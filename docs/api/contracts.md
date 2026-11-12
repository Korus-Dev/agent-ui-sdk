# Contracts and presentation

Types exported from the root that describe what the pane can do and how it looks. For behavior, see [Presentation and theming](/guide/presentation) and [Composer](/guide/composer).

## Capabilities

```ts
type Capabilities = {
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
  /** The permissions the harness offers for this conversation. */
  permissions?: readonly PermissionOption[];
};
```

Controls stay unavailable until the host supplies capability evidence: the pane's default is every flag `false` and no permissions.

```ts
type PermissionOption = { id: string; label?: string; description?: string; dangerous?: boolean };
```

`id` is the harness's own. The app may supply `label` and `description`; without them the label is derived from the id.

## Catalog types

```ts
type ModelOption = {
  id: string;
  model: string;
  displayName: string;
  description?: string;
  hidden?: boolean;
  supportedReasoningEfforts?: readonly { reasoningEffort: string; description: string }[];
  defaultReasoningEffort?: string | null;
  serviceTiers?: readonly ProviderServiceTier[];
  defaultServiceTier?: string | null;
  isDefault?: boolean;
  providerMetadata?: Record<string, unknown>;
};

type CommandSummary = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  slashName?: string;
  submitOnSelect?: boolean;
  composerMode?: { label?: string; placeholder?: string };
  providerMetadata?: Record<string, unknown>;
};

type FileSearchItem = { name: string; path: string };
```

`SkillSummary` and `PluginSummary` come from Multi Agent SDK and are re-exported as types. `ReasoningEffort` is a string.

## Presentation

```ts
type ConversationPresentation = {
  composer?: { actionMenu?: boolean; contextUsage?: boolean; voice?: boolean };
  messages?: {
    actions?: { copy?: boolean; delete?: boolean; edit?: boolean; fork?: boolean; quote?: boolean; retry?: boolean };
    toolBlocks?: boolean;
  };
  shelf?: { goal?: boolean; queuedPrompts?: boolean; turnGitDiff?: boolean };
};
```

Omitted values keep the full experience. `ResolvedConversationPresentation` is the same shape with every value present. `defaultConversationPresentation` is the frozen all-true baseline; `resolveConversationPresentation(presentation?)` fills the gaps.

Component-level shapes: `ComposerPresentation`, `ComposerShelfPresentation`, `MessageActionsPresentation` and `MessagesPresentation`.

## Requests and answers

```ts
type ToolConfirmationDecision = 'allow' | 'allow_conversation' | 'always_allow' | 'deny';

type AskUserQuestion = {
  id: string;
  header: string;
  question: string;
  isOther: boolean;
  isSecret: boolean;
  multiSelect?: boolean;
  options: { label: string; description: string }[] | null;
};

type AskUserAnswers = Record<string, { answers: string[] }>;

type ClientRequestResponse = {
  id: string;
  payload?: { answers?: AskUserAnswers; cancelled?: boolean; decision?: ToolConfirmationDecision | null };
};
```

`ConversationRequest` is the union of `ConversationQuestionRequest` (`kind: 'question'`) and `ConversationConfirmationRequest` (`kind: 'toolConfirmation'`), the requests the pane answers inline. Approvals use the approval prompt.

## Goals, usage and diffs

```ts
type ThreadGoalStatus = 'active' | 'paused' | 'blocked' | 'usageLimited' | 'budgetLimited' | 'complete';

type ThreadGoal = {
  threadId: string;
  objective: string;
  status: ThreadGoalStatus;
  tokenBudget: number | null;
  tokensUsed: number;
  timeUsedSeconds: number;
  createdAt: number;
  updatedAt: number;
};

type ContextUsage = {
  totalTokens: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  lastTotalTokens: number;
  modelContextWindow: number | null;
  usedPercent: number | null;
};

type TurnGitDiff = { turnId: string; addedLines: number; removedLines: number; diff?: string; updatedAt: string };
```

## Links

```ts
type ConversationLink =
  | { href: string; kind: 'external' }
  | {
      href: string;
      kind: 'file';
      path: string;
      filepath?: string;          // canonical alias for handling a clicked tool target
      action?: 'read' | 'edit' | 'create';  // present for file-operation tool targets
      turnId?: string;
      messageId?: string;
      itemId?: string;
      diffContent?: { sessionId: string; contentId: string; byteLength: number; changeKind: 'add' | 'update' | 'delete' };
      line?: number;
      column?: number;
    };
```

`EditorFileReference` and `parseEditorFileReference` describe `path:line:column` style references.

## Messages

```ts
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  createdAt?: string;
  model?: string;
  parts?: ChatMessagePart[];
  toolCalls?: MessageToolCall[];
  streaming?: boolean;
  turnId?: string;
  type?: 'compaction' | 'display' | 'steer' | 'text';
  compactionStatus?: 'completed' | 'running';
  suggestedPrompts?: { kind: 'chat' | 'idea'; text: string }[];
  promptContent?: readonly PromptPart[];
};

type ChatMessagePart =
  | { type: 'text'; content: string; phase?: 'commentary' | 'partial_answer' | 'final_answer' }
  | { type: 'reasoning'; summary: string }
  | { type: 'tool'; toolCall: MessageToolCall }
  | { type: 'media'; media: MessageMedia }
  | { type: 'attachment'; attachment: MessageAttachment }
  | { type: 'question'; request: ConversationQuestionRequest; historical?: boolean };
```

The pane accepts either `ChatMessage` or a harness `Message` (`ConversationMessageInput`, without `agentId`, `deferredContent`; `createdAt` optional). Harness messages are adapted for you.

`MessageToolCall` holds `id`, `function`, `args`, `result`, `state` (`running`, `completed`, `error` or `canceled`), `done`, `status` (a JSON descriptor), `kind`, `metadata`, `turnId`, `messageId` and `itemId`. `MessageMedia` and `MessageAttachment` carry intrinsic dimensions where known so layout is stable before images load.

## Speech types

`SpeechTranscriptionResult` (`{ text, error? }`) and `ChatTranscription`, a batch transcription function `(audio, { locale? }) => Promise<SpeechTranscriptionResult>`.

## Composer state

```ts
type ComposerState = {
  text: string;
  content?: readonly PromptPart[];
  selectionStart: number;
  selectionEnd: number;
  activeCommandId?: string | null;
};
```

`content` records structured mentions. Persist it with the draft and forward the submission's `options.content` so selected targets survive their labels.
