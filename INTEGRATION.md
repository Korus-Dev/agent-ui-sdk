# Consumer integration

## Diff overview

`DiffPreviewPanel` accepts `overview?: boolean` (default `false`). In overview mode, `#overview="{ files, select }"` replaces the diff body. Loading, parse errors, load errors and empty states stay SDK-owned. `DiffOverviewFile` and `DiffOverviewSlot` are exported from the root and `ai-app-sdk/documents/diff-overview`.

`files` contains file metadata (`key`, `directory`, `fullPath`, `name`, `iconKind`, `openable`, `addedLines`, `removedLines`) after the existing lockfile/file-kind filters. The objects may contain additional internal rendering fields. `select(path: string): Promise<void>` focuses that file and emits `select(path)`. The host handles `@select` by setting `overview=false`; the promise settles after Vue renders and attempts to scroll to the selection. Returning to overview clears the focused file subset. Exposed `showFiles(paths: string[], location?: CodeLocation)` remains available with its previous behavior except that mode is host-owned.

Korus owns treemap selection/filter state and the mode toggle. Replace `view="map"` / `update:view` / `#map` with `:overview="mode === 'map'"` / `@select="mode = 'diff'"` / `#overview`. `kinds` and `setKinds` are retired; derive and store those in Korus.

## Browser owner identity

The exact mechanical mapping is `agentId` → `ownerId`, `AgentId` → `OwnerId`, and template `agent-id` → `owner-id` within `src/browser/*`, `src/vue/browser/*` and their browser tests. Method/callback names, argument order, partition algorithm and callback meanings are unchanged. After the mechanical fidelity check, browser-facing error/confirmation copy was adapted separately: references to agents became owner, workspace or Browser pane as appropriate; shared-data confirmation no longer assumes agents. Corresponding error assertions retain their meaning. This affects `BrowserPanel` props, `BrowserAnnotation.ownerId`, `BrowserViewportRequest.ownerId`, `BrowserUiApi` parameter labels, browser manager pane records/options/callback parameter labels and partition helpers. `BrowserState` remains its existing navigation-only structure.

Korus must map its existing wire `agentId` fields to `ownerId` at its browser adapter. Keep companion payloads compatible. No app or wire code is changed here.

## Removed API and coverage

`CodexConversationSidebar`, its root export, and its dedicated test suite are retired together. The retired behavior is branded navigation, active-row selection, new-conversation action and `window.confirm`-gated deletion. Those are host navigation responsibilities. No surviving control assertion or the 85% statement gate was removed. New overview tests cover metadata, host selection, focused diff rendering, return-to-overview reset, loading/error/empty precedence.

The unused `ChartTreemapIcon` and other unused icon exports are removed. `src/vue/icons/app-icons.ts` is consolidated into `src/vue/shared/icons/app-icons.ts`: original export lines were transferred mechanically, deduped by exported name and pruned to imported names; control imports now use the latter. No component file was relocated. Internal component filenames and CSS names stay compatible.

## Neutral public names

Neutral exports are direct aliases of existing implementations/types, so legacy names remain valid during integration. The optional Electron preload entry uses the same alias rule. `nativeRendererGlobal` aliases the existing global key without changing its wire value. All `Codex*` host contract types also have corresponding names with `Codex` removed (`HostCapabilities`, `SpeechSession`, etc.). Browser/Electron/speech stay opt-in; Element Plus remains an optional peer. This package is private and is not a vendor publication target.

