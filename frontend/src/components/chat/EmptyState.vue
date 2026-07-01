<script setup lang="ts">
import { Code, FileText, User } from 'lucide-vue-next'

defineEmits<{
  quickPrompt: [prompt: string]
}>()
</script>

<template>
  <div class="empty-state">
    <h2 class="empty-state__title">有什么我能帮你的吗？</h2>
    <p class="empty-state__subtitle">我是豆豆，随时为你提供帮助</p>
    <div class="quick-actions">
      <button
        type="button"
        class="quick-pill"
        @click="$emit('quickPrompt', '介绍一下你自己')"
      >
        <User class="quick-pill__icon" />
        <span>介绍一下你自己</span>
      </button>
      <button
        type="button"
        class="quick-pill"
        @click="$emit('quickPrompt', '帮我写一个Python示例')"
      >
        <Code class="quick-pill__icon" />
        <span>帮我写代码</span>
      </button>
      <button
        type="button"
        class="quick-pill"
        @click="$emit('quickPrompt', '分析一段文本')"
      >
        <FileText class="quick-pill__icon" />
        <span>分析文本</span>
      </button>
    </div>
  </div>
</template>
