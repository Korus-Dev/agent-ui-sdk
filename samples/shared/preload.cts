import { contextBridge, ipcRenderer } from 'electron';
import { exposeNativeRendererApi } from '@korus-dev/agent-ui-sdk/electron/preload.js';
exposeNativeRendererApi(contextBridge, ipcRenderer);
contextBridge.exposeInMainWorld('sample', {
  snapshot: () => ipcRenderer.invoke('sample:snapshot'),
  call: (method: string, ...args: unknown[]) => ipcRenderer.invoke('sample:call', method, args),
  subscribe: (listener: (value: unknown) => void) => { const receive = (_event: unknown, value: unknown) => listener(value); ipcRenderer.on('sample:changed', receive); return () => ipcRenderer.removeListener('sample:changed', receive); },
});
