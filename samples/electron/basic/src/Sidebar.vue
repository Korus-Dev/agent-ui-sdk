<script setup lang="ts">
import type { ChatSummary } from '../shared/api';

defineProps<{ chats: ChatSummary[]; activeId: string | null; connection: string }>();
defineEmits<{ select: [id: string]; create: [] }>();

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
</script>

<template>
  <aside class="sidebar">
    <button class="new-chat" type="button" data-testid="new-chat" @click="$emit('create')">New chat</button>
    <ul class="chat-list" data-testid="chat-list">
      <li v-for="chat in chats" :key="chat.id">
        <button type="button" :class="{ active: chat.id === activeId }" :data-chat-id="chat.id" @click="$emit('select', chat.id)">
          <span class="title">{{ chat.title }}</span>
          <span class="date">{{ formatDate(chat.updatedAt) }}</span>
        </button>
      </li>
    </ul>
    <footer class="connection">{{ connection }}</footer>
  </aside>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid #e5e5ea; background: #f6f6f8; }
.new-chat { margin: 12px; padding: 8px 12px; border: 1px solid #d1d1d6; border-radius: 8px; background: #fff; font: inherit; cursor: pointer; }
.new-chat:hover { background: #f0f0f3; }
.chat-list { flex: 1; min-height: 0; margin: 0; padding: 0 8px; overflow-y: auto; list-style: none; }
.chat-list button { display: flex; justify-content: space-between; gap: 8px; width: 100%; padding: 7px 10px; border: 0; border-radius: 6px; background: none; font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.chat-list button:hover { background: #ebebef; }
.chat-list button.active { background: #dfe3f5; }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.date { flex: none; color: #8e8e93; }
.connection { padding: 10px 14px; font-size: 12px; color: #8e8e93; border-top: 1px solid #e5e5ea; }
</style>
