import { backendUrl as defaultBackendUrl } from '@/config'
import type {
  ApiResponse,
  ConnectionTestResult,
  DeleteChatResult,
  PaginatedData,
  SessionRecord,
} from '@/types/api'
import type { ChatDetail, ChatSummary } from '@/types/chat'

const jsonHeaders = {
  Accept: 'application/json',
} as const

/** 测试后端连接 */
export async function testConnection(
  backendUrl: string = defaultBackendUrl,
): Promise<ConnectionTestResult> {
  try {
    await fetch(`${backendUrl}/file/list`, {
      method: 'GET',
      headers: jsonHeaders,
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `无法连接到后端服务，请确保后端在 ${backendUrl} 运行`,
    }
  }
}

/** 加载会话列表 */
export async function loadChats(
  backendUrl: string = defaultBackendUrl,
): Promise<ChatSummary[]> {
  try {
    const response = await fetch(
      `${backendUrl}/session/list?pageNum=1&pageSize=100`,
      {
        method: 'GET',
        headers: jsonHeaders,
      },
    )

    if (!response.ok) {
      throw new Error('获取会话列表失败')
    }

    const result = (await response.json()) as ApiResponse<
      PaginatedData<SessionRecord>
    >

    if (result.code === 200 && result.data?.records) {
      return result.data.records.map((item) => ({
        id: item.conversationId,
        title: item.question
          ? item.question.substring(0, 20) +
            (item.question.length > 20 ? '...' : '')
          : '新对话',
        agentType: item.agentType,
        fileid: item.fileid,
        messages: [],
      }))
    }

    return []
  } catch (error) {
    console.error('加载会话列表失败:', error)
    return []
  }
}

/** 获取会话详情 */
export async function getChatDetail(
  backendUrl: string,
  chatId: string,
): Promise<ChatDetail | null> {
  try {
    const response = await fetch(`${backendUrl}/session/${chatId}`, {
      method: 'GET',
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('获取会话详情失败')
    }

    const result = (await response.json()) as ApiResponse<ChatDetail>

    if (result.code === 200 && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    console.error('获取会话详情失败:', error)
    return null
  }
}

/** 删除会话 */
export async function deleteChat(
  backendUrl: string,
  chatId: string,
): Promise<DeleteChatResult> {
  try {
    const response = await fetch(`${backendUrl}/session/${chatId}`, {
      method: 'DELETE',
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('删除会话失败')
    }

    const result = (await response.json()) as ApiResponse

    return {
      success: result.code === 200 || result.code === 0,
      message: result.message,
    }
  } catch (error) {
    console.error('删除会话失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
