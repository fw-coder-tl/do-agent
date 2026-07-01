<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  FileText,
  MessageSquare,
  Microscope,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Presentation,
  Trash2,
  User,
  Wrench,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AgentConfig, AgentId } from '@/constants/agents'
import type { ChatSummary } from '@/types/chat'

const props = withDefaults(
  defineProps<{
    agents: AgentConfig[]
    selectedAgent: string
    chatList: ChatSummary[]
    currentChatId: string | null
    backendUrl: string
    preview?: boolean
    collapsed?: boolean
  }>(),
  {
    preview: false,
    collapsed: false,
  },
)

defineEmits<{
  createNewChat: []
  selectAgent: [agentId: string]
  selectChat: [chatId: string]
  deleteChat: [chatId: string]
  toggleCollapse: []
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

const hasHistoryChats = computed(() =>
  props.chatList.some((chat) => !chat.isNew),
)

/** 登录入口占位（暂无真实登录逻辑） */
const loginPlaceholder = {
  displayName: '未登录用户',
  hint: '登录 / 注册',
}
</script>

<template>
  <aside
    class="sidebar app-sidebar"
    :class="{
      'app-sidebar--preview': preview,
      'app-sidebar--collapsed': collapsed && !preview,
    }"
  >
    <div class="sidebar-top">
      <div class="sidebar-top__row">
        <button type="button" class="sidebar-brand">
          <span class="sidebar-brand__avatar">🌱</span>
          <span class="sidebar-brand__name">豆豆</span>
        </button>
        <button
          v-if="!preview"
          type="button"
          class="sidebar-collapse-btn"
          title="收起侧边栏"
          aria-label="收起侧边栏"
          @click="$emit('toggleCollapse')"
        >
          <PanelLeftClose class="sidebar-collapse-btn__icon" />
        </button>
        <button
          v-else
          type="button"
          class="sidebar-collapse-btn sidebar-collapse-btn--pin"
          title="固定侧边栏"
          aria-label="固定侧边栏"
          @click="$emit('toggleCollapse')"
        >
          <PanelLeftOpen class="sidebar-collapse-btn__icon" />
        </button>
      </div>

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

    <div
      class="sidebar-history"
      :class="{ 'sidebar-history--empty': !hasHistoryChats }"
    >
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
      <button
        type="button"
        class="sidebar-account sidebar-account--login"
        aria-label="登录入口（占位）"
      >
        <span class="sidebar-account__avatar">
          <User class="sidebar-account__avatar-icon" />
        </span>
        <div class="sidebar-account__info">
          <span class="sidebar-account__name">{{ loginPlaceholder.displayName }}</span>
          <span class="sidebar-account__meta">{{ loginPlaceholder.hint }}</span>
        </div>
      </button>
    </div>
  </aside>
</template>
