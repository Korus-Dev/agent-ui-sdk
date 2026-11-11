export type SpeechTranscriptionResult = {
  text: string;
  error?: string;
};

/** Full replacement of the current transcript, not an append-only word delta. */
export type SpeechTranscript = { finalText: string; partialText: string };
export type SpeechPreparationOptions = { sessionId: string; locale?: string };
export type SpeechSessionOptions = SpeechPreparationOptions & { sampleRate: number };
/** Trusted-process session; PCM is delivered only after startup completes. */
export type SpeechSession = {
  append(audio: ArrayBuffer): Promise<void>;
  stop(): Promise<SpeechTranscriptionResult>;
  cancel(): Promise<void>;
};
/** Preparation owns resources until activation at the actual capture sample rate. */
export type PreparedSpeechSession = {
  start(sampleRate: number): Promise<SpeechSession>;
  cancel(): Promise<void>;
};
export type SpeechSessionEvent =
  | ({ type: 'transcript'; sessionId: string } & SpeechTranscript)
  | { type: 'error'; sessionId: string; error: string };

/** Mono Float32 little-endian PCM, sent once in capture order. Stop drains final results. */
export type StreamingTranscription = {
  /** Optional connection preparation, safe to run concurrently with microphone setup. */
  prepare?(options: SpeechPreparationOptions): Promise<void>;
  start(options: SpeechSessionOptions): Promise<void>;
  append(sessionId: string, audio: ArrayBuffer): Promise<void>;
  stop(sessionId: string): Promise<SpeechTranscriptionResult>;
  cancel(sessionId: string): Promise<void>;
  onEvent(listener: (event: SpeechSessionEvent) => void): () => void;
};

/** Renderer-safe attachment metadata. `reference` is an opaque host capability, never a filesystem path. */
export type HostAttachment = {
  id: string;
  type: 'file' | 'image';
  reference: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
};

export type HostAttachmentInput = {
  name: string;
  mimeType?: string;
  data: ArrayBuffer;
};

export type NativeAttachment = HostAttachment;
export type NativeAttachmentInput = HostAttachmentInput;

export type NativeClipboardContent = {
  text: string;
  html?: string;
};

export type HostCapabilities = {
  /** Absent when only batch transcription is available. */
  streamingTranscription?: StreamingTranscription;
  capabilities: {
    attachments: boolean;
    clipboard: boolean;
    externalLinks: boolean;
    transcription: boolean;
  };
  copyToClipboard(content: NativeClipboardContent): Promise<void>;
  ingestAttachments(files: readonly HostAttachmentInput[]): Promise<HostAttachment[]>;
  openExternal(href: string): Promise<void>;
  pickAttachments(): Promise<HostAttachment[]>;
  readImagePreview?(reference: string): Promise<string | null>;
  transcribeAudio(
    audioData: ArrayBuffer,
    options?: { locale?: string; live?: boolean },
  ): Promise<SpeechTranscriptionResult>;
};

export type NativeRendererApi = HostCapabilities;

export const nativeRendererGlobal = 'agentUiHostCapabilities';



export { toHarnessPromptOptions } from './session-prompt-options';

export { conversationImageInput, readEmbeddedConversationImage } from './conversation-images';
