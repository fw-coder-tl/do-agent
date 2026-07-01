<script setup lang="ts">
import { Book, ChevronDown, ChevronRight, ExternalLink } from 'lucide-vue-next'
import type { ReferenceItem } from '@/types/stream'

defineProps<{
  references: ReferenceItem[]
  showReference: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div v-if="references.length > 0" class="reference-section">
    <div class="reference-header" @click="$emit('toggle')">
      <div class="reference-icon-wrapper">
        <Book class="reference-icon" />
      </div>
      <span class="reference-title">参考来源 ({{ references.length }})</span>
      <ChevronDown v-if="showReference" class="header-chevron" />
      <ChevronRight v-else class="header-chevron" />
    </div>
    <div v-show="showReference" class="reference-content">
      <template v-for="(ref, rIndex) in references" :key="rIndex">
        <a
          v-if="ref && ref.url"
          :href="ref.url"
          target="_blank"
          rel="noopener noreferrer"
          class="reference-link"
        >
          <div class="ref-icon">
            <ExternalLink class="ref-link-icon" />
          </div>
          <div class="ref-info">
            <div class="ref-title-text">{{ ref.title || '无标题' }}</div>
            <div class="ref-url-text">{{ ref.url }}</div>
          </div>
        </a>
      </template>
    </div>
  </div>
</template>
