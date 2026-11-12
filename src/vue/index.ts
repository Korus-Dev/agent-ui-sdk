export { default as ModelPicker } from './components/ModelPicker.vue';
export type { ModelSelection } from './model-selection';
export { default as Composer } from './components/Composer.vue';
export type { ComposerState } from './composer-state';
export { default as ApprovalPrompt } from './components/ApprovalPrompt.vue';
export { default as ConversationPane } from './components/ConversationPane.vue';
export {
  createConversationPaneController,
  type ConversationPaneActions,
  type ConversationPaneCatalogState,
  type ConversationPaneComposerState,
  type ConversationPaneController,
  type ConversationPaneControllerOptions,
  type ConversationPaneControllerSource,
  type ConversationPaneHistoryState,
  type ConversationPaneIdentityState,
  type ConversationPanePolicy,
  type ConversationPaneState,
  type ConversationPaneThreadState,
  type ConversationPaneValueSource,
  resolveConversationPaneValue,
} from './conversation-pane-controller';
export { default as ConversationHistoryLoader } from './components/ConversationHistoryLoader.vue';
export { default as ComposerMenu } from './components/ComposerMenu.vue';
export { default as ComposerMenuList } from './components/ComposerMenuList.vue';
export { default as ComposerSendButton } from './components/ComposerSendButton.vue';
export { default as Message } from './components/Message.vue';
export { default as MessageList } from './components/MessageList.vue';
export { default as MessageTurn } from './components/MessageTurn.vue';
export { default as ScrollToBottom } from './components/ScrollToBottom.vue';
export { default as WorkbenchLayout } from './components/WorkbenchLayout.vue';
export type { ConversationRenderStrategy } from './chat/contracts';
export { default as AttachmentBlock } from './chat/ChatAttachmentBlock.vue';
export { default as AnimatedDiffStat } from './chat/ChatAnimatedDiffStat.vue';
export { default as CompactionMessage } from './chat/ChatCompactionMessage.vue';
export { default as ComposerActionMenu } from './chat/ChatComposerActionMenu.vue';
export { default as ComposerActiveModes } from './chat/ChatComposerActiveModes.vue';
export { default as ComposerFileMentionMenu } from './chat/ChatComposerFileMentionMenu.vue';
export { default as ComposerDrawer } from './chat/ChatComposerDrawer.vue';
export { default as ComposerDrawerRow } from './chat/ChatComposerDrawerRow.vue';
export { default as ComposerShelf } from './chat/ChatComposerShelf.vue';
export { default as ComposerSkillMenu } from './chat/ChatComposerSkillMenu.vue';
export { default as ComposerPluginMenu } from './chat/ChatComposerPluginMenu.vue';
export { default as ComposerAtMentionMenu } from './chat/ChatComposerAtMentionMenu.vue';
export { default as MentionChip } from './chat/ChatMentionChip.vue';
export { default as RichTextEditor } from './chat/ChatRichTextEditor.vue';
export type { RichTextEditorExpose } from './chat/ChatRichTextEditor.vue';
export { default as ComposerSlashMenu } from './chat/ChatComposerSlashMenu.vue';
export { default as ComposerVoiceButton } from './chat/ChatComposerVoiceButton.vue';
export { default as ComposerVoiceField } from './chat/ChatComposerVoiceField.vue';
export {
  useComposerVoice,
  type ComposerVoiceController,
  type ComposerVoiceOptions,
} from './chat/use-chat-composer-voice';
export { default as ContextUsageIndicator } from './chat/ChatContextUsageIndicator.vue';
export { default as UltrafastIcon } from './chat/UltrafastIcon.vue';
export { default as FoldTransition } from './chat/ChatFoldTransition.vue';
export { default as FollowUps } from './chat/ChatFollowUps.vue';
export { default as Goal } from './chat/ChatGoal.vue';
export { default as IconButton } from './chat/ChatIconButton.vue';
export { default as ImageLightbox } from './chat/ChatImageLightbox.vue';
export { default as MediaBlock } from './chat/ChatMediaBlock.vue';
export { default as MermaidBlock } from './chat/ChatMermaidBlock.vue';
export { default as MessageActions } from './chat/ChatMessageActions.vue';
export { default as MessageBlock } from './chat/ChatMessageBlock.vue';
export { default as MessageEditor } from './chat/ChatMessageEditor.vue';
export { default as ModelReasoningSelector } from './chat/ChatModelReasoningSelector.vue';
export { default as QueuedPrompt } from './chat/ChatQueuedPrompt.vue';
export { default as QueuedPrompts } from './chat/ChatQueuedPrompts.vue';
export { default as ToolCall } from './chat/ChatToolCall.vue';
export { default as ToolCallTitle } from './chat/ChatToolCallTitle.vue';
export { default as ToolConfirmation } from './chat/ChatToolConfirmation.vue';
export { default as ToolGroup } from './chat/ChatToolGroup.vue';
export { default as ToolIcon } from './chat/ChatToolIcon.vue';
export { default as ToolUserInputRequest } from './chat/ChatToolUserInputRequest.vue';
export { default as QuestionRequest } from './chat/ChatQuestionRequest.vue';
export { default as TurnGitInfo } from './chat/ChatTurnGitInfo.vue';
export { default as UserText } from './chat/ChatUserText.vue';
export { default as VisualizationBlock } from './chat/ChatVisualizationBlock.vue';
export { default as WorkGroup } from './chat/ChatWorkGroup.vue';
export {
  defaultConversationPresentation,
  resolveConversationPresentation,
} from './chat/contracts';
export { defaultChatTranslate, provideChatTranslate, useChatTranslate } from './chat/chat-i18n';
export { provideToolCallDetails, useToolCallDetails } from './chat/tool-call-details';
export { provideToolPresentation, useToolPresentation } from './chat/tool-presentation';
export type {
  ToolPresentation,
  ToolPresentationContext,
  ToolPresentationResolver,
} from './chat/tool-presentation';
export {
  chatMessageFromInput as toChatMessage,
  chatMessagesFromInputs as toChatMessages,
  conversationMessageToChatMessage,
} from './chat/renderer-message-adapter';
export { createQueuedChatPrompt } from './chat/queued-prompts';
export { commandDescription, filterComposerCommands } from './chat/composer-commands';
export {
  filterComposerMentionGroups,
  findComposerMention,
  type ComposerMentionGroup,
  type ComposerMentionItem,
  type ComposerVisibleMentionGroup,
} from './chat/composer-mentions-custom';
export {
  filterComposerSkills,
  promptSkillInputsFromText,
  skillDescription,
  skillDisplayName,
  skillInsertText,
  skillMatchesMention,
} from './chat/composer-skills';
export {
  filterComposerPlugins,
  pluginDescription,
  pluginDisplayName,
  pluginInsertText,
  pluginMatchesMention,
} from './chat/composer-plugins';
export { renderMarkdown } from './chat/message-markdown';
export { humanizeMentionName, parseUserText, parseAuthoredUserText } from './chat/user-text';
export type { UserTextToken } from './chat/user-text';
export type {
  MessageImage,
  MessageImageContext,
  MessageImageOpenHandler,
  MessageImageOpenIntent,
} from './chat/message-image';
export type {
  ConversationVisualization,
  ConversationVisualizationOpenHandler,
} from './chat/visualization';
export { languageForFilePath, renderCodeBlock } from './chat/syntax-highlighting';
export { registerToolTitlePresenter } from './chat/tool-status';
export type { ToolTitlePresenter, ToolTitlePresenterContext } from './chat/tool-status';
export type {
  ComposerMenuActionItem,
  ComposerMenuCheckboxItem,
  ComposerMenuHeadingItem,
  ComposerMenuItem,
  ComposerMenuItemBase,
  ComposerMenuRadioItem,
  ComposerMenuSelectableItem,
  ComposerMenuSeparatorItem,
  ComposerMenuSubmenuItem,
} from './composer-menu';
export type {
  ContextUsage,
  ComposerPresentation,
  ComposerShelfPresentation,
  ConversationFileAction,
  ConversationPresentation,
  ConversationLink,
  FileSearchItem,
  SpeechTranscriptionResult,
  PermissionOption,
  AskUserAnswers,
  AskUserQuestion,
  AskUserQuestionOption,
  Capabilities,
  CommandSummary,
  ModelOption,
  MessageActionsPresentation,
  MessagesPresentation,
  ReasoningEffortOption,
  SkillSummary,
  ClientRequestResponse,
  ChatTranscription,
  PromptSkillInput,
  ReasoningEffort,
  ResolvedConversationPresentation,
  ThreadGoal,
  ThreadGoalStatus,
  ToolConfirmationDecision,
  TurnGitDiff,
} from './chat/contracts';
export type { PluginSummary, ProviderServiceTier } from '@korus-dev/multi-agent-sdk';
export type {
  MessageAttachment,
  ChatMessage,
  MessageMedia,
  MessagePart as ChatMessagePart,
  MessageSuggestedPrompt,
  MessageToolCall,
  ToolExecutionState,
  ToolStatusDescriptor,
} from './chat/types';
export type {
  MessageTextSelection,
  MessageTextSelectionAnchor,
} from './chat/message-text-selection';
export type { ChatMessageInput as MessageInput, ConversationMessageInput } from './chat/renderer-message-adapter';
export type { ToolVisibility } from './chat/tool-visibility';
export type { ChatTranslate } from './chat/chat-i18n';
export type { QueuedChatPrompt as QueuedPromptData } from './chat/queued-prompts';
export { applyTheme, type ThemeMode, type ThemeOptions } from './theme';
export {
  conversationLinkFromHref,
  parseEditorFileReference,
  type EditorFileReference,
} from './chat/conversation-links';
export {
  getGlobalHostCapabilities,
  getNativeRendererApi,
  ingestAttachments,
  pickAttachments,
  provideHostCapabilities,
  useHostCapabilities,
  type AttachmentIngester,
  type AttachmentPicker,
} from './native-capabilities';
export type {
  HostCapabilities,
  HostAttachment,
  HostAttachmentInput,
  NativeAttachment,
  NativeAttachmentInput,
  NativeClipboardContent,
  NativeRendererApi,
} from '@korus-dev/agent-ui-sdk/host';

