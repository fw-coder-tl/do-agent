import type { ApiResponse, FileUploadData, UploadFileResult } from '@/types/api'

/** 上传文件 */
export async function uploadFile(
  backendUrl: string,
  file: File,
): Promise<UploadFileResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${backendUrl}/file/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('文件上传失败')
  }

  const result = (await response.json()) as ApiResponse<FileUploadData>

  if (result.code === 200 && result.data) {
    return {
      success: true,
      fileId: result.data.fileId,
    }
  }

  throw new Error(result.message || '文件上传失败')
}
