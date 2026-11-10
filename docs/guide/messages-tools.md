# Messages, tools and history

`MessageList`, `Message`, `MessageTurn` and leaf blocks render semantic conversation data. `toChatMessage` and `toChatMessages` adapt supported inputs; native provider normalization belongs in the harness SDK.

Markdown supports code highlighting, KaTeX math, Mermaid diagrams, images, attachments and custom blocks. Import `styles.css` so math fonts, code and controls render consistently. `MessageBlock`, `MediaBlock`, `AttachmentBlock`, `MermaidBlock` and `VisualizationBlock` are reusable independently.

Tool groups preserve the chronological relationship between work and final output. Raw tool inputs and outputs are hidden by default. `provideToolCallDetails(true)` enables disclosure for a trusted subtree; review sensitive content before enabling it. `provideToolPresentation` customizes icons and titles without replacing grouping or streaming behavior.

Message actions are constrained by turn state and host policy. Active turns do not expose historical mutation actions. Delete, Edit and Retry affect the selected turn through host actions; Fork requires a host-supported successful-turn operation. Copy and Quote remain message-level actions. Visibility does not authorize a mutation.

## History and performance

Lazy DOM rendering is independent from provider history loading. The default message list mounts a recent slice and progressively prepends older messages while preserving the reading position. `renderStrategy="eager"` opts out of lazy mounting. Keep message identities stable across streaming updates so settled Markdown and selection survive.

Hosts supply `turns`, history loading state and `loadTurnHistory`/`loadOlderHistory`. Summary turns can request details on expansion; loading failures remain retryable. Do not infer native history completeness from the number of DOM nodes.

Image previews are lazy and scoped to the conversation. Bind `readConversationContent` for session images or a host image reader for opaque references. Runtime references are not permanent attachment IDs; store durable copies and enforce retention in the application.

The component lab's Chromium and WebKit workflows check scrolling, streaming isolation, image layout, editing and selection. Unit tests alone do not establish browser geometry or physical-device behavior.
