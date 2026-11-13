import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { TurnStatus } from '@korus-dev/multi-agent-sdk';
import type { ClientRequestResponse } from './contracts'
import type { MessagePhase } from './types'

export const questionResponsesKey: InjectionKey<Map<string, ClientRequestResponse['payload']>> = Symbol('agent-ui-sdk-question-responses')

export type AssistantWorkTurnContext = {
  active: ComputedRef<boolean>
  completedWithoutFinal: ComputedRef<boolean>
  enabled: ComputedRef<boolean>
  expanded: Ref<boolean>
  finalStarted: ComputedRef<boolean>
  headerMessageIndex: ComputedRef<number | undefined>
  latestStreamingAssistantIndex: ComputedRef<number | undefined>
  phased: ComputedRef<boolean>
  startedAt?: ComputedRef<string | null | undefined>
  hasDetails?: ComputedRef<boolean>
  /** The turn's work can be folded behind "View details". False when the harness reports no phases and no summary. */
  collapsible?: ComputedRef<boolean>
  /** The phase derived for a text part when the harness states none. */
  phaseFor?: (messageIndex: number, partIndex: number) => MessagePhase | undefined
  itemsView?: ComputedRef<'summary' | 'full' | undefined>
  detailsLoading?: ComputedRef<boolean | undefined>
  detailsError?: ComputedRef<string | null | undefined>
  reloadDetails?: () => void
  durationMs?: ComputedRef<number | null | undefined>
  status: ComputedRef<TurnStatus | undefined>
  turnId: ComputedRef<string | undefined>
  toggle: () => void
}

export const assistantWorkTurnKey: InjectionKey<AssistantWorkTurnContext> = Symbol('agent-ui-sdk-assistant-work-turn')
export const assistantWorkMessageIndexKey: InjectionKey<ComputedRef<number>> = Symbol('agent-ui-sdk-assistant-work-message-index')
