<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import RelayBoard from '../electron/relay/src/renderer/components/OperationsBoard.vue';
import RelaySignIn from '../electron/relay/src/renderer/components/RelaySignIn.vue';
import { buildRelayPrompt } from '../electron/relay/src/shared/relay-prompts';
import type { RelaySnapshot, RelayAction, RelayShipment } from '../electron/relay/src/shared/relay-contracts';
import ConversationView from './ConversationView.vue';
import type { Snapshot } from './contracts';
if (!window.sample) throw new Error('The Electron sample bridge is unavailable.');
const bridge = window.sample;
const shape = 'relay';
const snapshot = shallowRef<Snapshot>({ backend: 'codex', authentication: null, conversations: [] });
const error = ref('');
const pending = ref(false);
const relay = shallowRef<RelaySnapshot>();
const shipmentId = ref('SHP-4827');
const shipment = computed(() => relay.value?.shipments.find(s => s.id === shipmentId.value) ?? relay.value?.shipments[0]);
const current = computed(() => snapshot.value.conversations[0]);
const view = ref<InstanceType<typeof ConversationView>>();
const accountLabel = computed(() => `${({ codex: 'ChatGPT', claude: 'Claude', cursor: 'Cursor', antigravity: 'Antigravity' })[snapshot.value.backend]} account`);
const label = computed(() => snapshot.value.backend === 'codex' ? 'Continue with ChatGPT' : snapshot.value.backend === 'claude' ? 'Check Claude sign-in' : `Sign in with ${snapshot.value.backend === 'cursor' ? 'Cursor' : 'Antigravity'}`);
async function run(action: () => Promise<unknown>) { error.value = ''; pending.value = true; try { await action(); } catch (cause) { error.value = String(cause); } finally { pending.value = false; } }
async function refreshRelay() { relay.value = await bridge.call('relaySnapshot') as RelaySnapshot; }
async function relayAction(action: RelayAction, shipment: RelayShipment) { await run(async () => { await view.value?.submit(buildRelayPrompt(action, shipment)); }); }
const off = bridge.subscribe(value => { snapshot.value = value; if (shape === 'relay' && value.authentication?.connected) void run(refreshRelay); });
onMounted(() => { void run(async () => { snapshot.value = await bridge.snapshot(); await bridge.call('authenticate', 'check'); if (shape === 'relay' && snapshot.value.authentication?.connected) await refreshRelay(); }); });
onBeforeUnmount(off);
</script>
<template>
  <RelaySignIn v-if="shape === 'relay' && snapshot.authentication && !snapshot.authentication.connected"
    :busy="pending || snapshot.authentication.pending" :error="error || snapshot.authentication.error" :label="label" :login-command="snapshot.authentication.loginCommand"
    @sign-in="run(() => bridge.call('authenticate', 'login'))" />
  <main v-else :class="['sample-app', shape]">
    <div v-if="shape === 'relay' && relay && shipment" class="sample-operations">
      <RelayBoard :snapshot="relay" :account-label="accountLabel" @sign-out="run(() => bridge.call('authenticate', 'logout'))" :selected-shipment="shipment" :action-pending="!current || pending" :reset-pending="pending"
        @select="shipmentId = $event" @action="relayAction" @reset="run(async () => { relay = await bridge.call('relayReset') as RelaySnapshot; })" />
    </div>
    <section class="sample-conversation">
      <p v-if="error" role="alert">{{ error }}</p>
      <ConversationView v-if="current" :key="current.id" ref="view" :conversation="current" :bridge="bridge" />
      <p v-else class="sample-status" role="status">Starting conversation…</p>
    </section>
  </main>
</template>
