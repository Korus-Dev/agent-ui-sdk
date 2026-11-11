<template>
  <main v-if="showStartupError" class="spark-status" aria-labelledby="spark-error-title">
    <span class="spark-status__mascot" aria-hidden="true">★</span>
    <h1 id="spark-error-title">Spark couldn’t start</h1>
    <p>{{ startupError }}</p>
    <button type="button" @click="connectHost">Try again</button>
  </main>

  <main v-else-if="!authenticationReady" class="spark-status" aria-live="polite">
    <span class="spark-status__mascot spark-status__mascot--loading" aria-hidden="true">★</span>
    <h1>Warming up Spark…</h1>
    <p>Getting your friendly helper ready.</p>
  </main>

  <SparkLanding
    v-else-if="requiresSignIn"
    :busy="signInBusy"
    :error="signInError"
    :sign-in-label="signInLabel"
    :login-command="snapshot.authentication?.loginCommand"
    @sign-in="signIn"
  />

  <main v-else class="spark-shell">
    <SparkSidebar
      :active-conversation-id="activeId"
      :conversations="conversations"
      :create-disabled="connecting"
      :loading="connecting"
      :account-label="accountLabel"
      :logout-busy="signingOut"
      :account-error="accountMenuError"
      @create="createConversation"
      @logout="signOut"
      @select="activeId = $event"
    />

    <section class="spark-conversation" aria-label="Spark conversation">
      <header class="spark-conversation__header">
        <span class="spark-conversation__avatar" aria-hidden="true">★</span>
        <div>
          <h1>{{ activeTitle }}</h1>
          <p>Your friendly idea helper</p>
        </div>
      </header>

      <ConversationPane
        v-if="current"
        ref="chat"
        class="spark-chat"
        :conversation="current"
        :bridge="bridge"
        focused
        :capabilities="sparkCapabilities"
        :attach-enabled="false"
        :commands="[]"
        :presentation="sparkPresentation"
        :can-delete-turn="false"
        :can-edit-turn="false"
        :can-retry-turn="false"
        aria-label="Chat with Spark"
        empty-title="What are you curious about?"
        empty-description="Ask a question, dream up a story, or learn something surprising."
        placeholder="Ask Spark anything…"
        autofocus
      >
        <template #empty>
          <div class="spark-empty">
            <span class="spark-empty__mascot" aria-hidden="true">★</span>
            <h2>Hi! I’m Spark.</h2>
            <p>What should we wonder about today?</p>
            <div class="spark-prompts" aria-label="Try asking">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion.prompt"
                type="button"
                @click="sendSuggestion(suggestion.prompt)"
              >
                <span aria-hidden="true">{{ suggestion.icon }}</span>
                {{ suggestion.label }}
              </button>
            </div>
          </div>
        </template>
      </ConversationPane>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { ConversationPresentation } from '@korus-dev/agent-ui-sdk';
import ConversationPane from '../../../../shared/ConversationView.vue';
import type { Snapshot } from '../../../../shared/contracts';
import SparkLanding from './components/SparkLanding.vue';
import SparkSidebar from './components/SparkSidebar.vue';
import { sparkCapabilities } from './spark-capabilities';

if (!window.sample) throw new Error('The Electron sample bridge is unavailable.');
const bridge = window.sample;
const snapshot = shallowRef<Snapshot>({ backend: 'codex', authentication: null, conversations: [] });
const activeId = ref<string | null>(null);
const current = computed(() => snapshot.value.conversations.find(conversation => conversation.id === activeId.value));
const conversations = computed(() => snapshot.value.conversations.map(conversation => ({ id: conversation.id, title: conversation.state.title ?? 'Untitled conversation', preview: '' })));
const chat = ref<InstanceType<typeof ConversationPane>>();
const connecting = ref(false);
const connectError = ref<string | null>(null);
const openingSignIn = ref(false);
const localSignInError = ref<string | null>(null);
const signingOut = ref(false);
const accountMenuError = ref<string | null>(null);
const authenticationReady = computed(() => snapshot.value.authentication !== null);
const requiresSignIn = computed(() => snapshot.value.authentication?.connected !== true);
const startupError = computed(() => connectError.value ?? snapshot.value.authentication?.error);
const showStartupError = computed(() => Boolean(startupError.value));
const signInBusy = computed(() => openingSignIn.value || snapshot.value.authentication?.pending === true);
const signInError = computed(() => localSignInError.value ?? snapshot.value.authentication?.error);
const activeTitle = computed(() => current.value?.state.title ?? 'A new chat');
const backendName = computed(() => ({ codex: 'ChatGPT', claude: 'Claude', cursor: 'Cursor', antigravity: 'Antigravity' })[snapshot.value.backend]);
const accountLabel = computed(() => `${backendName.value} account`);
const signInLabel = computed(() => snapshot.value.backend === 'claude' ? 'Check Claude sign-in' : `Sign in with ${backendName.value}`);
const sparkPresentation: ConversationPresentation = {
  composer: { actionMenu: false, contextUsage: false, voice: false },
  messages: {
    actions: { copy: false, delete: false, edit: false, quote: false, retry: false },
    toolBlocks: false,
  },
  shelf: { goal: false, queuedPrompts: false, turnGitDiff: false },
};
const suggestions = [
  { icon: '🐉', label: 'Invent a funny creature', prompt: 'Help me invent a funny creature.' },
  { icon: '🪐', label: 'Explore space', prompt: 'Tell me something amazing about space.' },
  { icon: '🐬', label: 'Take an ocean quiz', prompt: 'Quiz me about the ocean.' },
] as const;


const off = bridge.subscribe(value => {
  snapshot.value = value;
  if (!value.conversations.some(conversation => conversation.id === activeId.value)) activeId.value = value.conversations[0]?.id ?? null;
});
onMounted(() => { void connectHost(); });
onBeforeUnmount(off);

async function connectHost(): Promise<void> {
  connectError.value = null; connecting.value = true;
  try {
    snapshot.value = await bridge.snapshot();
    activeId.value = snapshot.value.conversations[0]?.id ?? null;
    await bridge.call('authenticate', 'check');
  } catch { connectError.value = 'We could not get Spark ready. Please check your connection and try again.'; }
  finally { connecting.value = false; }
}
async function createConversation(): Promise<void> {
  activeId.value = String(await bridge.call('create'));
}
async function signIn(): Promise<void> {
  localSignInError.value = null; openingSignIn.value = true;
  try { await bridge.call('authenticate', 'login'); }
  catch { localSignInError.value = 'We could not open sign in. Please ask a grown-up to try again.'; }
  finally { openingSignIn.value = false; }
}
async function signOut(): Promise<void> {
  accountMenuError.value = null; signingOut.value = true;
  try { await bridge.call('authenticate', 'logout'); localSignInError.value = null; }
  catch { accountMenuError.value = 'We could not sign out. Please try again.'; }
  finally { signingOut.value = false; }
}
async function sendSuggestion(prompt: string): Promise<void> {
  if (!current.value) { await createConversation(); await nextTick(); }
  await chat.value?.submit(prompt);
}
</script>
