# Vue components

Everything on this page is exported from the package root. For guidance on when to use each control, see [Components](/guide/components); for layouts built from them, see [Assembling a custom layout](/guide/assembling).

## ConversationPane

```ts
import { ConversationPane } from '@korus-dev/agent-ui-sdk';
```

`ConversationPane` is generic over the `Payload` type of host menu items and mentions. It resolves state and actions from `controller`; individual props are the controlled alternative.

### Props

**Controller and identity**

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `controller` | `ConversationPaneControllerSource` | | Grouped state and actions. Takes precedence over controlled props |
| `conversationKey` | `string \| number \| null` | | Stable identity; resets scroll and the composer when it changes |
| `ariaLabel` | `string` | `'Conversation'` | Accessible label |
| `autofocus` | `boolean` | `false` | Focus the composer on mount |

**Transcript**

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `messages` | `(ChatMessage \| ConversationMessageInput)[]` | | The transcript |
| `turns` | `Turn[]` | | Turn grouping, durations and summary details |
| `activeTurnId` | `string \| null` | | The running turn |
| `busy` | `boolean` | | A turn is active |
| `disabled` | `boolean` | | Disable input and actions |
| `error` | `string \| null` | | Error shown above the composer |
| `transformMessage` | `(message, index) => message` | | Adjust each message before rendering |
| `renderStrategy` | `'eager' \| 'lazy'` | `'lazy'` | Transcript mounting |
| `lazyMessages` | `boolean` | | Deprecated: use `renderStrategy` |
| `initialMessageBatchSize`, `messageBatchSize` | `number` | `50`, `25` | Lazy batches |
| `messageTextSelection` | `boolean` | | Emit selection changes |
| `emptyTitle`, `emptyDescription` | `string` | `'Start a conversation'`, `''` | Empty state |
| `scrollToBottomLabel` | `string` | `'Scroll to bottom'` | Accessible label |
| `toolVisibility` | `(toolCall) => boolean` | | Hide tool calls from the transcript |
| `showToolDetails` | `boolean` | provider | Show raw tool details |
| `presentation` | `ConversationPresentation` | all on | Hide optional UI |
| `openImage`, `openConversationLink`, `openVisualization` | handlers | | Host navigation |

**History and thread**

| Prop | Type | Purpose |
| --- | --- | --- |
| `hasOlderHistory`, `historyLoading`, `loadingOlderHistory` | `boolean` | History state |
| `requests` | `AgentRequest[]` | Pending approvals, questions and confirmations |
| `answeredClientRequestIds` | `ReadonlySet<string>` | Settled requests in restored history |
| `goal` | `ThreadGoal \| null` | Goal shown in the shelf |
| `queuedPrompts` | `QueuedPromptData[]` | Prompts waiting behind the active turn |
| `turnGitDiff` | `TurnGitDiff \| null` | Per-turn diff summary |
| `contextUsage` | `ContextUsage \| null` | Context window |

**Composer and catalogs**

| Prop | Type | Purpose |
| --- | --- | --- |
| `composerState` | `ComposerState` | Controlled draft |
| `attachments` | `HostAttachment[]` | Selected attachments |
| `attachEnabled` | `boolean` (default `true`) | Attach entry |
| `placeholder`, `suggestedPrompt`, `emptySendPrompt` | `string` | Hint and empty-send text |
| `promptHistory`, `readPromptHistory` | | Up/Down recall |
| `followUpBehavior`, `followUpsDisabled` | `'queue' \| 'steer'`, `boolean` | Busy submission |
| `capabilities` | `Capabilities` | Which controls exist |
| `models`, `modelCatalogStatus`, `selectedModelId`, `selectedReasoningEffort`, `selectedServiceTier` | | Model controls |
| `harnesses`, `harness` | `HarnessChoice[]`, `string` | Tabs and selected tab of the composer's [model picker](/guide/components#harnessmodelselector) |
| `commands`, `skills`, `plugins`, `files`, `mentionGroups`, `skillCatalogStatus` | | Suggestion catalogs |
| `permission`, `permissions`, `planMode` | | Composer menu state |
| `leadingMenuItems`, `menuItems` | `ComposerMenuItem[]` | Host menu items |
| `hasComposerContext` | `boolean` | Allow sending when the host supplies external context |
| `escapeInterrupt` | `boolean` (default `true`) | Double-Escape interrupts |
| `transcribeAudio`, `pickAttachments`, `ingestAttachments` | | Host port overrides |

