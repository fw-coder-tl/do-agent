<script setup lang="ts">
import { computed, nextTick, onUpdated, ref, watch } from 'vue'
import { Check, Copy, Download, Paperclip } from 'lucide-vue-next'
import MessageTimeline from '@/components/chat/MessageTimeline.vue'
import ReferenceList from '@/components/chat/ReferenceList.vue'
import RecommendQuestions from '@/components/chat/RecommendQuestions.vue'
import type { ChatMessage } from '@/types/chat'
import { renderMarkdown } from '@/utils/markdown'
import { highlightCodeBlocks } from '@/utils/highlightCode'

const props = defineProps<{
  message: ChatMessage
  isSending: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  copy: [message: ChatMessage]
  toggleTimeline: [msgId: string]
  toggleReference: [msgId: string]
  recommendSelect: [question: string]
}>()

const markdownRef = ref<HTMLElement | null>(null)

const markdownHtml = computed(() => {
  if (props.message.role !== 'assistant') return ''
  return renderMarkdown(props.message.content)
})

function applyHighlight(): void {
  nextTick(() => {
    highlightCodeBlocks(markdownRef.value)
  })
}

watch(
  () => props.message.role === 'assistant' && props.message.content,
  () => {
    if (props.message.role === 'assistant') {
      applyHighlight()
    }
  },
)

onUpdated(() => {
  if (props.message.role === 'assistant') {
    applyHighlight()
  }
})
</script>

<template>
  <div :class="['message', message.role]">
    <div class="message-content">
      <template v-if="message.role === 'user'">
        <div class="user-message">
          <span v-if="message.file" class="file-attachment">
            <Paperclip class="file-attachment-icon" />
            {{ message.fileName }}
          </span>
          <div class="user-message__text">{{ message.content }}</div>
        </div>
        <div class="copy-btn copy-btn-user" @click="emit('copy', message)">
          <Copy v-if="!message.copied" class="copy-icon" />
          <Check v-else class="copy-icon copy-check" />
        </div>
      </template>

      <template v-else>
        <div class="ai-message">
          <MessageTimeline
            :timeline="message.timeline"
            :show-timeline="message.showTimeline"
            @toggle="emit('toggleTimeline', message.id)"
          />

          <div
            ref="markdownRef"
            class="text-content markdown-body"
            v-html="markdownHtml"
          ></div>

          <div v-if="isSending && isLast" class="thinking-loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>

          <ReferenceList
            :references="message.reference"
            :show-reference="message.showReference"
            @toggle="emit('toggleReference', message.id)"
          />

          <RecommendQuestions
            :questions="message.recommend"
            @select="(q) => emit('recommendSelect', q)"
          />

          <div v-if="message.pptFile" class="ppt-download">
            <a :href="message.pptFile" download class="ppt-link">
              <Download class="ppt-link-icon" />
              下载生成的PPT
            </a>
          </div>

          <div class="copy-btn" @click="emit('copy', message)">
            <Copy v-if="!message.copied" class="copy-icon" />
            <Check v-else class="copy-icon copy-check" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
