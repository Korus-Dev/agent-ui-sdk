import type { SpeechTranscriptionResult as NativeSpeechTranscriptionResult } from '@korus-dev/agent-ui-sdk/host';
import type { ServiceTier } from '@korus-dev/multi-agent-sdk';

export type ApprovalPreset = 'ask-for-approval' | 'approve-for-me' | 'full-access';

export type ReasoningEffort = string;

export type Capabilities = {
  models: boolean;
  skills: boolean;
  reasoningEffort: boolean;
  serviceTier?: boolean;
  planMode: boolean;
  goals: boolean;
  steerPrompt: boolean;
  interrupt: boolean;
  history: boolean;
  deleteTurn: boolean;
  editTurn: boolean;
  retryTurn: boolean;
  approvals: boolean;
  approvalPresets?: readonly ApprovalPreset[];
};

export type ReasoningEffortOption = {
  reasoningEffort: ReasoningEffort;
  description: string;
};

export type ModelOption = {
  id: string;
  model: string;
  displayName: string;
  description?: string;
  hidden?: boolean;
  supportedReasoningEfforts?: readonly ReasoningEffortOption[];
  defaultReasoningEffort?: ReasoningEffort | null;
  serviceTiers?: readonly ServiceTier[];
  defaultServiceTier?: string | null;
  isDefault?: boolean;
  providerMetadata?: Record<string, unknown>;
};

export type SkillSummary = {
  id?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  displayName?: string;
  iconSmall?: string;
  iconLarge?: string;
  brandColor?: string;
  defaultPrompt?: string;
  path: string;
  scope?: string;
  enabled: boolean;
  providerMetadata?: Record<string, unknown>;
};

export type CommandSummary = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  slashName?: string;
  submitOnSelect?: boolean;
  composerMode?: {
    label?: string;
    placeholder?: string;
  };
  providerMetadata?: Record<string, unknown>;
};

export type FileSearchItem = {
  name: string;
  path: string;
};

export type ConversationFileAction = 'read' | 'edit' | 'create';

export type ConversationLink =
  | { href: string; kind: 'external' }
  | {
    href: string;
    kind: 'file';
    path: string;
    /** Canonical alias for hosts handling a clicked tool target. */
    filepath?: string;
    /** Present for file-operation tool targets; absent for ordinary markdown links. */
    action?: ConversationFileAction;
    /** Conversation turn that produced the tool target, when available. */
    turnId?: string;
    /** Assistant message that contains the tool target, when available. */
    messageId?: string;
    /** App-server item that produced the tool target, when available. */
    itemId?: string;
    /** Exact historical file patch, fetched by the host only when selected. */
    diffContent?: { sessionId: string; contentId: string; byteLength: number; changeKind: 'add' | 'update' | 'delete' };
    line?: number;
    column?: number;
  };

export type PromptSkillInput = {
  name: string;
  path: string;
};

export type ContextUsage = {
  totalTokens: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  lastTotalTokens: number;
  modelContextWindow: number | null;
  usedPercent: number | null;
};

export type ComposerPresentation = {
  actionMenu?: boolean;
  contextUsage?: boolean;
  voice?: boolean;
};

export type ComposerShelfPresentation = {
  goal?: boolean;
  queuedPrompts?: boolean;
  turnGitDiff?: boolean;
};

export type MessageActionsPresentation = {
  copy?: boolean;
  delete?: boolean;
  edit?: boolean;
  fork?: boolean;
  quote?: boolean;
  retry?: boolean;
};

export type MessagesPresentation = {
  actions?: MessageActionsPresentation;
  toolBlocks?: boolean;
};

/**
 * Controls the optional presentation supplied by the default conversation UI.
 * Omitted values preserve the full SDK experience. This never changes surface
 * capabilities or the operations available through the surface controller.
 */
export type ConversationPresentation = {
  composer?: ComposerPresentation;
  messages?: MessagesPresentation;
  shelf?: ComposerShelfPresentation;
};

