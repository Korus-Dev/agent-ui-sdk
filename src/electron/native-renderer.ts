import type {
  NativeAttachment,
  NativeAttachmentInput,
  NativeClipboardContent,
  NativeRendererApi,
  SpeechTranscriptionResult,
  SpeechSessionOptions,
  SpeechPreparationOptions,
  SpeechSessionEvent,
} from '@korus-dev/agent-ui-sdk/host';
import {
  TypedIpcRenderer,
  type IpcRendererPort,
  type IpcRequest,
} from './typed-ipc';

export const nativeChannels = {
  copyToClipboard: 'agent-ui-native:copy-to-clipboard',
  ingestAttachments: 'agent-ui-native:ingest-attachments',
  openExternal: 'agent-ui-native:open-external',
  pickAttachments: 'agent-ui-native:pick-attachments',
  readImagePreview: 'agent-ui-native:read-image-preview',
  transcribeAudio: 'agent-ui-native:transcribe-audio',
  prepareSpeech: 'agent-ui-native:prepare-speech',
  startSpeech: 'agent-ui-native:start-speech',
  appendSpeech: 'agent-ui-native:append-speech',
  stopSpeech: 'agent-ui-native:stop-speech',
  cancelSpeech: 'agent-ui-native:cancel-speech',
} as const;
export const speechEventChannel = 'agent-ui-native:speech-event';

export type NativeRequests = {
  [nativeChannels.prepareSpeech]: IpcRequest<[options: SpeechPreparationOptions], void>;
  [nativeChannels.startSpeech]: IpcRequest<[options: SpeechSessionOptions], void>;
  [nativeChannels.appendSpeech]: IpcRequest<[sessionId: string, audio: ArrayBuffer], void>;
  [nativeChannels.stopSpeech]: IpcRequest<[sessionId: string], SpeechTranscriptionResult>;
  [nativeChannels.cancelSpeech]: IpcRequest<[sessionId: string], void>;
  [nativeChannels.copyToClipboard]: IpcRequest<[content: NativeClipboardContent], void>;
  [nativeChannels.ingestAttachments]: IpcRequest<[
    files: readonly NativeAttachmentInput[],
  ], NativeAttachment[]>;
  [nativeChannels.openExternal]: IpcRequest<[href: string], void>;
  [nativeChannels.pickAttachments]: IpcRequest<[], NativeAttachment[]>;
  [nativeChannels.readImagePreview]: IpcRequest<[path: string], string | null>;
  [nativeChannels.transcribeAudio]: IpcRequest<[
    audioData: ArrayBuffer,
    options?: { locale?: string; live?: boolean },
  ], SpeechTranscriptionResult>;
};

export type ContextBridge = {
  exposeInMainWorld(key: string, api: unknown): void;
};

export function createNativeRendererApi(
  port: IpcRendererPort,
  options: { transcription?: boolean; streamingTranscription?: boolean; speechPreparation?: boolean } = {},
): NativeRendererApi {
  const renderer = new TypedIpcRenderer<NativeRequests, { [speechEventChannel]: SpeechSessionEvent }>(port);
  const transcription = options.transcription ?? process.platform === 'darwin';
  return {
    capabilities: {
      attachments: true,
      clipboard: true,
      externalLinks: true,
      transcription,
    },
    ...(transcription && (options.streamingTranscription ?? process.platform === 'darwin') ? {
      streamingTranscription: {
        ...(options.speechPreparation ? { prepare: (input: SpeechPreparationOptions) => renderer.invoke(nativeChannels.prepareSpeech, input) } : {}),
        start: (input: SpeechSessionOptions) => renderer.invoke(nativeChannels.startSpeech, input),
        append: (id: string, audio: ArrayBuffer) => renderer.invoke(nativeChannels.appendSpeech, id, audio),
        stop: (id: string) => renderer.invoke(nativeChannels.stopSpeech, id),
        cancel: (id: string) => renderer.invoke(nativeChannels.cancelSpeech, id),
        onEvent: (listener: (event: SpeechSessionEvent) => void) => renderer.on(speechEventChannel, listener),
      },
    } : {}),
    copyToClipboard: (content) => renderer.invoke(nativeChannels.copyToClipboard, content),
    ingestAttachments: (files) => renderer.invoke(nativeChannels.ingestAttachments, files),
    openExternal: (href) => renderer.invoke(nativeChannels.openExternal, href),
    pickAttachments: () => renderer.invoke(nativeChannels.pickAttachments),
    readImagePreview: (path) => renderer.invoke(nativeChannels.readImagePreview, path),
    transcribeAudio: (audioData, transcriptionOptions) => (
      renderer.invoke(nativeChannels.transcribeAudio, audioData, transcriptionOptions)
    ),
  };
}

export function exposeNativeRendererApi(
  contextBridge: ContextBridge,
  port: IpcRendererPort,
  options?: { transcription?: boolean; streamingTranscription?: boolean; speechPreparation?: boolean },
): NativeRendererApi {
  const api = createNativeRendererApi(port, options);
  contextBridge.exposeInMainWorld('agentUiHostCapabilities', api);
  return api;
}
