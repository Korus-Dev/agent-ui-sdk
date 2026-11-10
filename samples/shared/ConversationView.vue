<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { ConversationPane, createSessionConversationController, resolveConversationPaneValue, type Capabilities, type ConversationPresentation } from '@korus-dev/agent-ui-sdk';
import type { Conversation, SampleBridge } from './contracts';
const props = defineProps<{ conversation: Conversation; bridge: SampleBridge; focused?: boolean; capabilities?: Capabilities; presentation?: ConversationPresentation; placeholder?: string }>();
const id = props.conversation.id;
const binding = createSessionConversationController({
  conversationKey: id,
  state: () => props.conversation.state,
  capabilities: () => props.conversation.capabilities,
  controls: () => ({ models: props.conversation.models, modelCatalogStatus: 'loaded' }),
  client: {
    sendPrompt: (text, options) => props.bridge.call('send', id, text, options),
    steerPrompt: (text, options) => props.bridge.call('steer', id, text, options),
    interrupt: () => props.bridge.call('interrupt', id),
    respondToRequest: response => props.bridge.call('respond', id, response),
    setPermission: permission => props.bridge.call('permission', id, permission),
    setGoal: objective => props.bridge.call('goal', id, objective),
    clearGoal: () => props.bridge.call('clearGoal', id),
    readConversationContent: async input => await props.bridge.call('content', id, input) as Awaited<ReturnType<NonNullable<import('@korus-dev/agent-ui-sdk').SessionConversationClient['readConversationContent']>>>,
    loadOlderHistory: async () => { await props.bridge.call('history', id); },
    loadTurnHistory: async turn => { await props.bridge.call('turnHistory', id, turn); },
    deleteTurn: turn => props.bridge.call('deleteTurn', id, turn),
    retryTurn: turn => props.bridge.call('retryTurn', id, turn),
    editTurn: (turn, text, options) => props.bridge.call('editTurn', id, turn, text, options),
  },
});
const presentation = computed(() => props.presentation ?? (props.focused ? { composer: { actionMenu: false }, shelf: { goal: false, turnGitDiff: false } } : undefined));
const controller = { ...binding.controller, state: () => {
  const state = resolveConversationPaneValue(binding.controller.state);
  return { ...state, composer: { ...state.composer, ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }) }, capabilities: props.capabilities ?? state.capabilities,
    policy: props.focused ? { ...state.policy, attachEnabled: false, canDeleteTurn: false, canEditTurn: false, canRetryTurn: false, canForkTurn: false } : state.policy };
} };
onBeforeUnmount(binding.dispose);
defineExpose({ submit: (prompt: string) => binding.controller.actions.submit?.(prompt) });
</script>
<template><ConversationPane :controller="controller" :presentation="presentation"><template v-if="$slots.empty" #empty="slotProps"><slot name="empty" v-bind="slotProps" /></template></ConversationPane></template>
