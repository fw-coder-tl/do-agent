import type { RecommendationsInput } from '@/types/stream'

/** 处理推荐问题数据 */
export function processRecommendations(
  recommendData: RecommendationsInput,
): string[] {
  if (!recommendData) return []

  let recommendations: unknown = recommendData

  if (typeof recommendations === 'string') {
    try {
      recommendations = JSON.parse(recommendations) as unknown
    } catch {
      return []
    }
  }

  if (!Array.isArray(recommendations)) {
    return []
  }

  return recommendations as string[]
}