export { customBlocksKey, type CustomBlocks } from './chat/custom-blocks';

export { default as MarkdownPanel } from './documents/MarkdownPanel.vue';
export { collectMarkdownHeadings, type MarkdownHeading } from './documents/markdown-outline';
export { sanitizeSvg } from './documents/visualization-svg';
export { default as SourcePreviewPanel } from './documents/SourcePreviewPanel.vue';
export { default as DiffPreviewPanel } from './documents/DiffPreviewPanel.vue';
export { default as AnnotationPopup, type AnnotationPopupAnchor } from './documents/AnnotationPopup.vue';
export { default as CodeSelectionAnnotation } from './documents/CodeSelectionAnnotation.vue';
export { useCodeSelection, type CodeSelection, type CodeSelectionAnchor } from './documents/use-code-selection';
export { describeCodeRange, type CodeRange, type CodeAnnotationInput, type CodeLocation } from './documents/annotation-types';
export { fileKindColor } from './documents/file-kind-presentation';

export type { DiffOverviewFile, DiffOverviewSlot } from '../documents/diff-overview';

export { sessionStateToConversationPaneState, type SessionConversationControls } from './session-conversation-pane';

export { requestResponseFromClientResponse, requestResponseFromApproval, type SessionRequestResponse } from './session-request-response';

export type { ConversationRequest, ConversationQuestionRequest, ConversationConfirmationRequest } from './chat/conversation-request';

export { createSessionConversationController, type SessionConversationClient, type SessionConversationControllerOptions } from './session-conversation-controller';
export { toHarnessPromptOptions } from '../host/session-prompt-options';

export type { ConversationSubmissionResult } from './conversation-pane-controller';
