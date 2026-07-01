<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

defineProps<{
  visible: boolean
  title: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onOpenChange(open: boolean): void {
  if (!open) {
    emit('cancel')
  }
}
</script>

<template>
  <AlertDialog :open="visible" @update:open="onOpenChange">
    <AlertDialogContent class="sm:max-w-md">
      <AlertDialogHeader>
        <div class="confirm-icon mb-2 flex justify-center">
          <AlertCircle class="size-14 text-destructive" />
        </div>
        <AlertDialogTitle class="text-center">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription class="text-center">
          {{ message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="sm:justify-center">
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction variant="destructive" @click="emit('confirm')">
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
