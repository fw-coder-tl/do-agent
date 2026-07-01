<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { FileText, Paperclip, Send, Square } from 'lucide-vue-next'
import type { AgentConfig } from '@/constants/agents'
import AgentSelector from '@/components/chat/AgentSelector.vue'
import FilePreview from '@/components/chat/FilePreview.vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  agents: AgentConfig[]
  selectedAgent: string
  selectedFile: File | null
  isUploading: boolean
  isSending: boolean
  canSend: boolean
  inputMessage: string
  formatFileSize: (bytes: number) => string
}>()

const emit = defineEmits<{
  'update:inputMessage': [value: string]
  selectAgent: [agentId: string]
  fileSelect: [file: File]
  removeFile: []
  send: []
  stop: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const textareaInput = ref<{ $el: HTMLTextAreaElement } | null>(null)

const localMessage = ref(props.inputMessage)

watch(
  () => props.inputMessage,
  (value) => {
    localMessage.value = value
  },
)

watch(localMessage, (value) => {
  emit('update:inputMessage', value)
  resizeTextarea()
})

function resizeTextarea(): void {
  nextTick(() => {
    const el = textareaInput.value?.$el
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    emit('fileSelect', files[0])
  }
  input.value = ''
}

function onEnter(event: KeyboardEvent): void {
  if (!event.shiftKey) {
    event.preventDefault()
    if (props.isSending) {
      emit('stop')
    } else if (props.canSend && !props.isUploading) {
      emit('send')
    }
  }
}

function onSendClick(): void {
  if (props.isSending) {
    emit('stop')
  } else {
    emit('send')
  }
}

const showFileUpload = computed(
  () => props.selectedAgent === 'file' || props.selectedAgent === 'skills',
)

const textareaPlaceholder = computed(() => {
  if (props.selectedAgent === 'file' && props.selectedFile) {
    return '基于文件提问...'
  }
  return '发消息...'
})

const isFocused = ref(false)

const isExpanded = computed(
  () =>
    isFocused.value ||
    localMessage.value.trim().length > 0 ||
    !!props.selectedFile ||
    props.isUploading ||
    props.isSending,
)

function onTextareaFocus(): void {
  isFocused.value = true
}

function onTextareaBlur(): void {
  isFocused.value = false
}
</script>

<template>
  <div class="input-area">
    <div
      class="input-area__inner"
      :class="{ 'input-area__inner--expanded': isExpanded }"
      :data-expanded="isExpanded ? 'true' : 'false'"
    >
      <div class="input-card">
        <FilePreview
          v-if="selectedFile"
          :file="selectedFile"
          :file-size-label="formatFileSize(selectedFile.size)"
          :is-uploading="isUploading"
          @remove="emit('removeFile')"
        />

        <div class="input-card__body">
          <div
            v-if="selectedFile && !isUploading"
            class="input-file-badge"
            title="文件问答模式"
          >
            <FileText class="size-4" />
          </div>

          <Textarea
            ref="textareaInput"
            v-model="localMessage"
            class="input-card__textarea min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            :placeholder="textareaPlaceholder"
            rows="1"
            @focus="onTextareaFocus"
            @blur="onTextareaBlur"
            @keydown.enter.exact="onEnter"
          />
        </div>

        <div class="input-card__toolbar">
          <div class="input-card__tools">
            <AgentSelector
              :agents="agents"
              :selected-agent="selectedAgent"
              @select-agent="emit('selectAgent', $event)"
            />

            <Button
              v-if="showFileUpload && !selectedFile"
              type="button"
              variant="ghost"
              class="file-btn"
              :disabled="isUploading"
              title="上传文件（限1个）"
              @click="fileInput?.click()"
            >
              <Paperclip class="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            :class="[
              'send-btn',
              {
                stop: isSending,
                'send-btn--active': isSending || (canSend && !isUploading),
              },
            ]"
            :disabled="!isSending && (!canSend || isUploading)"
            @click="onSendClick"
          >
            <Square v-if="isSending" class="size-4 fill-current" />
            <Send v-else class="size-4" />
          </Button>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        class="input-file-input"
        @change="onFileChange"
      />
    </div>
  </div>
</template>
