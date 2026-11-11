<template>
  <ConversationPane :messages="messages" :busy="true" :render-strategy="lazy ? 'lazy' : 'eager'">
    <template #message-header><span class="host-message-header">Host header</span></template>
    <template #mention><span>Host mention</span></template>
  </ConversationPane>
</template>
<script setup lang="ts">
import type { ConversationMessage } from '@korus-dev/multi-agent-sdk'
import ConversationPane from '../../../src/vue/components/ConversationPane.vue'
defineProps<{ messages: ConversationMessage[]; lazy: boolean }>()
</script>
