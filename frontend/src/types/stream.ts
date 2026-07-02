import { STREAM_TYPES } from '@/constants/stream'
import type { AssistantMessage } from '@/types/chat'

/** 参考来源项 */
export interface ReferenceItem {
  url: string
  title: string
  content: string
}

/** SSE 流式事件：文本 */
export interface StreamTextEvent {
  type: typeof STREAM_TYPES.TEXT
  content: string
}

/** SSE 流式事件：思考 */
export interface StreamThinkingEvent {
  type: typeof STREAM_TYPES.THINKING
  content: string
}

/** SSE 流式事件：工具开始 */
export interface StreamToolStartEvent {
  type: typeof STREAM_TYPES.TOOL_START
  toolName?: string
  toolCallId?: string
}

/** SSE 流式事件：工具结束 */
export interface StreamToolEndEvent {
  type: typeof STREAM_TYPES.TOOL_END
  toolName?: string
  toolCallId?: string
}

/** SSE 流式事件：参考来源 */
export interface StreamReferenceEvent {
  type: typeof STREAM_TYPES.REFERENCE
  content?: string | unknown
  count?: number
}

/** SSE 流式事件：推荐问题 */
export interface StreamRecommendEvent {
  type: typeof STREAM_TYPES.RECOMMEND
  content?: string | unknown
}

/** SSE 流式事件：错误 */
export interface StreamErrorEvent {
  type: typeof STREAM_TYPES.ERROR
  message?: string
  detail?: string
  code?: string
}

/** SSE 流式事件：完成 */
export interface StreamCompleteEvent {
  type: typeof STREAM_TYPES.COMPLETE
}

/** SSE 流式事件联合类型 */
export type StreamEvent =
  | StreamTextEvent
  | StreamThinkingEvent
  | StreamToolStartEvent
  | StreamToolEndEvent
  | StreamReferenceEvent
  | StreamRecommendEvent
  | StreamErrorEvent
  | StreamCompleteEvent
  | { type: string; content?: unknown; [key: string]: unknown }

/** 流式消息基础结构 */
export interface StreamMessage {
  type: string
  content?: string
  count?: number
  [key: string]: unknown
}

/** 原始参考来源数据（多种后端格式） */
export type ReferencesInput =
  | string
  | ReferenceItem
  | ReferenceItem[]
  | StreamMessage
  | { data?: { content?: string | ReferenceItem[] } }
  | null
  | undefined

/** 原始推荐问题数据 */
export type RecommendationsInput = string | string[] | null | undefined

/** 发送流式聊天请求参数 */
export interface SendStreamChatParams {
  query: string
  conversationId: string
  selectedAgent: string
  hasFile: boolean
  fileId?: string | null
  assistantMessage: AssistantMessage
  backendUrl?: string
  onScroll?: () => void
  onComplete?: (message: AssistantMessage) => void
}

export type { AssistantMessage }
