<script setup lang="ts">
import {
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
  X,
} from 'lucide-vue-next'
import type { TimelineItem } from '@/types/chat'

defineProps<{
  timeline: TimelineItem[]
  showTimeline: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div v-if="timeline.length > 0" class="timeline-section">
    <div class="timeline-header" @click="$emit('toggle')">
      <div class="timeline-icon-wrapper">
        <Brain class="timeline-main-icon" />
      </div>
      <span class="timeline-title">思考过程</span>
      <ChevronDown v-if="showTimeline" class="header-chevron" />
      <ChevronRight v-else class="header-chevron" />
    </div>
    <div v-show="showTimeline" class="timeline-content">
      <div
        v-for="(item, idx) in timeline"
        :key="idx"
        class="timeline-item"
      >
        <div
          class="timeline-dot"
          :class="item.type === 'tool' ? item.status : item.type"
        ></div>
        <div class="timeline-item-body">
          <template v-if="item.type === 'thinking'">
            <div class="timeline-thinking">{{ item.content }}</div>
          </template>
          <template v-else-if="item.type === 'error'">
            <div class="timeline-error">
              <AlertTriangle class="timeline-error-icon" />
              <span>{{ item.message }}</span>
              <span v-if="item.detail" class="timeline-error-detail">{{
                item.detail
              }}</span>
            </div>
          </template>
          <template v-else>
            <div class="timeline-tool">
              <Wrench class="timeline-tool-icon" />
              <span class="timeline-tool-name">{{ item.toolName }}</span>
              <span class="timeline-tool-status" :class="item.status">
                <Loader2
                  v-if="item.status === 'running'"
                  class="timeline-status-icon animate-spin"
                />
                <Check
                  v-else-if="item.status === 'completed'"
                  class="timeline-status-icon"
                />
                <X v-else class="timeline-status-icon" />
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
