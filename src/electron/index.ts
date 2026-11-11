export {
  connectIpcEventsToBus,
  registerIpcMainHandlers,
  sendIpcEvent,
  TypedIpcMain,
  TypedIpcRenderer,
  type IpcEventSender,
  type IpcMainHandlers,
  type IpcMainPort,
  type IpcRendererPort,
  type IpcRequest,
  type IpcRequestArguments,
  type IpcRequestResult,
  type IpcSenderPolicy,
} from './typed-ipc';
export {
  externalUrl,
  installWindowPolicy,
  isRendererSender,
  isRendererUrl,
  type WindowPolicyOptions,
  type WindowPolicyTarget,
} from './window-policy';
export {
  createNativeRendererApi,
  exposeNativeRendererApi,
  type ContextBridge,
} from './native-renderer';
export {
  registerNativeIpc,
  type NativeClipboard,
  type NativeDialog,
  type NativeMainDependencies,
  type NativeMainOptions,
  type NativeShell,
} from './native-ipc';
export type {
  SpeechOperation,
  SpeechOperationOutcome,
  SpeechOperationObserver,
  SpeechSessionPreparer,
} from './speech-sessions';
export {
  ElectronAttachmentRegistry,
  type ElectronAttachmentRegistration,
} from './attachment-registry';
export type {
  HostAttachment,
  HostAttachmentInput,
  NativeAttachment,
  NativeAttachmentInput,
  NativeClipboardContent,
  NativeRendererApi,
  SpeechTranscriptionResult,
  SpeechPreparationOptions,
  PreparedSpeechSession,
  SpeechSession,
} from '@korus-dev/agent-ui-sdk/host';
export {
  startAppleSpeechSession,
  startOpenAISpeechSession,
  prepareOpenAISpeechSession,
  type AppleSpeechSession,
  type OpenAISpeechSession,
  type OpenAISpeechSessionConfiguration,
  type OpenAISpeechSocket,
  type OpenAISpeechData,
} from '../speech';
