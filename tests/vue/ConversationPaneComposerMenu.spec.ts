// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  ConversationPane,
  createConversationPaneController,
} from '../../src/vue';

describe('ConversationPane composer menu', () => {
  it('routes controller leading items between Approval and Plan mode', async () => {
    const menuSelect = vi.fn();
    const permissions = { id: 'permissions', type: 'custom' as const, label: 'Permissions' };
    const controller = createConversationPaneController({
      state: {
        identity: { messages: [] },
        capabilities: {
          models: false, skills: false, reasoningEffort: false, serviceTier: false,
          planMode: true, goals: true, approvals: true, permissions: [{ id: 'ask-for-approval' }],
          steerPrompt: false, interrupt: false, history: false,
          deleteTurn: false, editTurn: false, retryTurn: false,
        },
        catalogs: { commands: [{ id: 'host.goal', name: 'goal', composerMode: { label: 'Goal' } }] },
        composer: {
          permission: 'ask-for-approval',
          leadingMenuItems: [permissions],
          menuItems: [{ id: 'custom', type: 'custom', label: 'Custom' }],
        },
      },
      actions: { menuSelect },
    });
    const wrapper = mount(ConversationPane, { props: { controller } });

    await wrapper.get('button[aria-label="Composer actions"]').trigger('click');

    const menu = wrapper.get('.chat-composer-action-menu').element;
    const labels = Array.from(menu.children).flatMap((child) => {
      const button = child instanceof HTMLButtonElement
        ? child
        : child.querySelector(':scope > button');
      const label = button?.querySelector('.agent-ui-composer-menu-list__label')?.textContent?.trim();
      return label ? [label] : [];
    });
    expect(labels).toStrictEqual(['Permissions', 'Permissions', 'Goal mode', 'Plan mode', 'Custom', 'Add Files & Photos']);

    await wrapper.findAll('button').find((button) => button.text() === 'Permissions' && !button.attributes('aria-haspopup'))!.trigger('click');
    expect(menuSelect).toHaveBeenCalledWith(permissions);
  });
});
