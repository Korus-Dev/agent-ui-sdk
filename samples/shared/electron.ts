import { app, BrowserWindow, ipcMain, shell, clipboard, dialog } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installWindowPolicy, isRendererSender, registerNativeIpc, ElectronAttachmentRegistry } from '@korus-dev/agent-ui-sdk/electron.js';
import { startRelayHost } from '../electron/relay/host';
import { createSampleHost } from './host';
import type { Commands } from './contracts';
async function launch() {
await app.whenReady();
const shape = process.env.SAMPLE_SHAPE ?? 'basic';
const renderer = pathToFileURL(path.resolve('dist-samples/renderer/index.html')).href;
const relay = shape === 'relay' ? await startRelayHost(path.join(app.getPath('userData'), 'relay-operations.json')) : undefined;
const attachments = new ElectronAttachmentRegistry();
const host = createSampleHost({ client: { name: `agent-ui-${shape}-sample`, version: '1' }, ...(shape === 'spark' ? { instructions: () => 'Explain clearly and concisely. Ask before making changes.' } : {})  , ...(relay ? { mcpServers: () => [relay.endpoint] } : {}) }, process.cwd(), undefined, relay, attachment => attachments.resolve(attachment));
const window = new BrowserWindow({ width: 1280, height: 860, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.resolve('dist-samples/main/preload.cjs') } });
installWindowPolicy(window.webContents, { rendererUrl: renderer, openExternal: url => shell.openExternal(url) });
const trusted = (event: unknown) => { if (!isRendererSender(event, renderer)) throw new Error('Untrusted renderer.'); };
const unregisterNative = registerNativeIpc({ ipcMain, shell, clipboard, dialog }, { isTrustedSender: event => isRendererSender(event, renderer) }, attachments);
ipcMain.handle('sample:snapshot', event => { trusted(event); return host.snapshot(); });
ipcMain.handle('sample:call', async (event, method: keyof Commands, args: Commands[keyof Commands]) => { trusted(event); if (!Array.isArray(args) || args.length > 4) throw new Error('Invalid arguments.'); const result = await host.call(method, ...args); return ['create', 'relaySnapshot', 'relayReset', 'content'].includes(method) ? result : null; });
const off = host.subscribe(snapshot => { if (!window.isDestroyed()) window.webContents.send('sample:changed', snapshot); });
await window.loadURL(`${renderer}?sample=${shape}`);
let closing = false;
app.on('before-quit', event => { if (closing) return; event.preventDefault(); closing = true; off(); unregisterNative(); attachments.clear(); ipcMain.removeHandler('sample:snapshot'); ipcMain.removeHandler('sample:call'); void host.close().then(() => relay?.close()).finally(() => app.quit()); });
app.on('window-all-closed', () => app.quit());

}
void launch().catch(error => { console.error(error); app.exit(1); });
