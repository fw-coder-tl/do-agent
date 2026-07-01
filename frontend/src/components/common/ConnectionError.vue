<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps<{
  message: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div v-if="message" class="connection-error">
    <AlertTriangle class="size-5 shrink-0" />
    <span>{{ message }}</span>
    <Button type="button" variant="secondary" size="sm" class="retry-btn" @click="$emit('retry')">
      重试
    </Button>
  </div>
</template>
