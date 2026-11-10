import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron';
import { registerElectronMain } from '@korus-dev/agent-ui-sdk/electron.js';
import path from 'node:path';

app.setPath('userData', path.join(import.meta.dirname, 'profile'));
app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Electron ESM preloads require an unsandboxed preload.
    },
  });
  window.webContents.on('preload-error', (_event, file, error) => {
    console.error(`Preload failed: ${file}`, error);
    app.exit(1);
  });

  const dispose = registerElectronMain({
    clipboard, dialog, ipcMain, shell,
    sender: window.webContents,
    isTrustedSender: event => event.sender === window.webContents,
    surface: {
      getSnapshot: () => ({ smoke: 'packaged-sdk', connected: true }),
      onStateChange: () => () => {},
      onEvent: () => () => {},
    },
  });
  app.on('before-quit', dispose);
  await window.loadFile(path.join(import.meta.dirname, 'index.html'));
}).catch(error => {
  console.error(error);
  app.exit(1);
});
