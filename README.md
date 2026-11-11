# Agent UI SDK

Vue conversation controls for applications powered by Codex, Claude, Cursor and Antigravity through `@korus-dev/multi-agent-sdk`.

Build a complete conversation pane or compose individual controls: rich prompt editing, streaming messages, approvals and questions, model selection, tools, queues, goals, attachments and document previews. Your host supplies state, capabilities, catalogs and actions.

[![npm version](https://img.shields.io/npm/v/%40korus-dev%2Fagent-ui-sdk?color=0b7a65)](https://www.npmjs.com/package/@korus-dev/agent-ui-sdk)
[![CI](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/ci.yml)
[![Documentation](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/docs.yml/badge.svg?branch=main)](https://korus-dev.github.io/agent-ui-sdk/)
[![License](https://img.shields.io/badge/license-Apache--2.0-0b7a65.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/%40korus-dev%2Fagent-ui-sdk?color=339933)](package.json)

**[Documentation →](https://korus-dev.github.io/agent-ui-sdk/)**

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

Bind a reactive session snapshot and renderer-safe operations with `createSessionConversationController`, then render `<ConversationPane :controller="binding.controller" />`. The same pane adapts to each harness's capabilities. See the [conversation guide](https://korus-dev.github.io/agent-ui-sdk/guide/conversation-pane).

## Documentation

The [VitePress guides](https://korus-dev.github.io/agent-ui-sdk/) cover installation, session composition, the composer, messages, tools, history, themes, providers, documents, browser panels and native capabilities. Run `npm run dev:docs` to read them locally.

The root import contains provider-neutral Vue controls. State, capabilities and application-owned actions determine their behavior. Named optional entries keep trusted host code separate: `/host`, `/electron`, `/electron/preload`, `/electron/browser`, `/speech`, `/browser`, `/browser-ui` and `/documents`. See the [entry-point reference](https://korus-dev.github.io/agent-ui-sdk/api/). Applications own navigation, authorization, durable attachments and retention.

## Samples

| Sample | Run |
| --- | --- |
| Basic Electron: multiple conversations | `npm run dev:basic` |
| Spark: focused chat and theming | `npm run dev:spark` |
| Relay: business board and MCP tools | `npm run dev:relay` |
| Component lab: mocked visual scenarios | `npm run dev:lab` |

Pass `-- --backend claude` (or `codex`, `cursor`, `antigravity`) to a sample launch command; Codex is the default. Spark and Relay use isolated homes under `~/.agent-ui-sdk/samples/`; Basic uses the runtime’s standard home. The [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples) explains host boundaries and commands. Lab scenarios use deterministic mocked state.

## Development

```bash
npm ci
npm run check
npx playwright install chromium webkit
npm run test:lab:browser
npm run test:samples:browser
```

To develop sibling SDKs, set `SDK_LOCAL_SOURCE=1` in `.env` and optionally `SDK_SOURCE_ROOT` to their parent directory. Build `codex-sdk`, `multi-agent-sdk`, then this package. Published dependencies are used by default; `SDK_LOCAL_SOURCE=0` explicitly selects installed packages.

CI checks types, tests, coverage, builds, the packed consumer, VitePress and browser workflows. Publishing uses a manual GitHub Actions workflow with npm trusted publishing. See [contributing](https://korus-dev.github.io/agent-ui-sdk/guide/testing) and [release setup](https://korus-dev.github.io/agent-ui-sdk/guide/releasing).

Licensed under [Apache 2.0](LICENSE).
