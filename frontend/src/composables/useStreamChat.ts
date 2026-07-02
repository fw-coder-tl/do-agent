import { ref, type Ref } from 'vue'
import { getStreamChatUrl, stopStream as stopStreamApi } from '@/api/agent'
import { backendUrl as defaultBackendUrl } from '@/config'
import { STREAM_TYPES } from '@/constants/stream'
import type { AssistantMessage } from '@/types/chat'
import type {
  SendStreamChatParams,
  StreamEvent,
  StreamTextEvent,
  StreamThinkingEvent,
  StreamToolEndEvent,
  StreamToolStartEvent,
  StreamReferenceEvent,
  StreamRecommendEvent,
  StreamErrorEvent,
} from '@/types/stream'
import { processRecommendations } from '@/utils/recommendations'
import { processReferences } from '@/utils/references'

const sseHeaders = {
  Accept: 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const

export interface ProcessStreamContext {
  onScroll?: () => void
  onComplete?: (message: AssistantMessage) => void
  setSending: (value: boolean) => void
}

/** 处理单条 SSE 流式数据（与旧 app.js processStreamData 行为一致） */
export function processStreamData(
  data: StreamEvent,
  aiMsg: AssistantMessage,
  ctx: ProcessStreamContext,
): void {
  switch (data.type) {
    case STREAM_TYPES.TEXT: {
      const content = (data as StreamTextEvent).content
      if (content) {
        aiMsg.content += content
      }
      break
    }
    case STREAM_TYPES.THINKING: {
      const content = (data as StreamThinkingEvent).content
      if (!content) break
      aiMsg.hasThinking = true
      aiMsg.thinking.push(content)
      const last = aiMsg.timeline[aiMsg.timeline.length - 1]
      if (last && last.type === 'thinking') {
        last.content += content
      } else {
        aiMsg.timeline.push({ type: 'thinking', content })
      }
      ctx.onScroll?.()
      break
    }
    case STREAM_TYPES.TOOL_START: {
      const event = data as StreamToolStartEvent
      aiMsg.timeline.push({
        type: 'tool',
        toolName: event.toolName || 'unknown',
        toolCallId: event.toolCallId || '',
        status: 'running',
      })
      ctx.onScroll?.()
      break
    }
    case STREAM_TYPES.TOOL_END: {
      const event = data as StreamToolEndEvent
      const toolCallId = event.toolCallId || ''
      const entry = aiMsg.timeline.find(
        (t) =>
          t.type === 'tool' &&
          t.toolCallId === toolCallId &&
          t.status === 'running',
      )
      if (entry && entry.type === 'tool') {
        entry.status = 'completed'
      } else {
        aiMsg.timeline.push({
          type: 'tool',
          toolName: event.toolName || 'unknown',
          toolCallId,
          status: 'completed',
        })
      }
      break
    }
    case STREAM_TYPES.REFERENCE: {
      const event = data as StreamReferenceEvent
      if (!event.content) break
      try {
        let refsData: unknown = event.content
        if (typeof refsData === 'string') {
          refsData = JSON.parse(refsData) as unknown
        }
        if (
          typeof refsData === 'object' &&
          refsData !== null &&
          'data' in refsData &&
          typeof (refsData as { data?: { content?: unknown } }).data
            ?.content !== 'undefined'
        ) {
          refsData = (refsData as { data: { content: unknown } }).data.content
        }
        if (Array.isArray(refsData)) {
          aiMsg.reference = processReferences(refsData)
          if (aiMsg.reference.length > 0) {
            aiMsg.showReference = true
          }
        }
      } catch (error) {
        console.warn('解析reference失败:', error, '原始数据:', event.content)
      }
      break
    }
    case STREAM_TYPES.RECOMMEND: {
      const event = data as StreamRecommendEvent
      if (!event.content) break
      try {
        let recommendData: unknown = event.content
        if (typeof recommendData === 'string') {
          recommendData = JSON.parse(recommendData) as unknown
        }
        if (Array.isArray(recommendData)) {
          aiMsg.recommend = processRecommendations(recommendData)
        }
      } catch (error) {
        console.warn('解析recommend失败:', error, '原始数据:', event.content)
      }
      break
    }
    case STREAM_TYPES.ERROR: {
      const event = data as StreamErrorEvent
      aiMsg.timeline.push({
        type: 'error',
        message: event.message || '未知错误',
        detail: event.detail || '',
        code: event.code || '',
      })
      ctx.onScroll?.()
      break
    }
    case STREAM_TYPES.COMPLETE: {
      const hasError = aiMsg.timeline.some((t) => t.type === 'error')
      aiMsg.showTimeline = hasError
      ctx.setSending(false)
      ctx.onComplete?.(aiMsg)
      break
    }
  }
}

function buildStreamUrl(params: SendStreamChatParams, backendUrl: string): string {
  const useFileStream = params.hasFile && !!params.fileId
  const apiUrl = getStreamChatUrl(
    backendUrl,
    params.selectedAgent,
    useFileStream,
  )
  const url = new URL(apiUrl)
  url.searchParams.append(
    'query',
    params.query || (params.hasFile ? '请分析这个文件' : ''),
  )
  url.searchParams.append('conversationId', params.conversationId)
  if (params.hasFile && params.fileId) {
    url.searchParams.append('fileId', params.fileId)
  }
  return url.toString()
}

function finishStream(ctx: ProcessStreamContext): void {
  ctx.setSending(false)
}

/** 读取 SSE 响应体并逐行解析 */
async function readSseStream(
  response: Response,
  aiMsg: AssistantMessage,
  ctx: ProcessStreamContext,
): Promise<void> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  const handleDone = (): void => {
    finishStream(ctx)
  }

  const parseJsonLine = (raw: string): void => {
    let dataStr = raw

    if (dataStr.includes(STREAM_TYPES.DONE)) {
      const parts = dataStr.split(STREAM_TYPES.DONE)
      dataStr = parts[0] ?? ''
    }

    if (!dataStr.trim()) return

    try {
      const data = JSON.parse(dataStr) as StreamEvent
      processStreamData(data, aiMsg, ctx)
    } catch (error) {
      console.warn('解析数据失败:', dataStr, error)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let lineEndIndex: number
    while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.substring(0, lineEndIndex)
      buffer = buffer.substring(lineEndIndex + 1)

      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6)

        if (dataStr.trim() === STREAM_TYPES.DONE) {
          handleDone()
          return
        }

        if (dataStr.trim() === '') continue

        parseJsonLine(dataStr)
      } else if (line.trim() !== '') {
        const cleanLine = line.replace(/^data:\s*/, '').trim()

        if (cleanLine === STREAM_TYPES.DONE) {
          handleDone()
          return
        }

        if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
          try {
            const data = JSON.parse(cleanLine) as StreamEvent
            processStreamData(data, aiMsg, ctx)
          } catch (error) {
            console.warn('解析JSON行失败:', cleanLine, error)
          }
        }
      }
    }
  }

  if (buffer.trim() !== '') {
    const cleanBuffer = buffer.replace(/^data:\s*/, '').trim()

    if (cleanBuffer === STREAM_TYPES.DONE) {
      handleDone()
      return
    }

    if (cleanBuffer.startsWith('{') && cleanBuffer.endsWith('}')) {
      try {
        const data = JSON.parse(cleanBuffer) as StreamEvent
        if (data.type === STREAM_TYPES.TEXT && 'content' in data && data.content) {
          aiMsg.content += String(data.content)
        } else if (data.type === STREAM_TYPES.COMPLETE) {
          const hasError = aiMsg.timeline.some((t) => t.type === 'error')
          aiMsg.showTimeline = hasError
          ctx.setSending(false)
          ctx.onComplete?.(aiMsg)
        }
      } catch (error) {
        console.warn('解析剩余数据失败:', cleanBuffer, error)
      }
    }
  }

  finishStream(ctx)
}

