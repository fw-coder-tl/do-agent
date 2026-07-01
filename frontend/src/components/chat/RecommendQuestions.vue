<script setup lang="ts">
defineProps<{
  questions: string[]
}>()

defineEmits<{
  select: [question: string]
}>()
</script>

<template>
  <div v-if="questions.length > 0" class="recommend-section">
    <div class="recommend-pills">
      <button
        v-for="(question, qIndex) in questions"
        :key="qIndex"
        type="button"
        class="recommend-pill"
        @click="$emit('select', question)"
      >
        {{ question }}
      </button>
    </div>
  </div>
</template>
