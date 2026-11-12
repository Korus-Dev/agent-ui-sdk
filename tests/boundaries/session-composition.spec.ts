// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { shallowRef } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { HarnessEvent, Session, SessionState } from '@korus-dev/multi-agent-sdk';
import { ConversationPane, MessageList, createConversationPaneController, sessionStateToConversationPaneState, requestResponseFromClientResponse, requestResponseFromApproval, toChatMessage } from '../../src/vue';
import { sessionPaneExample } from '../../examples/session-pane';
import { sessionFixture, capabilitiesFixture, failedTurnFixture, timedFailedSessionFixture } from '../fixtures/consumer-session';

describe('neutral session composition', () => {
  it('renders neutral model catalogs inside the composer and returns controlled native selections', async () => {
    const selection = shallowRef({ model: 'model:b', reasoningEffort: 'high', serviceTier: null as string | null });
    const models = [{ id: 'catalog-key', model: 'model:a', supportedReasoningEfforts: [
      { reasoningEffort: 'low', description: 'Quick' }, { reasoningEffort: 'high', description: 'Deep' },
    ], serviceTiers: [{ id: 'priority', name: 'Priority', description: 'Faster processing' }] }, { id: 'other-key', model: 'model:b' }];
    const updateSettings = vi.fn((settings: { model?: string; reasoningEffort?: string | null; serviceTier?: string | null }) => {
      selection.value = { ...selection.value,
        ...(settings.model === undefined ? {} : { model: settings.model }),
        ...(settings.reasoningEffort === undefined ? {} : { reasoningEffort: settings.reasoningEffort ?? 'low' }),
        ...(settings.serviceTier === undefined ? {} : { serviceTier: settings.serviceTier }),
      };
    });
    const controller = createConversationPaneController({
      state: () => sessionStateToConversationPaneState({ ...sessionFixture, requests: [], busy: false },
        { ...capabilitiesFixture, models: true, reasoningEffort: true, serviceTier: true }, 'chat', { models, selection: selection.value }),
      actions: { updateSettings },
    });
    const pane = mount(ConversationPane, { props: { controller, escapeInterrupt: false } });
    expect(pane.get('.chat-composer .chat-model-selector__button').text()).toContain('model:b');
    await pane.get('.chat-model-selector__button').trigger('click');
    await pane.get('[data-submenu-id="model:model:a"]').trigger('mouseenter');
    await pane.findAll('[data-submenu-id="model:model:a"] [role="menuitemradio"]')[0]!.trigger('click');
    expect(updateSettings).toHaveBeenCalledWith({ model: 'model:a' });
    expect(updateSettings).not.toHaveBeenCalledWith({ model: 'catalog-key' });
    expect(updateSettings).toHaveBeenCalledWith({ reasoningEffort: 'low' });
    expect(pane.get('.chat-composer .chat-model-selector__button').text()).toContain('model:a Low');
    expect(models[0]!.id).toBe('catalog-key');
    expect(models[0]).not.toHaveProperty('displayName');
    pane.unmount();
  });

  it('binds an opaque harness session, resolves client options and releases its subscription', async () => {
    // Opaque test handle; no native identity is constructed or inspected.
    const session = Object.freeze({}) as Session;
    const otherSession = Object.freeze({}) as Session;
    let receive!: (event: HarnessEvent) => void;
    const unsubscribe = vi.fn();
    const driver = {
      readSession: vi.fn(() => sessionFixture),
      getCapabilities: vi.fn(() => capabilitiesFixture),
      onEvent: vi.fn((listener: (event: HarnessEvent) => void) => { receive = listener; return unsubscribe; }),
      sendPrompt: vi.fn(async () => ({ session })),
      interrupt: vi.fn(async () => ({ session })),
      respondToRequest: vi.fn(async () => {}),
    };
    const promptOptions = { inputMethod: 'dictated' as const };
    const resolveOptions = vi.fn(() => promptOptions);
    const binding = sessionPaneExample(driver, session, resolveOptions);
    const actions = binding.controller.actions;
    // The example supplies a direct actions object and function state source.
    const state = binding.controller.state;
    if (typeof state !== 'function' || !('submit' in actions)) throw new Error('Unexpected example controller shape');
    await actions.submit?.('Explain', { attachments: [{ type: 'file', reference: 'opaque-upload' }] });
    expect(resolveOptions).toHaveBeenCalledWith({ attachments: [{ type: 'file', reference: 'opaque-upload' }] });
    expect(driver.sendPrompt).toHaveBeenCalledWith(session, 'Explain', promptOptions);
    await actions.interrupt?.();
    expect(driver.interrupt).toHaveBeenCalledWith(session, 'turn-1');
    receive({ type: 'session.changed', session: otherSession, revision: 1, state: { ...sessionFixture, error: 'Ignore me' } });
    expect(state().identity.error).toBeNull();
    receive({ type: 'session.changed', session, revision: 1, state: { ...sessionFixture, error: 'Disconnected' } });
    expect(state().identity.error).toBe('Disconnected');
    await actions.respond?.({ id: 'approval-1', outcome: { kind: 'decision', decision: 'allow_conversation' } });
    expect(driver.respondToRequest).toHaveBeenLastCalledWith(session, { id: 'approval-1', outcome: { kind: 'decision', decision: 'allow_conversation' } });
    await actions.respond?.({ id: 'question-1', outcome: { kind: 'answered', answers: { language: { answers: ['TypeScript'] } } } });
    expect(driver.respondToRequest).toHaveBeenLastCalledWith(session, { id: 'question-1', outcome: { kind: 'answered', answers: { language: { answers: ['TypeScript'] } } } });
    const pane = mount(ConversationPane, { props: { controller: binding.controller, escapeInterrupt: false } });
    const approval = pane.get('.agent-ui-approval-prompt');
    expect(approval.text()).toContain('Run checks');
    expect(approval.text()).toContain('npm test');
    const allow = approval.findAll('button').find(button => button.text() === 'Allow');
    expect(allow).toBeDefined();
    await allow!.trigger('click');
    await flushPromises();
    expect(driver.respondToRequest).toHaveBeenLastCalledWith(session, { id: 'approval-1', outcome: { kind: 'decision', decision: 'allow' } });
    receive({ type: 'session.changed', session, revision: 1, state: { ...sessionFixture, requests: [] } });
    await pane.vm.$nextTick();
    expect(pane.find('.agent-ui-approval-prompt').exists()).toBe(false);
    binding.dispose();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('converts question, confirmation and approval intents without native identities', () => {
    const answers = { language: { answers: ['TypeScript'] } };
    expect(requestResponseFromClientResponse({ id: 'q', payload: { answers } })).toEqual({ id: 'q', outcome: { kind: 'answered', answers } });
    expect(requestResponseFromClientResponse({ id: 'q', payload: { cancelled: true } })).toEqual({ id: 'q', outcome: { kind: 'cancelled' } });
    for (const decision of ['allow', 'allow_conversation', 'always_allow', 'deny'] as const) {
      expect(requestResponseFromClientResponse({ id: 'tool', payload: { decision } })).toEqual({ id: 'tool', outcome: { kind: 'decision', decision } });
    }
    expect(() => requestResponseFromClientResponse({ id: 'empty' })).toThrow('needs an answer, decision or cancellation');
    expect(requestResponseFromApproval('a', 'approve', 'once')).toEqual({ id: 'a', outcome: { kind: 'decision', decision: 'allow' } });
    expect(requestResponseFromApproval('a', 'approve', 'session')).toEqual({ id: 'a', outcome: { kind: 'decision', decision: 'allow_conversation' } });
    expect(requestResponseFromApproval('a', 'deny', 'session')).toEqual({ id: 'a', outcome: { kind: 'decision', decision: 'deny' } });
  });

  it('preserves real turn errors, retries and authoritative timing through the rendered pane', async () => {
    const state = shallowRef<SessionState>(timedFailedSessionFixture);
    const retry = vi.fn();
    const controller = createConversationPaneController({
      state: () => sessionStateToConversationPaneState(state.value, { ...capabilitiesFixture, retryTurn: true }),
      actions: { retryTurn: retry },
    });
    const pane = mount(ConversationPane, { props: { controller, escapeInterrupt: false } });
    const renderedTurn = () => {
      const turn = pane.findComponent(MessageList).props('turns')?.[0];
      if (!turn) throw new Error('Missing rendered turn');
      return turn;
    };
    expect(renderedTurn()).toBe(state.value.turns[0]);
    expect(renderedTurn()).toMatchObject(failedTurnFixture);
    expect(renderedTurn().error).toBe(failedTurnFixture.error);
    // Provider duration is authoritative even when wall-clock timestamps differ.
    expect(pane.get('.chat-work-group__title').text()).toBe('Failed · 12s · Hide details');
    expect(pane.findComponent({ name: 'MessageTurn' }).props()).toMatchObject({
      status: 'failed', startedAt: failedTurnFixture.startedAt, durationMs: 12_000,
    });
    const retryButton = pane.findAll('button').find(button => button.attributes('aria-label') === 'Retry');
    expect(retryButton).toBeDefined();
    await retryButton!.trigger('click');
    expect(retry).toHaveBeenCalledWith('turn-1');
    const unknownTurn = { ...failedTurnFixture, error: null, willRetry: false, startedAt: null, completedAt: null, durationMs: null };
    state.value = { ...state.value, turns: [unknownTurn] };
    await pane.vm.$nextTick();
    expect(renderedTurn()).toBe(unknownTurn);
    expect(pane.get('.chat-work-group__title').text()).toBe('Failed · Hide details');
  });

  it('preserves answered requests and optional history evidence in the rendered pane', async () => {
    const question = sessionFixture.requests[1]!;
    if (question.kind !== 'question') throw new Error('Missing question fixture');
    // A question inside a message carries the same neutral request the session reports.
    const inlineRequest = question;
    const snapshot = {
      ...sessionFixture,
      messages: [...sessionFixture.messages, {
        id: 'inline-question', agentId: 'owner-1', role: 'assistant' as const, status: 'complete' as const,
        turnId: 'turn-1', createdAt: '2026-11-10T00:00:02Z',
        parts: [{ type: 'question' as const, request: inlineRequest }],
      }], requests: [sessionFixture.requests[1]!],
      answeredClientRequestIds: ['question-1'], historyLoading: false,
      historyState: { hasOlder: true, loadingOlder: true },
    };
    const state = shallowRef<SessionState>(snapshot);
    const controller = createConversationPaneController({
      state: () => sessionStateToConversationPaneState(state.value, capabilitiesFixture), actions: {},
    });
    const pane = mount(ConversationPane, { props: { controller, escapeInterrupt: false } });
    const list = () => pane.findComponent(MessageList);
    expect(list().props('answeredClientRequestIds')).toEqual(new Set(['question-1']));
    expect(list().props('hasOlderMessages')).toBe(true);
    expect(list().props('loadingOlderMessages')).toBe(true);
    expect(pane.find('.agent-ui-conversation-pane__question-composer').exists()).toBe(false);
    const mapped = sessionStateToConversationPaneState(state.value, capabilitiesFixture);
    expect(mapped.history).toEqual({ loading: false, hasOlder: true, loadingOlder: true });
    state.value = { ...snapshot, historyLoading: true };
    await pane.vm.$nextTick();
    expect(pane.find('[aria-label="Loading conversation"]').exists()).toBe(true);
    state.value = { ...sessionFixture, messages: snapshot.messages, requests: [sessionFixture.requests[1]!] };
    await pane.vm.$nextTick();
    const absent = sessionStateToConversationPaneState(state.value, capabilitiesFixture);
    expect(absent.history).toBeUndefined();
    expect(absent.thread?.answeredClientRequestIds).toBeUndefined();
    const loadingOnly = sessionStateToConversationPaneState({ ...sessionFixture, historyLoading: true }, capabilitiesFixture);
    expect(loadingOnly.history).toEqual({ loading: true });
    expect(loadingOnly.history).not.toHaveProperty('hasOlder');
    expect(loadingOnly.history).not.toHaveProperty('loadingOlder');
    const knownEmpty = sessionStateToConversationPaneState({ ...sessionFixture, answeredClientRequestIds: [] }, capabilitiesFixture);
    expect(knownEmpty.thread?.answeredClientRequestIds).toEqual(new Set());
    expect(list().props('answeredClientRequestIds')?.has('question-1')).toBe(false);
    expect(pane.find('.agent-ui-conversation-pane__question-composer').exists()).toBe(true);
  });

  it('projects canonical state without a provider branch or message copy', () => {
    const pane = sessionStateToConversationPaneState(sessionFixture, capabilitiesFixture, 'session-key');
    expect(pane.identity.messages).toBe(sessionFixture.messages);
    expect(pane.identity).toMatchObject({ conversationKey: 'session-key', busy: true, activeTurnId: 'turn-1', error: null });
    expect(pane.identity.turns?.[0]).toMatchObject({ id: 'turn-1', status: 'inProgress', durationMs: null, startedAt: null });
    // The pane receives the session's requests as they are; it splits approvals from inline requests itself.
    expect(pane.thread?.requests).toBe(sessionFixture.requests);
    expect(pane.capabilities).toMatchObject({ planMode: false, skills: false, approvals: true, permissions: [] });
    expect(toChatMessage(sessionFixture.messages[1]!).toolCalls?.[0]).toMatchObject({ id: 'tool-1', state: 'running' });
  });

  it('renders changing SessionState and routes controlled submit/interrupt intents', async () => {
    const state = shallowRef<SessionState>({ ...sessionFixture, requests: [], busy: false });
    const submit = vi.fn();
    const interrupt = vi.fn();
    const controller = createConversationPaneController({
      state: () => sessionStateToConversationPaneState(state.value, capabilitiesFixture, 'session-key'),
      actions: { submit, interrupt },
    });
    const pane = mount(ConversationPane, { props: { controller, escapeInterrupt: false } });
    expect(pane.text()).toContain('I found the entry point.');
    expect(pane.findComponent(MessageList).props('messages')[0]).toBe(state.value.messages[0]);
    pane.findComponent({ name: 'Composer' }).vm.$emit('send', 'Explain the entry point');
    expect(submit).toHaveBeenCalledWith('Explain the entry point', undefined);
    state.value = { ...state.value, busy: true, activeTurnId: 'turn-1' };
    await pane.vm.$nextTick();
    expect(pane.findComponent({ name: 'Composer' }).props('isSending')).toBe(true);
    pane.findComponent({ name: 'Composer' }).vm.$emit('interrupt');
    expect(interrupt).toHaveBeenCalledOnce();
    state.value = { ...state.value, busy: false, error: 'Connection lost', messages: [{ ...sessionFixture.messages[1]!, status: 'error' }] };
    await pane.vm.$nextTick();
    expect(pane.text()).toContain('Connection lost');
    expect(toChatMessage(state.value.messages[0]!).toolCalls?.[0]?.state).toBe('error');
  });
});
