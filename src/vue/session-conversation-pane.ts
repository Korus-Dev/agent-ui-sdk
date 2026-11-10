import type { HarnessCapabilities, SessionState } from 'multi-agents-sdk/consumer-types';
import type { CodexConversationPaneState as ConversationPaneState } from './conversation-pane-controller';

/**
 * Compose the controlled pane from a harness-owned snapshot, without owning a
 * session, reducing events or selecting a provider. Canonical messages already
 * satisfy the pane's semantic message input contract and retain their identity.
 * Hosts supply actions and catalogs through createConversationPaneController.
 */
export function sessionStateToConversationPaneState(
  state: SessionState,
  capabilities: HarnessCapabilities,
  conversationKey?: string | number | null,
): ConversationPaneState {
  const approvals: NonNullable<NonNullable<ConversationPaneState['thread']>['approvals']>[number][] = [];
  const clientRequests: NonNullable<NonNullable<ConversationPaneState['thread']>['clientRequests']>[number][] = [];
  for (const request of state.requests) {
    if (request.kind === 'approval') {
      approvals.push(request.approval);
    } else if (request.kind === 'question') {
      clientRequests.push({
        id: request.id, kind: 'ask_user', conversationId: request.conversationId,
        // Legacy presentation requires a string; absent turn identity stays empty.
        turnId: request.turnId ?? '', itemId: request.itemId ?? request.question.itemId,
        payload: { request: request.question },
      });
    } else {
      clientRequests.push({
        id: request.id, kind: 'confirm_tool', conversationId: request.conversationId,
        turnId: request.turnId ?? null, itemId: request.itemId ?? request.id,
        payload: { confirmation: request.confirmation },
      });
    }
  }
  return {
    identity: {
      conversationKey, messages: state.messages, busy: state.busy,
      activeTurnId: state.activeTurnId, error: state.error,
      turns: state.turns,
    },
    thread: {
      approvals, clientRequests, goal: state.goal, contextUsage: state.contextUsage,
      answeredClientRequestIds: state.answeredClientRequestIds === undefined
        ? undefined : new Set(state.answeredClientRequestIds),
    },
    history: state.historyLoading === undefined && state.historyState === undefined
      ? undefined : { loading: state.historyLoading, ...state.historyState },
    capabilities: {
      models: capabilities.models, skills: capabilities.skills,
      reasoningEffort: capabilities.reasoningEffort, serviceTier: capabilities.serviceTier,
      planMode: capabilities.planMode !== 'unsupported', goals: capabilities.goals,
      steerPrompt: capabilities.steerPrompt, interrupt: capabilities.interrupt,
      history: capabilities.history, deleteTurn: capabilities.deleteTurn,
      editTurn: capabilities.editTurn, retryTurn: capabilities.retryTurn,
      approvals: capabilities.approvals,
      // Permission IDs belong to the harness; never reinterpret them as presets.
      approvalPresets: [],
    },
    policy: {
      attachEnabled: capabilities.attachments, canDeleteTurn: capabilities.deleteTurn,
      canEditTurn: capabilities.editTurn, canRetryTurn: capabilities.retryTurn,
      canForkTurn: capabilities.conversationFork ?? false,
    },
  };
}