| Entry | Compatibility export | Neutral export |
| --- | --- | --- |
| `src/vue/index.ts` | `CodexComposer` | `Composer` |
| `src/vue/index.ts` | `CodexComposerState` | `ComposerState` |
| `src/vue/index.ts` | `CodexApprovalPrompt` | `ApprovalPrompt` |
| `src/vue/index.ts` | `CodexConversationPane` | `ConversationPane` |
| `src/vue/index.ts` | `createCodexConversationPaneController` | `createConversationPaneController` |
| `src/vue/index.ts` | `CodexConversationPaneActions` | `ConversationPaneActions` |
| `src/vue/index.ts` | `CodexConversationPaneCatalogState` | `ConversationPaneCatalogState` |
| `src/vue/index.ts` | `CodexConversationPaneComposerState` | `ConversationPaneComposerState` |
| `src/vue/index.ts` | `CodexConversationPaneController` | `ConversationPaneController` |
| `src/vue/index.ts` | `CodexConversationPaneControllerOptions` | `ConversationPaneControllerOptions` |
| `src/vue/index.ts` | `CodexConversationPaneControllerSource` | `ConversationPaneControllerSource` |
| `src/vue/index.ts` | `CodexConversationPaneHistoryState` | `ConversationPaneHistoryState` |
| `src/vue/index.ts` | `CodexConversationPaneIdentityState` | `ConversationPaneIdentityState` |
| `src/vue/index.ts` | `CodexConversationPanePolicy` | `ConversationPanePolicy` |
| `src/vue/index.ts` | `CodexConversationPaneState` | `ConversationPaneState` |
| `src/vue/index.ts` | `CodexConversationPaneThreadState` | `ConversationPaneThreadState` |
| `src/vue/index.ts` | `CodexConversationPaneValueSource` | `ConversationPaneValueSource` |
| `src/vue/index.ts` | `resolveCodexConversationPaneValue` | `resolveConversationPaneValue` |
| `src/vue/index.ts` | `CodexConversationHistoryLoader` | `ConversationHistoryLoader` |
| `src/vue/index.ts` | `CodexComposerMenu` | `ComposerMenu` |
| `src/vue/index.ts` | `CodexComposerMenuList` | `ComposerMenuList` |
| `src/vue/index.ts` | `CodexComposerSendButton` | `ComposerSendButton` |
| `src/vue/index.ts` | `CodexMessage` | `Message` |
| `src/vue/index.ts` | `CodexMessageList` | `MessageList` |
| `src/vue/index.ts` | `CodexMessageTurn` | `MessageTurn` |
| `src/vue/index.ts` | `CodexScrollToBottom` | `ScrollToBottom` |
| `src/vue/index.ts` | `CodexWorkbenchLayout` | `WorkbenchLayout` |
| `src/vue/index.ts` | `CodexConversationRenderStrategy` | `ConversationRenderStrategy` |
| `src/vue/index.ts` | `CodexAttachmentBlock` | `AttachmentBlock` |
| `src/vue/index.ts` | `CodexAnimatedDiffStat` | `AnimatedDiffStat` |
| `src/vue/index.ts` | `CodexCompactionMessage` | `CompactionMessage` |
| `src/vue/index.ts` | `CodexComposerActionMenu` | `ComposerActionMenu` |
| `src/vue/index.ts` | `CodexComposerActiveModes` | `ComposerActiveModes` |
| `src/vue/index.ts` | `CodexComposerFileMentionMenu` | `ComposerFileMentionMenu` |
| `src/vue/index.ts` | `CodexComposerDrawer` | `ComposerDrawer` |
| `src/vue/index.ts` | `CodexComposerDrawerRow` | `ComposerDrawerRow` |
| `src/vue/index.ts` | `CodexComposerShelf` | `ComposerShelf` |
| `src/vue/index.ts` | `CodexComposerSkillMenu` | `ComposerSkillMenu` |
| `src/vue/index.ts` | `CodexComposerPluginMenu` | `ComposerPluginMenu` |
| `src/vue/index.ts` | `CodexComposerAtMentionMenu` | `ComposerAtMentionMenu` |
| `src/vue/index.ts` | `CodexMentionChip` | `MentionChip` |
| `src/vue/index.ts` | `CodexRichTextEditor` | `RichTextEditor` |
| `src/vue/index.ts` | `CodexRichTextEditorExpose` | `RichTextEditorExpose` |
| `src/vue/index.ts` | `CodexComposerSlashMenu` | `ComposerSlashMenu` |
| `src/vue/index.ts` | `CodexComposerVoiceButton` | `ComposerVoiceButton` |
| `src/vue/index.ts` | `CodexComposerVoiceField` | `ComposerVoiceField` |
| `src/vue/index.ts` | `useCodexComposerVoice` | `useComposerVoice` |
| `src/vue/index.ts` | `CodexComposerVoiceController` | `ComposerVoiceController` |
| `src/vue/index.ts` | `CodexComposerVoiceOptions` | `ComposerVoiceOptions` |
| `src/vue/index.ts` | `CodexContextUsageIndicator` | `ContextUsageIndicator` |
| `src/vue/index.ts` | `CodexUltrafastIcon` | `UltrafastIcon` |
| `src/vue/index.ts` | `CodexFoldTransition` | `FoldTransition` |
| `src/vue/index.ts` | `CodexFollowUps` | `FollowUps` |
| `src/vue/index.ts` | `CodexGoal` | `Goal` |
| `src/vue/index.ts` | `CodexIconButton` | `IconButton` |
| `src/vue/index.ts` | `CodexImageLightbox` | `ImageLightbox` |
| `src/vue/index.ts` | `CodexMediaBlock` | `MediaBlock` |
| `src/vue/index.ts` | `CodexMermaidBlock` | `MermaidBlock` |
| `src/vue/index.ts` | `CodexMessageActions` | `MessageActions` |
| `src/vue/index.ts` | `CodexMessageBlock` | `MessageBlock` |
| `src/vue/index.ts` | `CodexMessageEditor` | `MessageEditor` |
| `src/vue/index.ts` | `CodexModelReasoningSelector` | `ModelReasoningSelector` |
| `src/vue/index.ts` | `CodexQueuedPrompt` | `QueuedPrompt` |
| `src/vue/index.ts` | `CodexQueuedPrompts` | `QueuedPrompts` |
| `src/vue/index.ts` | `CodexToolCall` | `ToolCall` |
| `src/vue/index.ts` | `CodexToolCallTitle` | `ToolCallTitle` |
| `src/vue/index.ts` | `CodexToolConfirmation` | `ToolConfirmation` |
| `src/vue/index.ts` | `CodexToolGroup` | `ToolGroup` |
| `src/vue/index.ts` | `CodexToolIcon` | `ToolIcon` |
| `src/vue/index.ts` | `CodexToolUserInputRequest` | `ToolUserInputRequest` |
| `src/vue/index.ts` | `CodexQuestionRequest` | `QuestionRequest` |
| `src/vue/index.ts` | `CodexTurnGitInfo` | `TurnGitInfo` |
| `src/vue/index.ts` | `CodexUserText` | `UserText` |
| `src/vue/index.ts` | `CodexVisualizationBlock` | `VisualizationBlock` |
| `src/vue/index.ts` | `CodexWorkGroup` | `WorkGroup` |
| `src/vue/index.ts` | `codexCapabilities` | `capabilities` |
| `src/vue/index.ts` | `codexCommands` | `commands` |
| `src/vue/index.ts` | `defaultCodexConversationPresentation` | `defaultConversationPresentation` |
| `src/vue/index.ts` | `resolveCodexConversationPresentation` | `resolveConversationPresentation` |
| `src/vue/index.ts` | `defaultCodexChatTranslate` | `defaultChatTranslate` |
| `src/vue/index.ts` | `provideCodexChatTranslate` | `provideChatTranslate` |
| `src/vue/index.ts` | `useCodexChatTranslate` | `useChatTranslate` |
| `src/vue/index.ts` | `provideCodexToolCallDetails` | `provideToolCallDetails` |
| `src/vue/index.ts` | `useCodexToolCallDetails` | `useToolCallDetails` |
| `src/vue/index.ts` | `provideCodexToolPresentation` | `provideToolPresentation` |
| `src/vue/index.ts` | `useCodexToolPresentation` | `useToolPresentation` |
| `src/vue/index.ts` | `CodexToolPresentation` | `ToolPresentation` |
| `src/vue/index.ts` | `CodexToolPresentationContext` | `ToolPresentationContext` |
| `src/vue/index.ts` | `CodexToolPresentationResolver` | `ToolPresentationResolver` |
| `src/vue/index.ts` | `toCodexChatMessage` | `toChatMessage` |
| `src/vue/index.ts` | `toCodexChatMessages` | `toChatMessages` |
| `src/vue/index.ts` | `CodexComposerMentionGroup` | `ComposerMentionGroup` |
| `src/vue/index.ts` | `CodexComposerMentionItem` | `ComposerMentionItem` |
| `src/vue/index.ts` | `CodexComposerVisibleMentionGroup` | `ComposerVisibleMentionGroup` |
| `src/vue/index.ts` | `parseCodexUserText` | `parseUserText` |
| `src/vue/index.ts` | `CodexUserTextToken` | `UserTextToken` |
| `src/vue/index.ts` | `CodexMessageImage` | `MessageImage` |
| `src/vue/index.ts` | `CodexMessageImageContext` | `MessageImageContext` |
| `src/vue/index.ts` | `CodexMessageImageOpenHandler` | `MessageImageOpenHandler` |
| `src/vue/index.ts` | `CodexMessageImageOpenIntent` | `MessageImageOpenIntent` |
| `src/vue/index.ts` | `CodexConversationVisualization` | `ConversationVisualization` |
| `src/vue/index.ts` | `CodexConversationVisualizationOpenHandler` | `ConversationVisualizationOpenHandler` |
| `src/vue/index.ts` | `registerCodexToolTitlePresenter` | `registerToolTitlePresenter` |
| `src/vue/index.ts` | `CodexToolTitlePresenter` | `ToolTitlePresenter` |
| `src/vue/index.ts` | `CodexToolTitlePresenterContext` | `ToolTitlePresenterContext` |
| `src/vue/index.ts` | `CodexComposerMenuActionItem` | `ComposerMenuActionItem` |
| `src/vue/index.ts` | `CodexComposerMenuCheckboxItem` | `ComposerMenuCheckboxItem` |
| `src/vue/index.ts` | `CodexComposerMenuHeadingItem` | `ComposerMenuHeadingItem` |
| `src/vue/index.ts` | `CodexComposerMenuItem` | `ComposerMenuItem` |
| `src/vue/index.ts` | `CodexComposerMenuItemBase` | `ComposerMenuItemBase` |
| `src/vue/index.ts` | `CodexComposerMenuRadioItem` | `ComposerMenuRadioItem` |
| `src/vue/index.ts` | `CodexComposerMenuSelectableItem` | `ComposerMenuSelectableItem` |
| `src/vue/index.ts` | `CodexComposerMenuSeparatorItem` | `ComposerMenuSeparatorItem` |
| `src/vue/index.ts` | `CodexComposerMenuSubmenuItem` | `ComposerMenuSubmenuItem` |
| `src/vue/index.ts` | `CodexContextUsage` | `ContextUsage` |
| `src/vue/index.ts` | `CodexComposerPresentation` | `ComposerPresentation` |
| `src/vue/index.ts` | `CodexComposerShelfPresentation` | `ComposerShelfPresentation` |
| `src/vue/index.ts` | `CodexConversationFileAction` | `ConversationFileAction` |
| `src/vue/index.ts` | `CodexConversationPresentation` | `ConversationPresentation` |
| `src/vue/index.ts` | `CodexConversationLink` | `ConversationLink` |
| `src/vue/index.ts` | `CodexFileSearchItem` | `FileSearchItem` |
| `src/vue/index.ts` | `CodexSpeechTranscriptionResult` | `SpeechTranscriptionResult` |
| `src/vue/index.ts` | `CodexCapabilities` | `Capabilities` |
| `src/vue/index.ts` | `CodexCommandSummary` | `CommandSummary` |
| `src/vue/index.ts` | `CodexModelOption` | `ModelOption` |
| `src/vue/index.ts` | `CodexMessageActionsPresentation` | `MessageActionsPresentation` |
| `src/vue/index.ts` | `CodexMessagesPresentation` | `MessagesPresentation` |
| `src/vue/index.ts` | `CodexReasoningEffortOption` | `ReasoningEffortOption` |
| `src/vue/index.ts` | `CodexSkillSummary` | `SkillSummary` |
| `src/vue/index.ts` | `CodexChatTranscription` | `ChatTranscription` |
| `src/vue/index.ts` | `ResolvedCodexConversationPresentation` | `ResolvedConversationPresentation` |
| `src/vue/index.ts` | `CodexSurfacePlugin` | `SurfacePlugin` |
| `src/vue/index.ts` | `CodexSurfaceServiceTier` | `SurfaceServiceTier` |
| `src/vue/index.ts` | `CodexMessageAttachment` | `MessageAttachment` |
| `src/vue/index.ts` | `CodexChatMessage` | `ChatMessage` |
| `src/vue/index.ts` | `CodexMessageMedia` | `MessageMedia` |
| `src/vue/index.ts` | `CodexChatMessagePart` | `ChatMessagePart` |
| `src/vue/index.ts` | `CodexMessageSuggestedPrompt` | `MessageSuggestedPrompt` |
| `src/vue/index.ts` | `CodexMessageToolCall` | `MessageToolCall` |
| `src/vue/index.ts` | `CodexToolExecutionState` | `ToolExecutionState` |
| `src/vue/index.ts` | `CodexToolStatusDescriptor` | `ToolStatusDescriptor` |
| `src/vue/index.ts` | `CodexMessageTextSelection` | `MessageTextSelection` |
| `src/vue/index.ts` | `CodexMessageTextSelectionAnchor` | `MessageTextSelectionAnchor` |
| `src/vue/index.ts` | `CodexMessageInput` | `MessageInput` |
| `src/vue/index.ts` | `CodexToolVisibility` | `ToolVisibility` |
| `src/vue/index.ts` | `CodexChatTranslate` | `ChatTranslate` |
| `src/vue/index.ts` | `CodexQueuedPromptData` | `QueuedPromptData` |
| `src/vue/index.ts` | `useCodexSurface` | `useNativeSurface` |
| `src/vue/index.ts` | `CodexSurfaceController` | `NativeSurfaceController` |
| `src/vue/index.ts` | `useCodexLiveChat` | `useNativeLiveChat` |
| `src/vue/index.ts` | `CodexLiveChatOptions` | `NativeLiveChatOptions` |
| `src/vue/index.ts` | `CodexLiveChatStatus` | `NativeLiveChatStatus` |
| `src/vue/index.ts` | `CodexLiveChatTranscript` | `NativeLiveChatTranscript` |
| `src/vue/index.ts` | `applyCodexTheme` | `applyTheme` |
| `src/vue/index.ts` | `CodexThemeMode` | `ThemeMode` |
| `src/vue/index.ts` | `CodexThemeOptions` | `ThemeOptions` |
| `src/vue/index.ts` | `codexConversationLinkFromHref` | `conversationLinkFromHref` |
| `src/vue/index.ts` | `parseCodexEditorFileReference` | `parseEditorFileReference` |
| `src/vue/index.ts` | `CodexEditorFileReference` | `EditorFileReference` |
| `src/vue/index.ts` | `getCodexGlobalHostCapabilities` | `getGlobalHostCapabilities` |
| `src/vue/index.ts` | `getCodexNativeRendererApi` | `getNativeRendererApi` |
| `src/vue/index.ts` | `ingestCodexAttachments` | `ingestAttachments` |
| `src/vue/index.ts` | `pickCodexAttachments` | `pickAttachments` |
| `src/vue/index.ts` | `provideCodexHostCapabilities` | `provideHostCapabilities` |
| `src/vue/index.ts` | `useCodexHostCapabilities` | `useHostCapabilities` |
| `src/vue/index.ts` | `CodexAttachmentIngester` | `AttachmentIngester` |
| `src/vue/index.ts` | `CodexAttachmentPicker` | `AttachmentPicker` |
| `src/vue/index.ts` | `CodexHostCapabilities` | `HostCapabilities` |
| `src/vue/index.ts` | `CodexHostAttachment` | `HostAttachment` |
| `src/vue/index.ts` | `CodexHostAttachmentInput` | `HostAttachmentInput` |
| `src/vue/index.ts` | `CodexNativeAttachment` | `NativeAttachment` |
| `src/vue/index.ts` | `CodexNativeAttachmentInput` | `NativeAttachmentInput` |
| `src/vue/index.ts` | `CodexNativeClipboardContent` | `NativeClipboardContent` |
| `src/vue/index.ts` | `CodexNativeRendererApi` | `NativeRendererApi` |
| `src/vue/index.ts` | `CodexRendererAttachment` | `RendererAttachment` |
| `src/vue/index.ts` | `CodexRendererSendMessageOptions` | `RendererSendMessageOptions` |
| `src/vue/index.ts` | `CodexSurfaceAttachment` | `SurfaceAttachment` |
| `src/vue/index.ts` | `SendCodexMessageOptions` | `SendMessageOptions` |
| `src/vue/index.ts` | `codexCustomBlocksKey` | `customBlocksKey` |
| `src/vue/index.ts` | `CodexCustomBlocks` | `CustomBlocks` |
| `src/electron/index.ts` | `codexExternalUrl` | `externalUrl` |
| `src/electron/index.ts` | `installCodexWindowPolicy` | `installWindowPolicy` |
| `src/electron/index.ts` | `isCodexRendererSender` | `isRendererSender` |
| `src/electron/index.ts` | `isCodexRendererUrl` | `isRendererUrl` |
| `src/electron/index.ts` | `CodexWindowPolicyOptions` | `WindowPolicyOptions` |
| `src/electron/index.ts` | `CodexWindowPolicyTarget` | `WindowPolicyTarget` |
| `src/electron/index.ts` | `createCodexSurfaceRendererApi` | `createSurfaceRendererApi` |
| `src/electron/index.ts` | `registerCodexSurfaceIpc` | `registerSurfaceIpc` |
| `src/electron/index.ts` | `CodexSurfaceRendererApi` | `SurfaceRendererApi` |
| `src/electron/index.ts` | `createCodexNativeRendererApi` | `createNativeRendererApi` |
| `src/electron/index.ts` | `exposeCodexNativeRendererApi` | `exposeNativeRendererApi` |
| `src/electron/index.ts` | `CodexContextBridge` | `ContextBridge` |
| `src/electron/index.ts` | `registerCodexNativeIpc` | `registerNativeIpc` |
| `src/electron/index.ts` | `CodexNativeClipboard` | `NativeClipboard` |
| `src/electron/index.ts` | `CodexNativeDialog` | `NativeDialog` |
| `src/electron/index.ts` | `CodexNativeMainDependencies` | `NativeMainDependencies` |
| `src/electron/index.ts` | `CodexNativeMainOptions` | `NativeMainOptions` |
| `src/electron/index.ts` | `CodexNativeShell` | `NativeShell` |
| `src/electron/index.ts` | `CodexSpeechOperation` | `SpeechOperation` |
| `src/electron/index.ts` | `CodexSpeechOperationOutcome` | `SpeechOperationOutcome` |
| `src/electron/index.ts` | `CodexSpeechOperationObserver` | `SpeechOperationObserver` |
| `src/electron/index.ts` | `CodexSpeechSessionPreparer` | `SpeechSessionPreparer` |
| `src/electron/index.ts` | `CodexElectronAttachmentRegistry` | `ElectronAttachmentRegistry` |
| `src/electron/index.ts` | `CodexElectronAttachmentRegistration` | `ElectronAttachmentRegistration` |
| `src/electron/index.ts` | `CodexHostAttachment` | `HostAttachment` |
| `src/electron/index.ts` | `CodexHostAttachmentInput` | `HostAttachmentInput` |
| `src/electron/index.ts` | `CodexNativeAttachment` | `NativeAttachment` |
| `src/electron/index.ts` | `CodexNativeAttachmentInput` | `NativeAttachmentInput` |
| `src/electron/index.ts` | `CodexNativeClipboardContent` | `NativeClipboardContent` |
| `src/electron/index.ts` | `CodexNativeRendererApi` | `NativeRendererApi` |
| `src/electron/index.ts` | `CodexSpeechTranscriptionResult` | `SpeechTranscriptionResult` |
| `src/electron/index.ts` | `CodexSpeechPreparationOptions` | `SpeechPreparationOptions` |
| `src/electron/index.ts` | `CodexPreparedSpeechSession` | `PreparedSpeechSession` |
| `src/electron/index.ts` | `CodexSpeechSession` | `SpeechSession` |
| `src/electron/index.ts` | `exposeCodexElectronPreload` | `exposeElectronPreload` |
| `src/electron/index.ts` | `CodexElectronRendererApis` | `ElectronRendererApis` |
| `src/electron/index.ts` | `registerCodexElectronMain` | `registerElectronMain` |
| `src/electron/index.ts` | `CodexElectronMainOptions` | `ElectronMainOptions` |
| `src/electron/preload.ts` | `exposeCodexElectronPreload` | `exposeElectronPreload` |
| `src/electron/preload.ts` | `CodexElectronRendererApis` | `ElectronRendererApis` |
| `src/electron/preload.ts` | `createCodexNativeRendererApi` | `createNativeRendererApi` |
| `src/electron/preload.ts` | `exposeCodexNativeRendererApi` | `exposeNativeRendererApi` |
| `src/electron/preload.ts` | `CodexContextBridge` | `ContextBridge` |
| `src/electron/preload.ts` | `createCodexSurfaceRendererApi` | `createSurfaceRendererApi` |
| `src/electron/preload.ts` | `CodexNativeRendererApi` | `NativeRendererApi` |
| `src/electron/preload.ts` | `CodexSurfaceRendererApi` | `SurfaceRendererApi` |
| `src/vue/index.ts` | `CodexClientAttachment` | `ClientAttachment` |
| `src/vue/index.ts` | `CodexClientSendMessageOptions` | `ClientSendMessageOptions` |

