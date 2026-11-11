// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MessageTurn from '../../src/vue/components/MessageTurn.vue';

describe('MessageTurn', () => {
  it('renders its turn content without adding a layout wrapper', () => {
    const wrapper = mount(MessageTurn, {
      props: { entries: [], showToolBlocks: true, turnId: 'turn-1' },
      slots: { default: '<p>Turn content</p>' },
    });

    expect(wrapper.classes()).toContain('agent-ui-message-turn');
    expect(wrapper.get('p').text()).toBe('Turn content');
  });
});
