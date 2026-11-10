<template>
  <ChatToolConfirmation
    :tool-call="toolCall"
    @client-response="$emit('client-response', $event)"
  />
</template>

<script setup lang="ts">
import { confirmationPayload, type ConversationRequest as CodexSurfaceClientRequest } from './conversation-request';
import { computed } from 'vue'
import type { ClientRequestResponse as CodexSurfaceClientRequestResponse } from '@korus-dev/multi-agent-sdk/ui-types';
import type { MessageToolCall } from './types'
import ChatToolConfirmation from './ChatToolConfirmation.vue'

const props = defineProps<{
  request: Extract<CodexSurfaceClientRequest, { kind: 'toolConfirmation' | 'confirm_tool' }>
}>()
defineEmits<{ 'client-response': [response: CodexSurfaceClientRequestResponse] }>()

const toolCall = computed<MessageToolCall>(() => ({
  args: undefined,
  result: undefined,
  id: props.request.itemId ?? props.request.id,
  itemId: props.request.itemId,
  function: confirmationPayload(props.request).toolName,
  done: false,
  state: 'running',
  status: JSON.stringify({
    source: 'mcp',
    action: 'confirm_tool',
    phase: 'running',
    params: {
      requestId: props.request.id,
      confirmationSummary: confirmationPayload(props.request).summary,
      argumentsPreview: confirmationPayload(props.request).argumentsPreview,
      allowConversation: confirmationPayload(props.request).allowConversation,
      allowAlways: confirmationPayload(props.request).allowAlways,
    },
  }),
}))
</script>
