import type { HarnessCapabilities, ModelOption, SessionState } from '@korus-dev/multi-agent-sdk/consumer-types';
import type { ModelSelection } from './model-selection';
import type { CodexConversationPaneState as ConversationPaneState } from './conversation-pane-controller';

/** Controlled catalog and selection; loading and persistence belong to the host. */
export type SessionConversationControls = {
  models?: readonly ModelOption[];
  selection?: ModelSelection;
  planMode?: boolean;
  permission?: string;
  modelCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
};

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
  controls?: SessionConversationControls,
): ConversationPaneState {
  const selection = { ...state.selection, ...controls?.selection };
  const approvals = state.requests.flatMap(request => request.kind === 'approval' ? [request.approval] : []);
  const clientRequests = state.requests.filter(request => request.kind !== 'approval');
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
    ...(controls === undefined && state.selection === undefined ? {} : {
      catalogs: {
        models: controls?.models?.map(model => ({ ...model, id: model.model, displayName: model.displayName ?? model.model })),
        modelCatalogStatus: controls?.modelCatalogStatus ?? (controls?.models === undefined ? 'notLoaded' : 'loaded'),
      },
      composer: {
        planMode: controls?.planMode,
        selectedModelId: selection.model,
        selectedReasoningEffort: selection.reasoningEffort,
        selectedServiceTier: selection.serviceTier,
      },
    }),
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
