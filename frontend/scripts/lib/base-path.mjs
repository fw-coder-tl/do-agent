/** Default Vite base when no env/profile override is provided. */
export const DEFAULT_BASE_PATH = '/new-ui/'

/**
 * Normalize Vite `base`:
 * - `/` stays root
 * - other paths always end with `/`
 */
export function normalizeBasePath(raw) {
  const value = (raw ?? DEFAULT_BASE_PATH).trim()
  if (!value || value === '/') {
    return '/'
  }
  return value.endsWith('/') ? value : `${value}/`
}
