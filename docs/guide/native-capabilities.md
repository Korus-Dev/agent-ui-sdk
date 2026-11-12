# Native capabilities

The root UI consumes renderer-safe **host capabilities** from `/host`. A capability is something only the host can do: pick a file, read the clipboard, open a link, record speech. Applications own native authorization, lifecycle, durable storage and retention.

## The contract

```ts
type HostCapabilities = {
  capabilities: {
    attachments: boolean;
    clipboard: boolean;
    externalLinks: boolean;
    transcription: boolean;
  };
  pickAttachments(): Promise<HostAttachment[]>;
  ingestAttachments(files: readonly HostAttachmentInput[]): Promise<HostAttachment[]>;
  copyToClipboard(content: { text: string; html?: string }): Promise<void>;
  openExternal(href: string): Promise<void>;
  readImagePreview?(reference: string): Promise<string | null>;
  transcribeAudio(audio: ArrayBuffer, options?: { locale?: string; live?: boolean }): Promise<SpeechTranscriptionResult>;
  streamingTranscription?: StreamingTranscription;
};
```

The pane reads it from `provideHostCapabilities` or `window.agentUiHostCapabilities`. Controls appear only for capabilities that are advertised: no `attachments`, no attach menu; no `transcription`, no microphone.

For one-off overrides, the pane also takes `pickAttachments`, `ingestAttachments` and `transcribeAudio` props.

## Attachments

```ts
type HostAttachment = {
  id: string;
  type: 'file' | 'image';
  reference: string;   // opaque host capability, never a path
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
};
```

The renderer holds `HostAttachment` records and sends their references back with a prompt. The host resolves a reference to a file in its trusted process. With Electron, `ElectronAttachmentRegistry` does this; other hosts implement the same shape.

- **Picking** uses `pickAttachments`; **dropping or pasting** a `File` is ingested through `ingestAttachments` as `HostAttachmentInput` (`name`, `mimeType`, `data`).
- **Image previews** are optional. Return a `data:` URL from `readImagePreview(reference)`, or `null`.
- **Prompt translation** uses `toHarnessPromptOptions(options, resolveAttachment)` from `/host`. Attachments without a resolver throw.

::: warning
Never treat a renderer-supplied path as permission to read a file. Applications own retention and durable attachment storage; temporary files are not a long-term store.
:::

## Clipboard and links

`copyToClipboard` receives plain text and optional HTML. `openExternal` receives only URLs the host has validated: the Electron adapter accepts `http`, `https`, `mailto` and `tel`.

## Speech

Dictation uses the host speech capability. Two shapes exist:

| Shape | Contract | Used for |
| --- | --- | --- |
| Batch | `transcribeAudio(audio, { locale })` returns `{ text, error? }` | Record, then transcribe |
| Streaming | `StreamingTranscription` | Live partial text, audio level and low latency |

Audio is mono Float32 little-endian PCM, delivered once in capture order. A streaming session is **prepared** (connect early), **started** at the real capture sample rate, fed with `append`, then `stop` drains the final transcript or `cancel` discards it. The transcript is a full replacement of the current text, not a word delta.

```ts
type StreamingTranscription = {
  prepare?(options: { sessionId: string; locale?: string }): Promise<void>;
  start(options: { sessionId: string; locale?: string; sampleRate: number }): Promise<void>;
  append(sessionId: string, audio: ArrayBuffer): Promise<void>;
  stop(sessionId: string): Promise<SpeechTranscriptionResult>;
  cancel(sessionId: string): Promise<void>;
  onEvent(listener: (event: SpeechSessionEvent) => void): () => void;
};
```

### Trusted speech sessions

`/speech` provides sessions for the trusted process:

| Function | Provider | Requirements |
| --- | --- | --- |
| `startAppleSpeechSession(options, onEvent, deps?)` | Apple SpeechAnalyzer through the packaged helper | macOS 26 or later |
| `transcribeWithAppleSpeechAnalyzer(audio, options?, deps?)` | Same, batch | macOS 26 or later |
| `startOpenAISpeechSession(options, onEvent, config)` | OpenAI Realtime transcription | An API key held by the host |
| `prepareOpenAISpeechSession(options, onEvent, config)` | Same, connect before the microphone is ready | An API key held by the host |

The Apple helper is a packaged universal binary under `assets/` with Swift source under `native/`. Rebuild it on macOS with Xcode 26 or later using `npm run build:apple-speech`. The OpenAI default model is `gpt-live-transcribe`; set `model` to change it.

Keep credentials and speech connections in the trusted host, never in renderer IPC, and release recording and session resources when the view closes. Provider realtime conversation protocols belong in the application host or Multi Agent SDK. See the [speech API](/api/speech).

## Non-Electron hosts

Nothing requires Electron. A web or custom desktop host implements `HostCapabilities` over its own transport, provides it with `provideHostCapabilities`, and keeps the same renderer code. Omit capabilities you cannot provide.

## Where the pieces fit

Conversation state, capabilities and actions reach the same `ConversationPane` through the neutral [session controller](/guide/session-binding). Provider-specific login, account and realtime operations belong in Multi Agent SDK or the application's host adapter.
