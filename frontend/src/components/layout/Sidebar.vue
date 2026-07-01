<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  FileText,
  MessageSquare,
  Microscope,
  Plus,
  Presentation,
  Search,
  Trash2,
  Wrench,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AgentConfig, AgentId } from '@/constants/agents'
import type { ChatSummary } from '@/types/chat'

const props = defineProps<{
  agents: AgentConfig[]
  selectedAgent: string
  chatList: ChatSummary[]
  currentChatId: string | null
  backendUrl: string
}>()

defineEmits<{
  createNewChat: []
  selectAgent: [agentId: string]
  selectChat: [chatId: string]
  deleteChat: [chatId: string]
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

const isNewChatActive = computed(() => {
  const chat = props.chatList.find((c) => c.id === props.currentChatId)
  return chat?.isNew ?? false
})
</script>

<template>
  <aside class="sidebar app-sidebar">
    <div class="sidebar-top">
      <div class="sidebar-search" role="search" aria-hidden="true">
        <Search class="sidebar-search__icon" />
        <input
          type="search"
          class="sidebar-search__input"
          placeholder="搜索..."
          readonly
          tabindex="-1"
          aria-hidden="true"
        />
        <kbd class="sidebar-search__kbd">Ctrl K</kbd>
      </div>

      <button type="button" class="sidebar-brand">
        <span class="sidebar-brand__avatar">🌱</span>
        <span class="sidebar-brand__name">豆豆</span>
      </button>

      <button
        type="button"
        :class="[
          'sidebar-new-chat',
          { 'sidebar-new-chat--active': isNewChatActive },
        ]"
        @click="$emit('createNewChat')"
      >
        <Plus class="sidebar-new-chat__icon" />
        <span class="sidebar-new-chat__label">新对话</span>
      </button>
    </div>

    <section class="sidebar-capabilities" aria-label="助手能力">
      <h2 class="sidebar-capabilities__title">助手能力</h2>
      <ul class="sidebar-capabilities__list">
        <li v-for="agent in agents" :key="agent.id">
          <button
            type="button"
            :class="[
              'sidebar-capability',
              { 'sidebar-capability--active': selectedAgent === agent.id },
            ]"
            @click="$emit('selectAgent', agent.id)"
          >
            <component :is="getAgentIcon(agent.id)" class="sidebar-capability__icon" />
            <span class="sidebar-capability__label">{{ agent.name }}</span>
          </button>
        </li>
      </ul>
    </section>

    <div class="sidebar-history">
      <h2 class="sidebar-history__title">历史对话</h2>
      <ScrollArea class="sidebar-scroll">
        <div class="chat-list">
          <div
            v-for="chat in chatList"
            :key="chat.id"
            :class="[
              'chat-item',
              { active: currentChatId === chat.id },
            ]"
            @click="$emit('selectChat', chat.id)"
          >
            <span class="chat-title">{{ chat.title }}</span>
            <Button
              v-if="!chat.isNew"
              type="button"
              variant="ghost"
              size="icon-sm"
              class="delete-btn"
              @click.stop="$emit('deleteChat', chat.id)"
            >
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-account">
        <span class="sidebar-account__avatar">🌱</span>
        <div class="sidebar-account__info">
          <span class="sidebar-account__name">豆豆工作台</span>
          <span class="sidebar-account__meta">{{ backendUrl }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
