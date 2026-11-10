<template>
  <CodexConversationPane :messages="messages" :busy="true" :render-strategy="lazy ? 'lazy' : 'eager'">
    <template #message-header><span class="host-message-header">Host header</span></template>
    <template #mention><span>Host mention</span></template>
  </CodexConversationPane>
</template>
<script setup lang="ts">
import type { SurfaceMessage } from '@korus-dev/multi-agent-sdk/surface'
import CodexConversationPane from '../../../src/vue/components/CodexConversationPane.vue'
defineProps<{ messages: SurfaceMessage[]; lazy: boolean }>()
</script>
