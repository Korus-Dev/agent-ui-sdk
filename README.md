# Agent UI SDK

Vue conversation controls for applications powered by Codex, Claude, Cursor and Antigravity through `@korus-dev/multi-agent-sdk`.

Build a complete conversation pane or compose individual controls: rich prompt editing, streaming messages, approvals and questions, model selection, tools, queues, goals, attachments and document previews. Your host supplies state, capabilities, catalogs and actions.

## Install

```bash
npm install @korus-dev/agent-ui-sdk vue
```

Requires Vue 3.5+ and a Vue-aware ESM bundler. Node.js 22.19+ is required for development and trusted adapters. Electron and Element Plus are optional peers; install Element Plus when using the document/browser panels that need it.

```ts
import {
  ConversationPane,
  createSessionConversationController,
} from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
```

Bind a reactive session snapshot and renderer-safe operations with `createSessionConversationController`, then render `<ConversationPane :controller="binding.controller" />`. The same pane adapts to each harness's capabilities. See the [conversation guide](docs/guide/conversation-pane.md) and [typed example](examples/session-pane.ts).

## Documentation

The [VitePress guides](docs/index.md) cover installation, session composition, the composer, messages, tools, history, themes, providers, documents, browser panels and native capabilities. Run `npm run dev:docs` to read them locally.

The root import contains Vue controls. Named optional entries keep trusted host code separate: `/host.js`, `/native.js`, `/electron.js`, `/electron/preload.js`, `/electron/browser.js`, `/speech.js`, `/browser.js`, `/browser-ui.js` and `/documents.js`. See the [entry-point reference](docs/api/index.md). Applications own navigation, authorization, durable attachments and retention.

## Samples

| Sample | Run |
| --- | --- |
| Basic Electron: multiple conversations | `npm run dev:electron` |
| Spark: focused chat and theming | `npm run dev:spark` |
| Relay: business board and MCP tools | `npm run dev:relay` |
| Component lab: mocked visual scenarios | `npm run dev:lab` |

Select a harness when creating a conversation in the application samples. Install and authenticate that runtime first. The [sample guide](docs/guide/samples.md) explains host boundaries and commands. Lab scenarios use deterministic mocked state.

## Development

```bash
npm ci
npm run check
npx playwright install chromium webkit
npm run test:lab:browser
npm run test:samples:browser
```

To develop sibling SDKs, set `SDK_LOCAL_SOURCE=1` in `.env` and optionally `SDK_SOURCE_ROOT` to their parent directory. Build `codex-sdk`, `multi-agent-sdk`, then this package. Published dependencies are used by default; `SDK_LOCAL_SOURCE=0` explicitly selects installed packages.

CI checks types, tests, coverage, builds, the packed consumer, VitePress and browser workflows. Publishing uses a manual GitHub Actions workflow with npm trusted publishing. See [contributing](CONTRIBUTING.md) and [release setup](docs/guide/releasing.md).

Licensed under [Apache 2.0](LICENSE).
