# Public entry points

Import the common Vue API from the package root. Optional modules use explicit, extensionless package exports, with matching JavaScript and declaration targets. The package keeps `main` and `types` as the root fallback. Use TypeScript Bundler resolution with a Vue-aware bundler.

| Import suffix | Exports and runtime |
| --- | --- |
| root | Vue conversation controls, session/controller composition, renderers, themes, providers, document panels and neutral types |
| `/styles.css` | Control styles, syntax/math styles and packaged fonts |
| `/host` | Host capability contracts and pure `toHarnessPromptOptions` translation |
| `/electron` | Trusted IPC, window policy, native integration and attachment registry |
| `/electron/preload` | Preload bridge helpers |
| `/electron/browser` | Trusted Electron browser manager |
| `/speech` | Trusted Apple/OpenAI speech sessions and transcription |
| `/browser` | Browser-safe contracts, bookmark, partition and viewport helpers |
| `/browser-ui` | Vue browser panel, bookmarks and annotation controls |
| `/documents` | File-kind helpers and diff overview contracts |

All suffixes are relative to `@korus-dev/agent-ui-sdk`. Electron and speech entry points require a trusted Node host; keep them outside renderer imports. Vue and Element Plus are peers for the controls that use them.

## Conversation composition

- `createSessionConversationController(options)` returns `{ controller, queuedPrompts, dispose }` for a reactive session, capabilities and client actions.
- `sessionStateToConversationPaneState(state, capabilities, key?, controls?)` projects a session snapshot into pane state.
- `createConversationPaneController(options)` binds grouped state and application-owned actions.
- `requestResponseFromClientResponse` and `requestResponseFromApproval` translate request responses while preserving identity.
- `toHarnessPromptOptions(options, resolveAttachment?)` translates UI selection/content/attachments at the trusted host boundary.

## Controls

`ConversationPane`, `Composer`, `MessageList`, `Message`, `MessageTurn`, `ApprovalPrompt`, `ModelPicker`, `ModelReasoningSelector`, `ConversationHistoryLoader`, `ScrollToBottom` and `WorkbenchLayout` cover the main composition. Leaf exports include composer menus/shelf/voice, message blocks/actions/editor, tools/groups/requests, goals, queued prompts, images, Mermaid, media and visualization blocks.

## Provider boundaries

The root controls and host capability contracts are provider-neutral. Shared conversation DTOs use Multi Agent SDK's canonical names, including `ConversationMessage`, `ClientAttachment` and `ClientSendMessageOptions`. UI presentation types describe renderer choices rather than provider execution.

Every harness uses `ConversationPane` with the same session/controller binding. The UI SDK has no provider-specific panes, hooks, command catalogs, authentication or transport bridges. Applications obtain normalized state and capabilities from Multi Agent SDK and supply session-bound actions. A provider label may be displayed as application-owned text; it does not select UI behavior.
