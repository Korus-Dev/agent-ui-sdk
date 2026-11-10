<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { HarnessProvider } from '@korus-dev/multi-agent-sdk';
import RelayBoard from '../electron/relay/src/renderer/components/OperationsBoard.vue';
import { buildRelayPrompt } from '../electron/relay/src/shared/relay-prompts';
import type { RelaySnapshot, RelayAction, RelayShipment } from '../electron/relay/src/shared/relay-contracts';
import ConversationView from './ConversationView.vue';
import type { Snapshot } from './contracts';
if (!window.sample) throw new Error('The Electron sample bridge is unavailable.');
const bridge = window.sample;
const shape = new URLSearchParams(location.search).get('sample') ?? 'basic';
const snapshot = shallowRef<Snapshot>({ conversations: [] });
const provider = ref<HarnessProvider>('codex');
const selected = ref('');
const error = ref('');
const pending = ref(false);
const relay = shallowRef<RelaySnapshot>();
const shipmentId = ref('SHP-4827');
const shipment = computed(() => relay.value?.shipments.find(s => s.id === shipmentId.value) ?? relay.value?.shipments[0]);
async function refreshRelay() { relay.value = await bridge.call('relaySnapshot') as RelaySnapshot; }
async function relayAction(action: RelayAction, shipment: RelayShipment) { await run(async () => { await view.value?.submit(buildRelayPrompt(action, shipment)); }); }
const current = computed(() => snapshot.value.conversations.find(c => c.id === selected.value));
const view = ref<InstanceType<typeof ConversationView>>();
async function run(action: () => Promise<unknown>) { error.value = ''; pending.value = true; try { await action(); } catch (cause) { error.value = String(cause); } finally { pending.value = false; } }
async function create() { await run(async () => { selected.value = String(await bridge.call('create', provider.value)); }); }
const off = bridge.subscribe(value => { snapshot.value = value; if (shape === 'relay') void run(refreshRelay); });
onMounted(async () => { await run(async () => { snapshot.value = await bridge.snapshot(); selected.value = snapshot.value.conversations[0]?.id ?? ''; if (shape === 'relay') await refreshRelay(); }); });
onBeforeUnmount(off);
</script>
<template>
  <main :class="['sample-app', shape]">
    <aside>
      <h1>{{ shape === 'spark' ? 'Spark' : shape === 'relay' ? 'Relay' : 'Agent UI' }}</h1>
      <label for="harness">Harness</label>
      <select id="harness" v-model="provider" :disabled="pending"><option value="codex">Codex</option><option value="claude">Claude</option><option value="cursor">Cursor</option><option value="antigravity">Antigravity</option></select>
      <button :disabled="pending" @click="create">New conversation</button>
      <nav aria-label="Conversations"><button v-for="conversation in snapshot.conversations" :key="conversation.id" :aria-current="selected === conversation.id ? 'page' : undefined" @click="selected = conversation.id">{{ conversation.state.title ?? conversation.provider }}</button></nav>
      <button v-if="current" :disabled="pending" @click="run(async () => { await bridge.call('release', selected); selected = ''; })">Close conversation</button>
    </aside>
    <section class="sample-conversation">
      <div v-if="shape === 'relay' && relay && shipment" class="sample-operations"><RelayBoard v-if="shape === 'relay' && relay && shipment" :snapshot="relay" :selected-shipment="shipment" :action-pending="!current || pending" :reset-pending="pending" @select="shipmentId = $event" @action="relayAction" @reset="run(async () => { relay = await bridge.call('relayReset') as RelaySnapshot; })" /></div>
      <p v-if="error" role="alert">{{ error }}</p>
      <ConversationView v-if="current" :key="current.id" ref="view" :conversation="current" :bridge="bridge" :focused="shape === 'spark'" />
      <p v-else class="empty">{{ shape === 'spark' ? 'What would you like to explore?' : 'Choose a harness and start a conversation.' }}</p>
    </section>
  </main>
</template>