## Audit and validation boundaries

The composed pane keeps optimistic state, submission wiring, goal intents and the existing escape-interrupt composable. These are control behavior and capability-driven; no provider-name branch, host filesystem/storage policy or host workflow was found to extract. Goal, turn git info and visualization blocks render props and emit intent; visualization `path` is an opaque host-owned target and is never loaded by the block.

Build and test configs use package-local `source-aliases.ts`, limited to this package's optional host/speech entries and sibling harness surface/events/consumer-types development entries. They do not import the parent's shared aliases. Typechecking resolves the installed workspace dependencies. Final builds, broad coverage and real browser integration are parent-owned serial gates.

## Neutral session composition

`sessionStateToConversationPaneState(state, capabilities, conversationKey?)` composes a controlled pane from `SessionState` and `HarnessCapabilities` imported as types from `multi-agents-sdk/consumer-types`. It passes canonical messages through without cloning: they already satisfy the pane's semantic message contract. The existing neutral `toChatMessage` adapter also accepts canonical `Message` and converts tool, reasoning, attachment and text parts for custom renderers. No provider dispatch or Korus integration is required.

The adapter presents busy/error/active-turn state, goals, context usage, turn status and pending approval/question/confirmation requests. Turns pass through by identity, preserving supplied error, retry, timing, detail and usage fields. Unknown values remain unknown. Pending questions without a turn use the legacy presentation contract's empty turn string; confirmations use null. A confirmation with no item uses its request ID as the UI key. These presentation keys are never native identities. Plans and titles have no pane field and remain available to host chrome through the original snapshot.

