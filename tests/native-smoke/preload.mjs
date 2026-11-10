import { contextBridge, ipcRenderer } from 'electron';
import { exposeElectronPreload } from '@korus-dev/agent-ui-sdk/electron/preload.js';

exposeElectronPreload(contextBridge, ipcRenderer);
