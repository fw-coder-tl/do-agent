import { createApp } from 'vue'
import App from '@/App.vue'
import '@/styles/app.css'
import 'highlight.js/styles/github.min.css'
import { initTheme } from '@/composables/useTheme'
import { setupMarkdown } from '@/utils/markdown'

initTheme()
setupMarkdown()

createApp(App).mount('#app')
