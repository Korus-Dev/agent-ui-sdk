import { app, BrowserWindow, ipcMain, shell, clipboard, dialog } from 'electron';
import path from 'node:path';
import { homedir } from 'node:os';
import { mkdir } from 'node:fs/promises';
import { createCodexSignIn } from './codex-sign-in';
import { sparkInstructions } from '../electron/spark/instructions';
import { pathToFileURL } from 'node:url';
import { installWindowPolicy, isRendererSender, registerNativeIpc, ElectronAttachmentRegistry } from '@korus-dev/agent-ui-sdk/electron';
import { startRelayHost } from '../electron/relay/host';
import { createSampleHost } from './host';
import { parseSampleLaunchArgs, sampleDirectories } from './launch-options';
import type { Commands } from './contracts';
async function launch() {
const { shape, backend } = parseSampleLaunchArgs([process.env.SAMPLE_SHAPE ?? 'relay', '--backend', process.env.SAMPLE_BACKEND ?? 'codex']);
if (shape === 'basic') throw new Error('Basic uses its own Electron entry point.');
const directories = sampleDirectories(shape, backend, homedir());
await Promise.all(Object.values(directories).map(directory => mkdir(directory, { recursive: true })));
app.setName(shape === 'spark' ? 'Spark' : 'Relay');
app.setPath('userData', directories.desktop);
await app.whenReady();
const signIn = backend === 'codex' ? createCodexSignIn(directories.home, url => shell.openExternal(url)) : undefined;
const renderer = pathToFileURL(path.resolve('dist-samples/renderer/index.html')).href;
const relay = shape === 'relay' ? await startRelayHost(path.join(directories.home, 'relay-operations.json')) : undefined;
const attachments = new ElectronAttachmentRegistry();
const host = createSampleHost({ client: { name: `agent-ui-${shape}-sample`, version: '1' }, home: directories.home, stateDirectory: () => directories.state, ...(shape === 'spark' ? { instructions: () => sparkInstructions, codex: { readOnly: true } } : {})  , ...(relay ? { mcpServers: () => [relay.endpoint] } : {}) }, directories.workspace, undefined, relay, attachment => attachments.resolve(attachment), { backend, login: signIn ? () => signIn.login() : undefined, loginCommand: backend === 'claude' ? `CLAUDE_CONFIG_DIR='${directories.home}' claude auth login` : undefined });
const window = new BrowserWindow({ width: 1280, height: 860, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.resolve('dist-samples/main/preload.cjs') } });
installWindowPolicy(window.webContents, { rendererUrl: renderer, openExternal: url => shell.openExternal(url) });
const trusted = (event: unknown) => { if (!isRendererSender(event, renderer)) throw new Error('Untrusted renderer.'); };
const unregisterNative = registerNativeIpc({ ipcMain, shell, clipboard, dialog }, { isTrustedSender: event => isRendererSender(event, renderer) }, attachments);
ipcMain.handle('sample:snapshot', event => { trusted(event); return host.snapshot(); });
ipcMain.handle('sample:call', async (event, method: keyof Commands, args: Commands[keyof Commands]) => { trusted(event); if (!Array.isArray(args) || args.length > 4) throw new Error('Invalid arguments.'); const result = await host.call(method, ...args); return ['create', 'authenticate', 'relaySnapshot', 'relayReset', 'content'].includes(method) ? result : null; });
const off = host.subscribe(snapshot => { if (!window.isDestroyed()) window.webContents.send('sample:changed', snapshot); });
await window.loadURL(`${renderer}?sample=${shape}`);
// The renderer checks authentication; the host opens its first session after sign-in.
let closing = false;
app.on('before-quit', event => { if (closing) return; event.preventDefault(); closing = true; off(); unregisterNative(); attachments.clear(); ipcMain.removeHandler('sample:snapshot'); ipcMain.removeHandler('sample:call'); void Promise.resolve(signIn?.close()).then(() => host.close()).then(() => relay?.close()).finally(() => app.quit()); });
app.on('window-all-closed', () => app.quit());

}
void launch().catch(error => { console.error(error); app.exit(1); });
