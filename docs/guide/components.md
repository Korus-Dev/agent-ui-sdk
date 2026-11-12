# Components

Every control in the pane is exported from the package root, so you can use the complete [`ConversationPane`](/guide/conversation-pane) or assemble your own layout. This page lists each component family with the props, events and slots that customize it. See [Assembling a custom layout](/guide/assembling) for a worked example, and the [API reference](/api/vue) for the complete `ConversationPane` surface.

All components are styled by one stylesheet (`@korus-dev/agent-ui-sdk/styles.css`) and the [semantic theme tokens](/guide/presentation#theme-tokens). Each root element carries the `agent-ui-theme` class, so scoped tokens apply wherever you place it.

## Choosing a component

| You want… | Use |
| --- | --- |
| The whole conversation | `ConversationPane` |
| Only the transcript | `MessageList` |
| One message, or one turn of messages | `Message`, `MessageTurn` |
| Only the prompt box | `Composer` |
| A model and reasoning picker outside the composer | `ModelPicker` |
| An approval prompt in your own chrome | `ApprovalPrompt` |
| A question or tool confirmation | `QuestionRequest`, `ToolConfirmation`, `ToolUserInputRequest` |
| A queue, goal or diff summary above the composer | `ComposerShelf`, `QueuedPrompts`, `Goal`, `TurnGitInfo` |
| A fixed header, body and footer layout | `WorkbenchLayout` |

## Layout and chrome

### WorkbenchLayout

A section with a body and optional `header` and `footer` slots. The pane uses it to keep the composer below a scrolling transcript.

The header and footer **overlay** the body rather than sitting beside it. The layout measures them and publishes `--workbench-layout-header-offset` and `--workbench-layout-footer-offset`, which the body should use for its padding so content is never hidden. Override `--workbench-layout-header-padding`, `-footer-padding`, `-header-background`, `-footer-background` and `-body-gap` to restyle it.

| Prop | Default | Purpose |
| --- | --- | --- |
| `scrollMode` | `'body'` | `'body'` scrolls the whole body; `'child'` lets the body's child (such as `MessageList`) own scrolling |

Slots: default (body), `header`, `footer`.

### ConversationHistoryLoader

A skeleton shown while a conversation's history loads. It has no props and announces itself as `role="status"`. The pane shows it while `historyLoading` is true.

### ScrollToBottom

The floating button used by `MessageList`. Use it for custom scrollers.

| Prop | Default | Purpose |
| --- | --- | --- |
| `label` | `'Scroll to bottom'` | Accessible label |

Emits `click`. Size and colors are set with `--agent-ui-scroll-to-bottom-size`, `-border`, `-color`, `-background` and `-shadow`.

## Composer controls

### Composer

The prompt box: rich text, mention chips, attachments row, action menu, model selector, context usage, voice and send button. The model selector appears only when `capabilities.models` is on; turn it off when you render your own picker.

| Prop | Type | Purpose |
| --- | --- | --- |
| `disabled` (required) | `boolean` | Disable input and actions |
| `isSending` (required) | `boolean` | A turn is active; the send button becomes stop and follow-ups queue or steer |
| `composerState` | `ComposerState` | Controlled draft: `text`, `content`, selection and `activeCommandId` |
| `draft`, `draftRevision` | `string`, `number` | Replace the editor text from outside; bump the revision to force it |
| `capabilities` | `Capabilities` | Controls availability of model, reasoning, steering, plan mode, goals and more |
| `commands`, `skills`, `plugins`, `files`, `mentionGroups` | catalogs | Suggestion sources for `/`, `$` and `@` |
| `skillCatalogStatus`, `modelCatalogStatus` | `'notLoaded' \| 'loading' \| 'loaded' \| 'error'` | Catalog load state |
| `models`, `selectedModelId`, `selectedReasoningEffort`, `selectedServiceTier` | | Model, reasoning and speed selector |
| `planMode`, `permission` | | Active modes shown in the action menu |
| `leadingMenuItems`, `menuItems`, `modelMenuItems` | `ComposerMenuItem[]` | Host menu items. Leading items render before Plan mode, `modelMenuItems` before the model controls |
| `presentation` | `ConversationPresentation` | Hide the action menu, context usage or voice |
| `placeholder`, `suggestedPrompt` | `string` | Hint text; the suggested prompt is accepted into the draft |
| `promptHistory`, `promptHistoryLoading` | | Up/Down recall |
| `followUpBehavior` | `'queue' \| 'steer'` | Primary action while busy |
| `queuedPromptId` | `string \| null` | The prompt being edited |
| `attachEnabled`, `hasAttachments`, `hasExternalContent` | `boolean` | Attach menu entry; enable send without text |
| `contextUsage` | `ContextUsage \| null` | Context window indicator |
| `emptySendPrompt` | `string` | Prompt sent when the user submits an empty draft, so attachments or external context can go out on their own |
| `autofocus` | `boolean` | Focus on mount |
| `transcribeAudio` | `ChatTranscription` | Batch dictation override |
| `canContinueInterruptedTurn`, `interruptArmed` | `boolean` | Continue and double-Escape states |

Events: `send`, `steer`, `steerQueuedPrompt`, `interrupt`, `attach`, `menuSelect`, `mentionSelect`, `requestSkills`, `selectPermission`, `continueInterruptedTurn`, `error`, `update:composerState`, `update:modelId`, `update:reasoningEffort`, `update:serviceTier`, `update:planMode`.

Slots: `before`, `before-meta`, `after-input`, `after`, `mention`, `suggestion-item`, `menu-icon`, `menu-item`.

Exposes `focus()`. `send` and `steer` carry `{ inputMethod, content }` options; forward `content` so selected mention targets survive their visible labels. See [Composer and input](/guide/composer).

### RichTextEditor

The mention-aware editor `Composer` uses. Use it for a custom prompt field.

| Prop | Purpose |
| --- | --- |
| `modelValue`, `content` | Plain text and its structured `PromptPart[]` |
| `placeholder`, `ariaLabel`, `disabled`, `maxHeight` | Presentation |
| `files`, `skills`, `plugins`, `mentionGroups` | Mention catalogs used to render chips |

Emits `update:modelValue`, `update:content`, `input` and `caret-change`. Exposes `RichTextEditorExpose`.

### ComposerSendButton

| Prop | Default | Purpose |
| --- | --- | --- |
| `busy` | `false` | Show the stop state |
| `disabled` | `false` | Disable submit |
| `interruptArmed` | `false` | Show the armed-stop state after the first Escape |
| `hoverToEnable` | `false` | Let hover re-enable a disabled button |
| `submitLabel`, `interruptLabel`, `interruptArmedLabel` | English | Accessible labels |

Emits `click`.

### ComposerMenu and ComposerMenuList

`ComposerMenu` is a popup button; `ComposerMenuList` is the same list inline. Both render `ComposerMenuItem[]`.

| Prop | Purpose |
| --- | --- |
| `items` | The menu items |
| `pinnedItemCount` | Keep the first N items fixed while the rest scroll |
| `ariaLabel` | Accessible label |
| `buttonLabel`, `menuClass`, `open`, `disabled` | `ComposerMenu` only; `open` supports `v-model:open` |

Events: `select` (a selectable item), plus `update:open` on `ComposerMenu`. Slots: `icon` and `item` (for custom rendering), plus `trigger` on `ComposerMenu`.

Item `type` is one of:

| Type | Notes |
| --- | --- |
| `action`, `custom` | `closeOnSelect`, `danger`, `leadingColor` |
| `checkbox` | `checked`, `accessory: 'check' \| 'switch' \| Component` |
| `radio` | `checked` |
| `submenu` | `items`, optional `selectAction`, `submenuAlignment`, `submenuWidth` |
| `heading` | `label` with optional header `actions` |
| `separator` | A divider |

Every item also takes `id`, `label`, `description`, `disabled`, `icon`, `payload`, `value`, `valueAppearance` and value icon fields. `payload` returns unchanged in `select`.

### ComposerActionMenu and ComposerActiveModes

`ComposerActionMenu` is the plus menu. It combines attach, permissions, goal mode, plan mode and host items.

| Prop | Purpose |
| --- | --- |
| `attachEnabled`, `disabled` | Attach entry state |
| `leadingMenuItems`, `items` | Host items before and after the built-in ones |
| `permission`, `permissions`, `showPermissionMenu` | Permission submenu |
| `planMode`, `showPlanMode`, `goalMode`, `showGoalMode` | Mode toggles |

Emits `attach`, `select`, `selectPermission`, `update:planMode`, `update:goalMode`. `ComposerActiveModes` shows the active plan mode and command as removable chips (`planMode`, `command`; emits `disablePlanMode`, `removeCommand`).

### Suggestion menus

The menus the composer opens for `/`, `$` and `@`. Each takes an `activeIndex` and the visible items, and emits a select event.

| Component | Props | Events |
| --- | --- | --- |
| `ComposerSlashMenu` | `visibleCommands`, `visibleSkills` | `selectCommand`, `selectSkill` |
| `ComposerSkillMenu` | `visibleSkills`, `plugins` | |
| `ComposerPluginMenu` | `visiblePlugins` | |
| `ComposerFileMentionMenu` | `visibleFiles`, `showHint` | |
| `ComposerAtMentionMenu` | `mentionGroups`, `visibleFiles`, `visiblePlugins`, `showFileHint` | `select-file`, `select-plugin`, `select-mention` |

`ComposerAtMentionMenu` has a `mention` slot to render host items. The filtering helpers (`filterComposerCommands`, `filterComposerSkills`, `filterComposerPlugins`, `filterComposerMentionGroups`) are exported for custom menus.

### Shelf

The area above the composer.

| Component | Props | Events |
| --- | --- | --- |
| `ComposerShelf` | `goal`, `queuedPrompts`, `turnGitDiff`, `presentation`, `disabled`, `queuedPromptEditDisabled`, `queuedPromptSteerDisabled` | `clearGoal`, `editGoal`, `editQueuedPrompt`, `deleteQueuedPrompt`, `steerQueuedPrompt` |
| `QueuedPrompts` | `prompts`, `editDisabled`, `steerDisabled` | `edit`, `delete`, `steer` |
| `QueuedPrompt` | `prompt`, `editDisabled`, `steerDisabled` | `edit`, `delete`, `steer` |
| `Goal` | `goal` | `edit`, `clear` |
| `TurnGitInfo` | `diff` (`TurnGitDiff`) | |
| `ComposerDrawer` | | Slot container stacked above the composer |
| `ComposerDrawerRow` | | Slots `leading`, default and `actions` |
| `AnimatedDiffStat` | `kind`, `label`, `value` | |

`ComposerShelf` forwards `drawers` and `actions` slots (the pane exposes them as `composer-drawers` and `composer-shelf-actions`). Use `ComposerDrawer` and `ComposerDrawerRow` to add your own rows with the SDK's look.

### Model controls

`ModelPicker` is a standalone model, reasoning and speed menu. `ModelReasoningSelector` is the composer's version.

| `ModelPicker` prop | Default | Purpose |
| --- | --- | --- |
| `models` (required) | | `ModelOption[]` |
| `selection` (required) | | `{ model, reasoningEffort, serviceTier }` |
| `disabled`, `loading` | `false` | State |
| `modelLabel`, `serviceTierLabel`, `standardTierLabel`, `loadingLabel` | English | Labels |

Emits `update:selection` and `select`.

| `ModelReasoningSelector` prop | Purpose |
| --- | --- |
| `models`, `modelId`, `reasoningEffort`, `serviceTier` | Current options and selection |
| `modelCatalogStatus` | Load state |
| `menuItems` | Host items before the model controls |
| `showReasoning`, `showServiceTier`, `disabled` | Visibility and state |

Emits `update:modelId`, `update:reasoningEffort`, `update:serviceTier`.

### Voice

| Component | Props | Purpose |
| --- | --- | --- |
| `ComposerVoiceButton` | `recording`, `label`, `title`, `disabled` | Microphone toggle; emits `toggle` |
| `ComposerVoiceField` | `recording`, `starting`, `transcript`, `audioLevel`, `before`, `after` | Live transcript and level while recording |
| `ContextUsageIndicator` | `contextUsage` | Context window ring |

`useComposerVoice(options)` owns recording, transcription and cleanup for a custom voice UI. It takes `isDisabled`, `isSending`, `onTranscript`, and optional `transcribeAudio` or `streamingTranscription` overrides, and returns refs for `isRecording`, `isTranscribing`, `isStarting`, `transcript`, `audioLevel`, `error`, plus `toggle`, `stop`, `cancel` and `dispose`. Dictation uses the host speech capability; see [native capabilities](/guide/native-capabilities).

### MentionChip

Renders a `file`, `plugin` or `skill` mention: `kind`, `name` and optional `iconUrl`.

## Messages

### MessageList

The transcript. It handles lazy mounting, scroll stickiness, turn grouping and the thinking placeholder.

| Prop | Default | Purpose |
| --- | --- | --- |
| `messages` (required) | | `ChatMessage` or harness `Message` values |
| `turns` | | Groups messages into turns and powers summary details |
| `busy`, `activeTurnId` | | Streaming state |
| `renderStrategy` | `'lazy'` | `'eager'` mounts everything |
| `initialMessageBatchSize`, `messageBatchSize` | | Lazy mounting batches |
| `hasOlderMessages`, `loadingOlderMessages` | | Older-history loader |
| `resetKey` | | Reset scroll when the conversation changes |
| `canDeleteTurn`, `canEditTurn`, `canForkTurn`, `canRetryTurn`, `actionsDisabled`, `followUpsDisabled` | | Message action policy |
| `deletingTurnId` | | Show the delete-in-progress state |
| `presentation` | | Hide message actions or tool blocks |
| `toolVisibility` | | Hide tool calls from the transcript |
| `showToolDetails` | | Show raw tool details |
| `transformMessage` | | Adjust each message before rendering |
| `openImage` | | Host image opener |
| `skills`, `plugins`, `mentionGroups` | | Render mention chips in user messages |
| `answeredClientRequestIds`, `hiddenClientRequestIds` | | Request display state |
| `messageTextSelection` | `false` | Emit selection changes for quote UIs |
| `emptyLabel`, `scrollToBottomLabel`, `ariaLabel`, `bottomThreshold` | | Labels and scroll threshold |

Events: `client-response`, `cancel`, `copy-message`, `delete-turn`, `edit-turn`, `fork-turn`, `retry-turn`, `quote-message`, `send-follow-up`, `load-older-messages`, `load-turn-history`, `open-link`, `open-visualization`, `message-text-selection-change`, `stickiness-change`.

Slots: `message`, `header`, `block`, `text`, `attachment`, `tool`, `actions`, `status`, `thinking`, `mention`, `empty`. Exposes `scrollToBottom()`.

### Message and MessageTurn

`Message` renders one message with the same props and slots as `MessageList` for its scope: `message` (required), `index`, `presentation`, `canDeleteTurn`, `canEditTurn`, `canForkTurn`, `canRetryTurn`, `actionsDisabled`, `actionsAlwaysVisible`, `deletingTurn`, `followUpsDisabled`, `threadActionsDisabled`, `showToolDetails`, `openImage`, `skills`, `plugins`, `mentionGroups`, `answeredClientRequestIds`, `hiddenClientRequestIds`, `activityState`.

`MessageTurn` renders the entries of one turn with the work group: `entries` (required), `showToolBlocks` (required), `active`, `status`, `turnId`, `startedAt`, `durationMs`, `itemsView` (`'summary' | 'full'`), `detailsLoading`, `detailsError`. It emits `loadTurnHistory`.

### MessageBlock and UserText

`MessageBlock` renders one block (Markdown text, tool, media, mermaid, visualization or custom). Its props are `block` and the same host props as `Message`. Slots: `block`, `text`, `tool`, `media`, `mention`, `mermaid`, `visualization`.

`UserText` renders authored user text with mention chips: `content`, optional `promptContent`, `skills`, `plugins`, `mentionGroups`. `parseUserText` and `parseAuthoredUserText` expose the tokens.

### MessageActions and MessageEditor

| Component | Props | Events |
| --- | --- | --- |
| `MessageActions` | `message`, `canDelete`, `canEdit`, `canFork`, `canRetry`, `deleting`, `mutationDisabled`, `iconsVisible`, `copyAction`, `presentation` | `copy`, `delete`, `edit`, `fork`, `quote`, `retry` |
| `MessageEditor` | `content`, `promptContent`, `inputLabel`, `saveLabel`, `cancelLabel` | `save(content, options?)`, `cancel` |

### Other message pieces

| Component | Props | Purpose |
| --- | --- | --- |
| `FollowUps` | `prompts`, `disabled` | Suggested prompts; emits `send-follow-up` |
| `CompactionMessage` | `runningTitle`, `completedTitle`, `status` | Context compaction row |
| `WorkGroup` | `active`, `finalStarted`, `continuation` | Collapsible work-so-far section |
| `FoldTransition` | `open` | Animated fold |
| `IconButton` | `label`, `title`, `bordered`, `danger`, `disabled`, `href`, `download`, `target`, `rel` | Icon button used throughout |

## Rich blocks

| Component | Props | Notes |
| --- | --- | --- |
| `MediaBlock` | `media`, `openImage` | Generated and tool-result media |
| `AttachmentBlock` | `attachment`, `openImage` | File and image attachments |
| `MermaidBlock` | `code` | Mermaid diagram with copy |
| `VisualizationBlock` | `path`, `title` | Host-opened visualization card |
| `ImageLightbox` | `open`, `src`, `alt`, `label`, `closeLabel`, `reference`, `themeSource` | Fullscreen image, with gallery navigation. Emits `close` |

Custom assistant fences render through [custom blocks](/guide/messages-tools#custom-blocks).

## Tools

| Component | Props | Notes |
| --- | --- | --- |
| `ToolGroup` | `toolCalls`, `activityTitle`, `showToolDetails`, `answeredClientRequestIds` | A run of tool calls collapsed under one activity title |
| `ToolCall` | `toolCall`, `expandable`, `detailsExpanded`, `showToolDetails`, `summaryOnly`, `headerless` | One call. Emits `toggle-details`, `open-link`, `client-response`, `cancel` |
| `ToolCallTitle` | `title`, `titlePrefix`, `titleTarget`, `titleTargetLink`, `lineDiff`, `running`, `icon`, `toolPresentation` | The call's title row |
| `ToolIcon` | `toolCall`, `presentation` | The call's icon |

Customize icons and titles with [`provideToolPresentation`](/guide/vue-providers#tool-presentation); hide calls with `toolVisibility`.

## Requests

| Component | Props | Events |
| --- | --- | --- |
| `ApprovalPrompt` | `approval` (`ProviderApprovalRequest`), `disabled` | `resolve(decision, scope)` |
| `QuestionRequest` | `request`, `historical`, `answeredClientRequestIds` | `client-response` |
| `ToolConfirmation` | `toolCall`, `answeredClientRequestIds` | `client-response` |
| `ToolUserInputRequest` | `toolCall`, `historical`, `answeredClientRequestIds` | `client-response` |

See [Requests and approvals](/guide/requests) for the lifecycle and response helpers.

## Documents and browser

`MarkdownPanel`, `SourcePreviewPanel`, `DiffPreviewPanel`, `AnnotationPopup` and `CodeSelectionAnnotation` are covered in [Documents](/guide/documents). `BrowserPanel`, `BrowserBookmarks` and `AnnotationSendButton` are covered in the [browser panel guide](/guide/browser).
