import { ref } from 'vue'

const STORAGE_KEY = 'dodo-sidebar-collapsed'
const PREVIEW_CLOSE_DELAY_MS = 150

const isSidebarCollapsed = ref(readStoredCollapsed())
const isSidebarPreviewOpen = ref(false)

let previewCloseTimer: ReturnType<typeof setTimeout> | null = null

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore storage errors
  }
}

function clearPreviewCloseTimer(): void {
  if (previewCloseTimer !== null) {
    clearTimeout(previewCloseTimer)
    previewCloseTimer = null
  }
}

export function useSidebarState() {
  function openSidebarPreview(): void {
    clearPreviewCloseTimer()
    if (isSidebarCollapsed.value) {
      isSidebarPreviewOpen.value = true
    }
  }

  function scheduleCloseSidebarPreview(): void {
    clearPreviewCloseTimer()
    previewCloseTimer = setTimeout(() => {
      isSidebarPreviewOpen.value = false
      previewCloseTimer = null
    }, PREVIEW_CLOSE_DELAY_MS)
  }

  function expandSidebar(): void {
    clearPreviewCloseTimer()
    isSidebarCollapsed.value = false
    isSidebarPreviewOpen.value = false
    persistCollapsed(false)
  }

  function collapseSidebar(): void {
    clearPreviewCloseTimer()
    isSidebarCollapsed.value = true
    isSidebarPreviewOpen.value = false
    persistCollapsed(true)
  }

  function toggleSidebarCollapsed(): void {
    if (isSidebarCollapsed.value) {
      expandSidebar()
    } else {
      collapseSidebar()
    }
  }

  function setSidebarCollapsed(collapsed: boolean): void {
    if (collapsed) {
      collapseSidebar()
    } else {
      expandSidebar()
    }
  }

  return {
    isSidebarCollapsed,
    isSidebarPreviewOpen,
    openSidebarPreview,
    scheduleCloseSidebarPreview,
    expandSidebar,
    collapseSidebar,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
  }
}
