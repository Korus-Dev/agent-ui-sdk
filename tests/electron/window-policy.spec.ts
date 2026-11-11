import { describe, expect, it, vi } from 'vitest';
import {
  installWindowPolicy,
  isRendererSender,
  registerNativeIpc,
  type WindowPolicyTarget,
} from '../../src/electron';

const devRenderer = 'http://localhost:5173/';
const packagedRenderer = 'file:///Applications/Demo.app/Contents/Resources/app/dist-renderer/index.html';

function windowWithPolicy(rendererUrl: string) {
  let navigate: ((event: { url: string; preventDefault(): void }) => void) | undefined;
  let openWindow: ((details: { url: string }) => { action: 'deny' }) | undefined;
  const webContents: WindowPolicyTarget = {
    on: (_event, listener) => { navigate = listener; },
    setWindowOpenHandler: (handler) => { openWindow = handler; },
  };
  const openExternal = vi.fn();
  installWindowPolicy(webContents, { rendererUrl, openExternal });
  return {
    openExternal,
    navigate(url: string) {
      const preventDefault = vi.fn();
      navigate!({ url, preventDefault });
      return { blocked: preventDefault.mock.calls.length > 0, opened: openExternal.mock.calls.flat() };
    },
    openWindow: (url: string) => openWindow!({ url }),
  };
}

describe('Electron window policy', () => {
  it.each([
    ['a dev-server reload', devRenderer, 'http://localhost:5173/?reload=1', false, []],
    ['a foreign web page', devRenderer, 'https://attacker.example/', true, ['https://attacker.example/']],
    ['the dev host on another port', devRenderer, 'http://localhost:5174/', true, ['http://localhost:5174/']],
    ['an executable data URL', devRenderer, 'data:text/html,<script>alert(1)</script>', true, []],
    ['the packaged renderer itself', packagedRenderer, `${packagedRenderer}#conversation`, false, []],
    ['another local file', packagedRenderer, 'file:///Users/me/project/report.html', true, []],
  ])('handles navigation to %s', (_label, rendererUrl, target, blocked, opened) => {
    expect(windowWithPolicy(rendererUrl).navigate(target)).toStrictEqual({ blocked, opened });
  });

  it('denies new windows and only hands safe protocols to the OS', () => {
    const window = windowWithPolicy(devRenderer);

    expect(window.openWindow('https://docs.example/page')).toStrictEqual({ action: 'deny' });
    expect(window.openWindow('javascript:alert(1)')).toStrictEqual({ action: 'deny' });
    expect(window.openWindow('mailto:team@example.com')).toStrictEqual({ action: 'deny' });
    expect(window.openExternal.mock.calls.flat()).toStrictEqual(['https://docs.example/page', 'mailto:team@example.com']);
  });

  it('accepts IPC only from the main frame of a window showing the renderer', () => {
    const frame = (url: string, parent: unknown = null) => ({ senderFrame: { url, parent } });

    expect(isRendererSender(frame('http://localhost:5173/index.html'), devRenderer)).toBe(true);
    expect(isRendererSender(frame('https://attacker.example/'), devRenderer)).toBe(false);
    expect(isRendererSender(frame('http://localhost:5173/', { url: devRenderer }), devRenderer)).toBe(false);
    expect(isRendererSender({ senderFrame: null }, devRenderer)).toBe(false);
  });

  it('rejects native IPC from untrusted senders before reaching the host', async () => {
    const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>();
    const shell = { openExternal: vi.fn(async () => undefined) };
    registerNativeIpc({
      clipboard: { write: vi.fn() },
      dialog: { showOpenDialog: vi.fn() },
      ipcMain: {
        handle: (channel, handler) => { handlers.set(channel, handler); },
        removeHandler: (channel) => { handlers.delete(channel); },
      },
      shell,
    }, { isTrustedSender: event => isRendererSender(event, devRenderer) });
    const attacker = { senderFrame: { url: 'https://attacker.example/', parent: null } };
    const renderer = { senderFrame: { url: devRenderer, parent: null } };

    await expect(Promise.resolve().then(() => handlers.get('agent-ui-native:open-external')!(attacker, 'https://attacker.example/')))
      .rejects.toThrow('untrusted sender');
    expect(shell.openExternal).not.toHaveBeenCalled();

    await handlers.get('agent-ui-native:open-external')!(renderer, 'https://docs.example/page');
    expect(shell.openExternal).toHaveBeenCalledWith('https://docs.example/page');
  });
});
