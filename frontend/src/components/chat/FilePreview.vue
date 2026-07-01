<script setup lang="ts">
import { File, Loader2, X } from 'lucide-vue-next'

defineProps<{
  file: File
  fileSizeLabel: string
  isUploading: boolean
}>()

defineEmits<{
  remove: []
}>()
</script>

<template>
  <div class="file-preview">
    <div class="file-preview-item">
      <div class="file-preview-item__icon">
        <File class="size-4" />
      </div>
      <div class="file-info">
        <div class="file-name">{{ file.name }}</div>
        <div class="file-size">{{ fileSizeLabel }}</div>
        <div v-if="isUploading" class="upload-parsing">
          <Loader2 class="upload-spinner animate-spin" />
          <span>解析中...</span>
        </div>
      </div>
      <button
        v-if="!isUploading"
        type="button"
        class="remove-file"
        title="删除文件"
        @click="$emit('remove')"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
</template>
