// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { shallowRef } from 'vue';
import type { SessionState } from '@korus-dev/multi-agent-sdk/consumer-types';
import { describe, expect, it, vi } from 'vitest';
import { ConversationPane, MessageList, toChatMessage, createSessionConversationController, toHarnessPromptOptions } from '../../src/vue';
import { sessionFixture, capabilitiesFixture } from '../fixtures/consumer-session';

function fixture(busy = false) {
  const state = shallowRef<SessionState>({ ...sessionFixture, busy, activeTurnId: busy ? 'turn-1' : null, requests: [] });
  const client = {
    sendPrompt: vi.fn(async (..._args: unknown[]) => {}), steerPrompt: vi.fn(async (..._args: unknown[]) => {}),
    interrupt: vi.fn(async () => {}), respondToRequest: vi.fn(async (..._args: unknown[]) => {}),
    setPermission: vi.fn(async (..._args: unknown[]) => {}), setGoal: vi.fn(async (..._args: unknown[]) => {}), clearGoal: vi.fn(async () => {}),
  };
  const binding = createSessionConversationController({ state: () => state.value, conversationKey: 'chat',
    capabilities: { ...capabilitiesFixture, attachments: true, models: true, reasoningEffort: true, goals: true, planMode: 'native', steerPrompt: true,
      permissions: [{ id: 'ask-for-approval' }, { id: 'full-access', dangerous: true }] },
    controls: { models: [{ id: 'catalog-id', model: 'model', defaultReasoningEffort: 'high', supportedReasoningEfforts: [{ reasoningEffort: 'high', description: 'Deep' }] }] }, client });
  const pane = mount(ConversationPane, { props: { controller: binding.controller, escapeInterrupt: false } });
  return { binding, state, client, pane, composer: () => pane.findComponent({ name: 'CodexComposer' }) };
}

