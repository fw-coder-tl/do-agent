/** 流式消息类型常量 */
export const STREAM_TYPES = {
  TEXT: 'text',
  THINKING: 'thinking',
  TOOL_START: 'tool_start',
  TOOL_END: 'tool_end',
  REFERENCE: 'reference',
  RECOMMEND: 'recommend',
  ERROR: 'error',
  COMPLETE: 'complete',
  DONE: '[DONE]',
} as const

export type StreamType = (typeof STREAM_TYPES)[keyof typeof STREAM_TYPES]
