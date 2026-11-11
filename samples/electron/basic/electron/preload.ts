import { contextBridge, ipcRenderer } from 'electron';
import { exposeNativeRendererApi } from '@korus-dev/agent-ui-sdk/electron/preload';
import type { ChatStateEvent, SampleApi } from '../shared/api';

const api: SampleApi = {
  status: () => ipcRenderer.invoke('status'),
  chats: () => ipcRenderer.invoke('chats'),
  newChat: () => ipcRenderer.invoke('newChat'),
  chat: id => ipcRenderer.invoke('chat', id),
  prompt: (id, prompt, options) => ipcRenderer.invoke('prompt', id, prompt, options),
  call: (id, method, ...args) => ipcRenderer.invoke('call', id, method, ...args),
  onChatState(listener) {
    const handler = (_event: unknown, payload: ChatStateEvent) => listener(payload);
    ipcRenderer.on('chat:state', handler);
    return () => ipcRenderer.off('chat:state', handler);
  },
};
contextBridge.exposeInMainWorld('sampleApi', api);
// Native file picker, clipboard and external links for the SDK composer.
exposeNativeRendererApi(contextBridge, ipcRenderer);