describe('standard session conversation', () => {
  it('provides composer models, plan/goal controls and opaque permission choices without host UI mapping', async () => {
    const { binding, pane, composer, client, state } = fixture();
    expect(pane.get('.chat-model-selector__button').text()).toContain('model High');
    await pane.get('[aria-label="Composer actions"]').trigger('click');
    await pane.findAll('button').find(button => button.text().includes('Plan mode'))!.trigger('click');
    expect(composer().props('planMode')).toBe(true);
    composer().vm.$emit('send', 'Explain'); await flushPromises();
    expect(client.sendPrompt).toHaveBeenLastCalledWith('Explain', expect.objectContaining({ planMode: true }));
    expect(pane.findComponent(MessageList).props('messages').map(toChatMessage).some(message => message.content === 'Explain')).toBe(true);
    state.value = { ...state.value, messages: [...state.value.messages, { ...sessionFixture.messages[0]!, id: 'native-explain', parts: [{ type: 'text', text: 'Explain' }] }] };
    await flushPromises();
    if (pane.get('[aria-label="Composer actions"]').attributes('aria-expanded') !== 'true') await pane.get('[aria-label="Composer actions"]').trigger('click');
    await pane.findAll('button').find(button => button.text().includes('Goal mode'))!.trigger('click');
    expect(pane.text()).toContain('Goal');
    composer().vm.$emit('send', '/goal Finish checks'); await flushPromises();
    expect(client.setGoal).toHaveBeenCalledWith('Finish checks');
    expect(pane.findComponent(MessageList).props('messages').map(toChatMessage).filter(message => message.role === 'user').map(message => message.content).join(' ')).not.toContain('/goal Finish checks');
    const actions = binding.controller.actions;
    await actions.menuSelect?.({ id: 'session-permission:1', type: 'radio', label: 'Full access', checked: false });
    expect(client.setPermission).toHaveBeenCalledWith('full-access');
    binding.dispose(); pane.unmount();
  });

  it('queues busy submissions in the shelf, supports editing/steering and drains one turn at a time', async () => {
    const { binding, pane, state, client, composer } = fixture(true);
    composer().vm.$emit('send', 'First follow-up'); composer().vm.$emit('send', 'Second follow-up');
    await flushPromises();
    expect(client.sendPrompt).not.toHaveBeenCalled();
    expect(pane.findComponent(MessageList).props('messages').map(toChatMessage).filter(message => message.role === 'user').map(message => message.content).join(' ')).not.toContain('Second follow-up');
    expect(pane.get('.chat-queued-prompts').text()).toContain('First follow-up');
    const first = binding.queuedPrompts.value[0]!;
    await binding.controller.actions.updateQueuedPrompt?.(first.id, 'Edited follow-up');
    expect(pane.get('.chat-queued-prompts').text()).toContain('Edited follow-up');
    await binding.controller.actions.steerQueuedPrompt?.(first.id);
    expect(client.steerPrompt).toHaveBeenCalledWith('Edited follow-up', expect.any(Object));
    expect(binding.queuedPrompts.value).toHaveLength(1);
    state.value = { ...state.value, busy: false, activeTurnId: null }; await flushPromises();
    expect(client.sendPrompt).toHaveBeenCalledTimes(1);
    expect(client.sendPrompt).toHaveBeenCalledWith('Second follow-up', expect.any(Object));
    expect(binding.queuedPrompts.value).toHaveLength(0);
    binding.dispose(); pane.unmount();
  });

  it('protects pending admissions and observes turns that start and finish in one tick', async () => {
    const { binding, pane, state, client, composer } = fixture(true);
    composer().vm.$emit('send', 'First'); composer().vm.$emit('send', 'Second'); await flushPromises();
    let admit!: () => void;
    client.sendPrompt.mockImplementationOnce(() => new Promise<void>(resolve => { admit = resolve; }));
    state.value = { ...state.value, busy: false, activeTurnId: null }; await flushPromises();
    const first = binding.queuedPrompts.value[0]!;
    await expect(binding.controller.actions.steerQueuedPrompt?.(first.id)).rejects.toThrow('admission');
    expect(() => binding.controller.actions.deleteQueuedPrompt?.(first.id)).toThrow('admission');
    expect(client.steerPrompt).not.toHaveBeenCalled();
    state.value = { ...state.value, busy: true, activeTurnId: 'fast' };
    state.value = { ...state.value, busy: false, activeTurnId: null };
    admit(); await flushPromises();
    expect(client.sendPrompt.mock.calls.map(call => call[0])).toEqual(['First', 'Second']);
    expect(binding.queuedPrompts.value).toEqual([]);
    binding.dispose(); pane.unmount();
  });

  it('keeps failed queued work retryable and routes actual approvals/questions to the client', async () => {
    const { binding, pane, state, client, composer } = fixture(true);
    composer().vm.$emit('send', 'Keep this'); await flushPromises();
    client.sendPrompt.mockRejectedValueOnce(new Error('Offline'));
    state.value = { ...state.value, busy: false, activeTurnId: null }; await flushPromises();
    expect(binding.queuedPrompts.value).toHaveLength(1);
    expect(pane.get('[role="alert"]').text()).toContain('Offline');
    await binding.controller.actions.deleteQueuedPrompt?.(binding.queuedPrompts.value[0]!.id);
    state.value = { ...state.value, requests: sessionFixture.requests }; await flushPromises();
    await pane.findAll('.codex-approval-prompt button').find(button => button.text() === 'Allow')!.trigger('click');
    await flushPromises();
    expect(client.respondToRequest).toHaveBeenCalledWith({ id: 'approval-1', outcome: { kind: 'decision', decision: 'allow' } });
    state.value = { ...state.value, requests: sessionFixture.requests.filter(request => request.kind === 'question')
      .map(request => ({ ...request, question: { ...request.question, delivery: 'tool' as const } })) };
    await flushPromises();
    await pane.get('.chat-tool-user-input textarea').setValue('TypeScript');
    await pane.get('.chat-tool-user-input__button--primary').trigger('click');
    await flushPromises();
    expect(client.respondToRequest).toHaveBeenLastCalledWith({ id: 'question-1', outcome: { kind: 'answered', answers: { language: { answers: ['TypeScript'] } } } });
    binding.dispose(); pane.unmount();
    await expect(binding.controller.actions.submit?.('after disposal')).rejects.toThrow('disposed');
  });

  it('renders provider-backed image previews through the scoped reader, without opening provider paths', async () => {
    const image = 'data:image/png;base64,cG5n';
    const contentId = 'a'.repeat(64);
    const state = { ...sessionFixture, busy: false, activeTurnId: null, requests: [], messages: [{
      ...sessionFixture.messages[0]!, parts: [{ type: 'attachment' as const, attachment: { kind: 'image' as const,
        name: 'photo.png', path: '/provider/private/photo.png', url: `conversation-image:thread:${contentId}`, mimeType: 'image/png' } }],
    }] };
    const readConversationContent = vi.fn(async (input: { contentId: string; offset: number }) => {
      const data = input.offset === 0 ? image.slice(0, 12) : image.slice(12);
      return { data: btoa(data), totalBytes: image.length, nextOffset: input.offset === 0 ? 12 : null };
    });
    const binding = createSessionConversationController({ state, capabilities: capabilitiesFixture, conversationKey: 'image',
      client: { sendPrompt: vi.fn(), readConversationContent } });
    const pane = mount(ConversationPane, { props: { controller: binding.controller, escapeInterrupt: false, renderStrategy: 'eager' } });
    await flushPromises();
    const attachment = pane.findComponent({ name: 'ChatAttachmentBlock' });
    expect(attachment.exists()).toBe(true);
    expect(attachment.get('img').attributes('src')).toBe(image);
    expect(readConversationContent.mock.calls).toEqual([[{ contentId, offset: 0 }], [{ contentId, offset: 12 }]]);
    binding.dispose(); pane.unmount();
  });

  it('resolves attachment capabilities only at the trusted prompt boundary and preserves settings', () => {
    const options = { model: 'm', reasoningEffort: 'low', serviceTier: null, planMode: true,
      attachments: [{ type: 'file' as const, reference: 'opaque' }], inputMethod: 'dictated' as const };
    expect(() => toHarnessPromptOptions(options)).toThrow('resolver');
    const resolve = vi.fn(() => ({ type: 'file' as const, path: '/trusted/file' }));
    expect(toHarnessPromptOptions(options, resolve)).toEqual({ selection: { model: 'm', reasoningEffort: 'low', serviceTier: null }, planMode: true,
      attachments: [{ type: 'file', path: '/trusted/file' }], inputMethod: 'dictated' });
    expect(resolve).toHaveBeenCalledWith({ type: 'file', reference: 'opaque' });
  });
});
