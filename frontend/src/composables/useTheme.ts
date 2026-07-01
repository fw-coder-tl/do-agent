import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'dodo-theme'

const theme = ref<ThemeMode>('light')

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // ignore storage errors
  }
  return 'light'
}

function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.classList.add('theme')
  root.classList.toggle('dark', mode === 'dark')
}

/** 应用启动前调用，避免主题闪烁 */
export function initTheme(): ThemeMode {
  const initial = readStoredTheme()
  theme.value = initial
  applyThemeToDocument(initial)
  return initial
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(mode: ThemeMode): void {
    theme.value = mode
    applyThemeToDocument(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore storage errors
    }
  }

  function toggleTheme(): void {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
