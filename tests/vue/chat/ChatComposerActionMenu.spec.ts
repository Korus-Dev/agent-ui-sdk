// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import ChatComposerActionMenu from '../../../src/vue/chat/ChatComposerActionMenu.vue';
import type { ComposerMenuItem, ComposerMenuSelectableItem } from '../../../src/vue/composer-menu';

describe('ChatComposerActionMenu', () => {
  it('closes when clicking outside the menu', async () => {
    const wrapper = mountMenu();

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    expect(wrapper.find('.chat-composer-action-menu').exists()).toBe(true);

    document.body.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.chat-composer-action-menu').exists()).toBe(false);
  });

  it('does not open when disabled', async () => {
    const wrapper = mountMenu({ disabled: true });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');

    expect(wrapper.find('.chat-composer-action-menu').exists()).toBe(false);
  });

  it('lists the permissions the harness offers, whatever their ids, and emits the selected id', async () => {
    const wrapper = mountMenu({
      permission: 'bypassPermissions',
      permissions: [{ id: 'default', label: 'Ask for approval' }, { id: 'acceptEdits', description: 'Edits files without asking.' }, { id: 'bypassPermissions', dangerous: true }],
      showPermissionMenu: true,
    });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');

    expect(wrapper.get('.agent-ui-composer-menu-list__submenu > button').text()).toBe('Permissions');
    expect(wrapper.get('.agent-ui-composer-menu-list__submenu > button > svg').classes()).toContain('tabler-icon-shield-check');
    // The app's words win; without them the label is the id made readable, and a dangerous option says so.
    expect(wrapper.text()).toContain('Ask for approval');
    expect(wrapper.text()).toContain('Accept Edits');
    expect(wrapper.text()).toContain('Edits files without asking.');
    expect(wrapper.text()).toContain('Bypass Permissions');
    expect(wrapper.text()).toContain('Allows tools to run without approval.');
    expect(wrapper.find('.agent-ui-composer-menu-list__chevron').exists()).toBe(true);
    const approvalItems = wrapper.findAll('[role="menuitemradio"]');
    expect(approvalItems.map((item) => item.attributes('aria-checked')))
      .toStrictEqual(['false', 'false', 'true']);
    expect(approvalItems.map((item) => item.get('svg').attributes('class'))).toStrictEqual([
      expect.stringContaining('tabler-icon-hand-stop'),
      expect.stringContaining('tabler-icon-hand-stop'),
      expect.stringContaining('agent-ui-composer-menu-list__radio-check'),
    ]);
    await wrapper.findAll('[role="menuitemradio"]')[1]?.trigger('click');

    expect(wrapper.emitted('selectPermission')).toStrictEqual([['acceptEdits']]);
    expect(wrapper.find('.chat-composer-action-menu').exists()).toBe(false);
  });

  it.each([false, true])('separates approval once when the host supplies a divider: %s', async (hostDivider) => {
    const wrapper = mountMenu({ showPermissionMenu: true, showGoalMode: true,
      leadingMenuItems: hostDivider ? [{ id: 'app-commands', type: 'separator' }] : [],
    });
    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    const children = [...wrapper.get('.chat-composer-action-menu').element.children];
    expect(children[1]!.classList.contains('agent-ui-composer-menu-list__separator')).toBe(true);
    expect(children.filter(child => child.classList.contains('agent-ui-composer-menu-list__separator'))).toHaveLength(1);
  });

  it.each([
    [false, true],
    [true, false],
  ])('toggles plan mode from %s to %s', async (planMode, expected) => {
    const wrapper = mountMenu({ planMode });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    const planItem = wrapper.get('[role="menuitemcheckbox"]');
    expect(planItem.attributes('aria-checked')).toBe(String(planMode));
    expect(planItem.find('.agent-ui-composer-menu-list__switch').exists()).toBe(true);
    await planItem.trigger('click');

    expect(wrapper.emitted('update:planMode')).toStrictEqual([[expected]]);
  });

  it('selects an approval preset through the visible hover submenu', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    onTestFinished(() => { vi.useRealTimers(); });
    const wrapper = mountMenu({
      permission: 'ask-for-approval',
      permissions: [{ id: 'ask-for-approval' }, { id: 'approve-for-me' }, { id: 'full-access', dangerous: true }],
      showPermissionMenu: true,
    });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    const approvalSubmenu = wrapper.get('.agent-ui-composer-menu-list__submenu');
    await approvalSubmenu.trigger('mouseenter');

    expect(approvalSubmenu.classes()).toContain('agent-ui-composer-menu-list__submenu--open');
    const fullAccess = wrapper.findAll('[role="menuitemradio"]')
      .find((item) => item.text().includes('Full access'))!;

    // Chromium briefly clears focus between pointer-down and focusing the
    // submenu item. The submenu must remain mounted for the matching click.
    const approvalTrigger = approvalSubmenu.get('button[role="menuitem"]');
    (approvalTrigger.element as HTMLButtonElement).blur();
    await wrapper.vm.$nextTick();
    (fullAccess.element as HTMLButtonElement).focus();
    await vi.runOnlyPendingTimersAsync();

    expect(approvalSubmenu.classes()).toContain('agent-ui-composer-menu-list__submenu--open');
    await fullAccess.trigger('click');

    expect(wrapper.emitted('selectPermission')).toStrictEqual([['full-access']]);
    expect(wrapper.find('.chat-composer-action-menu').exists()).toBe(false);
  });

  it('lists only the permissions the harness offers', async () => {
    const wrapper = mountMenu({
      permission: 'ask-for-approval',
      permissions: [{ id: 'ask-for-approval' }],
      showPermissionMenu: true,
    });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');

    expect(wrapper.get('.agent-ui-composer-menu-list__submenu > button').text()).toBe('Permissions');
    expect(wrapper.get('.agent-ui-composer-menu-list__submenu > button > svg').classes()).toContain('tabler-icon-shield-check');
    expect(wrapper.findAll('[role="menuitemradio"]').map((item) => item.text())).toStrictEqual(['Ask for approval']);
  });

  it('merges host actions into the full menu and emits their payload', async () => {
    const wrapper = mountMenu({
      items: [{ id: 'refresh', type: 'custom', label: 'Refresh', payload: { source: 'host' } }],
    });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    await wrapper.findAll('button').find((button) => button.text().includes('Refresh'))!.trigger('click');

    expect(wrapper.emitted('select')).toStrictEqual([[
      expect.objectContaining({ id: 'refresh', payload: { source: 'host' } }),
    ]]);
  });

  it('renders leading host actions after Approval and before Goal then Plan mode', async () => {
    const wrapper = mountMenu({
      permission: 'ask-for-approval',
      permissions: [{ id: 'ask-for-approval' }],
      leadingMenuItems: [{
        id: 'permissions',
        type: 'custom',
        label: 'Permissions',
        payload: { source: 'host' },
      }],
      items: [{ id: 'refresh', type: 'custom', label: 'Refresh', payload: { source: 'host' } }],
      showPermissionMenu: true,
      showGoalMode: true,
      showPlanMode: true,
    });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');

    const menu = wrapper.get('.chat-composer-action-menu').element;
    const labels = Array.from(menu.children).flatMap((child) => {
      const button = child instanceof HTMLButtonElement
        ? child
        : child.querySelector(':scope > button');
      const label = button?.querySelector('.agent-ui-composer-menu-list__label')?.textContent?.trim();
      return label ? [label] : [];
    });
    expect(labels).toStrictEqual(['Permissions', 'Permissions', 'Goal mode', 'Plan mode', 'Refresh']);
  });

  it('enables attachment selection only when the host supports it', async () => {
    const wrapper = mountMenu({ attachEnabled: true });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    await wrapper.findAll('button').find((button) => button.text().includes('Add Files & Photos'))!.trigger('click');

    expect(wrapper.emitted('attach')).toStrictEqual([[]]);
  });

  it('adds exactly one attachment separator only after an existing action', async () => {
    const attachOnly = mountMenu({ attachEnabled: true, showPlanMode: false });
    await attachOnly.get('.chat-composer-action-menu__button').trigger('click');
    expect(attachOnly.findAll('.agent-ui-composer-menu-list__separator')).toHaveLength(0);

    const afterAction = mountMenu({ attachEnabled: true, showPlanMode: true });
    await afterAction.get('.chat-composer-action-menu__button').trigger('click');
    expect(afterAction.findAll('.agent-ui-composer-menu-list__separator')).toHaveLength(1);

    const afterSeparator = mountMenu({
      attachEnabled: true,
      items: [{ id: 'existing-separator', type: 'separator' }],
      showPlanMode: false,
    });
    await afterSeparator.get('.chat-composer-action-menu__button').trigger('click');
    expect(afterSeparator.findAll('.agent-ui-composer-menu-list__separator')).toHaveLength(1);
  });

  it.each([
    ['approval id without an action payload', { id: 'permission:host', type: 'custom', label: 'Approval host', payload: null }],
    ['approval payload without an approval id', {
      id: 'host-approval', type: 'custom', label: 'Host approval',
      payload: { kind: 'permission', permission: 'full-access' },
    }],
    ['non-approval action payload', {
      id: 'permission:attach', type: 'custom', label: 'Approval attach', payload: { kind: 'attach' },
    }],
    ['primitive payload', { id: 'permission:text', type: 'custom', label: 'Approval text', payload: 'host' }],
  ] satisfies Array<[string, ComposerMenuItem<unknown>]>)('routes a host item with %s to the host', async (_, item) => {
    const wrapper = mountMenu({ items: [item] });
    await wrapper.get('.chat-composer-action-menu__button').trigger('click');
    await wrapper.findAll('button').find((button) => button.text().includes(item.label))!.trigger('click');

    expect(wrapper.emitted('select')).toStrictEqual([[item]]);
    expect(wrapper.emitted('selectPermission')).toBeUndefined();
    expect(wrapper.emitted('attach')).toBeUndefined();
  });

  it('renders no action-menu root when every menu source is empty', () => {
    const wrapper = mountMenu({ attachEnabled: false, showPlanMode: false });

    expect(wrapper.find('.chat-composer-action-menu__root').exists()).toBe(false);
    expect(wrapper.find('.chat-composer-action-menu__button').exists()).toBe(false);
  });

  it('omits the attachment item and its separator when attachments are unavailable', async () => {
    const wrapper = mountMenu({ attachEnabled: false, showPlanMode: true });

    await wrapper.get('.chat-composer-action-menu__button').trigger('click');

    expect(wrapper.text()).toContain('Plan mode');
    expect(wrapper.text()).not.toContain('Add Files & Photos');
    expect(wrapper.find('.agent-ui-composer-menu-list__separator').exists()).toBe(false);
  });

  it('forwards host item and icon slots through both composer menu layers', async () => {
    const item: ComposerMenuItem<{ source: string }> = {
      id: 'host-action',
      type: 'custom',
      label: 'Host action',
      payload: { source: 'host' },
    };
    const itemSlotWrapper = mount(ChatComposerActionMenu, {
      props: {
        items: [item],
        planMode: false,
        showPlanMode: false,
      },
      slots: {
        item: ({ item: slotItem }: { item: ComposerMenuSelectableItem }) => (
          h('span', { class: 'host-menu-item' }, `item:${slotItem.label}`)
        ),
      },
    });
    await itemSlotWrapper.get('.chat-composer-action-menu__button').trigger('click');
    expect(itemSlotWrapper.get('.host-menu-item').text()).toBe('item:Host action');

    const iconSlotWrapper = mount(ChatComposerActionMenu, {
      props: {
        items: [item],
        planMode: false,
        showPlanMode: false,
      },
      slots: {
        icon: ({ item: slotItem }: { item: ComposerMenuSelectableItem }) => (
          h('span', { class: 'host-menu-icon' }, `icon:${slotItem.id}`)
        ),
      },
    });
    await iconSlotWrapper.get('.chat-composer-action-menu__button').trigger('click');

    expect(iconSlotWrapper.get('.host-menu-icon').text()).toBe('icon:host-action');
  });
});

function mountMenu(props: Partial<{
  permission: string | null;
  permissions: { id: string; label?: string; description?: string; dangerous?: boolean }[];
  attachEnabled: boolean;
  disabled: boolean;
  leadingMenuItems: ComposerMenuItem<unknown>[];
  items: ComposerMenuItem<unknown>[];
  planMode: boolean;
  showPermissionMenu: boolean;
  showGoalMode: boolean;
  showPlanMode: boolean;
}> = {}) {
  return mount(ChatComposerActionMenu, {
    props: {
      disabled: false,
      permission: null,
      planMode: false,
      showPermissionMenu: false,
      ...props,
    },
    attachTo: document.body,
  });
}
