<template>
  <ChatToolUserInputRequest
    :answered-client-request-ids="answeredClientRequestIds"
    :historical="historical"
    :tool-call="toolCall"
    @client-response="respond"
  />
</template>

<script setup lang="ts">
import { questionPayload, type ConversationRequest as ClientRequest } from './conversation-request';
import { computed, inject } from 'vue'
import { questionResponsesKey } from './message-work-state'
import ChatToolUserInputRequest from './ChatToolUserInputRequest.vue'
import type { ClientRequestResponse } from './contracts'
import type { MessageToolCall } from './types'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = defineProps<{
  answeredClientRequestIds?: ReadonlySet<string>
  historical?: boolean
  request: Extract<ClientRequest, { kind: 'question' | 'ask_user' }>
}>()

const emit = defineEmits<{
  'client-response': [response: ClientRequestResponse]
}>()
// Stryker restore all

const responses = inject(questionResponsesKey, undefined)
function respond(response: ClientRequestResponse) {
  responses?.set(response.id, response.payload)
  emit('client-response', response)
}

const toolCall = computed<MessageToolCall>(() => ({
  args: questionPayload(props.request).questions,
  done: false,
  function: 'ask_user_question',
  id: props.request.itemId ?? questionPayload(props.request).itemId,
  itemId: props.request.itemId,
  result: responses?.get(props.request.id) ?? null,
  state: responses?.get(props.request.id)?.cancelled ? 'canceled' : 'running',
  status: JSON.stringify({
    source: 'harness',
    action: 'ask_user_question',
    phase: 'running',
    params: {
      requestId: props.request.id,
      questions: questionPayload(props.request).questions,
    },
  }),
  turnId: props.request.turnId,
}))
</script>
