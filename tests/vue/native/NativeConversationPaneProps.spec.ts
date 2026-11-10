// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { h, reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { MessageList, resolveConversationPaneValue, type ConversationPaneController } from '../../../src/vue';
import type { CodexSurfaceController } from '../../../src/vue/native';
import Fixture from './NativeConversationPanePropsFixture.vue';

function nativeSurface() {
  const state = reactive({
    selectedModelId: 'native-model', status: 'ready', activeConversationId: 'native-view' as string | null | undefined, activeTurnId: null,
    messages: [{ id: 'm', role: 'assistant', status: 'complete', parts: [{ type: 'text', text: 'Known native message' }] }],
    turns: [], busy: false, error: null as string | null | undefined, approvals: [], clientRequests: [],
    historyLoading: false, historyState: { hasOlder: false, loadingOlder: false },
  });
  // Narrow hermetic native read-model fixture; no provider calls or transport.
  const surface = { state, answeredClientRequestIds: new Set<string>(),
    sendMessage: vi.fn(async () => { throw new Error('send failed'); }),
    steerMessage: vi.fn(async () => { throw new Error('steer failed'); }),
    readConversationPromptHistory: vi.fn(async () => ({ prompts: [] })),
  } as unknown as CodexSurfaceController;
  return { state, surface };
}

function paneState(wrapper: ReturnType<typeof mount>) {
  const controller = wrapper.findComponent({ name: 'CodexConversationPane' }).props('controller') as ConversationPaneController;
  return resolveConversationPaneValue(controller.state);
}

describe('native pane compatibility', () => {
  it('normalizes kebab-case and bare Boolean overrides before creating controlled state', async () => {
    const { state, surface } = nativeSurface();
    const wrapper = mount(Fixture, { props: { surface, mode: 'bare', hostKey: 'host-view' } });
    expect(paneState(wrapper)).toMatchObject({
      identity: { conversationKey: 'host-view', busy: false, disabled: true },
      history: { hasOlder: true, loadingOlder: true },
      policy: { actionsDisabled: true },
    });
    expect(wrapper.get('[role="textbox"]').attributes('contenteditable')).toBe('false');
    state.busy = true;
    state.status = 'loading';
    state.historyState = { hasOlder: true, loadingOlder: true };
    await wrapper.setProps({ mode: 'false', hostKey: 'next-host-view' });
    expect(paneState(wrapper)).toMatchObject({
      identity: { conversationKey: 'next-host-view', busy: false, disabled: false },
      history: { hasOlder: false, loadingOlder: false },
      policy: { actionsDisabled: false },
    });
    expect(wrapper.get('[role="textbox"]').attributes('contenteditable')).toBe('true');
    expect(paneState(wrapper).composer?.selectedModelId).toBeNull();
    await wrapper.setProps({ hostKey: null });
    expect(paneState(wrapper).identity.conversationKey).toBeNull();
    await wrapper.setProps({ mode: 'absent' });
    expect(paneState(wrapper)).toMatchObject({
      identity: { conversationKey: 'native-view', busy: true, disabled: true },
      history: { hasOlder: true, loadingOlder: true },
    });
    expect(paneState(wrapper).identity.messages).toBe(state.messages);
    expect(paneState(wrapper).composer?.selectedModelId).toBe('native-model');
  });

  it('emits the old turn-history event when the optional native method is absent', async () => {
    const { surface } = nativeSurface();
    const wrapper = mount(Fixture, { props: { surface, mode: 'absent', hostKey: 'unused' } });
    wrapper.findComponent(MessageList).vm.$emit('load-turn-history', 'turn-2');
    await flushPromises();
    expect(wrapper.findComponent({ name: 'NativeConversationPane' }).emitted('loadTurnHistory')).toEqual([['turn-2']]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it.each([null, undefined, '', 0])('emits history intents instead of serializing a missing key %s', async key => {
    const { state, surface } = nativeSurface();
    state.activeConversationId = typeof key === 'number' ? null : key;
    const loadTurnHistory = vi.fn(async () => undefined);
    const loadOlderConversationHistory = vi.fn(async () => undefined);
    Object.assign(surface, { loadTurnHistory, loadOlderConversationHistory });
    const wrapper = mount(Fixture, { props: { surface, mode: 'false', hostKey: key } });
    const list = wrapper.findComponent(MessageList);
    list.vm.$emit('load-turn-history', 'turn-2');
    list.vm.$emit('load-older-messages');
    await flushPromises();
    expect(loadTurnHistory).not.toHaveBeenCalled();
    expect(loadOlderConversationHistory).not.toHaveBeenCalled();
    const native = wrapper.findComponent({ name: 'NativeConversationPane' });
    expect(native.emitted('loadTurnHistory')).toEqual([['turn-2']]);
    expect(native.emitted('loadOlderHistory')).toEqual([[]]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it.each(['send', 'steer'] as const)('clears a failed %s only after same-key enabled/error-free recovery', async intent => {
    const { state, surface } = nativeSurface();
    const wrapper = mount(Fixture, { props: { surface, mode: 'absent', hostKey: 'unused' } });
    const composer = () => wrapper.findComponent({ name: 'CodexComposer' });
    composer().vm.$emit(intent, 'Try this');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(`${intent} failed`);
    // Unrelated renders while already enabled/error-free must retain the failure.
    state.messages = [...state.messages];
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe(`${intent} failed`);
    state.status = 'connecting'; state.error = 'Transport recovering';
    await wrapper.vm.$nextTick();
    state.status = 'ready';
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe(`${intent} failed`);
    state.status = 'connecting'; state.error = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe(`${intent} failed`);
    state.status = 'ready'; state.error = undefined;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe(`${intent} failed`);
    state.error = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(paneState(wrapper).identity.conversationKey).toBe('native-view');
    // An active composer/transcription error is independent of transport recovery.
    composer().vm.$emit('error', 'Microphone access denied');
    state.status = 'connecting'; state.error = 'Transport recovering';
    await wrapper.vm.$nextTick();
    state.status = 'ready'; state.error = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe('Microphone access denied');
    composer().vm.$emit('error', null);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('casts the same real-template Boolean overrides during server rendering', async () => {
    const { surface } = nativeSurface();
    const html = await renderToString(h(Fixture, { surface, mode: 'bare', hostKey: 'host-view' }));
    expect(html).toContain('Known native message');
    expect(html).toContain('contenteditable="false"');
    expect(html).toContain('chat-composer--disabled');
  });
});
