# Session and controller

Contracts that connect a Multi Agent SDK session to `ConversationPane`. For a walkthrough, see [Session binding](/guide/session-binding) and [Conversation pane](/guide/conversation-pane).

## createSessionConversationController

```ts
function createSessionConversationController(options: SessionConversationControllerOptions): {
  controller: ConversationPaneController;
  queuedPrompts: ShallowRef<QueuedPrompt[]>;
  dispose(): void;
};
```

Construct one binding per conversation. After `dispose()`, every action throws "Conversation binding is disposed."

### SessionConversationControllerOptions

```ts
type SessionConversationControllerOptions = {
  state: ConversationPaneValueSource<SessionState>;
  capabilities: ConversationPaneValueSource<HarnessCapabilities>;
  conversationKey: string | number;
  client: SessionConversationClient;
  controls?: ConversationPaneValueSource<SessionConversationControls>;
  presentPermission?(permission: { id: string; dangerous?: boolean }): { label?: string; description?: string } | undefined;
  onControlsChange?(controls: SessionConversationControls): void | Promise<void>;
};
```

A value source is a plain value, a ref (`{ value }`) or a getter.

### SessionConversationClient

Renderer-safe, session-bound operations. A host may implement them over IPC. All but `sendPrompt` are optional.

```ts
type SessionConversationClient = {
  sendPrompt(prompt: string, options?: ReferenceSendPromptOptions): Promise<unknown>;
  steerPrompt?(prompt: string, options?: ReferenceSendPromptOptions): Promise<unknown>;
  interrupt?(): Promise<unknown>;
  respondToRequest?(response: SessionRequestResponse): Promise<unknown>;
  setPermission?(id: string): Promise<unknown>;
  setGoal?(objective: string): Promise<unknown>;
  clearGoal?(): Promise<unknown>;
  readConversationContent?(input): ReturnType<Harness['readConversationContent']>;
  loadTurnHistory?(id: string): Promise<unknown>;
  loadOlderHistory?(): Promise<unknown>;
  deleteTurn?(id: string): Promise<unknown>;
  editTurn?(id: string, content: string, options?: Pick<ReferenceSendPromptOptions, 'content'>): Promise<unknown>;
  retryTurn?(id: string): Promise<unknown>;
};
```

### SessionConversationControls

```ts
type SessionConversationControls = {
  models?: readonly ModelOption[];
  selection?: ModelSelection;               // { model?, reasoningEffort?, serviceTier? }
  planMode?: boolean;
  permission?: string;                       // pending choice, shown until the session reports it
  modelCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
};
```

`permission` is used internally to show the pending permission choice; it is never passed to `onControlsChange`.

## sessionStateToConversationPaneState

```ts
function sessionStateToConversationPaneState(
  state: SessionState,
  capabilities: HarnessCapabilities,
  conversationKey?: string | number | null,
  controls?: SessionConversationControls,
): ConversationPaneState;
```

Pure projection of a harness-owned snapshot into the pane's grouped state. It does not own a session, reduce events or choose a provider. Canonical messages keep their identity.

