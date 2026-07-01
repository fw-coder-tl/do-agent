import hljs from 'highlight.js'

/** 对容器内 pre code 块执行语法高亮 */
export function highlightCodeBlocks(root: HTMLElement | null | undefined): void {
  if (!root) return
  root.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })
}