export function useStreamChat(isSendingRef?: Ref<boolean>) {
  const internalSending = ref(false)
  const isSending = isSendingRef ?? internalSending
  let abortController: AbortController | null = null

  const setSending = (value: boolean): void => {
    isSending.value = value
    if (!value) {
      abortController = null
    }
  }

  /** 发送流式聊天消息 */
  async function sendStreamMessage(
    params: SendStreamChatParams,
  ): Promise<void> {
    if (isSending.value) return

    const backendUrl = params.backendUrl ?? defaultBackendUrl
    const { assistantMessage: aiMsg } = params

    isSending.value = true

    const ctx: ProcessStreamContext = {
      onScroll: params.onScroll,
      onComplete: params.onComplete,
      setSending,
    }

    const url = buildStreamUrl(params, backendUrl)

    try {
      abortController = new AbortController()

      const response = await fetch(url, {
        method: 'GET',
        headers: sseHeaders,
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await readSseStream(response, aiMsg, ctx)
    } catch (error) {
      console.error('请求错误:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        aiMsg.content += `\n\n⚠️ 请求出错: ${error.message}`
      }
      setSending(false)
    }
  }

  /** 停止流式聊天（调用 /agent/stop） */
  async function stopStreamChat(
    backendUrl: string,
    conversationId: string,
  ): Promise<void> {
    if (!isSending.value) return

    await stopStreamApi(backendUrl, conversationId)
    setSending(false)
  }

  return {
    isSending,
    sendStreamMessage,
    stopStreamChat,
    processStreamData,
  }
}
