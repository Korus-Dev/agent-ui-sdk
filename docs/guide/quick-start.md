# Quick start

This walkthrough builds the smallest useful desktop application: an Electron host that runs one session, a preload script that exposes a narrow bridge, and a Vue renderer that shows the conversation pane. It follows the [Basic sample](/guide/samples#basic-electron), which adds multiple conversations, history and a sidebar.

Before you start, install the runtime for the harness you want and sign in with its normal CLI. Then install the packages:

```bash
npm install @korus-dev/agent-ui-sdk @korus-dev/multi-agent-sdk vue
npm install -D electron vite @vitejs/plugin-vue
```

## 1. Run a session in the main process

The trusted process owns the harness, the session and the attachment registry. Nothing here is imported by the renderer.

```ts
// electron/main.ts
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { createHarness } from '@korus-dev/multi-agent-sdk';
import { ElectronAttachmentRegistry, registerNativeIpc } from '@korus-dev/agent-ui-sdk/electron';
import { toHarnessPromptOptions } from '@korus-dev/agent-ui-sdk/host';

const harness = createHarness('codex', { client: { name: 'my-agent-app', version: '1.0.0' } });
const session = harness.open({ id: 'main', folder: process.cwd() });
const attachments = new ElectronAttachmentRegistry();

// Native file picker, clipboard, external links and dictation for the composer.
registerNativeIpc({ clipboard, dialog, ipcMain, shell }, {}, attachments);

let window: BrowserWindow | null = null;
harness.onEvent(event => {
  if (event.type === 'session.changed' && event.session === session) {
    window?.webContents.send('session:changed', event.state);
  }
});

ipcMain.handle('session:read', async () => ({
  state: harness.readSession(session),
  capabilities: harness.getCapabilities(session),
  models: await harness.listModels(session).catch(() => []),
}));
ipcMain.handle('session:prompt', async (_event, prompt: string, options) => {
  await harness.sendPrompt(session, prompt, toHarnessPromptOptions(options, attachment => attachments.resolve(attachment)));
});
ipcMain.handle('session:interrupt', () => harness.interrupt(session, harness.readSession(session).activeTurnId ?? undefined));
ipcMain.handle('session:respond', (_event, response) => harness.respondToRequest(session, response));

app.whenReady().then(async () => {
  window = new BrowserWindow({
    width: 1100,
    height: 760,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await window.loadFile(path.join(import.meta.dirname, '../renderer/index.html'));
});
app.on('window-all-closed', () => app.quit());
```

`toHarnessPromptOptions` translates the pane's options at the trusted boundary. Attachments arrive as opaque references, so the host supplies a resolver; the registry turns a reference back into the file the user picked.

## 2. Expose a narrow bridge

The preload script exposes the session operations and the SDK's native capabilities, and nothing else.

```ts
// electron/preload.ts (bundle to preload.cjs)
import { contextBridge, ipcRenderer } from 'electron';
import { exposeNativeRendererApi } from '@korus-dev/agent-ui-sdk/electron/preload';

contextBridge.exposeInMainWorld('bridge', {
  read: () => ipcRenderer.invoke('session:read'),
  sendPrompt: (prompt: string, options?: unknown) => ipcRenderer.invoke('session:prompt', prompt, options),
  interrupt: () => ipcRenderer.invoke('session:interrupt'),
  respondToRequest: (response: unknown) => ipcRenderer.invoke('session:respond', response),
  subscribe(listener: (state: unknown) => void) {
    const receive = (_event: unknown, state: unknown) => listener(state);
    ipcRenderer.on('session:changed', receive);
    return () => ipcRenderer.removeListener('session:changed', receive);
  },
});
exposeNativeRendererApi(contextBridge, ipcRenderer);
```

Electron's sandbox cannot load an ESM preload directly. Bundle the preload to CommonJS and keep `electron` external. See the [Electron host guide](/guide/electron#preload-format).

## 3. Render the pane

First, give the renderer a typed handle on what the preload exposed. Every example in these docs imports `bridge` from this module:

```ts
// src/bridge.ts
import type { HarnessCapabilities, ModelOption, SessionState } from '@korus-dev/multi-agent-sdk';
import type { SessionConversationClient } from '@korus-dev/agent-ui-sdk';

/** The shape preload.ts exposes as window.bridge. */
export type SessionBridge = Required<Pick<SessionConversationClient, 'sendPrompt' | 'interrupt' | 'respondToRequest'>> & {
  read(): Promise<{ state: SessionState; capabilities: HarnessCapabilities; models: ModelOption[] }>;
  subscribe(listener: (state: SessionState) => void): () => void;
};

declare global {
  interface Window { bridge: SessionBridge }
}

export const bridge = window.bridge;
```

Because its operations match `SessionConversationClient`, the bridge can be passed to the session binding as the `client` as is.

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue';
import { ConversationPane, createSessionConversationController } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
import { bridge } from './bridge';

const initial = await bridge.read();
const state = shallowRef(initial.state);
const off = bridge.subscribe(next => { state.value = next; });

const binding = createSessionConversationController({
  conversationKey: 'main',
  state,
  capabilities: () => initial.capabilities,
  controls: () => ({ models: initial.models }),
  client: bridge,
});
onBeforeUnmount(() => { off(); binding.dispose(); });
</script>

<template>
  <div class="app">
    <ConversationPane :controller="binding.controller" autofocus />
  </div>
</template>

<style>
html, body, #app, .app { height: 100%; margin: 0; }
</style>
```

Give the pane a container with a definite height; it fills the space and scrolls its own transcript. Operations you do not provide reject if invoked, so only advertise capabilities that the host connects. The pane hides controls the capabilities do not support.

::: tip Top-level await
`<script setup>` with top-level `await` needs a `<Suspense>` boundary around `App`. Alternatively, load the session in `onMounted` and render the pane once it arrives.
:::

## 4. Go further

- Persist model, reasoning and plan-mode choices with [`controls`](/guide/session-binding#controls).
- Resume past conversations and provide history loading. See [History and performance](/guide/history) and the Basic sample's service.
- List the harness's permissions in the composer menu with [`setPermission`](/guide/session-binding#permissions).
- Add goals, steering, turn editing and retry by connecting the matching [client operations](/guide/session-binding#client-operations).
- Customize with [presentation flags](/guide/presentation), [slots](/guide/conversation-pane#slots) and [theme tokens](/guide/presentation#theme-tokens).
- Harden the host with the [security boundary](/guide/security) checklist and [window policy](/guide/electron#window-policy).
