<script setup lang="ts">
import { type Component } from 'vue'
import {
  FileText,
  MessageSquare,
  Microscope,
  Presentation,
  Wrench,
} from 'lucide-vue-next'
import type { AgentConfig, AgentId } from '@/constants/agents'

defineProps<{
  agents: AgentConfig[]
  selectedAgent: string
}>()

defineEmits<{
  selectAgent: [agentId: string]
}>()

const agentIconMap: Record<AgentId, Component> = {
  chat: MessageSquare,
  file: FileText,
  ppt: Presentation,
  deep: Microscope,
  skills: Wrench,
}

function getAgentIcon(id: string): Component {
  return agentIconMap[id as AgentId] ?? MessageSquare
}
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
      <component :is="getAgentIcon(agent.id)" class="agent-pill__icon size-4" />
      <span class="agent-pill__name">{{ agent.name }}</span>
    </button>
  </div>
</template>
