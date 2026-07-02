<script setup lang="ts">
import type { AgentConfig } from '@/constants/agents'

defineProps<{
  agents: AgentConfig[]
  selectedAgent: string
}>()

defineEmits<{
  selectAgent: [agentId: string]
}>()
</script>

<template>
  <div class="agent-selector">
    <button
      v-for="agent in agents"
      :key="agent.id"
      type="button"
      :class="[
        'agent-pill',
        { 'agent-pill--active': selectedAgent === agent.id },
      ]"
      @click="$emit('selectAgent', agent.id)"
    >
      <span class="agent-pill__icon">{{ agent.icon }}</span>
      <span class="agent-pill__name">{{ agent.name }}</span>
    </button>
  </div>
</template>
