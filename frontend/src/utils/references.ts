import type { ReferenceItem, ReferencesInput } from '@/types/stream'

function parseReferenceItem(ref: unknown): ReferenceItem | null {
  let linkUrl: string | undefined
  let displayTitle: string | undefined
  let content = ''

  if (typeof ref === 'string') {
    try {
      const parsed = JSON.parse(ref) as Partial<ReferenceItem> & { link?: string }
      linkUrl = parsed.url ?? parsed.link
      displayTitle = parsed.title || parsed.url || parsed.link || '无标题'
      content = parsed.content ?? ''
    } catch {
      linkUrl = ref
      displayTitle = ref
      content = ''
    }
  } else if (typeof ref === 'object' && ref !== null) {
    const obj = ref as Partial<ReferenceItem> & { link?: string }
    linkUrl = obj.url ?? obj.link
    displayTitle = obj.title || obj.url || obj.link || '无标题'
    content = obj.content ?? ''
  }

  if (!linkUrl) return null

  if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
    linkUrl = `https://${linkUrl}`
  }

  return {
    url: linkUrl,
    title: displayTitle ?? '无标题',
    content,
  }
}

/** 处理参考来源数据（统一处理多种格式） */
export function processReferences(refsData: ReferencesInput): ReferenceItem[] {
  if (!refsData) return []

  let references: unknown = refsData

  if (typeof references === 'string') {
    try {
      references = JSON.parse(references) as unknown
    } catch {
      return []
    }
  }

  if (
    typeof references === 'object' &&
    references !== null &&
    'data' in references &&
    typeof (references as { data?: { content?: unknown } }).data?.content !==
      'undefined'
  ) {
    const contentData = (references as { data: { content: unknown } }).data
      .content

    if (typeof contentData === 'string') {
      try {
        references = JSON.parse(contentData) as unknown
      } catch {
        return []
      }
    } else {
      references = contentData
    }
  }

  if (
    typeof references === 'object' &&
    references !== null &&
    'type' in references &&
    (references as { type?: string }).type === 'reference' &&
    typeof (references as { content?: unknown }).content === 'string'
  ) {
    try {
      references = JSON.parse(
        (references as unknown as { content: string }).content,
      ) as unknown
    } catch {
      return []
    }
  }

  if (!Array.isArray(references)) {
    return []
  }

  return references
    .filter((ref) => ref != null)
    .map((ref) => parseReferenceItem(ref))
    .filter((ref): ref is ReferenceItem => ref !== null && Boolean(ref.url))
}