| Output | From |
| --- | --- |
| `identity` | `messages`, `busy`, `activeTurnId`, `error`, `turns` |
| `thread` | `requests`, `goal`, `contextUsage`, `answeredClientRequestIds` |
| `history` | `historyLoading` and `historyState` |
| `catalogs` | `controls.models` (mapped to `ModelOption` with `id` and `displayName`) and `modelCatalogStatus` |
| `composer` | `controls.planMode` and the effective model, reasoning effort and service tier |
| `capabilities` | `HarnessCapabilities` mapped to [`Capabilities`](/api/contracts#capabilities); `planMode` is true unless the harness reports `unsupported`. `permissions` is empty because the session controller lists them with the app's wording |
| `policy` | `attachEnabled`, `canDeleteTurn`, `canEditTurn`, `canRetryTurn`, and `canForkTurn` from `conversationFork` |

## createConversationPaneController

```ts
function createConversationPaneController<Payload = unknown>(options: {
  state: ConversationPaneValueSource<ConversationPaneState>;
  actions: ConversationPaneValueSource<ConversationPaneActions<Payload>>;
}): ConversationPaneController<Payload>;
```

Returns the supplied sources unchanged, so reactive values keep their own dependency graph. Keep the returned object stable and update state leaves in place.

`resolveConversationPaneValue(source)` reads a value, ref-like object or getter.

## ConversationPaneState

```ts
type ConversationPaneState = {
  identity: {
    conversationKey?: string | number | null;
    activeTurnId?: string | null;
    turns?: readonly Turn[];
    messages: readonly (ChatMessage | ConversationMessageInput)[];
    busy?: boolean;
    disabled?: boolean;
    error?: string | null;
  };
  history?: { hasOlder?: boolean; loading?: boolean; loadingOlder?: boolean };
  thread?: {
    requests?: readonly AgentRequest[];
    answeredClientRequestIds?: ReadonlySet<string>;
    goal?: ThreadGoal | null;
    queuedPrompts?: readonly QueuedPromptData[];
    turnGitDiff?: TurnGitDiff | null;
    contextUsage?: ContextUsage | null;
  };
  composer?: {
    state?: ComposerState;
    attachments?: readonly HostAttachment[];
    promptHistory?: readonly string[];
    placeholder?: string;
    suggestedPrompt?: string;
    followUpBehavior?: 'queue' | 'steer';
    leadingMenuItems?: readonly ComposerMenuItem[];
    menuItems?: readonly ComposerMenuItem[];
    permission?: string | null;
    planMode?: boolean;
    selectedModelId?: string | null;
    selectedReasoningEffort?: ReasoningEffort | null;
    selectedServiceTier?: string | null;
    harnesses?: readonly HarnessChoice[];
    harness?: string;
  };
  catalogs?: {
    files?: readonly FileSearchItem[];
    models?: readonly ModelOption[];
    commands?: readonly CommandSummary[];
    skills?: readonly SkillSummary[];
    plugins?: readonly PluginSummary[];
    mentionGroups?: readonly ComposerMentionGroup[];
    modelCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
    skillCatalogStatus?: 'notLoaded' | 'loading' | 'loaded' | 'error';
  };
  capabilities?: Capabilities;
  policy?: {
    actionsDisabled?: boolean;
    attachEnabled?: boolean;
    canDeleteTurn?: boolean;
    canEditTurn?: boolean;
    canForkTurn?: boolean;
    canRetryTurn?: boolean;
    followUpsDisabled?: boolean;
  };
};
```

## ConversationPaneActions

Every action is optional and may return a promise.

```ts
type ConversationPaneActions<Payload = unknown> = {
  submit?(prompt: string, options?: ReferenceSendPromptOptions): ConversationSubmissionResult | Promise<ConversationSubmissionResult>;
  steer?(prompt: string, options?: ReferenceSendPromptOptions): void;
  interrupt?(): void;
  cancel?(): void;
  respond?(response: AgentRequestResponse): void;
  updateSettings?(defaults: Partial<HarnessDefaults>): void;
  setPlanMode?(planMode: boolean): void;
  selectHarness?(harness: string): void;   // the person picked another tab in the harness picker
  updateComposerState?(state: ComposerState): void;
  updateAttachments?(attachments: readonly HostAttachment[]): void;
  attach?(): void;
  updateQueuedPrompt?(id: string, prompt: string, options?: ReferenceSendPromptOptions): void;
  deleteQueuedPrompt?(id: string): void;
  steerQueuedPrompt?(id: string, prompt?: string, options?: ReferenceSendPromptOptions): void;
  deleteTurn?(turnId: string): void;
  editTurn?(payload: { content: string; turnId: string; options?: ReferenceSendPromptOptions }): void;
  retryTurn?(turnId: string): void;
  forkTurn?(turnId: string): void;
  loadOlderHistory?(): void;
  loadTurnHistory?(turnId: string): void;
  clearGoal?(): void;
  editGoal?(): void;
  continueInterruptedTurn?(): void;
  sendFollowUp?(prompt: string): void;
  quoteMessage?(index: number): void;
  onMessageCopied?(index: number): void;
  menuSelect?(item: ComposerMenuSelectableItem<Payload>): void;
  mentionSelect?(item: ComposerMentionItem<Payload>, group: ComposerMentionGroup<Payload>): void;
  openImage?: MessageImageOpenHandler;
  openLink?(link: ConversationLink): void;
  openVisualization?(visualization: ConversationVisualization): void;
  readPromptHistory?(): readonly string[] | Promise<readonly string[]>;
  readImagePreview?(reference: string): Promise<string | null>;
  requestSkills?(): void;
};
```

### ConversationSubmissionResult

```ts
type ConversationSubmissionResult = void | {
  renderOptimisticMessage?: boolean;  // false retires the optimistic user row
  sentPrompt?: string;                // the text actually sent, when the host decorated it
};
```

## Request helpers

```ts
type SessionRequestResponse = Omit<AgentRequestResponse, 'agentId'>;

function requestResponseFromClientResponse(response: ClientRequestResponse): SessionRequestResponse;
function requestResponseFromApproval(id: string, decision: 'approve' | 'deny', scope: 'once' | 'session'): SessionRequestResponse;
```

`requestResponseFromClientResponse` maps a cancellation, an answer set or a decision to the matching `outcome` (`cancelled`, `answered` or `decision`), and throws if the payload holds none. `requestResponseFromApproval` produces `allow` for a one-time approval, `allow_conversation` for session scope and `deny` for a denial.

## toHarnessPromptOptions

```ts
function toHarnessPromptOptions(
  options?: ReferenceSendPromptOptions,
  resolveAttachment?: (attachment: PromptReferenceAttachment) => Attachment,
): PromptOptions;
```

Call it in the trusted host, exported from the root and from `/host`. Attachments require a resolver, or it throws. `providerOptions` from the renderer are removed.

## Conversation images

From `/host`: `conversationImageInput(reference)` parses a `conversation-image:<sessionId>:<contentId>` reference, returning `null` when invalid. `readEmbeddedConversationImage(reference, read)` reads the bounded content chunks and returns an image URL. The session binding uses it for `readImagePreview`.
