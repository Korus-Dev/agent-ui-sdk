# Composer and input

Use `Composer` independently or inside `ConversationPane`. It supports multiline text, authored mention chips, attachments, history recall, queue editing and optional voice input.

| Prefix | Catalog |
| --- | --- |
| `/` | Host commands |
| `$` | Skills |
| `@` | Plugins, files and host mention groups |

Accepting a suggestion creates a typed chip. Literal typed or pasted text remains literal. Preserve `ComposerState.content` with drafts and forward submission `options.content` through sending, steering and queue edits so selected targets survive their visible labels.

Supply catalogs explicitly. Opening a skill menu can request discovery; the host returns catalog state and handles failures. Models, reasoning efforts and service tiers use provider IDs. Do not invent a universal model list or map one harness's permission IDs onto another's.

Enter submits; Shift+Enter inserts a line break. Cmd/Ctrl+Enter steers when supported. Capability flags control steering, interruption, goals, plan mode and other optional actions. Goal mode collects an objective before sending `/goal …`; Goal and Plan modes are mutually exclusive.

`ComposerMenu`, `ComposerMenuList`, `ComposerSendButton`, `ModelReasoningSelector`, voice controls and shelf controls can be composed into a custom layout. `useComposerVoice` owns recording, transcription and cleanup for a custom voice UI. Dictation uses the supplied host speech capability. Provider realtime conversation protocols belong in the application host or Multi Agent SDK.

Attachments need a trusted host picker/ingester and opaque references. Call `toHarnessPromptOptions` from `/host` when translating UI options for a harness; provide a trusted resolver for attachments. Never treat a renderer-supplied path as permission to read a file. Applications own retention and durable attachment storage.
