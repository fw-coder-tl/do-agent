import { backendUrl as defaultBackendUrl } from '@/config'
import type { ApiResponse } from '@/types/api'

/** 获取流式聊天 API URL */
export function getStreamChatUrl(
  backendUrl: string = defaultBackendUrl,
  selectedAgent: string,
  hasFile: boolean,
): string {
  if (hasFile) {
    return `${backendUrl}/agent/file/stream`
  }

  if (selectedAgent === 'ppt') {
    return `${backendUrl}/agent/pptx/stream`
  }

  if (selectedAgent === 'deep') {
    return `${backendUrl}/agent/deep/stream`
  }

  if (selectedAgent === 'skills') {
    return `${backendUrl}/agent/skills/stream`
  }

  return `${backendUrl}/agent/chat/stream`
}

/** 停止流式请求 */
export async function stopStream(
  backendUrl: string,
  conversationId: string,
): Promise<ApiResponse | null> {
  try {
    const stopUrl = `${backendUrl}/agent/stop?conversationId=${conversationId}`
    const response = await fetch(stopUrl, {
      method: 'GET',
    })
    return (await response.json()) as ApiResponse
  } catch (error) {
    console.warn('调用停止接口失败:', error)
    return null
  }
}
