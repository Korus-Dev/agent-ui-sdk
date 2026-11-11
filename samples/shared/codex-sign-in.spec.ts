import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { HarnessEvent } from '@korus-dev/multi-agent-sdk';
import { createCodexSignIn } from './codex-sign-in';

type Authentication = { status: string; error: string | null; requiresOpenaiAuth: boolean; account: unknown; login: { status: string; error: string | null; loginId: string | null; authUrl: string | null } };

function fixture() {
  let listener: (event: HarnessEvent) => void = () => {};
  const off = vi.fn();
  const host = {
    authenticate: vi.fn(async (request: { action: string }) => request.action === 'login'
      ? { connected: false, login: { method: 'browser' as const, id: 'login-1', url: 'https://auth.example.test/login' }, native: {} as never }
      : { connected: false, native: {} as never }),
    close: vi.fn(async () => {}),
    onEvent: (value: typeof listener) => { listener = value; return off; },
  };
  const openExternal = vi.fn(async () => {});
  const factory = vi.fn(() => host);
  const signIn = createCodexSignIn('/isolated/spark/codex', openExternal, factory as never);
  const emit = (state: Authentication) => listener({ type: 'provider.event', event: { type: 'provider.authenticationChanged', payload: { kind: 'codex', connected: Boolean(state.account || !state.requiresOpenaiAuth), state } } } as never);
  return { host, signIn, factory, openExternal, off, emit };
}
describe('isolated Codex sign-in', () => {
  it('keeps the native host alive until the browser callback completes, then releases it', async () => {
    const f = fixture();
    const pending = f.signIn.login();
    await flushPromises();
    expect(f.factory).toHaveBeenCalledWith('/isolated/spark/codex');
    expect(f.openExternal).toHaveBeenCalledWith('https://auth.example.test/login');
    expect(f.host.close).not.toHaveBeenCalled();
    f.emit({ status: 'loaded', error: null, requiresOpenaiAuth: true, account: { type: 'chatgpt', email: null, planType: 'plus' }, login: { status: 'completed', error: null, loginId: null, authUrl: null } });
    await pending;
    expect(f.off).toHaveBeenCalledOnce();
    expect(f.host.close).toHaveBeenCalledOnce();
    expect(f.host.authenticate).not.toHaveBeenCalledWith({ action: 'cancel', loginId: 'login-1' });
  });
  it('cancels a pending browser login and closes the native host when the app closes', async () => {
    const f = fixture();
    const pending = f.signIn.login();
    const rejected = expect(pending).rejects.toThrow('cancelled');
    await flushPromises();
    await f.signIn.close(); await rejected;
    expect(f.host.authenticate).toHaveBeenCalledWith({ action: 'cancel', loginId: 'login-1' });
    expect(f.host.close).toHaveBeenCalledOnce();
    expect(f.off).toHaveBeenCalledOnce();
  });
});