Capabilities drive controls. `native` and `prompted` plan modes enable the plan toggle; `unsupported` disables it. Opaque harness permission IDs are never converted into legacy approval presets; the preset list stays empty. A host can supply permission selection through its own composer menu and `driver.setPermission`. Attachment selection/resolution, catalogs and action bindings remain host-owned.

[examples/session-pane.ts](examples/session-pane.ts) is a typed minimal binding of an opaque `Session` to the controller. It subscribes only to that session's `session.changed` events, exposes disposal, and wires submit/interrupt/request responses using the public `requestResponseFromClientResponse` and `requestResponseFromApproval` helpers. Both return `SessionRequestResponse`, which matches the neutral driver response without native identity. Its required `resolvePromptOptions` callback resolves host-owned attachment references and maps client model/reasoning fields into harness prompt selection; the example never treats a reference as a filesystem path. Hosts add actions/catalogs for any further capabilities they expose. The caller passes the resulting controller to `ConversationPane`.

`ClientAttachment` and `ClientSendMessageOptions` are the preferred UI action types. `RendererAttachment` / `RendererSendMessageOptions` and original Codex spellings remain compatibility aliases. `useNativeSurface` / `useNativeLiveChat` name the native helpers explicitly, retaining `useCodexSurface` / `useCodexLiveChat`. The generic `useSurface` / `useLiveChat` aliases are removed: those implementations only support the native Codex bridge. The harness `/surface` and `/surface-bridge` remain explicit native compatibility entries, not the neutral session API.

