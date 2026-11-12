import type { ConversationMessageInput } from './chat/renderer-message-adapter';
import type {
  ConversationLink,
  ContextUsage,
  FileSearchItem,
  ModelOption,
  SkillSummary,
  Capabilities,
  CommandSummary,
  ReasoningEffort,
  ThreadGoal,
  TurnGitDiff,
} from './chat/contracts';
import type { ComposerMenuItem, ComposerMenuSelectableItem } from './composer-menu';
import type { ChatMessage } from './chat/types';
import type { MessageImageOpenHandler } from './chat/message-image';
import type { ConversationVisualization } from './chat/visualization';
import type { ComposerState } from './composer-state';
import type { HarnessChoice } from './components/HarnessModelSelector.vue';
import type { QueuedChatPrompt } from './chat/queued-prompts';
import type { ComposerMentionGroup, ComposerMentionItem } from './chat/composer-mentions-custom';
import type { HostAttachment } from '@korus-dev/agent-ui-sdk/host';
import type { AgentRequest, AgentRequestResponse, HarnessDefaults, PluginSummary, Turn, ReferenceSendPromptOptions } from '@korus-dev/multi-agent-sdk';

export type ConversationPaneIdentityState = {
  conversationKey?: string | number | null;
  activeTurnId?: string | null;
  turns?: readonly Turn[];
  messages: readonly (ChatMessage | ConversationMessageInput)[];
  busy?: boolean;
  disabled?: boolean;
  error?: string | null;
};

export type ConversationPaneHistoryState = {
  hasOlder?: boolean;
  loading?: boolean;
  loadingOlder?: boolean;
};

export type ConversationPaneThreadState = {
  /** Pending requests the person answers: approvals, questions and tool confirmations. */
  requests?: readonly AgentRequest[];
  answeredClientRequestIds?: ReadonlySet<string>;
  goal?: ThreadGoal | null;
  queuedPrompts?: readonly QueuedChatPrompt[];
  turnGitDiff?: TurnGitDiff | null;
  contextUsage?: ContextUsage | null;
};

export type ConversationPaneComposerState = {
  state?: ComposerState;
  attachments?: readonly HostAttachment[];
  /** Chronological user prompts available to Up/Down recall. */
  promptHistory?: readonly string[];
  placeholder?: string;
  /** Optional follow-up rendered as the empty-editor hint and accepted into the draft. */
  suggestedPrompt?: string;
  /** Primary follow-up action while busy; Cmd/Ctrl+Enter uses the other action. */
  followUpBehavior?: 'queue' | 'steer';
  /** Host actions rendered after Approval and before Plan mode. */
  leadingMenuItems?: readonly ComposerMenuItem[];
  menuItems?: readonly ComposerMenuItem[];
  /** The id of the permission in effect, one of the capabilities' permissions. */
  permission?: string | null;
  planMode?: boolean;
  selectedModelId?: string | null;
  selectedReasoningEffort?: ReasoningEffort | null;
  selectedServiceTier?: string | null;
  /** The harnesses offered as tabs in the `'harness'` picker. */
  harnesses?: readonly HarnessChoice[];
  /** The id of the selected harness. */
  harness?: string;
};

export type ConversationPaneCatalogState = {
  files?: readonly FileSearchItem[];
  models?: readonly ModelOption[];
  commands?: readonly CommandSummary[];
  skills?: readonly SkillSummary[];
  plugins?: readonly PluginSummary[];
  mentionGroups?: readonly ComposerMentionGroup[];
  modelCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
  skillCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
};

export type ConversationPanePolicy = {
  actionsDisabled?: boolean;
  attachEnabled?: boolean;
  canDeleteTurn?: boolean;
  canEditTurn?: boolean;
  canForkTurn?: boolean;
  canRetryTurn?: boolean;
  followUpsDisabled?: boolean;
};

export type ConversationPaneState = {
  identity: ConversationPaneIdentityState;
  history?: ConversationPaneHistoryState;
  thread?: ConversationPaneThreadState;
  composer?: ConversationPaneComposerState;
  catalogs?: ConversationPaneCatalogState;
  capabilities?: Capabilities;
  policy?: ConversationPanePolicy;
};

/**
 * A Vue-version-independent reactive value source. Ref-like values are
 * intentionally structural so applications with a separately-resolved Vue
 * package can pass `computed`/`ref` values without nominal type conflicts.
 */
export type ConversationPaneValueSource<T> =
  | T
  | { readonly value: T }
  | (() => T);

export function resolveConversationPaneValue<T>(
  source: ConversationPaneValueSource<T>,
): T {
  if (typeof source === 'function') return (source as () => T)();
  if (source !== null && typeof source === 'object' && 'value' in source) {
    return (source as { readonly value: T }).value;
  }
  return source as T;
}

