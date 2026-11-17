// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppMenu from '../../src/vue/shared/menu/AppMenu.vue';

describe('AppMenu', () => {
  it('reports a submenu trigger as expanded only while its submenu is open', async () => {
    const wrapper = mount(AppMenu, {
      props: { ariaLabel: 'Menu', items: [{ id: 'more', type: 'submenu', label: 'More', items: [{ id: 'one', type: 'action', label: 'One' }] }] },
    });
    const trigger = wrapper.get('.app-menu__item--submenu');
    expect(trigger.attributes('aria-expanded')).toBe('false');

    await wrapper.get('.app-menu__submenu').trigger('mouseenter');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    await wrapper.get('.app-menu__submenu').trigger('mouseleave');
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });
});
