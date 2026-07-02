import type { AgentId } from '@/constants/agents'
import type { ReferenceItem } from '@/types/stream'

/** 用户消息 */
export interface UserMessage {
  id: string
  role: 'user'
  content: string
  file?: boolean
  fileName?: string | null
  timestamp: number
  copied?: boolean
}

/** 时间线条目：思考过程 */
export interface TimelineThinkingItem {
  type: 'thinking'
  content: string
}

/** 时间线条目：工具调用 */
export interface TimelineToolItem {
  type: 'tool'
  toolName: string
  toolCallId: string
  status: 'running' | 'completed'
}

/** 时间线条目：错误 */
export interface TimelineErrorItem {
  type: 'error'
  message: string
  detail: string
  code: string
}

/** 时间线联合类型 */
export type TimelineItem =
  | TimelineThinkingItem
  | TimelineToolItem
  | TimelineErrorItem

/** Assistant 流式消息 */
export interface AssistantMessage {
  id: string
  role: 'assistant'
  content: string
  thinking: string[]
  timeline: TimelineItem[]
  reference: ReferenceItem[]
  recommend: string[]
  showTimeline: boolean
  showReference: boolean
  hasThinking: boolean
  timestamp: number
  copied?: boolean
  pptFile?: string
}

/** 聊天消息联合类型 */
export type ChatMessage = UserMessage | AssistantMessage

/** 前端会话摘要 */
export interface ChatSummary {
  id: string
  title: string
  agentType?: string
  fileid?: string
  isNew?: boolean
  messages: ChatMessage[]
}

/** 后端会话消息记录 */
export interface SessionMessageRecord {
  id?: string | number
  question?: string
  answer?: string
  thinking?: string
  fileid?: string
  reference?: unknown
  createTime?: string
}

/** 会话详情（后端返回，结构随 agent 类型变化） */
export interface ChatDetail {
  agentType?: string
  fileid?: string
  messages?: SessionMessageRecord[]
  [key: string]: unknown
}

/** 流式聊天 URL 参数上下文 */
export interface StreamUrlContext {
  selectedAgent: AgentId | string
  hasFile: boolean
}

/** 创建空白 assistant 消息 */
export function createAssistantMessage(id: string): AssistantMessage {
  return {
    id,
    role: 'assistant',
    content: '',
    thinking: [],
    timeline: [],
    reference: [],
    recommend: [],
    showTimeline: true,
    showReference: false,
    hasThinking: false,
    timestamp: Date.now(),
  }
}