**Policy**

`actionsDisabled`, `canDeleteTurn` (`true`), `canEditTurn` (`true`), `canForkTurn` (`false`), `canRetryTurn` (`true`).

### Events

| Event | Payload |
| --- | --- |
| `submit`, `steer` | `prompt`, `options?` (`ReferenceSendPromptOptions`) |
| `sendFollowUp` | `prompt` |
| `interrupt`, `cancel`, `continueInterruptedTurn` | |
| `respond` | `AgentRequestResponse` |
| `attach`, `attachmentsChange` | `attachments` |
| `requestSkills` | |
| `editTurn` | `{ content, turnId, options? }` |
| `deleteTurn`, `retryTurn`, `forkTurn`, `loadTurnHistory` | `turnId` |
| `loadOlderHistory` | |
| `copyMessage`, `quoteMessage` | `index` |
| `messageTextSelectionChange` | `MessageTextSelection \| null` |
| `openLink` | `ConversationLink` |
| `openVisualization` | `ConversationVisualization` |
| `menuSelect` | `ComposerMenuSelectableItem` |
| `mentionSelect` | `item`, `group` |
| `deleteQueuedPrompt`, `updateQueuedPrompt`, `steerQueuedPrompt` | prompt id, text, options |
| `clearGoal`, `editGoal` | |
| `error` | `message \| null` |
| `update:composerState`, `update:modelId`, `update:reasoningEffort`, `update:serviceTier`, `update:permission`, `update:planMode`, `update:harness`, `update:modelValue` | New value |

With a `controller`, the matching action runs instead of the event for the actions the controller defines. The pane emits `update:permission` alongside the other `update:*` events when no controller handles settings.

### Slots

