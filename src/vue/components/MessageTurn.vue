<template>
  <div class="agent-ui-message-turn">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide, ref, shallowReactive, watch } from 'vue'
import type { TurnStatus } from '@korus-dev/multi-agent-sdk';
import {
  computeMessageBlocks,
  hasExplicitAssistantWorkPhases,
  isAssistantWorkBlock,
} from '../chat/message-blocks'
import { renderedChatMessage, type ConversationMessageInput } from '../chat/renderer-message-adapter'
import type { ChatMessage, MessagePhase } from '../chat/types'
import { assistantWorkTurnKey, questionResponsesKey } from '../chat/message-work-state'

provide(questionResponsesKey, inject(questionResponsesKey, undefined) ?? shallowReactive(new Map()))

type TurnEntry = {
  index: number
  message: ChatMessage | ConversationMessageInput
}

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = defineProps<{
  active?: boolean
  answeredClientRequestIds?: ReadonlySet<string>
  durationMs?: number | null
  itemsView?: 'summary' | 'full'
  detailsLoading?: boolean
  detailsError?: string | null
  entries: readonly TurnEntry[]
  showToolBlocks: boolean
  startedAt?: string | null
  status?: TurnStatus
  turnId?: string
  /** The harness states work phases itself (see `Capabilities.workPhases`). */
  workPhases?: boolean
}>()
const emit = defineEmits<{ loadTurnHistory: [turnId: string] }>()
// Stryker restore all

const messages = computed(() => props.entries.map((entry) => ({
  entry,
  message: renderedChatMessage(entry.message),
})))
const turnId = computed(() => props.turnId)
// A harness that states phases (Codex) groups a turn by them. Otherwise the turn's text carries no phase, and the
// work/answer split is derived from the structure: text after the last tool or reasoning item is the answer.
const statesPhases = computed(() => props.workPhases === true || messages.value.some(({ message }) => (
  message.role === 'assistant' && message.parts?.some(part => (
    (part.type === 'text' || part.type === 'media') && part.phase !== undefined
  ))
)))
// Only turns with stated phases, or that report an items view, fold their work behind "View details".
const collapsible = computed(() => statesPhases.value || props.itemsView !== undefined)
const derivedPhases = computed(() => {
  if (statesPhases.value) return undefined
  const sequence: Array<{ entry: number; part: number; work: boolean }> = []
  for (const { entry, message } of messages.value) {
    if (message.role !== 'assistant') continue
    message.parts?.forEach((part, partIndex) => {
      if (part.type === 'tool' || part.type === 'reasoning') sequence.push({ entry: entry.index, part: partIndex, work: true })
      else if (part.type === 'text' && part.content.trim()) sequence.push({ entry: entry.index, part: partIndex, work: false })
    })
  }
  const lastWork = sequence.map(item => item.work).lastIndexOf(true)
  const phases = new Map<string, MessagePhase>()
  sequence.forEach((item, position) => {
    if (!item.work) phases.set(`${item.entry}:${item.part}`, position > lastWork ? 'final_answer' : 'commentary')
  })
  return phases
})
const phased = computed(() => statesPhases.value
  ? messages.value.some(({ message }) => message.role === 'assistant' && hasExplicitAssistantWorkPhases(message))
  : messages.value.some(({ message }) => message.role === 'assistant' && message.parts?.some(part => (
    part.type === 'tool' || part.type === 'reasoning'
  ))))
const latestStreamingAssistantIndex = computed(() => [...messages.value]
  .reverse()
  .find(({ message }) => message.role === 'assistant' && message.streaming === true)
  ?.entry.index)
const latestStreamingWorkIndex = computed(() => props.active === false
  ? undefined
  : [...messages.value]
      .reverse()
      .find(({ message }) => (
        message.role === 'assistant'
        && message.streaming === true
        && (message.parts?.length ?? 0) > 0
      ))
      ?.entry.index)
