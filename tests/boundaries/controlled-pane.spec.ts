// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ConversationPane, Composer, MessageList } from '../../src/vue';

describe('generic controlled pane', () => {
  it('preserves explicit boolean history flags through the prop/event interface', async () => {
    const pane = mount(ConversationPane, { props: {
      messages: [{ id: 'm', role: 'assistant', status: 'complete', parts: [{ type: 'text', text: 'Ready' }] }],
      hasOlderHistory: true, loadingOlderHistory: true,
    } });
    expect(pane.findComponent(MessageList).props()).toMatchObject({ hasOlderMessages: true, loadingOlderMessages: true });
    await pane.setProps({ hasOlderHistory: false, loadingOlderHistory: false });
    expect(pane.findComponent(MessageList).props()).toMatchObject({ hasOlderMessages: false, loadingOlderMessages: false });
  });

  it('starts with neutral host-controlled catalogs and no native surface prop', () => {
    const pane = mount(ConversationPane);
    const composer = pane.findComponent({ name: 'Composer' });
    expect(composer.props('capabilities')).toMatchObject({ models: false, skills: false, goals: false, approvals: false });
    expect(composer.props('commands')).toEqual([]);
    expect(pane.text()).toContain('Start a conversation');
    expect(pane.text()).not.toContain('Codex');
    expect(pane.get('[contenteditable]').attributes('data-placeholder')).toBe('Ask a question…');
    expect((ConversationPane as unknown as { props: Record<string, unknown> }).props).not.toHaveProperty('surface');
    const standalone = mount(Composer, { props: { disabled: false, isSending: false } });
    expect(standalone.props('commands')).toBeUndefined();
  });
});
