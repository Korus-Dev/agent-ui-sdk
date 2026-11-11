import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron';
import { ElectronAttachmentRegistry, registerNativeIpc } from '@korus-dev/agent-ui-sdk/electron';
import fs from 'node:fs';
import { parseSampleLaunchArgs } from '../../../shared/launch-options';
import path from 'node:path';
import { createChatService, type ChatRecord } from './service';
import type { ChatOperation } from '../shared/api';

const { backend } = parseSampleLaunchArgs(['basic', '--backend', process.env.SAMPLE_BACKEND ?? 'codex']);
const folder = process.env.SAMPLE_FOLDER ?? process.cwd();
const devUrl = process.env.VITE_DEV_SERVER_URL;
let window: BrowserWindow | null = null;

const storeFile = path.join(app.getPath('userData'), backend === 'codex' ? 'chats.json' : `chats-${backend}.json`);
const store = {
  load: (): ChatRecord[] => { try { return JSON.parse(fs.readFileSync(storeFile, 'utf8')); } catch { return []; } },
  save: (records: ChatRecord[]) => { fs.mkdirSync(path.dirname(storeFile), { recursive: true }); fs.writeFileSync(storeFile, JSON.stringify(records, null, 2)); },
};
const attachments = new ElectronAttachmentRegistry();
registerNativeIpc({ clipboard, dialog, ipcMain, shell }, {}, attachments);
const service = createChatService(folder, store, attachment => attachments.resolve(attachment), event => window?.webContents.send('chat:state', event), backend);
const { api } = service;

ipcMain.handle('status', () => api.status());
ipcMain.handle('chats', () => api.chats());
ipcMain.handle('newChat', () => api.newChat());
ipcMain.handle('chat', (_event, id: string) => api.chat(id));
ipcMain.handle('prompt', (_event, id: string, prompt: string, options) => api.prompt(id, prompt, options));
ipcMain.handle('call', (_event, id: string, method: ChatOperation, ...args: unknown[]) => (api.call as (...values: unknown[]) => Promise<unknown>)(id, method, ...args));

async function createWindow() {
  window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Agent Sample App',
    webPreferences: { preload: path.join(import.meta.dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  if (devUrl) await window.loadURL(devUrl);
  else await window.loadFile(path.join(import.meta.dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
let closing = false;
app.on('before-quit', event => {
  if (closing) return;
  closing = true;
  event.preventDefault();
  void service.close().finally(() => app.exit(0));
});
