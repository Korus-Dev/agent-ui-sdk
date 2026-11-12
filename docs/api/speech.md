# Speech

Trusted-process dictation from `@korus-dev/agent-ui-sdk/speech`. These helpers use Node APIs and credentials, so keep them out of renderer code. The renderer reaches them through the [Electron bridge](/api/electron) or your own transport. See [Native capabilities](/guide/native-capabilities#speech) for how dictation fits together.

All sessions consume **mono Float32 little-endian PCM**, delivered once in capture order. A transcript event carries the full current transcript (`finalText` and `partialText`), not a delta.

## Apple SpeechAnalyzer

Requires macOS 26 or later. The helper is a packaged universal binary under `assets/`, built from `native/apple-speech.swift`.

### startAppleSpeechSession

```ts
function startAppleSpeechSession(
  options: SpeechSessionOptions,                         // { sessionId, locale?, sampleRate }
  onEvent: (event: SpeechSessionEvent) => void,
  dependencies?: {
    assetsPath?: string;
    signal?: AbortSignal;
    spawn?: (command: string, args: string[]) => ChildProcessWithoutNullStreams;
  },
): Promise<AppleSpeechSession>;

type AppleSpeechSession = {
  append(audio: ArrayBuffer): Promise<void>;
  stop(): Promise<SpeechTranscriptionResult>;
  cancel(): Promise<void>;
};
```

The sample rate must be an integer from 8,000 to 96,000 Hz. The helper is copied to a private temporary directory, started in streaming mode, and removed when the session ends. Startup times out after two minutes.

### transcribeWithAppleSpeechAnalyzer

```ts
function transcribeWithAppleSpeechAnalyzer(
  audioData: Buffer,
  options?: { locale?: string; live?: boolean },
  deps?: { assetsPath?: string; /* test seams */ },
): Promise<{ text: string; error?: string }>;
```

Batch transcription of a WAV buffer. It never throws for a transcription failure: errors come back in `error` with empty `text`.

### resolveAppleSpeechAnalyzerPath

```ts
function resolveAppleSpeechAnalyzerPath(assetsPath?: string, dependencies?: AppleSpeechAssetDiscoveryDependencies): string;
```

Returns the path of `apple-speechanalyzer-cli` inside `assetsPath`. Without one, discovery checks an assets-path environment override, the Electron resources directory (including unpacked ASAR locations), then the installed package. Pass `appleSpeechAssetsPath` to `registerNativeIpc` when your packaging moves the assets.

## OpenAI realtime transcription

```ts
function startOpenAISpeechSession(
  input: SpeechSessionOptions,
  onEvent: (event: SpeechSessionEvent) => void,
  configuration: OpenAISpeechSessionConfiguration,
): Promise<OpenAISpeechSession>;

function prepareOpenAISpeechSession(
  input: SpeechPreparationOptions,
  onEvent: (event: SpeechSessionEvent) => void,
  configuration: OpenAISpeechSessionConfiguration,
): Promise<PreparedSpeechSession>;
```

`prepareOpenAISpeechSession` connects without knowing the microphone's sample rate and accepts no audio yet; call `start(sampleRate)` on the result when capture begins. This hides connection latency behind microphone setup.

```ts
type OpenAISpeechSessionConfiguration = {
  apiKey: string;           // supplied by the trusted host; never send through renderer IPC
  signal?: AbortSignal;
  model?: string;           // defaults to 'gpt-live-transcribe'
  createWebSocket?: (url: string, options: { headers: { Authorization: string } }) => OpenAISpeechSocket;
};
```

A missing API key or an empty model throws. `createWebSocket` lets you supply a transport or a test server; `OpenAISpeechSocket` is the minimal contract it must satisfy, so consumers do not need `ws` types.

## Wiring a provider into the Electron bridge

```ts
registerNativeIpc(deps, {
  prepareSpeechSession: (input, onEvent, { signal }) =>
    prepareOpenAISpeechSession(input, onEvent, { apiKey: secrets.openai, signal }),
  isTrustedSender: event => isRendererSender(event, rendererUrl),
});
```

Without `prepareSpeechSession`, the bridge starts Apple sessions. The bridge enforces one bounded recording per renderer and ends it if the frame is destroyed or navigates.

## Types

`AppleSpeechSession`, `AppleSpeechTranscriptionOptions`, `AppleSpeechTranscriptionResult`, `AppleSpeechAssetDiscoveryDependencies`, `OpenAISpeechSession`, `OpenAISpeechData`, `OpenAISpeechSocket` and `OpenAISpeechSessionConfiguration`. Shared contracts (`SpeechSessionEvent`, `SpeechSessionOptions`, `PreparedSpeechSession`, …) are in [Host capabilities](/api/host#speech).
