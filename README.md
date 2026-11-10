# ai-app-sdk

Private Vue controls for agent applications: compose prompts, render conversations, answer approvals and questions, and choose models. Hosts supply capabilities, semantic conversation state, catalogs and action handlers.

Import controls such as `Composer`, `MessageList`, `ConversationPane` and `ModelReasoningSelector` from `ai-app-sdk`, with styles from `ai-app-sdk/styles.css`. Optional document panels are available from the root. Hosts own navigation and application workflows. Compose neutral harness `SessionState` with `sessionStateToConversationPaneState` and `createConversationPaneController`; see the typed [session example](examples/session-pane.ts).

Trusted integrations are opt-in: `ai-app-sdk/native`, `ai-app-sdk/electron`, `ai-app-sdk/electron/preload`, `ai-app-sdk/speech`, `ai-app-sdk/browser/*` and `ai-app-sdk/browser-ui`. `ai-app-sdk/host` contains host contracts. Electron and Element Plus are optional peers.

See [consumer integration](INTEGRATION.md) for the exact neutral export map, browser owner contract and host-owned diff overview.
