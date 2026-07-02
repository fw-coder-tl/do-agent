import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { deleteChat as deleteChatApi, getChatDetail, loadChats, testConnection as testConnectionApi } from '@/api/session'
import { uploadFile } from '@/api/file'
import { useStreamChat } from '@/composables/useStreamChat'
import { backendUrl } from '@/config'
import { AGENTS } from '@/constants/agents'
import type { AgentId } from '@/constants/agents'
import { SUPPORTED_FILE_TYPES } from '@/constants/agents'
import type {
  AssistantMessage,
  ChatDetail,
  ChatMessage,
  ChatSummary,
  UserMessage,
} from '@/types/chat'
import { createAssistantMessage } from '@/types/chat'
import type { ReferencesInput } from '@/types/stream'
import { generateId, formatFileSize } from '@/utils/format'
import { processReferences } from '@/utils/references'

export function useChat(messagesContainer: ReturnType<typeof ref<HTMLElement | null>>) {
  const connectionError = ref<string | null>(null)
  const chatList = ref<ChatSummary[]>([])
  const currentChatId = ref<string | null>(null)
  const selectedAgent = ref<AgentId | string>('chat')
  const inputMessage = ref('')
  const selectedFile = ref<File | null>(null)
  const uploadedFileId = ref<string | null>(null)
  const isUploading = ref(false)
  const currentRecommendMsgId = ref<string | null>(null)

  const showConfirmDialog = ref(false)
  const confirmTitle = ref('确认操作')
  const confirmMessage = ref('')
  let confirmCallback: (() => void | Promise<void>) | null = null

  const { isSending, sendStreamMessage, stopStreamChat } = useStreamChat()

  const currentChat = computed(() =>
    chatList.value.find((c) => c.id === currentChatId.value),
  )

  const canSend = computed(() => {
    if (isSending.value || isUploading.value) return false
    return inputMessage.value.trim().length > 0 || !!selectedFile.value
  })

  function scrollToBottom(): void {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  async function testConnection(): Promise<void> {
    const result = await testConnectionApi(backendUrl)
    connectionError.value = result.success ? null : (result.error ?? null)
  }

  async function loadChatsFromStorage(): Promise<void> {
    chatList.value = await loadChats(backendUrl)
  }

  function createNewChat(): void {
    const existingNewChat = chatList.value.find((c) => c.isNew)
    if (existingNewChat) {
      currentChatId.value = existingNewChat.id
      return
    }

    const newChat: ChatSummary = {
      id: generateId(),
      title: '新对话',
      messages: [],
      isNew: true,
    }
    chatList.value.unshift(newChat)
    currentChatId.value = newChat.id
  }

  async function selectChat(chatId: string): Promise<void> {
    currentChatId.value = chatId

    const chat = chatList.value.find((c) => c.id === chatId)
    if (chat?.isNew) return

    const sessionData = await getChatDetail(backendUrl, chatId)
    if (!sessionData || !chat) return

    mapSessionToChat(chat, sessionData)
    scrollToBottom()
  }

  function mapSessionToChat(chat: ChatSummary, sessionData: ChatDetail): void {
    chat.agentType = sessionData.agentType
    chat.fileid = sessionData.fileid
    chat.messages = []

    if (sessionData.messages && Array.isArray(sessionData.messages)) {
      sessionData.messages.forEach((msg) => {
        if (msg.question) {
          chat.messages.push({
            id: `user_${msg.id}`,
            role: 'user',
            content: msg.question,
            file: !!msg.fileid,
            fileName: msg.fileid ? '已上传文件' : null,
            timestamp: msg.createTime
              ? new Date(msg.createTime).getTime()
              : Date.now(),
          })
        }

        if (msg.answer || msg.thinking) {
          const reference = processReferences(msg.reference as ReferencesInput)
          const thinkingContent = msg.thinking || ''
          chat.messages.push({
            id: `assistant_${msg.id}`,
            role: 'assistant',
            content: msg.answer || '',
            thinking: thinkingContent ? [thinkingContent] : [],
            timeline: thinkingContent
              ? [{ type: 'thinking', content: thinkingContent }]
              : [],
            reference,
            recommend: [],
            showTimeline: false,
            showReference: false,
            hasThinking: !!thinkingContent,
            timestamp: msg.createTime
              ? new Date(msg.createTime).getTime()
              : Date.now(),
          })
        }
      })
    }

    const firstUserMessage = chat.messages.find(
      (m): m is UserMessage => m.role === 'user',
    )
    if (firstUserMessage?.content) {
      chat.title =
        firstUserMessage.content.substring(0, 20) +
        (firstUserMessage.content.length > 20 ? '...' : '')
    }
  }

  function requestDeleteChat(chatId: string): void {
    confirmTitle.value = '确认删除'
    confirmMessage.value = '删除该会话后将无法恢复，是否继续？'
    confirmCallback = async () => {
      const result = await deleteChatApi(backendUrl, chatId)
      if (result.success) {
        const index = chatList.value.findIndex((c) => c.id === chatId)
        if (index !== -1) {
          chatList.value.splice(index, 1)
          if (currentChatId.value === chatId) {
            if (chatList.value.length > 0) {
              await selectChat(chatList.value[0].id)
            } else {
              createNewChat()
            }
          }
        }
      } else {
        alert(`删除失败: ${result.message || result.error || '未知错误'}`)
      }
      showConfirmDialog.value = false
    }
    showConfirmDialog.value = true
  }

  function confirmOk(): void {
    confirmCallback?.()
  }

  function confirmCancel(): void {
    showConfirmDialog.value = false
    confirmCallback = null
  }

  function selectAgent(agentId: AgentId | string): void {
    if (selectedFile.value) {
      selectedFile.value = null
      uploadedFileId.value = null
    }
    selectedAgent.value = agentId
  }

  function quickPrompt(prompt: string): void {
    inputMessage.value = prompt
  }

  function clearAllRecommendQuestions(): void {
    if (currentChat.value?.messages) {
      currentChat.value.messages.forEach((msg) => {
        ;(msg as ChatMessage & { recommend?: string[] }).recommend = []
      })
    }
  }

  async function sendRecommendQuestion(question: string): Promise<void> {
    clearAllRecommendQuestions()
    inputMessage.value = question
    await sendMessage()
  }

  function toggleTimeline(msgId: string): void {
    const msg = currentChat.value?.messages.find((m) => m.id === msgId)
    if (msg?.role === 'assistant') {
      msg.showTimeline = !msg.showTimeline
    }
  }

  function toggleReference(msgId: string): void {
    const msg = currentChat.value?.messages.find((m) => m.id === msgId)
    if (msg?.role === 'assistant') {
      msg.showReference = !msg.showReference
    }
  }

  function isLastMessage(msg: ChatMessage): boolean {
    const chat = currentChat.value
    if (!chat || chat.messages.length === 0) return false
    return chat.messages[chat.messages.length - 1].id === msg.id
  }

  async function copyMessage(msg: ChatMessage): Promise<void> {
    const textToCopy = msg.role === 'user' ? msg.content : msg.content || ''
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      msg.copied = true
      setTimeout(() => {
        msg.copied = false
      }, 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  async function handleFileSelect(file: File): Promise<void> {
    if (selectedFile.value) {
      alert('已上传文件，请先删除当前文件再上传新文件（限1个）')
      return
    }
    await handleFile(file)
  }

  async function handleFile(file: File): Promise<void> {
    selectedFile.value = file
    isUploading.value = true
    uploadedFileId.value = null

    try {
      const validTypes = SUPPORTED_FILE_TYPES.mime as readonly string[]
      const validExts = SUPPORTED_FILE_TYPES.extensions as readonly string[]
      const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''

      if (!validTypes.includes(file.type) && !validExts.includes(fileExt)) {
        alert('不支持的文件类型，仅支持 PDF、Word、TXT、PNG、JPG 格式')
        removeFile()
        return
      }

      const result = await uploadFile(backendUrl, file)
      uploadedFileId.value = result.fileId
    } catch (error) {
      console.error('文件上传错误:', error)
      alert(
        `文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
      removeFile()
    } finally {
      isUploading.value = false
    }
  }

  function removeFile(): void {
    selectedFile.value = null
    uploadedFileId.value = null
  }

  async function sendMessage(): Promise<void> {
    if (isSending.value || isUploading.value) return
    if (!inputMessage.value.trim() && !selectedFile.value) return

    const chat = currentChat.value
    if (!chat || !currentChatId.value) return

    clearAllRecommendQuestions()
    const message = inputMessage.value.trim()
    const hasFile = !!selectedFile.value
    currentRecommendMsgId.value = null

    inputMessage.value = ''
    const fileToSend = selectedFile.value
    const fileIdToSend = uploadedFileId.value

    if (chat.isNew) {
      chat.isNew = false
    }

    const userMsg: UserMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      file: hasFile,
      fileName: fileToSend ? fileToSend.name : null,
      timestamp: Date.now(),
    }
    chat.messages.push(userMsg)

    if (chat.messages.filter((m) => m.role === 'user').length === 1 && message) {
      chat.title =
        message.substring(0, 20) + (message.length > 20 ? '...' : '')
    }

    const aiMsg = reactive(createAssistantMessage(generateId()))
    chat.messages.push(aiMsg)

    scrollToBottom()

    await sendStreamMessage({
      query: message,
      conversationId: currentChatId.value,
      selectedAgent: selectedAgent.value,
      hasFile,
      fileId: fileIdToSend,
      backendUrl,
      assistantMessage: aiMsg as AssistantMessage,
      onScroll: scrollToBottom,
      onComplete: (msg) => {
        currentRecommendMsgId.value = msg.id
        scrollToBottom()
      },
    })
  }

  async function stopMessage(): Promise<void> {
    if (!isSending.value) return
    await stopStreamChat(backendUrl, currentChatId.value ?? '')
  }

  onMounted(async () => {
    await loadChatsFromStorage()
    createNewChat()
  })

  return {
    backendUrl,
    agents: AGENTS,
    connectionError,
    chatList,
    currentChatId,
    currentChat,
    selectedAgent,
    inputMessage,
    selectedFile,
    uploadedFileId,
    isUploading,
    isSending,
    currentRecommendMsgId,
    canSend,
    showConfirmDialog,
    confirmTitle,
    confirmMessage,
    testConnection,
    createNewChat,
    selectChat,
    requestDeleteChat,
    confirmOk,
    confirmCancel,
    selectAgent,
    quickPrompt,
    sendRecommendQuestion,
    toggleTimeline,
    toggleReference,
    isLastMessage,
    copyMessage,
    handleFileSelect,
    removeFile,
    sendMessage,
    stopMessage,
    scrollToBottom,
    formatFileSize,
  }
}
