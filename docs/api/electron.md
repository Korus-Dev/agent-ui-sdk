# Electron

Trusted adapters for desktop hosts. Import `/electron` in the main process and `/electron/preload` in the preload script. Never import them from renderer code. For setup, see the [Electron host guide](/guide/electron).

## Main process: `/electron`

### registerNativeIpc

```ts
function registerNativeIpc(
  dependencies: NativeMainDependencies,
  options?: NativeMainOptions,
  attachments?: ElectronAttachmentRegistry,
): () => void;
```

Installs validated handlers for attachments, clipboard, external links, image previews, batch transcription and streaming speech. Returns a function that unregisters the handlers, stops speech sessions and clears the registry.

```ts
type NativeMainDependencies = {
  clipboard: { write(content: { html?: string; text: string }): void };
  dialog: { showOpenDialog(options): Promise<{ canceled: boolean; filePaths: string[] }> };
  ipcMain: IpcMainPort;
  shell: { openExternal(href: string): Promise<void> };
};

type NativeMainOptions = IpcSenderPolicy & {
  maxAttachmentBytes?: number;        // default 25 MiB
  maxTotalAttachmentBytes?: number;   // default 100 MiB
  maxAudioBytes?: number;             // default 25 MiB
  maxImagePreviewBytes?: number;      // default 8 MiB
  appleSpeechAssetsPath?: string;
  startSpeechSession?: typeof startAppleSpeechSession;
  prepareSpeechSession?: SpeechSessionPreparer;
  onSpeechOperation?: SpeechOperationObserver;
  transcribeAudio?: (audio: Buffer, options?: AppleSpeechTranscriptionOptions) => Promise<AppleSpeechTranscriptionResult>;
};
```

Byte limits must be positive. Up to 20 attachments are accepted per call.

`SpeechOperation` is `'start' | 'stop' | 'cancel'` and `SpeechOperationOutcome` is `'succeeded' | 'failed' | 'cancelled'`. A `SpeechOperationObserver` receives the operation and may return a function that receives the outcome; it never receives audio or identity.

### ElectronAttachmentRegistry

```ts
class ElectronAttachmentRegistry {
  register(input: ElectronAttachmentRegistration): HostAttachment;
  resolve(attachment: PromptReferenceAttachment): PromptAttachment;
  path(reference: string): string;
  clear(): void;
}
```

References look like `electron-attachment:<uuid>` and are scoped to one integration. `resolve` checks the reference and its type and returns the trusted `PromptOptions` attachment, and `path` returns the stored file path for trusted reads.

### Window policy

```ts
function installWindowPolicy(webContents: WindowPolicyTarget, options: { rendererUrl: string; openExternal(url: string): Promise<void> | void }): void;
function isRendererSender(event: unknown, rendererUrl: string): boolean;
function isRendererUrl(url: string | null | undefined, rendererUrl: string): boolean;
function externalUrl(value: string): string | null;
```

`installWindowPolicy` denies new windows and navigations away from the renderer, opening safe external URLs in the system browser. `isRendererSender` is the predicate for `isTrustedSender`: it accepts only the main frame of a window showing the renderer. `externalUrl` returns a normalized `http`, `https`, `mailto` or `tel` URL, otherwise `null`.

### Typed IPC

| Export | Purpose |
| --- | --- |
| `IpcRequest<Args, Result>` | Describes one request channel |
| `IpcRequestArguments<R>`, `IpcRequestResult<R>` | Extract argument and result types |
| `TypedIpcMain<Requests>` | Typed `handle`, with `dispose()` |
| `TypedIpcRenderer<Requests, Events>` | Typed `invoke` and `on` |
| `registerIpcMainHandlers(port, handlers, policy?)` | Register handlers; applies `isTrustedSender` before each. Returns an unregister function |
| `sendIpcEvent(sender, channel, payload)` | Send a typed event |
| `connectIpcEventsToBus(renderer, bus, channels)` | Forward events into a typed event bus |
| `IpcMainPort`, `IpcRendererPort`, `IpcEventSender`, `IpcMainHandlers`, `IpcSenderPolicy` | Port and policy types |

`IpcSenderPolicy` is `{ isTrustedSender?(event: unknown): boolean }`. A rejected call throws `Rejected <channel> from an untrusted sender` before the handler runs.

### Re-exports

The entry also re-exports the `/host` types and the speech helpers `startAppleSpeechSession`, `startOpenAISpeechSession` and `prepareOpenAISpeechSession` with their types.

## Preload: `/electron/preload`

```ts
function exposeNativeRendererApi(
  contextBridge: { exposeInMainWorld(key: string, api: unknown): void },
  port: IpcRendererPort,
  options?: { transcription?: boolean; streamingTranscription?: boolean; speechPreparation?: boolean },
): NativeRendererApi;

function createNativeRendererApi(port: IpcRendererPort, options?): NativeRendererApi;
```

`exposeNativeRendererApi` exposes `window.agentUiHostCapabilities`. `createNativeRendererApi` returns the object without exposing it, for tests or custom bridges. Transcription and streaming transcription default to on when the platform is macOS. `speechPreparation` adds `streamingTranscription.prepare`.

Channels use the `agent-ui-native:` prefix (`copy-to-clipboard`, `ingest-attachments`, `open-external`, `pick-attachments`, `read-image-preview`, `transcribe-audio`, `prepare-speech`, `start-speech`, `append-speech`, `stop-speech`, `cancel-speech`), with speech events on `agent-ui-native:speech-event`.

The preload entry also exports `TypedIpcRenderer` and the IPC request types.

## Browser manager: `/electron/browser`

`BrowserPane` and `safePartitionName`. See [Browser](/api/browser#browserpane).