/**
 * A submission may retire its optimistic user row, or report the prompt the
 * host actually sent when it decorates the text the user typed.
 */
export type ConversationSubmissionResult = void | {
  renderOptimisticMessage?: boolean;
  sentPrompt?: string;
};
type PaneAction<Args extends unknown[] = [], Result = void> = (...args: Args) => Result | Promise<Result>;

export type ConversationPaneActions<Payload = unknown> = {
  attach?: PaneAction;
  cancel?: PaneAction;
  /** Answers a pending request, in the shape `Harness.respondToRequest` takes. */
  respond?: PaneAction<[response: AgentRequestResponse]>;
  clearGoal?: PaneAction;
  continueInterruptedTurn?: PaneAction;
  /** Called after the SDK has copied a message to the clipboard. */
  onMessageCopied?: PaneAction<[index: number]>;
  deleteTurn?: PaneAction<[turnId: string]>;
  deleteQueuedPrompt?: PaneAction<[promptId: string]>;
  updateQueuedPrompt?: PaneAction<[promptId: string, prompt: string, options?: ReferenceSendPromptOptions]>;
  editGoal?: PaneAction;
  editTurn?: PaneAction<[payload: { content: string; turnId: string; options?: import('@korus-dev/multi-agent-sdk').ReferenceSendPromptOptions }]>;
  forkTurn?: PaneAction<[turnId: string]>;
  interrupt?: PaneAction;
  loadOlderHistory?: PaneAction;
  loadTurnHistory?: PaneAction<[turnId: string]>;
  menuSelect?: PaneAction<[item: ComposerMenuSelectableItem<Payload>]>;
  mentionSelect?: PaneAction<[item: ComposerMentionItem<Payload>, group: ComposerMentionGroup<Payload>]>;
  openImage?: MessageImageOpenHandler;
  openLink?: PaneAction<[link: ConversationLink]>;
  openVisualization?: PaneAction<[visualization: ConversationVisualization]>;
  quoteMessage?: PaneAction<[index: number]>;
  /** Loads bounded user-only prompt history for the active conversation. */
  readPromptHistory?: () => readonly string[] | Promise<readonly string[]>;
  /** Scoped attachment/media content, independent of native file picking. */
  readImagePreview?: (reference: string) => Promise<string | null>;
  /** Discovers the skill catalog when the composer opens skill suggestions. */
  requestSkills?: PaneAction;
  retryTurn?: PaneAction<[turnId: string]>;
  sendFollowUp?: PaneAction<[prompt: string]>;
  steer?: PaneAction<[prompt: string, options?: ReferenceSendPromptOptions]>;
  steerQueuedPrompt?: PaneAction<[promptId: string, prompt?: string, options?: ReferenceSendPromptOptions]>;
  submit?: PaneAction<[prompt: string, options?: ReferenceSendPromptOptions], ConversationSubmissionResult>;
  updateAttachments?: PaneAction<[attachments: readonly HostAttachment[]]>;
  updateComposerState?: PaneAction<[state: ComposerState]>;
  /** Changes the defaults the session's next calls use. */
  updateSettings?: PaneAction<[defaults: Partial<HarnessDefaults>]>;
  setPlanMode?: PaneAction<[planMode: boolean]>;
  /** The person picked another harness in the `'harness'` model picker. */
  selectHarness?: PaneAction<[harness: string]>;
};

export type ConversationPaneController<Payload = unknown> = {
  state: ConversationPaneValueSource<ConversationPaneState>;
  actions: ConversationPaneValueSource<ConversationPaneActions<Payload>>;
};

export type ConversationPaneControllerSource<Payload = unknown> = ConversationPaneValueSource<
  ConversationPaneController<Payload>
>;

export type ConversationPaneControllerOptions<Payload = unknown> = {
  state: ConversationPaneValueSource<ConversationPaneState>;
  actions: ConversationPaneValueSource<ConversationPaneActions<Payload>>;
};

/**
 * Creates a stable controlled-view adapter for ConversationPane.
 *
 * The adapter only normalizes reactive state and actions. It does not load a
 * conversation, clone messages, or own a backend. Keep the returned object
 * stable and update the supplied state leaves in place when possible.
 */
export function createConversationPaneController<Payload = unknown>(
  options: ConversationPaneControllerOptions<Payload>,
): ConversationPaneController<Payload> {
  return {
    // Preserve the host source instead of wrapping it in this Vue runtime's
    // computed(). A ref/computed from another Vue package must retain its own
    // dependency graph; the pane resolves the source at render time.
    state: options.state,
    actions: options.actions,
  };
}
