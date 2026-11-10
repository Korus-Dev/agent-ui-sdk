# agent-ui-sdk

Private Vue controls for agent applications: compose prompts, render conversations, answer approvals and questions, and choose models. Hosts supply capabilities, semantic conversation state, catalogs and action handlers.

Import controls such as `Composer`, `MessageList`, `ConversationPane` and `ModelReasoningSelector` from `@korus-dev/agent-ui-sdk`, with styles from `@korus-dev/agent-ui-sdk/styles.css`. Optional document panels are available from the root. Hosts own navigation and application workflows. Compose neutral harness `SessionState` with `sessionStateToConversationPaneState` and `createConversationPaneController`; see the typed [session example](examples/session-pane.ts).

Trusted integrations are opt-in: `@korus-dev/agent-ui-sdk/native`, `@korus-dev/agent-ui-sdk/electron`, `@korus-dev/agent-ui-sdk/electron/preload`, `@korus-dev/agent-ui-sdk/speech`, `@korus-dev/agent-ui-sdk/browser/*` and `@korus-dev/agent-ui-sdk/browser-ui`. `@korus-dev/agent-ui-sdk/host` contains host contracts. Electron and Element Plus are optional peers.

See [consumer integration](INTEGRATION.md) for the exact neutral export map, browser owner contract and host-owned diff overview.

## Local development

Install dependencies with `npm ci` in this repository. npm packages are used by default. Set `SDK_LOCAL_SOURCE=1` in `.env` to run dependency source from sibling SDK repositories; `SDK_SOURCE_ROOT` can point to another directory containing `codex-sdk`, `multi-agent-sdk` and `agent-ui-sdk`. Build local dependencies first, in that order. Vite and tests use live source; typechecking uses the local builds’ declarations. `SDK_LOCAL_SOURCE=0` explicitly selects installed npm packages.
