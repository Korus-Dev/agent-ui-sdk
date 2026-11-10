export {
  exposeCodexElectronPreload,
  type CodexElectronRendererApis,
} from './codex-electron-preload';
export {
  createCodexNativeRendererApi,
  exposeCodexNativeRendererApi,
  type CodexContextBridge,
} from './codex-native-renderer';
export {
  createCodexSurfaceRendererApi,
} from './codex-surface-ipc';
export {
  TypedIpcRenderer,
  type IpcRendererPort,
  type IpcRequest,
  type IpcRequestArguments,
  type IpcRequestResult,
} from './typed-ipc';
export type {
  CodexNativeRendererApi,
} from '@korus-dev/agent-ui-sdk/host.js';
export type {
  CodexSurfaceRendererApi,
} from '@korus-dev/multi-agent-sdk';

// Neutral public vocabulary; legacy names remain compatible.
export { exposeCodexElectronPreload as exposeElectronPreload, type CodexElectronRendererApis as ElectronRendererApis } from './codex-electron-preload';
export { createCodexNativeRendererApi as createNativeRendererApi, exposeCodexNativeRendererApi as exposeNativeRendererApi, type CodexContextBridge as ContextBridge } from './codex-native-renderer';
export { createCodexSurfaceRendererApi as createSurfaceRendererApi } from './codex-surface-ipc';
export type { CodexNativeRendererApi as NativeRendererApi } from '@korus-dev/agent-ui-sdk/host.js';
export type { CodexSurfaceRendererApi as SurfaceRendererApi } from '@korus-dev/multi-agent-sdk';
