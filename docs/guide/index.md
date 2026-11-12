# Why Agent UI SDK

An agent application needs a lot more than a text box and a message list. It needs streaming and restored history, approvals and questions, queued prompts and steering, goals, model and permission selection, attachments, mentions, voice input and previews, and every one of them has to behave differently depending on what the underlying harness supports.

The SDK packages that conversation experience once, as Vue components that work from **capabilities and session state** rather than provider names:

- a headerless `ConversationPane` that combines history, requests, messages, queues and the composer;
- a rich composer with typed mention chips, prompt recall, editable queues, steering, interruption and dictation;
- messages that render Markdown, code, math, Mermaid, images, attachments, tools, work groups and inline HTML;
- approvals, questions and tool confirmations that replace the composer until answered;
- document previews (Markdown, source, diff) with annotation, and an embedded browser panel;
- optional trusted adapters for Electron IPC, attachments, clipboard and speech;
- scoped providers, presentation flags, slots and semantic tokens for customization.

## Default workflow

1. [Install](/guide/installation) the package and import its stylesheet.
2. Run a session in a trusted host with `@korus-dev/multi-agent-sdk` and expose a narrow, session-bound bridge. The [quick start](/guide/quick-start) shows the whole path for Electron.
3. [Bind the session](/guide/session-binding) with `createSessionConversationController` and render `<ConversationPane />`.
4. Customize with [presentation flags and tokens](/guide/presentation), [slots](/guide/conversation-pane#slots), and [scoped providers](/guide/vue-providers).

## The boundary

The SDK owns the conversation controls. The application owns the product.

| SDK responsibility | Application responsibility |
| --- | --- |
| Conversation pane, composer, messages, tools and requests | Navigation, sidebars, headers, settings and analytics |
| Rendering of neutral session state and capabilities | Provider execution through `@korus-dev/multi-agent-sdk` |
| Optional Electron, speech and browser adapters | Authorization, process lifecycle and window creation |
| Opaque attachment references and host capability contracts | Durable attachment storage and retention |
| Presentation flags, slots, tokens and providers | Wording for permissions, branding and product copy |

Provider execution belongs in `@korus-dev/multi-agent-sdk`, and raw Codex protocol handling belongs in `@korus-dev/codex-sdk`. A diff view is application-specific and does not belong here; the SDK offers document panels that your application feeds with content.

## Choose your level

### Complete pane

Create one binding per conversation and render `ConversationPane`. This is the recommended path, and the same pane serves every harness.

### Grouped controller

Use `sessionStateToConversationPaneState` with `createConversationPaneController` when your host owns queueing, keeps conversation state elsewhere, or needs actions the session binding does not provide.

### Individual controls

`Composer`, `MessageList`, `Message`, `MessageTurn`, `ApprovalPrompt`, `ModelPicker`, `QueuedPrompts`, `Goal` and many leaf blocks can be assembled into a custom layout. See the [API reference](/api/vue) for every export.

## What the SDK deliberately leaves out

- **Provider-specific panes, hooks or catalogs.** Every harness uses the same `ConversationPane`.
- **App chrome.** There is no sidebar, settings screen or account menu; conversation navigation is a host concern.
- **Persistence.** Drafts, queued prompts, preferences and attachments live in your application unless you wire them in.
- **Authorization.** Capability flags and presentation controls hide UI. They never grant or revoke access; enforce policy in the trusted process.
