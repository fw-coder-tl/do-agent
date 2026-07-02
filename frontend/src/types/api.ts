/** 通用 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  data?: T
  message?: string
}

/** 分页数据 */
export interface PaginatedData<T> {
  records: T[]
  total?: number
  size?: number
  current?: number
}

/** 会话列表项（后端原始字段） */
export interface SessionRecord {
  conversationId: string
  question?: string
  agentType?: string
  fileid?: string
}

/** 文件上传响应 */
export interface FileUploadData {
  fileId: string
}

/** 连接测试结果 */
export interface ConnectionTestResult {
  success: boolean
  error?: string
}

/** 删除会话结果 */
export interface DeleteChatResult {
  success: boolean
  message?: string
  error?: string
}

/** 文件上传结果 */
export interface UploadFileResult {
  success: true
  fileId: string
}