Fixture-backed tests in `tests/boundaries/session-composition.spec.ts` verify canonical message rendering and identity, capability mapping, all three pending request kinds, busy/error updates, terminal tool state, controlled submit/interrupt intents, session event isolation, option resolution, approval/question responses and subscription disposal. The fixture is also mounted with a pending approval: clicking its actual Allow button routes through the pane, controller and reusable converter to `driver.respondToRequest`; the approval disappears on the next request-free snapshot. Converter tests cover answers, cancellation, each tool-confirmation decision, approval scopes and rejection of empty responses. `tsconfig.composition.json` typechecks the actual example, fixture and composition test in addition to source. This is separate from Vitest's transpile-only execution.

The timed failure fixture verifies real error/retry evidence reaches the message list unchanged and an authoritative 12-second duration remains visible even when wall-clock timestamps span 18 seconds. The rendered Retry action routes to the controller; an update with unknown timing does not manufacture a duration.

Optional `SessionState.answeredClientRequestIds` maps to the controller's answered set only when supplied; absence remains undefined and a supplied empty list remains a known empty set. `historyLoading` maps to `history.loading`; optional `historyState` supplies `hasOlder` and `loadingOlder`. Absent paging flags remain absent rather than becoming false. Tests verify rendered answered-question suppression, known paging/loading state, the conversation loading indicator and transitions back to absent history evidence.
