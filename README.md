# Agent UI SDK

Vue conversation controls for applications powered by Codex, Claude, Cursor and Antigravity. Build a complete conversation pane, or compose just the controls you need, without rebuilding prompt editing, streaming messages, approvals and history for every app.

[![npm version](https://img.shields.io/npm/v/%40korus-dev%2Fagent-ui-sdk?color=0b7a65)](https://www.npmjs.com/package/@korus-dev/agent-ui-sdk)
[![CI](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/ci.yml)
[![Documentation](https://github.com/Korus-Dev/agent-ui-sdk/actions/workflows/docs.yml/badge.svg?branch=main)](https://korus-dev.github.io/agent-ui-sdk/)
[![License](https://img.shields.io/badge/license-Apache--2.0-0b7a65.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/%40korus-dev%2Fagent-ui-sdk?color=339933)](package.json)
[![Vue](https://img.shields.io/badge/vue-%3E%3D3.5-42b883.svg)](https://vuejs.org/)

**[Read the full documentation →](https://korus-dev.github.io/agent-ui-sdk/)**

The SDK renders the conversation. [`@korus-dev/multi-agent-sdk`](https://www.npmjs.com/package/@korus-dev/multi-agent-sdk) runs it. Your application supplies session state, capabilities, catalogs and actions, and owns navigation, authorization, durable attachments and retention. The UI never asks which provider it is talking to: it works from capabilities, so one pane serves every harness.

| Entry point | Responsibility |
| --- | --- |
| `@korus-dev/agent-ui-sdk` | Provider-neutral Vue controls, session and controller composition, themes, providers and document panels |
| `…/styles.css` | Control styles, syntax and math styles, packaged fonts |
| `…/host` | Renderer-safe host capability contracts and prompt-option translation |
| `…/electron`, `…/electron/preload` | Trusted IPC, window policy, native capabilities and the preload bridge |
| `…/electron/browser`, `…/browser`, `…/browser-ui` | Guarded in-app browser: manager, contracts and Vue panel |
| `…/speech` | Trusted Apple SpeechAnalyzer and OpenAI dictation sessions |
| `…/documents` | File classification and diff-overview contracts |

## Install

```bash
npm install @korus-dev/agent-ui-sdk vue
```

Requires Vue 3.5+ and a Vue-aware ESM bundler. Node.js 22.19+ is needed for development and trusted adapters. Electron and Element Plus are optional peers; install Element Plus when you use the document and browser panels. See the [installation guide](https://korus-dev.github.io/agent-ui-sdk/guide/installation) for TypeScript settings and import boundaries.

## What you get

- **A complete conversation pane.** `ConversationPane` combines history, requests, messages, queues and the composer, and adapts to each harness's capabilities.
- **A composer that understands intent.** Slash commands, skills, plugins, file mentions and host-defined mention groups become typed chips, with prompt recall, editable queues, steering, double-Escape interruption, goals, plan mode and voice dictation.
- **Rich messages.** Streaming Markdown with code highlighting, math, Mermaid, images, attachments, inline HTML and custom blocks; chronological tool groups; message actions that follow host policy.
- **Requests handled inline.** Approvals, tool confirmations and questions replace the composer, and the draft survives.
- **Model, reasoning, speed and permission controls** driven by the catalogs and permissions the harness reports.
- **Long conversations that stay fast.** Lazy mounting, progressive history, stable streaming identities and lazy, bounded image previews.
- **Document and browser panels.** Markdown, source and diff previews with annotation, and an embedded browser with bookmarks, viewports and element annotations.
- **Optional trusted adapters.** Typed Electron IPC, a window policy, attachments, clipboard, links and macOS speech. Renderer code receives opaque references, never paths or handles.
- **Customization without forking.** Slots, presentation flags, scoped providers, semantic CSS tokens and light, dark and system themes.

## A deliberately small renderer

Bind a reactive session snapshot and a few session-bound operations, then render the pane:

```vue
<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue';
import { ConversationPane, createSessionConversationController } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
import { bridge } from './bridge'; // your typed window.bridge, see the quick start

const initial = await bridge.read();
const state = shallowRef(initial.state);
const off = bridge.subscribe(next => { state.value = next; });

const binding = createSessionConversationController({
  conversationKey: 'conversation-1',
  state,
  capabilities: () => initial.capabilities,
  client: bridge,
});
onBeforeUnmount(() => { off(); binding.dispose(); });
</script>

<template>
  <ConversationPane :controller="binding.controller" />
</template>
```

Operations you do not connect reject if invoked, and the pane hides controls the capabilities do not support. For other layouts, [assemble the individual controls](https://korus-dev.github.io/agent-ui-sdk/guide/assembling), including `Composer`, `MessageList`, `ApprovalPrompt` and `ModelPicker`.

## Start here

### Try it from source

With Node.js 22.19 or newer, explore every control without an API key or provider login:

```bash
git clone https://github.com/Korus-Dev/agent-ui-sdk.git
cd agent-ui-sdk
npm ci
npm run dev:lab
```

### Build your own application

The [quick start](https://korus-dev.github.io/agent-ui-sdk/guide/quick-start) builds a minimal Electron host, preload bridge and Vue renderer. From there:

- [Conversation pane](https://korus-dev.github.io/agent-ui-sdk/guide/conversation-pane) and [session binding](https://korus-dev.github.io/agent-ui-sdk/guide/session-binding)
- [Components and their customization props](https://korus-dev.github.io/agent-ui-sdk/guide/components)
- [Assembling a custom layout](https://korus-dev.github.io/agent-ui-sdk/guide/assembling)
- [Composer](https://korus-dev.github.io/agent-ui-sdk/guide/composer), [messages and tools](https://korus-dev.github.io/agent-ui-sdk/guide/messages-tools) and [requests](https://korus-dev.github.io/agent-ui-sdk/guide/requests)
- [Presentation and theming](https://korus-dev.github.io/agent-ui-sdk/guide/presentation) and [Vue providers](https://korus-dev.github.io/agent-ui-sdk/guide/vue-providers)
- [Electron host](https://korus-dev.github.io/agent-ui-sdk/guide/electron), [native capabilities](https://korus-dev.github.io/agent-ui-sdk/guide/native-capabilities) and the [security boundary](https://korus-dev.github.io/agent-ui-sdk/guide/security)
- [Documents](https://korus-dev.github.io/agent-ui-sdk/guide/documents) and the [browser panel](https://korus-dev.github.io/agent-ui-sdk/guide/browser)
- [API reference](https://korus-dev.github.io/agent-ui-sdk/api/)

## Samples

| Sample | Product shape | Run |
| --- | --- | --- |
| [Basic](./samples/electron/basic) | Several conversations, existing history and a sidebar | `npm run dev:basic` |
| [Spark](./samples/electron/spark) | Focused, themed chat with isolated sign-in | `npm run dev:spark` |
| [Relay](./samples/electron/relay) | Operations board backed by an app-owned MCP server | `npm run dev:relay` |
| [Component lab](./lab) | Mocked conversation scenarios for every control | `npm run dev:lab` |

Pass `-- --backend claude` (or `codex`, `cursor`, `antigravity`) to a sample launch command; Codex is the default. Spark and Relay use isolated homes under `~/.agent-ui-sdk/samples/`, while Basic uses the runtime's standard home. Lab scenarios use deterministic mocked state.

The samples are product demonstrations, not templates for child safety or a production logistics backend. See the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples) for the boundaries each one demonstrates.

## Develop

```bash
npm ci
npm run check
npx playwright install chromium webkit
npm run test:lab:browser
npm run test:samples:browser
npm run dev:docs
```

`npm run check` covers types, tests, the 85% coverage gate, the build, the packed consumer, VitePress, the lab and the samples. Use `npm run test:ai -- <name-or-path>` while iterating.

To develop the sibling SDKs together with this package, set `SDK_LOCAL_SOURCE=1` in `.env` and optionally `SDK_SOURCE_ROOT` to their parent directory. Build `codex-sdk`, `multi-agent-sdk`, then this package. Published dependencies are used by default; `SDK_LOCAL_SOURCE=0` explicitly selects installed packages. See the [development guide](https://korus-dev.github.io/agent-ui-sdk/guide/development).

CI runs the quality gate on Linux with Node 22.19, 24 and 26, the browser workflows on Linux, and a macOS native smoke test. Publishing uses a manual GitHub Actions workflow with npm trusted publishing. See [testing](https://korus-dev.github.io/agent-ui-sdk/guide/testing) and [releasing](https://korus-dev.github.io/agent-ui-sdk/guide/releasing).

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [development guide](https://korus-dev.github.io/agent-ui-sdk/guide/development). Keep reusable conversation UI here; provider execution belongs in `multi-agent-sdk` and product navigation and persistence belong in your application.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
