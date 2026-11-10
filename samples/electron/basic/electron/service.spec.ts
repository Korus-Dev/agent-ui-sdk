import { describe, expect, it, vi } from 'vitest';
import type { HarnessDriver, HarnessProvider, HarnessOptions, Session } from '@korus-dev/multi-agent-sdk';
import { createChatService } from './service';

describe('Basic sample backend selection', () => {
  it.each(['codex', 'claude', 'cursor', 'antigravity'] as const)('uses the standard %s home and authentication', async backend => {
    const harness = { open: () => Object.freeze({}) as Session, onEvent: () => () => {}, close: vi.fn(async () => {}),
      authenticate: vi.fn(async () => ({ connected: true })), getRuntimeStatus: () => ({ status: 'running' }), listConversations: vi.fn(async () => []) };
    const factory = vi.fn((_backend: HarnessProvider, _options: HarnessOptions) => harness as unknown as HarnessDriver);
    const service = createChatService('/workspace', { load: () => [], save: () => {} }, () => { throw new Error('No attachments'); }, () => {}, backend, factory);
    try {
      expect(factory.mock.calls[0]?.[0]).toBe(backend);
      expect(factory.mock.calls[0]?.[1]).not.toHaveProperty('home');
      expect(await service.api.status()).toEqual({ backend, connected: true, runtime: { status: 'running' } });
      expect(await service.api.chats()).toEqual([]);
    } finally { await service.close(); }
    expect(harness.close).toHaveBeenCalledOnce();
  });
});
