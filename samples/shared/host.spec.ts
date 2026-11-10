import { describe, expect, it, vi } from 'vitest';
import type { HarnessDriver, HarnessEvent, HarnessProvider, HarnessOptions, Session } from '@korus-dev/multi-agent-sdk';
import { createSampleHost, type SampleHostConfiguration } from './host';
import { capabilitiesFixture, sessionFixture } from '../../tests/fixtures/consumer-session';

function fixture(configuration?: SampleHostConfiguration) {
  const listeners = new Set<(event: HarnessEvent) => void>();
  const driver = {
    open: vi.fn(() => Object.freeze({}) as Session),
    readSession: vi.fn(() => structuredClone(sessionFixture)),
    getCapabilities: () => capabilitiesFixture,
    onEvent: (listener: (event: HarnessEvent) => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    authenticate: vi.fn(async () => ({ connected: false })),
    sendPrompt: vi.fn(async () => ({})), respondToRequest: vi.fn(async () => {}),
    release: vi.fn(async () => {}), close: vi.fn(async () => {}),
  };
  const factory = vi.fn((_provider: HarnessProvider, _options: HarnessOptions) => driver as unknown as HarnessDriver);
  const host = createSampleHost({ client: { name: 'sample-test' } }, '/workspace', factory, undefined, undefined, configuration);
  return { host, factory, driver, listeners };
}
describe('neutral sample host', () => {
  it('releases the chat driver before native sign-in and opens the chosen backend only after completion', async () => {
    const order: string[] = [];
    let connected = false;
    const f = fixture({ backend: 'codex', login: async () => { order.push('login'); connected = true; } });
    f.driver.authenticate.mockImplementation(async (...args: unknown[]) => { if ((args[0] as { action?: string })?.action === 'logout') connected = false; return { connected }; });
    f.driver.close.mockImplementation(async () => { order.push('close'); });
    f.driver.open.mockImplementation(() => { order.push('open'); return Object.freeze({}) as Session; });
    try {
      await f.host.call('authenticate', 'check');
      expect(f.host.snapshot().authentication?.connected).toBe(false);
      expect(f.driver.open).not.toHaveBeenCalled();
      await f.host.call('authenticate', 'login');
      expect(order).toEqual(['close', 'login', 'open']);
      expect(f.host.snapshot().authentication?.connected).toBe(true);
      expect(f.host.snapshot().conversations[0]?.provider).toBe('codex');
      await f.host.call('authenticate', 'logout');
      expect(f.driver.release).toHaveBeenCalledOnce();
      expect(f.host.snapshot().conversations).toEqual([]);
    } finally { await f.host.close(); }
  });

  it.each(['codex','claude','cursor','antigravity'] as const)('binds %s state and prompts without exposing native handles', async provider => {
    const f = fixture();
    try {
      const snapshots: unknown[] = []; f.host.subscribe(value => snapshots.push(value));
      const id = String(await f.host.call('create', provider));
      expect(f.factory.mock.calls[0]?.[0]).toBe(provider);
      const view = f.host.snapshot().conversations[0]!;
      expect(view).toMatchObject({ id, provider, state: sessionFixture, capabilities: capabilitiesFixture });
      expect(view).not.toHaveProperty('session');
      view.state.messages.length = 0;
      expect(f.host.snapshot().conversations[0]!.state.messages.length).toBeGreaterThan(0);
      await f.host.call('send', id, 'Hello', { model: 'provider-model', reasoningEffort: 'low', serviceTier: null });
      expect(f.driver.sendPrompt).toHaveBeenCalledWith(f.driver.open.mock.results[0]!.value, 'Hello', { selection: { model: 'provider-model', reasoningEffort: 'low', serviceTier: null } });
      const session = f.driver.open.mock.results[0]!.value as Session;
      for (const listener of f.listeners) listener({ type: 'session.changed', session, state: { ...sessionFixture, title: 'Updated by provider' } });
      expect(f.host.snapshot().conversations[0]!.state.title).toBe('Updated by provider');
      expect(snapshots.length).toBeGreaterThan(1);
      await f.host.call('release', id);
      expect(f.host.snapshot().conversations).toEqual([]);
      await expect(f.host.call('send', id, 'Stale')).rejects.toThrow('not open');
    } finally { await f.host.close(); }
    expect(f.listeners.size).toBe(0); expect(f.driver.close).toHaveBeenCalledOnce();
  });
  it('keeps requests session-bound and rejects untrusted attachment references and operations', async () => {
    const f = fixture();
    try {
      const a = String(await f.host.call('create', 'claude'));
      await f.host.call('create', 'codex');
      const response = { id: 'question-1', outcome: { kind: 'answered' as const, answers: { language: { answers: ['English'] } } } };
      await f.host.call('respond', a, response);
      expect(f.driver.respondToRequest).toHaveBeenCalledWith(f.driver.open.mock.results[0]!.value, response);
      await expect(f.host.call('send', a, 'Read', { attachments: [{ type: 'file', reference: '/etc/passwd' }] })).rejects.toThrow('resolver');
      expect(f.driver.sendPrompt).not.toHaveBeenCalled();
      await expect((f.host.call as (...args: unknown[]) => Promise<unknown>)('arbitrary', a)).rejects.toThrow('Unknown sample operation');
      await expect(f.host.call('create', 'unknown' as never)).rejects.toThrow('Unknown harness');
    } finally { await f.host.close(); }
  });
});
