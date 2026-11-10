# Public entry points

Import the common Vue API from the package root. Optional modules use static public JavaScript files with adjacent declarations. The package uses `main` and `types`, with no exports map or declaration rewrite step. Use TypeScript Bundler resolution with a Vue-aware bundler.

| Import suffix | Exports and runtime |
| --- | --- |
| root | Vue conversation controls, session/controller composition, renderers, themes, providers, document panels and neutral types |
| `/styles.css` | Control styles, syntax/math styles and packaged fonts |
| `/host.js` | Host capability contracts and pure `toHarnessPromptOptions` translation |
| `/native.js` | Opt-in native Codex surface/live-chat controls and catalogs |
| `/electron.js` | Trusted IPC, window policy, native integration and attachment registry |
| `/electron/preload.js` | Preload bridge helpers |
| `/electron/browser.js` | Trusted Electron browser manager |
| `/speech.js` | Trusted Apple/OpenAI speech sessions and transcription |
| `/browser.js` | Browser-safe contracts, bookmark, partition and viewport helpers |
| `/browser-ui.js` | Vue browser panel, bookmarks and annotation controls |
| `/documents.js` | File-kind helpers and diff overview contracts |

All suffixes are relative to `@korus-dev/agent-ui-sdk`. Electron and speech entry points require a trusted Node host; keep them outside renderer imports. Vue and Element Plus are peers for the controls that use them.

## Conversation composition

- `createSessionConversationController(options)` returns `{ controller, queuedPrompts, dispose }` for a reactive session, capabilities and client actions.
- `sessionStateToConversationPaneState(state, capabilities, key?, controls?)` projects a session snapshot into pane state.
- `createConversationPaneController(options)` binds grouped state and application-owned actions.
- `requestResponseFromClientResponse` and `requestResponseFromApproval` translate request responses while preserving identity.
- `toHarnessPromptOptions(options, resolveAttachment?)` translates UI selection/content/attachments at the trusted host boundary.

## Controls

`ConversationPane`, `Composer`, `MessageList`, `Message`, `MessageTurn`, `ApprovalPrompt`, `ModelPicker`, `ModelReasoningSelector`, `ConversationHistoryLoader`, `ScrollToBottom` and `WorkbenchLayout` cover the main composition. Leaf exports include composer menus/shelf/voice, message blocks/actions/editor, tools/groups/requests, goals, queued prompts, images, Mermaid, media and visualization blocks.

## Compatibility

Existing `Codex*` aliases retain the same implementations where exported. Use neutral names for new applications. The native Codex hooks and catalogs are available only from `/native.js`; the root does not own provider execution. TypeScript declarations in the published package are the authoritative complete signature reference.
