import { describe, expect, it, vi } from 'vitest';
import type { Harness, HarnessProvider, HarnessOptions, Session } from '@korus-dev/multi-agent-sdk';
import { createChatService } from './service';

describe('Basic sample backend selection', () => {
  it.each(['codex', 'claude', 'cursor', 'antigravity'] as const)('uses the standard %s home and authentication', async backend => {
    const harness = { open: () => Object.freeze({}) as Session, onEvent: () => () => {}, close: vi.fn(async () => {}),
      authenticate: vi.fn(async () => ({ connected: true })), getRuntimeStatus: () => ({ status: 'running' }), listConversations: vi.fn(async () => []) };
    const factory = vi.fn((_backend: HarnessProvider, _options: HarnessOptions) => harness as unknown as Harness);
    const service = createChatService('/workspace', { load: () => [], save: () => {} }, () => { throw new Error('No attachments'); }, () => {}, backend, factory);
    try {
      expect(factory.mock.calls[0]?.[0]).toBe(backend);
      expect(factory.mock.calls[0]?.[1]).not.toHaveProperty('home');
      expect(await service.api.status()).toEqual({ backend, connected: true, runtime: { status: 'running' } });
      expect(await service.api.chats()).toEqual([]);
    } finally { await service.close(); }
    expect(harness.close).toHaveBeenCalledOnce();
  });

  it('lists with a session in the working folder, because Claude and Cursor list the folder of the session they are asked through', async () => {
    const listConversations = vi.fn(async () => []);
    const open = vi.fn(() => Object.freeze({}) as Session);
    const harness = { open, onEvent: () => () => {}, close: vi.fn(async () => {}), listConversations };
    const service = createChatService('/workspace', { load: () => [], save: () => {} }, () => { throw new Error('No attachments'); }, () => {}, 'claude', () => harness as unknown as Harness);
    try {
      await service.api.chats();
      expect(open).toHaveBeenCalledWith(expect.objectContaining({ id: 'sample-lister', folder: '/workspace' }));
      expect(listConversations).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ cwd: '/workspace' }));
    } finally { await service.close(); }
  });
});
