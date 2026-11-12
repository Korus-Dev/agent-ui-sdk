# Host capabilities

Renderer-safe contracts from `@korus-dev/agent-ui-sdk/host`. They are types plus two pure helpers, so the entry is safe to import from a renderer, a main process or a server. For behavior and patterns, see [Native capabilities](/guide/native-capabilities).

## HostCapabilities

```ts
type HostCapabilities = {
  capabilities: {
    attachments: boolean;
    clipboard: boolean;
    externalLinks: boolean;
    transcription: boolean;
  };
  streamingTranscription?: StreamingTranscription;   // absent when only batch transcription exists
  pickAttachments(): Promise<HostAttachment[]>;
  ingestAttachments(files: readonly HostAttachmentInput[]): Promise<HostAttachment[]>;
  copyToClipboard(content: NativeClipboardContent): Promise<void>;
  openExternal(href: string): Promise<void>;
  readImagePreview?(reference: string): Promise<string | null>;
  transcribeAudio(audioData: ArrayBuffer, options?: { locale?: string; live?: boolean }): Promise<SpeechTranscriptionResult>;
};
```

`NativeRendererApi` is an alias. `nativeRendererGlobal` is the global name, `'agentUiHostCapabilities'`.

## Attachments

```ts
type HostAttachment = {
  id: string;
  type: 'file' | 'image';
  reference: string;       // opaque host capability, never a filesystem path
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
};

type HostAttachmentInput = { name: string; mimeType?: string; data: ArrayBuffer };
type NativeClipboardContent = { text: string; html?: string };
```

`NativeAttachment` and `NativeAttachmentInput` are aliases.

## Speech

```ts
type SpeechTranscriptionResult = { text: string; error?: string };

/** Full replacement of the current transcript, not an append-only delta. */
type SpeechTranscript = { finalText: string; partialText: string };

type SpeechPreparationOptions = { sessionId: string; locale?: string };
type SpeechSessionOptions = SpeechPreparationOptions & { sampleRate: number };

type SpeechSessionEvent =
  | ({ type: 'transcript'; sessionId: string } & SpeechTranscript)
  | { type: 'error'; sessionId: string; error: string };

/** Mono Float32 little-endian PCM, sent once in capture order. Stop drains final results. */
type StreamingTranscription = {
  prepare?(options: SpeechPreparationOptions): Promise<void>;
  start(options: SpeechSessionOptions): Promise<void>;
  append(sessionId: string, audio: ArrayBuffer): Promise<void>;
  stop(sessionId: string): Promise<SpeechTranscriptionResult>;
  cancel(sessionId: string): Promise<void>;
  onEvent(listener: (event: SpeechSessionEvent) => void): () => void;
};
```

Trusted-process helpers use these two shapes:

```ts
type SpeechSession = {
  append(audio: ArrayBuffer): Promise<void>;
  stop(): Promise<SpeechTranscriptionResult>;
  cancel(): Promise<void>;
};

/** Preparation owns resources until activation at the real capture sample rate. */
type PreparedSpeechSession = {
  start(sampleRate: number): Promise<SpeechSession>;
  cancel(): Promise<void>;
};
```

## Functions

| Export | Purpose |
| --- | --- |
| `toHarnessPromptOptions(options?, resolveAttachment?)` | Translate pane prompt options into harness `PromptOptions`. See [session](/api/session#toharnesspromptoptions) |
| `conversationImageInput(reference)` | Parse a `conversation-image:` reference |
| `readEmbeddedConversationImage(reference, read)` | Read bounded content and return an image URL |

## Renderer helpers

The root entry provides the scoped access to host capabilities:

| Export | Purpose |
| --- | --- |
| `provideHostCapabilities(capabilities, options?)` | Provide capabilities to a subtree. `options.imagePreviewBudgetBytes` bounds the preview pool |
| `useHostCapabilities()` | Nearest provider, falling back to the global |
| `getGlobalHostCapabilities()` | `window.agentUiHostCapabilities`, or `undefined` |
| `pickAttachments(override?, capabilities?)` | Pick through an override or the capability; returns `[]` when unavailable |
| `ingestAttachments(files, override?, capabilities?)` | Read `File`s to `HostAttachmentInput` and ingest them |
| `AttachmentPicker`, `AttachmentIngester` | The function types |
