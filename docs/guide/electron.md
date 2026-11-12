# Electron host

The `/electron` and `/electron/preload` entries give a desktop host a validated bridge for the composer's native needs, and typed IPC helpers for your own session bridge. They never expose provider execution.

| Entry | Runs in | Provides |
| --- | --- | --- |
| `@korus-dev/agent-ui-sdk/electron` | Main process | `registerNativeIpc`, `installWindowPolicy`, `isRendererSender`, `ElectronAttachmentRegistry`, typed IPC |
| `@korus-dev/agent-ui-sdk/electron/preload` | Preload | `exposeNativeRendererApi`, `createNativeRendererApi`, `TypedIpcRenderer` |
| `@korus-dev/agent-ui-sdk/electron/browser` | Main process | `BrowserPane`, the guarded webview manager. See [browser panel](/guide/browser) |

## The three pieces

### Main process

```ts
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron';
import {
  ElectronAttachmentRegistry,
  installWindowPolicy,
  isRendererSender,
  registerNativeIpc,
} from '@korus-dev/agent-ui-sdk/electron';

const rendererUrl = pathToFileURL(path.resolve('dist/renderer/index.html')).href;
const attachments = new ElectronAttachmentRegistry();

const unregister = registerNativeIpc(
  { clipboard, dialog, ipcMain, shell },
  { isTrustedSender: event => isRendererSender(event, rendererUrl) },
  attachments,
);

const window = new BrowserWindow({
  webPreferences: {
    preload: path.resolve('dist/main/preload.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});
installWindowPolicy(window.webContents, { rendererUrl, openExternal: url => shell.openExternal(url) });
await window.loadURL(rendererUrl);

app.on('before-quit', () => { unregister(); attachments.clear(); });
```

`registerNativeIpc(dependencies, options?, registry?)` installs handlers for the composer's capabilities and returns a function that unregisters them, stops speech sessions and clears the registry. Dependencies are the Electron `clipboard`, `dialog`, `ipcMain` and `shell` objects, so the module stays testable.

| Option | Default | Purpose |
| --- | --- | --- |
| `isTrustedSender` | accept all | Reject IPC calls before the handler runs. Always set it |
| `maxAttachmentBytes` | 25 MiB | Per-attachment limit |
| `maxTotalAttachmentBytes` | 100 MiB | Per-call total limit |
| `maxAudioBytes` | 25 MiB | Recording limit |
| `maxImagePreviewBytes` | 8 MiB | Image preview limit |
| `appleSpeechAssetsPath` | packaged assets | Location of the Apple speech helper |
| `startSpeechSession`, `prepareSpeechSession` | Apple | Replace the streaming speech provider |
| `transcribeAudio` | Apple | Replace batch transcription |
| `onSpeechOperation` | none | Observe start, stop and cancel outcomes. Receives no audio or identity |

At most 20 attachments can be added in one call. The handlers validate every argument, and a rejected sender throws before any work happens.

### Preload

```ts
import { contextBridge, ipcRenderer } from 'electron';
import { exposeNativeRendererApi } from '@korus-dev/agent-ui-sdk/electron/preload';

exposeNativeRendererApi(contextBridge, ipcRenderer);
// Add your own, narrow session bridge with contextBridge.exposeInMainWorld(...)
```

This exposes `window.agentUiHostCapabilities` (a `HostCapabilities`, see [native capabilities](/guide/native-capabilities)) over `agent-ui-native:*` IPC channels. Transcription defaults to on for macOS, with streaming transcription and optional `speechPreparation`; pass an options object to change that.

### Renderer

Nothing to wire. The composer reads `window.agentUiHostCapabilities` automatically. To scope capabilities to a subtree or a test, use [`provideHostCapabilities`](/guide/vue-providers#host-capabilities).

## Preload format

The SDK ships ESM. Electron's sandbox cannot load an ESM preload directly. Choose one:

- **Bundle** the preload to a CommonJS file and keep `electron` external (recommended; works with `sandbox: true`). The samples bundle `preload.cts` this way.
- **Load the ESM entry** from a `.mjs` preload with `sandbox: false`, keeping `contextIsolation: true` and `nodeIntegration: false`.

## Window policy

Electron re-runs the preload script on every navigation, so any page a window reaches would receive your capability bridge. `installWindowPolicy` keeps a window on the app renderer:

- New windows are denied.
- Navigation away from the renderer is blocked. Safe external URLs (`http`, `https`, `mailto`, `tel`) open in the system browser instead.

`externalUrl(value)` normalizes a URL and returns `null` for anything else, `isRendererUrl(url, rendererUrl)` compares against a dev-server origin or a packaged `file:` document, and `isRendererSender(event, rendererUrl)` accepts only the main frame of a window showing the renderer. Use them for your own handlers.

## Typed IPC for your session bridge

Use the same helpers the native bridge uses to type your own channels:

```ts
import { registerIpcMainHandlers, sendIpcEvent, type IpcRequest } from '@korus-dev/agent-ui-sdk/electron';

type Requests = {
  'session:prompt': IpcRequest<[chatId: string, prompt: string], void>;
};

const unregister = registerIpcMainHandlers<Requests>(ipcMain, {
  'session:prompt': async (_event, chatId, prompt) => { await sessions.get(chatId)?.send(prompt); },
}, { isTrustedSender: event => isRendererSender(event, rendererUrl) });
```

`TypedIpcRenderer` is its renderer-side counterpart (`invoke`, `on`), and `connectIpcEventsToBus` forwards events into a typed event bus. Keep opaque driver handles in the main process; only plain data crosses IPC.

## Attachments

`ElectronAttachmentRegistry` keeps local paths out of the renderer. Picking or dropping a file registers its path and returns a `HostAttachment` with an opaque `electron-attachment:<uuid>` reference. When a prompt is sent, resolve the references in the main process:

```ts
const options = toHarnessPromptOptions(promptOptions, attachment => attachments.resolve(attachment));
```

`resolve` checks that the reference exists and that its type matches. Dropped or pasted file data is written to a private temporary directory (mode `0600`), and image previews are returned as bounded `data:` URLs (SVG is excluded).

## Packaged app checklist

- Bundle the preload and keep `electron` external.
- Set `isTrustedSender` for every `registerNativeIpc` and `registerIpcMainHandlers` call.
- Install the window policy on every window that loads the renderer.
- Keep `contextIsolation: true`, `nodeIntegration: false` and enable `sandbox` where your preload allows.
- Ship the Apple speech helper from `assets/` and sign it with your app if you enable macOS dictation.
