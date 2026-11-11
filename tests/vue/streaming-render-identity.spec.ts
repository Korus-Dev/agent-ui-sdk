// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { shallowRef } from 'vue';
import type { Message, SessionState } from '@korus-dev/multi-agent-sdk';
import { ConversationPane, createSessionConversationController } from '../../src/vue';
import { capabilitiesFixture, sessionFixture } from '../fixtures/consumer-session';
function answer(id: string, text: string, status: Message['status'] = 'complete'): Message {
  return { id, agentId: 'session-owner', createdAt: '2026-11-10T00:00:00Z', role: 'assistant', status, turnId: `turn-${id}`, parts: [{ type: 'text', text }] };
}

describe('streaming render cost', () => {
  it('re-renders only the streaming message when neutral session snapshots stream', async () => {
    const history = Array.from({ length: 12 }, (_, index) => answer(`done-${index}`, `Finished answer ${index}`));
    const state = shallowRef<SessionState>({ ...sessionFixture, requests: [],
      messages: [...history, answer('live', 'Finished **prefix**.\n\nHel', 'streaming')],
    });
    const binding = createSessionConversationController({ conversationKey: 'shared-session', state, capabilities: capabilitiesFixture,
      client: { sendPrompt: async () => undefined } });
    const wrapper = mount(ConversationPane, { props: { controller: binding.controller, renderStrategy: 'eager' } });
    await flushPromises();
    const finished = wrapper.findAll('.chat-message--assistant p').slice(0, 12).map(node => node.element);
    expect(finished.map(node => node.textContent)).toEqual(history.map((_, index) => `Finished answer ${index}`));

    const prefix = wrapper.findAll('.chat-message--assistant p')[12]!.element;
    state.value = { ...state.value, messages: [...history, answer('live', 'Finished **prefix**.\n\nHello', 'streaming')] };
    await flushPromises();

    expect(wrapper.text()).toContain('Hello');
    expect(wrapper.findAll('.chat-message--assistant p')[12]!.element).toBe(prefix);
    expect(wrapper.findAll('.chat-message--assistant p').slice(0, 12).map(node => node.element)).toEqual(finished);
    wrapper.unmount();
    binding.dispose();
  });
});
