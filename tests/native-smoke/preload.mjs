import { contextBridge, ipcRenderer } from 'electron';
import { exposeNativeRendererApi, TypedIpcRenderer } from '@korus-dev/agent-ui-sdk/electron/preload';
exposeNativeRendererApi(contextBridge, ipcRenderer);
const bridge = new TypedIpcRenderer(ipcRenderer);
contextBridge.exposeInMainWorld('smoke', { snapshot: () => bridge.invoke('smoke:snapshot') });
