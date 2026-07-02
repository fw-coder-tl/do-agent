import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_BASE_PATH, normalizeBasePath } from './scripts/lib/base-path.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Vite public base path; override via VITE_BASE_PATH (e.g. `/` for root deploy). */
const base = normalizeBasePath(process.env.VITE_BASE_PATH ?? DEFAULT_BASE_PATH)

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
