<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import EmptyState from '@/components/chat/EmptyState.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ConnectionError from '@/components/common/ConnectionError.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useChat } from '@/composables/useChat'

const messagesContainer = ref<HTMLElement | null>(null)

const {
  backendUrl,
  agents,
  connectionError,
  chatList,
  currentChatId,
  currentChat,
  selectedAgent,
  inputMessage,
  selectedFile,
  isUploading,
  isSending,
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
  formatFileSize,
} = useChat(messagesContainer)

const chatHeaderTitle = computed(() => currentChat.value?.title ?? '豆豆')
</script>

<template>
  <div class="app-shell">
    <Sidebar
      :agents="agents"
      :selected-agent="selectedAgent"
      :chat-list="chatList"
      :current-chat-id="currentChatId"
      :backend-url="backendUrl"
      @create-new-chat="createNewChat"
      @select-agent="selectAgent"
      @select-chat="selectChat"
      @delete-chat="requestDeleteChat"
    />

    <main class="chat-panel">
      <header class="chat-header">
        <div class="chat-header__inner">
          <h1 class="chat-header__title">{{ chatHeaderTitle }}</h1>
          <p class="chat-header__hint">AI 生成可能有误 请核实</p>
        </div>
      </header>

      <div class="chat-panel__body">
        <div ref="messagesContainer" class="messages-container">
          <EmptyState
            v-if="currentChat && currentChat.messages.length === 0"
            @quick-prompt="quickPrompt"
          />

          <ChatMessage
            v-for="msg in currentChat?.messages || []"
            :key="msg.id"
            :message="msg"
            :is-sending="isSending"
            :is-last="isLastMessage(msg)"
            @copy="copyMessage"
            @toggle-timeline="toggleTimeline"
            @toggle-reference="toggleReference"
            @recommend-select="sendRecommendQuestion"
          />
        </div>
      </div>

      <footer class="chat-panel__footer">
        <ChatInput
          :agents="agents"
          :selected-agent="selectedAgent"
          :selected-file="selectedFile"
          :is-uploading="isUploading"
          :is-sending="isSending"
          :can-send="canSend"
          :input-message="inputMessage"
          :format-file-size="formatFileSize"
          @update:input-message="inputMessage = $event"
          @select-agent="selectAgent"
          @file-select="handleFileSelect"
          @remove-file="removeFile"
          @send="sendMessage"
          @stop="stopMessage"
        />
      </footer>
    </main>
  </div>

  <ConnectionError
    :message="connectionError || ''"
    @retry="testConnection"
  />

  <ConfirmDialog
    :visible="showConfirmDialog"
    :title="confirmTitle"
    :message="confirmMessage"
    @confirm="confirmOk"
    @cancel="confirmCancel"
  />
</template>
