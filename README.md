# agent-ui-sdk

Vue controls for agent applications: compose prompts, render conversations, answer approvals and questions, and choose models. Hosts supply capabilities, semantic conversation state, catalogs and action handlers.

Import controls such as `Composer`, `MessageList`, `ConversationPane` and `ModelReasoningSelector` from `@korus-dev/agent-ui-sdk`, with styles from `@korus-dev/agent-ui-sdk/styles.css`. Optional document panels are available from the root. Hosts own navigation and application workflows. Use `createSessionConversationController` to bind neutral harness state and session operations to the complete conversation pane, including composer settings, follow-up queue/steering, goals, approvals, questions and scoped image previews. For custom behavior, compose `SessionState` with `sessionStateToConversationPaneState` and the low-level `createConversationPaneController`; see the typed [session example](examples/session-pane.ts).

Trusted integrations are opt-in: `@korus-dev/agent-ui-sdk/native`, `@korus-dev/agent-ui-sdk/electron`, `@korus-dev/agent-ui-sdk/electron/preload`, `@korus-dev/agent-ui-sdk/speech`, `@korus-dev/agent-ui-sdk/browser/*` and `@korus-dev/agent-ui-sdk/browser-ui`. `@korus-dev/agent-ui-sdk/host` contains host contracts. Electron and Element Plus are optional peers.

Applications own durable attachment storage and retention. The SDK renders previews through host/session readers; runtime attachment references are not permanent IDs. See [attachment previews and retention](INTEGRATION.md#attachment-previews-and-retention).

See [consumer integration](INTEGRATION.md) for the exact neutral export map, browser owner contract and host-owned diff overview.

## Local development

Install dependencies with `npm ci` in this repository. npm packages are used by default. Set `SDK_LOCAL_SOURCE=1` in `.env` to run dependency source from sibling SDK repositories; `SDK_SOURCE_ROOT` can point to another directory containing `codex-sdk`, `multi-agent-sdk` and `agent-ui-sdk`. Build local dependencies first, in that order. Vite and tests use live source; typechecking uses the local builds’ declarations. `SDK_LOCAL_SOURCE=0` explicitly selects installed npm packages.

## Component lab

Run `npm run dev:lab` from this repository to preview conversation and composer states at `http://127.0.0.1:5176`. Mocked scenarios need no provider login. The opt-in live chat scenario uses a local Codex runtime only after you connect.

`npm run build:lab` creates a static preview in `dist-lab`. Lab component checks run with `npm test`; `npm run test:lab` runs them separately. Install Chromium and WebKit with `npx playwright install chromium webkit`, then run `npm run test:lab:browser` for layout, streaming, editing, requests, images and speech workflows. See [lab/README.md](lab/README.md).
