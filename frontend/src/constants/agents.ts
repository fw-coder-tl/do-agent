/** 智能体 ID */
export type AgentId = 'chat' | 'file' | 'ppt' | 'deep' | 'skills'

/** 智能体配置项 */
export interface AgentConfig {
  id: AgentId
  name: string
  icon: string
}

/** 智能体列表 */
export const AGENTS: AgentConfig[] = [
  { id: 'chat', name: '对话助手', icon: '💬' },
  { id: 'file', name: '文件问答', icon: '📁' },
  { id: 'ppt', name: 'PPT生成', icon: '📊' },
  { id: 'deep', name: '深度研究', icon: '🔬' },
  { id: 'skills', name: '技能助手', icon: '🛠' },
]

/** 支持的文件类型 */
export const SUPPORTED_FILE_TYPES = {
  mime: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
  extensions: ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
} as const
