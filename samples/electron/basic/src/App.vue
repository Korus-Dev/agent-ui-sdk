<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowReactive, shallowRef, type ShallowRef } from 'vue';
import { ConversationPane, createSessionConversationController } from '@korus-dev/agent-ui-sdk';
import type { ChatSummary, ChatView } from '../shared/api';
import { api } from './api';
import Sidebar from './Sidebar.vue';

type Binding = { view: ShallowRef<ChatView>; controller: ReturnType<typeof createSessionConversationController>['controller']; dispose(): void };

const chats = ref<ChatSummary[]>([]);
const activeId = ref<string | null>(null);
const connection = ref('Connecting…');
const failure = ref<string | null>(null);
// One binding per conversation, kept across navigation so queued prompts survive switching.
const bindings = shallowReactive(new Map<string, Binding>());
const active = computed(() => (activeId.value ? bindings.get(activeId.value) : undefined));

function bind(initial: ChatView): Binding {
  const view = shallowRef(initial);
  const id = initial.id;
  const { controller, dispose } = createSessionConversationController({
    state: () => view.value.state,
    capabilities: () => view.value.capabilities,
    conversationKey: id,
    controls: () => ({ models: view.value.models }),
    client: {
      sendPrompt: (prompt, options) => api.prompt(id, prompt, options),
      steerPrompt: (prompt, options) => api.call(id, 'steerPrompt', prompt, options as never),
      interrupt: () => api.call(id, 'interrupt', view.value.state.activeTurnId ?? undefined),
      respondToRequest: response => api.call(id, 'respondToRequest', response),
      setPermission: permission => api.call(id, 'setPermission', permission),
      setGoal: objective => api.call(id, 'setGoal', objective),
      clearGoal: () => api.call(id, 'clearGoal'),
      loadTurnHistory: turnId => api.call(id, 'loadTurnHistory', turnId),
      loadOlderHistory: () => api.call(id, 'loadOlderHistory'),
      deleteTurn: turnId => api.call(id, 'deleteTurn', turnId),
      editTurn: (turnId, content, options) => api.call(id, 'editTurn', turnId, content, options),
      retryTurn: turnId => api.call(id, 'retryTurn', turnId),
      readConversationContent: input => api.call(id, 'readConversationContent', input),
    },
  });
  return { view, controller, dispose };
}

const show = (chat: ChatView) => {
  const existing = bindings.get(chat.id);
  if (existing) existing.view.value = chat;
  else bindings.set(chat.id, bind(chat));
  activeId.value = chat.id;
};
const refreshChats = async () => { chats.value = await api.chats(); };
const guard = async (work: () => Promise<void>) => {
  try { failure.value = null; await work(); } catch (error) { failure.value = error instanceof Error ? error.message : String(error); }
};
const open = (id: string) => guard(async () => show(await api.chat(id)));
const startChat = () => guard(async () => { show(await api.newChat()); await refreshChats(); });

let unsubscribe = () => {};
onMounted(async () => {
  unsubscribe = api.onChatState((event) => {
    const binding = bindings.get(event.chatId);
    if (binding) binding.view.value = { ...binding.view.value, title: event.title, state: event.state };
    const row = chats.value.find(chat => chat.id === event.chatId);
    if (row) row.title = event.title;
  });
  await guard(async () => {
    const status = await api.status();
    const backend = ({ codex: 'Codex', claude: 'Claude', cursor: 'Cursor', antigravity: 'Antigravity' })[status.backend];
    connection.value = status.connected ? `${backend} connected` : (status.runtime.detail ?? `${backend} not connected`);
    await refreshChats();
  });
});
onBeforeUnmount(() => { unsubscribe(); for (const binding of bindings.values()) binding.dispose(); });
</script>

<template>
  <div class="shell">
    <Sidebar :chats="chats" :active-id="activeId" :connection="connection" @select="open" @create="startChat" />
    <main class="main">
      <p v-if="failure" class="failure" role="alert">{{ failure }}</p>
      <ConversationPane
        v-if="active"
        :key="activeId!"
        class="pane"
        :controller="active.controller"
        :conversation-key="activeId!"
        autofocus
      />
      <div v-else class="empty">
        <h1>Select a chat or start a new one</h1>
      </div>
    </main>
  </div>
</template>
