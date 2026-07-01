import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'

let markdownReady = false

/** 配置 Markdown 渲染（marked + highlight.js） */
export function setupMarkdown(): void {
  if (markdownReady) return

  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch {
            // fall through to auto highlight
          }
        }
        return hljs.highlightAuto(code).value
      },
    }),
  )

  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  markdownReady = true
}

/** 渲染 Markdown 为安全 HTML */
export function renderMarkdown(content: string): string {
  if (!content) return ''

  setupMarkdown()

  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n')

  const html = marked.parse(processedContent) as string
  return DOMPurify.sanitize(html)
}
