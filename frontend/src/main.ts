import { createApp } from 'vue'
import App from '@/App.vue'
import 'highlight.js/styles/github-dark.min.css'
import '@/styles/app.css'
import { setupMarkdown } from '@/utils/markdown'

setupMarkdown()

createApp(App).mount('#app')
