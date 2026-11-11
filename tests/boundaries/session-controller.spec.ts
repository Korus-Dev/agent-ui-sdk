// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { shallowRef } from 'vue';
import type { SessionState } from '@korus-dev/multi-agent-sdk';
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
  return { binding, state, client, pane, composer: () => pane.findComponent({ name: 'Composer' }) };
}

describe('standard session conversation', () => {
  it.each(['Codex', 'Claude', 'Cursor', 'Antigravity', 'An unknown backend'])('uses capabilities and actions independently of the %s label', async title => {
    const state = shallowRef<SessionState>({ ...sessionFixture, title, busy: false, activeTurnId: null, requests: [] });
    const capabilities = shallowRef({ ...capabilitiesFixture, models: false });
    const sendPrompt = vi.fn(async (..._args: unknown[]) => {});
    const binding = createSessionConversationController({ conversationKey: 'shared-session', state, capabilities, client: { sendPrompt } });
    const pane = mount(ConversationPane, { props: { controller: binding.controller } });
    try {
      expect(pane.find('.chat-model-selector').exists()).toBe(false);
      capabilities.value = { ...capabilities.value, models: true };
      await flushPromises();
      expect(pane.find('.chat-model-selector').exists()).toBe(true);
      const editor = pane.get('[contenteditable="true"]');
      editor.element.textContent = 'Hello';
      await editor.trigger('input');
      await pane.get('form').trigger('submit');
      await flushPromises();
      expect(sendPrompt.mock.calls[0]?.[0]).toBe('Hello');
    } finally { pane.unmount(); binding.dispose(); }
  });

  it.each([undefined, 'native-item-with-another-id'])('shows a pending confirmation only in the composer when itemId is %s', async itemId => {
    const { state, pane, client, binding } = fixture(true);
    const request = { id: 'confirm-rebook', kind: 'toolConfirmation' as const, conversationId: 'conversation-1',
      ...(itemId === undefined ? {} : { itemId }),
      confirmation: { integrationId: 'relay', integrationName: 'Relay', toolName: 'rebook_shipment',
        summary: 'Approve shipment rebooking', argumentsPreview: '{}', allowConversation: true } };
    state.value = { ...state.value, requests: [request], messages: [{ ...sessionFixture.messages[1]!, parts: [
      { type: 'text', text: 'Investigating shipment.' },
      { type: 'tool', id: 'transcript-confirmation', kind: 'mcp', title: 'rebook_shipment', status: 'running',
        statusText: JSON.stringify({ source: 'mcp', action: 'confirm_tool', phase: 'running',
          params: { requestId: request.id, confirmationSummary: request.confirmation.summary } }) },
      { type: 'tool', id: 'unrelated-read', kind: 'read', title: 'Read shipment record', status: 'running',
        statusText: JSON.stringify({ source: 'mcp', action: 'read', phase: 'running', params: { path: 'shipment.json' } }) },
    ] }] };
    try {
      await flushPromises();
      const transcript = pane.get('.agent-ui-conversation-pane__messages');
      expect(transcript.text()).toContain('Investigating shipment.');
      expect(transcript.find('.chat-tool-call').exists()).toBe(true);
      expect(transcript.find('.chat-tool-confirmation').exists()).toBe(false);
      const footer = pane.get('.agent-ui-conversation-pane__footer');
      expect(footer.text()).toContain(request.confirmation.summary);
      expect(pane.findAll('.chat-tool-confirmation')).toHaveLength(1);
      await footer.findAll('button').find(button => button.text() === 'Allow')!.trigger('click');
      await flushPromises();
      expect(client.respondToRequest.mock.calls).toEqual([[{ id: request.id, outcome: { kind: 'decision', decision: 'allow' } }]]);
      state.value = { ...state.value, requests: [], answeredClientRequestIds: [request.id] };
      await flushPromises();
      expect(pane.find('.agent-ui-conversation-pane__footer .chat-tool-confirmation').exists()).toBe(false);
      expect(pane.get('.agent-ui-conversation-pane__messages').text()).toContain('Allowed tool call');
    } finally { pane.unmount(); binding.dispose(); }
  });

  it('provides composer models, plan/goal controls and opaque permission choices without host UI mapping', async () => {
    const { binding, pane, composer, client, state } = fixture();
    expect(pane.get('.chat-model-selector__button').text()).toContain('model High');
    await pane.get('[aria-label="Composer actions"]').trigger('click');
    const permissionTrigger = pane.get('.agent-ui-composer-menu-list__submenu > button');
    expect(permissionTrigger.text()).toBe('Permissions');
    expect(permissionTrigger.get('svg').classes()).toContain('tabler-icon-shield-check');
    expect(pane.get('.chat-composer-action-menu').element.children[1]!.classList.contains('agent-ui-composer-menu-list__separator')).toBe(true);
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

  it('selects the backend permission on load and follows native changes after a pending choice is acknowledged', async () => {
    const { binding, pane, state } = fixture();
    state.value = { ...state.value, permission: 'ask-for-approval' };
    await pane.get('[aria-label="Composer actions"]').trigger('click');
    const checked = () => pane.findAll('[role="menuitemradio"][aria-checked="true"]').map(item => item.text());
    expect(checked()).toEqual([expect.stringContaining('Ask for approval')]);
    await binding.controller.actions.menuSelect?.({ id: 'session-permission:1', type: 'radio', label: 'Full access', checked: false });
    await flushPromises();
    expect(checked()).toEqual([expect.stringContaining('Full access')]);
    state.value = { ...state.value, permission: 'full-access' }; await flushPromises();
    state.value = { ...state.value, permission: 'ask-for-approval' }; await flushPromises();
    expect(checked()).toEqual([expect.stringContaining('Ask for approval')]);
    state.value = { ...state.value, permission: null }; await flushPromises();
    expect(checked()).toEqual([]);
    binding.dispose(); pane.unmount();
  });

  it('uses provider-restored model selection, retains pending edits, and adopts acknowledged native changes', async () => {
    const state = shallowRef<SessionState>({ ...sessionFixture, busy: false, requests: [],
      selection: { model: 'terra', reasoningEffort: 'low', serviceTier: 'default' } });
    const models = [
      { id: 'sol-catalog', model: 'sol', displayName: 'Sol', isDefault: true },
      { id: 'terra-catalog', model: 'terra', displayName: 'Terra' },
    ].map(model => ({ ...model, supportedReasoningEfforts: [{ reasoningEffort: 'low', description: 'Quick' }, { reasoningEffort: 'high', description: 'Deep' }] }));
    const sendPrompt = vi.fn(async () => {});
    const binding = createSessionConversationController({ state, capabilities: { ...capabilitiesFixture, models: true, reasoningEffort: true },
      conversationKey: 'resumed', controls: { models }, client: { sendPrompt } });
    const pane = mount(ConversationPane, { props: { controller: binding.controller, escapeInterrupt: false } });
    expect(pane.get('.chat-model-selector__button').text()).toBe('Terra Low');
    await binding.controller.actions.submit?.('Continue');
    expect(sendPrompt).toHaveBeenCalledWith('Continue', expect.objectContaining({ model: 'terra', reasoningEffort: 'low', serviceTier: 'default' }));
    await binding.controller.actions.updateSettings?.({ model: 'sol' }); await flushPromises();
    state.value = { ...state.value }; await flushPromises();
    expect(pane.get('.chat-model-selector__button').text()).toBe('Sol Low');
    state.value = { ...state.value, selection: { model: 'sol', reasoningEffort: 'low', serviceTier: 'default' } }; await flushPromises();
    state.value = { ...state.value, selection: { model: 'terra', reasoningEffort: 'high', serviceTier: 'default' } }; await flushPromises();
    expect(pane.get('.chat-model-selector__button').text()).toBe('Terra High');
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
    await pane.findAll('.agent-ui-approval-prompt button').find(button => button.text() === 'Allow')!.trigger('click');
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
    const options = { selection: { model: 'm', reasoningEffort: 'low', serviceTier: null }, planMode: true,
      attachments: [{ type: 'file' as const, reference: 'opaque' }], inputMethod: 'dictated' as const };
    expect(() => toHarnessPromptOptions(options)).toThrow('resolver');
    const resolve = vi.fn(() => ({ type: 'file' as const, path: '/trusted/file' }));
    expect(toHarnessPromptOptions(options, resolve)).toEqual({ selection: { model: 'm', reasoningEffort: 'low', serviceTier: null }, planMode: true,
      attachments: [{ type: 'file', path: '/trusted/file' }], inputMethod: 'dictated' });
    expect(resolve).toHaveBeenCalledWith({ type: 'file', reference: 'opaque' });
  });
});
