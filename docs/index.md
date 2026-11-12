---
layout: home

hero:
  name: Agent UI SDK
  text: One conversation UI for every agent.
  tagline: Capability-driven Vue controls for applications powered by Codex, Claude, Cursor and Antigravity. Compose a complete pane or just the pieces you need.
  image:
    src: /logo.svg
    alt: Agent UI SDK
  actions:
    - theme: brand
      text: Get started
      link: /guide/quick-start
    - theme: alt
      text: Explore the architecture
      link: /guide/architecture
    - theme: alt
      text: View on GitHub
      link: https://github.com/Korus-Dev/agent-ui-sdk

features:
  - icon: 💬
    title: A complete conversation pane
    details: Streaming messages, rich prompt editing, tools, approvals, questions, queues, goals, history and model selection in one component.
  - icon: 🔌
    title: Harness-neutral by design
    details: The pane renders what a session's capabilities allow. It never asks which provider it is talking to, so one UI serves every harness.
  - icon: ✍️
    title: A composer that understands intent
    details: Slash commands, skills, plugins, file mentions and host-defined mention groups become typed chips. Prompt recall, queue editing, steering and voice dictation included.
  - icon: 🧱
    title: Composable all the way down
    details: Use ConversationPane, or assemble Composer, MessageList, ApprovalPrompt, ModelPicker and dozens of leaf controls into your own layout.
  - icon: 🖥️
    title: Optional trusted adapters
    details: Typed Electron IPC, a window policy, attachments, clipboard, Apple and OpenAI speech, and a guarded in-app browser. All behind explicit entry points.
  - icon: 🎨
    title: Yours to customize
    details: Slots, presentation flags, scoped providers, semantic CSS tokens and light, dark and system themes. No private selectors required.
---

## A deliberately small integration

Your trusted host runs a session through `@korus-dev/multi-agent-sdk`. The renderer binds a reactive snapshot and a handful of session-bound actions, then renders the pane:

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

Provider handles, credentials, filesystem paths and Electron objects never cross into this code.

## One package, a few clear layers

<div class="sdk-layer-grid">
  <div class="sdk-layer">
    <strong>Root</strong>
    <p>Provider-neutral Vue controls, session composition, themes, providers and document panels.</p>
  </div>
  <div class="sdk-layer">
    <strong>/host</strong>
    <p>Renderer-safe contracts for attachments, clipboard, links and speech, plus prompt-option translation.</p>
  </div>
  <div class="sdk-layer">
    <strong>/electron</strong>
    <p>Typed IPC, window policy, native capabilities and the preload bridge for desktop hosts.</p>
  </div>
  <div class="sdk-layer">
    <strong>/speech</strong>
    <p>Trusted Apple SpeechAnalyzer and OpenAI dictation sessions.</p>
  </div>
  <div class="sdk-layer">
    <strong>/browser</strong>
    <p>Browser contracts, the Vue browser panel, and a guarded Electron browser manager.</p>
  </div>
</div>

## Start where you are

| If you are building… | Start from… |
| --- | --- |
| A new agent application | [Quick start](/guide/quick-start) |
| A pane inside an existing Vue app | [Conversation pane](/guide/conversation-pane) and [session binding](/guide/session-binding) |
| A custom layout from individual controls | [Composer](/guide/composer) and [messages and tools](/guide/messages-tools) |
| An Electron desktop host | [Electron host](/guide/electron) |
| A focused, branded chat | [Presentation and theming](/guide/presentation) and the [Spark sample](/guide/samples#spark-focused-chat) |
| A business application with model-driven operations | The [Relay sample](/guide/samples#relay-business-ui-and-mcp-tools) |

::: tip Design rule
The UI works from capabilities and session state. It never branches on a provider name. Applications supply wording such as permission labels, and the harness SDK supplies behavior.
:::

## Source and package access

The package is published to npm as `@korus-dev/agent-ui-sdk` under the Apache-2.0 license. The [component lab](/guide/samples#component-lab) needs no provider login: clone the repository, run `npm ci` and `npm run dev:lab`.

The SDK is pre-1.0 and these docs follow `main`; package releases may lag behind.

[Quick start →](/guide/quick-start)