`empty`, `approval`, `before-composer`, `after-composer`, `composer-replacement`, `composer-context`, `composer-drawers`, `composer-shelf-actions`, `composer-after-input`, `composer-after`, `composer-attachment-actions`, `menu-icon`, `menu-item`, `suggestion-item`, `mention`, `message`, `message-header`, `message-block`, `message-text`, `message-attachment`, `message-tool`, `message-actions`, `message-status` and `message-thinking`. Slot props are listed in the [conversation pane guide](/guide/conversation-pane#slots).

## Controls

| Export | Role |
| --- | --- |
| `ConversationPane` | History, requests, messages, queue and composer |
| `Composer` | The prompt box |
| `MessageList` | The transcript |
| `Message`, `MessageTurn` | One message, one turn |
| `ApprovalPrompt` | Approval card |
| `ModelPicker` | Model, reasoning and speed list |
| `HarnessModelSelector` | Harness tabs above a model list, in a popover |
| `ConversationHistoryLoader` | History skeleton |
| `ScrollToBottom` | Floating scroll button |
| `WorkbenchLayout` | Header, body and footer layout |

### Composer family

`ComposerMenu`, `ComposerMenuList`, `ComposerSendButton`, `ComposerActionMenu`, `ComposerActiveModes`, `ComposerSlashMenu`, `ComposerSkillMenu`, `ComposerPluginMenu`, `ComposerFileMentionMenu`, `ComposerAtMentionMenu`, `ComposerShelf`, `ComposerDrawer`, `ComposerDrawerRow`, `ComposerVoiceButton`, `ComposerVoiceField`, `RichTextEditor`, `MentionChip`, `ContextUsageIndicator`, `UltrafastIcon`.

### Message family

`MessageBlock`, `MessageActions`, `MessageEditor`, `UserText`, `CompactionMessage`, `FollowUps`, `WorkGroup`, `FoldTransition`, `IconButton`, `CopyButton`, `AnimatedDiffStat`, `TurnGitInfo`.

### Rich blocks, tools and requests

`MediaBlock`, `AttachmentBlock`, `MermaidBlock`, `VisualizationBlock`, `ImageLightbox`, `ToolGroup`, `ToolCall`, `ToolCallTitle`, `ToolIcon`, `ToolConfirmation`, `ToolUserInputRequest`, `QuestionRequest`, `QueuedPrompts`, `QueuedPrompt`, `Goal`.

### Documents

`MarkdownPanel`, `SourcePreviewPanel`, `DiffPreviewPanel`, `AnnotationPopup`, `CodeSelectionAnnotation`. See [Documents](/guide/documents).

## Functions and helpers

| Export | Purpose |
| --- | --- |
| `createSessionConversationController(options)` | Bind a session to the pane. See [session](/api/session) |
| `createConversationPaneController(options)` | Grouped controller adapter |
| `sessionStateToConversationPaneState(...)` | Project a session snapshot |
| `resolveConversationPaneValue(source)` | Read a value, ref or getter |
| `requestResponseFromClientResponse`, `requestResponseFromApproval` | Request response helpers |
| `toHarnessPromptOptions(options, resolver?)` | Translate prompt options at the trusted boundary |
| `applyTheme(element, options)` | Apply a theme and tokens |
| `defaultConversationPresentation`, `resolveConversationPresentation` | Presentation defaults |
| `toChatMessage`, `toChatMessages`, `conversationMessageToChatMessage` | Adapt messages |
| `createQueuedChatPrompt(text)` | Create a queue entry |
| `renderMarkdown`, `renderCodeBlock`, `languageForFilePath` | Rendering |
| `parseUserText`, `parseAuthoredUserText`, `humanizeMentionName` | Authored user text |
| `filterComposerCommands`, `filterComposerSkills`, `filterComposerPlugins`, `filterComposerMentionGroups`, `findComposerMention` | Suggestion filtering |
| `commandDescription`, `skillDescription`, `skillDisplayName`, `skillInsertText`, `skillMatchesMention`, `promptSkillInputsFromText`, `pluginDescription`, `pluginDisplayName`, `pluginInsertText`, `pluginMatchesMention` | Catalog item helpers |
| `conversationLinkFromHref`, `parseEditorFileReference` | Link handling |
| `collectMarkdownHeadings`, `sanitizeSvg`, `describeCodeRange`, `fileKindColor` (a color map), `useCodeSelection` | Document helpers |
| `useComposerVoice(options)` | Voice controller |
| `registerToolTitlePresenter(presenter)` | Compatibility global tool title presenter |

## Providers

`provideChatTranslate` / `useChatTranslate` / `defaultChatTranslate`, `provideToolCallDetails` / `useToolCallDetails`, `provideToolPresentation` / `useToolPresentation`, `provideHostCapabilities` / `useHostCapabilities`, `getGlobalHostCapabilities` (`getNativeRendererApi` is a deprecated alias), `pickAttachments`, `ingestAttachments` and `customBlocksKey`. See [Vue providers](/guide/vue-providers).

## Types

Controller: `ConversationPaneState`, `ConversationPaneActions`, `ConversationPaneController`, `ConversationPaneControllerOptions`, `ConversationPaneControllerSource`, `ConversationPaneValueSource`, the `ConversationPane*State` groups, `ConversationPanePolicy`, `ConversationSubmissionResult`, `ConversationRenderStrategy`.

Session: `SessionConversationClient`, `SessionConversationControllerOptions`, `SessionConversationControls`, `SessionRequestResponse`.

Messages: `ChatMessage`, `ChatMessagePart`, `MessageInput`, `ConversationMessageInput`, `MessageAttachment`, `MessageMedia`, `MessageToolCall`, `MessageSuggestedPrompt`, `ToolExecutionState`, `ToolStatusDescriptor`, `ToolVisibility`, `UserTextToken`, `MessageImage`, `MessageImageContext`, `MessageImageOpenHandler`, `MessageTextSelection`, `ConversationVisualization`, `QueuedPromptData`.

Composer: `ComposerState`, `ModelSelection`, `ComposerMenuItem` and its variants, `ComposerMentionGroup`, `ComposerMentionItem`, `RichTextEditorExpose`, `ComposerVoiceController`, `ComposerVoiceOptions`.

See [Contracts and presentation](/api/contracts) for capability, catalog and presentation types.
