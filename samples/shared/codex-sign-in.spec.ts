import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { CodexSurface, CodexSurfaceSnapshot } from '@korus-dev/multi-agent-sdk';
import { createCodexSignIn } from './codex-sign-in';

function fixture() {
  let listener: Parameters<CodexSurface['onStateChange']>[0] = () => {};
  const off = vi.fn();
  const surface = { startChatGptLogin: vi.fn(async () => ({ loginId: 'login-1', authUrl: 'https://auth.example.test/login' })),
    cancelLogin: vi.fn(async () => ({} as Awaited<ReturnType<CodexSurface['cancelLogin']>>)),
    close: vi.fn(async () => {}), onStateChange: (value: typeof listener) => { listener = value; return off; } };
  const openExternal = vi.fn(async () => {});
  const factory = vi.fn(() => surface);
  const signIn = createCodexSignIn('/isolated/spark/codex', openExternal, factory);
  const emit = (authentication: CodexSurfaceSnapshot['authentication']) => listener({ authentication } as CodexSurfaceSnapshot);
  return { surface, signIn, factory, openExternal, off, emit };
}
describe('isolated Codex sign-in', () => {
  it('keeps the native surface alive until the browser callback completes, then releases it', async () => {
    const f = fixture();
    const pending = f.signIn.login();
    await flushPromises();
    expect(f.factory).toHaveBeenCalledWith('/isolated/spark/codex');
    expect(f.openExternal).toHaveBeenCalledWith('https://auth.example.test/login');
    expect(f.surface.close).not.toHaveBeenCalled();
    f.emit({ status: 'loaded', error: null, requiresOpenaiAuth: true, account: { type: 'chatgpt', email: null, planType: 'plus' }, login: { status: 'completed', error: null, loginId: null, authUrl: null } });
    await pending;
    expect(f.off).toHaveBeenCalledOnce();
    expect(f.surface.close).toHaveBeenCalledOnce();
    expect(f.surface.cancelLogin).not.toHaveBeenCalled();
  });
  it('cancels a pending browser login and closes the native surface when the app closes', async () => {
    const f = fixture();
    const pending = f.signIn.login();
    const rejected = expect(pending).rejects.toThrow('cancelled');
    await flushPromises();
    await f.signIn.close(); await rejected;
    expect(f.surface.cancelLogin).toHaveBeenCalledWith('login-1');
    expect(f.surface.close).toHaveBeenCalledOnce();
    expect(f.off).toHaveBeenCalledOnce();
  });
});