const finalStarted = computed(() => !statesPhases.value
  ? [...(derivedPhases.value?.values() ?? [])].includes('final_answer')
  : messages.value.some(({ entry, message }) => (
  message.role === 'assistant'
  && (latestStreamingWorkIndex.value === undefined
    || entry.index >= latestStreamingWorkIndex.value)
  && (message.parts?.some((part) => (
    part.type === 'text'
      && part.phase === 'final_answer'
      && part.content.trim().length > 0
  )) ?? false)
)))
// Without stated phases the turn is working until it ends, even while its answer streams.
const active = computed(() => (statesPhases.value ? !finalStarted.value : true) && (props.active ?? messages.value.some(({ message }) => (
  message.role === 'assistant' && message.streaming === true
))))
const status = computed(() => props.status)
const startedAt = computed(() => props.startedAt)
const durationMs = computed(() => props.durationMs)
const stoppedWithoutFinal = computed(() => (
  collapsible.value
  && props.itemsView !== 'summary'
  && !active.value
  && !finalStarted.value
  && (status.value === 'interrupted' || status.value === 'failed')
))
const completedWithoutFinal = computed(() => (
  collapsible.value
  && props.itemsView === undefined
  && phased.value
  && !active.value
  && !finalStarted.value
  && (status.value === undefined || status.value === 'completed')
))
const headerMessageIndex = computed(() => messages.value.find(({ message }) => (
  message.role === 'assistant' && (props.itemsView !== undefined || shouldGroupMessageWork(message))
))?.entry.index)
const hasDetails = computed(() => props.itemsView === 'summary' || messages.value.some(({ message }) => (
  (message.type === 'steer' && computeMessageBlocks(message).length > 0)
  || message.role === 'assistant' && computeMessageBlocks(message).some(block => (
    (props.showToolBlocks || (block.type !== 'tool' && block.type !== 'tool-group'))
    && isAssistantWorkBlock(block, props.answeredClientRequestIds)
  ))
)))
const enabled = computed(() => Boolean(turnId.value && headerMessageIndex.value !== undefined))
const expanded = ref((active.value && !finalStarted.value) || stoppedWithoutFinal.value)
const userToggled = ref(false)
const detailsLoading = computed(() => !active.value && expanded.value && (props.detailsLoading || (
  props.itemsView === 'summary' && !props.detailsError
)))

watch(finalStarted, (started, previous) => {
  if (started && !previous && !userToggled.value) expanded.value = false
})

watch([active, stoppedWithoutFinal], ([isActive, isStoppedWithoutFinal]) => {
  if (!userToggled.value) expanded.value = (isActive && !finalStarted.value) || isStoppedWithoutFinal
})

provide(assistantWorkTurnKey, {
  active,
  completedWithoutFinal,
  enabled,
  expanded: computed(() => !collapsible.value || (expanded.value && !detailsLoading.value && (active.value || props.itemsView !== 'summary' || Boolean(props.detailsError)))),
  finalStarted,
  headerMessageIndex,
  latestStreamingAssistantIndex,
  phased,
  startedAt,
  durationMs,
  hasDetails,
  collapsible,
  phaseFor: (messageIndex, partIndex) => derivedPhases.value?.get(`${messageIndex}:${partIndex}`),
  itemsView: computed(() => props.itemsView),
  detailsLoading,
  detailsError: computed(() => props.detailsError),
  reloadDetails: () => { if (props.turnId) emit('loadTurnHistory', props.turnId) },
  status,
  turnId,
  toggle() {
    userToggled.value = true
    expanded.value = !expanded.value
  },
})

watch([active, expanded, () => props.itemsView, () => props.detailsLoading, () => props.detailsError], () => {
  if (!active.value && expanded.value && props.itemsView === 'summary' && !props.detailsLoading && !props.detailsError && props.turnId) emit('loadTurnHistory', props.turnId)
}, { immediate: true })

function shouldGroupMessageWork(message: ChatMessage): boolean {
  const blocks = computeMessageBlocks(message).filter((block) => (
    props.showToolBlocks || (block.type !== 'tool' && block.type !== 'tool-group')
  ))
  if (blocks.length === 0) return false
  if (phased.value) return blocks.some((block) => isAssistantWorkBlock(block, props.answeredClientRequestIds))
  return active.value && blocks.every((block) => block.type === 'tool' || block.type === 'tool-group')
}
</script>

<style scoped>
.agent-ui-message-turn {
  display: contents;
}
</style>