export type ResolvedConversationPresentation = {
  readonly composer: Readonly<Required<ComposerPresentation>>;
  readonly messages: {
    readonly actions: Readonly<Required<MessageActionsPresentation>>;
    readonly toolBlocks: boolean;
  };
  readonly shelf: Readonly<Required<ComposerShelfPresentation>>;
};

export const defaultConversationPresentation: ResolvedConversationPresentation = Object.freeze({
  composer: Object.freeze({
    actionMenu: true,
    contextUsage: true,
    voice: true,
  }),
  messages: Object.freeze({
    actions: Object.freeze({
      copy: true,
      delete: true,
      edit: true,
      fork: true,
      quote: true,
      retry: true,
    }),
    toolBlocks: true,
  }),
  shelf: Object.freeze({
    goal: true,
    queuedPrompts: true,
    turnGitDiff: true,
  }),
});

export function resolveConversationPresentation(
  presentation?: ConversationPresentation,
): ResolvedConversationPresentation {
  return {
    composer: {
      actionMenu: presentation?.composer?.actionMenu ?? defaultConversationPresentation.composer.actionMenu,
      contextUsage: presentation?.composer?.contextUsage ?? defaultConversationPresentation.composer.contextUsage,
      voice: presentation?.composer?.voice ?? defaultConversationPresentation.composer.voice,
    },
    messages: {
      actions: {
        copy: presentation?.messages?.actions?.copy ?? defaultConversationPresentation.messages.actions.copy,
        delete: presentation?.messages?.actions?.delete ?? defaultConversationPresentation.messages.actions.delete,
        edit: presentation?.messages?.actions?.edit ?? defaultConversationPresentation.messages.actions.edit,
        fork: presentation?.messages?.actions?.fork ?? defaultConversationPresentation.messages.actions.fork,
        quote: presentation?.messages?.actions?.quote ?? defaultConversationPresentation.messages.actions.quote,
        retry: presentation?.messages?.actions?.retry ?? defaultConversationPresentation.messages.actions.retry,
      },
      toolBlocks: presentation?.messages?.toolBlocks ?? defaultConversationPresentation.messages.toolBlocks,
    },
    shelf: {
      goal: presentation?.shelf?.goal ?? defaultConversationPresentation.shelf.goal,
      queuedPrompts: presentation?.shelf?.queuedPrompts ?? defaultConversationPresentation.shelf.queuedPrompts,
      turnGitDiff: presentation?.shelf?.turnGitDiff ?? defaultConversationPresentation.shelf.turnGitDiff,
    },
  };
}

export type ToolConfirmationDecision =
  | 'allow'
  | 'allow_conversation'
  | 'always_allow'
  | 'deny';

export type AskUserQuestionOption = {
  label: string;
  description: string;
};

export type AskUserQuestion = {
  id: string;
  header: string;
  question: string;
  isOther: boolean;
  isSecret: boolean;
  multiSelect?: boolean;
  options: AskUserQuestionOption[] | null;
};

export type AskUserAnswers = Record<string, { answers: string[] }>;

export type ClientRequestResponse = {
  id: string;
  payload?: {
    answers?: AskUserAnswers;
    cancelled?: boolean;
    decision?: ToolConfirmationDecision | null;
  };
};

export type ThreadGoalStatus =
  | 'active'
  | 'paused'
  | 'blocked'
  | 'usageLimited'
  | 'budgetLimited'
  | 'complete';

export type ThreadGoal = {
  threadId: string;
  objective: string;
  status: ThreadGoalStatus;
  tokenBudget: number | null;
  tokensUsed: number;
  timeUsedSeconds: number;
  createdAt: number;
  updatedAt: number;
};

export type TurnGitDiff = {
  turnId: string;
  addedLines: number;
  removedLines: number;
  diff?: string;
  updatedAt: string;
};

export type SpeechTranscriptionResult = NativeSpeechTranscriptionResult;

export type ChatTranscription = (
  audioData: ArrayBuffer,
  options?: { locale?: string },
) => Promise<SpeechTranscriptionResult>;
