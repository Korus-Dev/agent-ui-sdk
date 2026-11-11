// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConversationHistoryLoader from '../../src/vue/components/ConversationHistoryLoader.vue';

describe('ConversationHistoryLoader', () => {
  it('renders an accessible themed transcript skeleton in isolation', () => {
    const wrapper = mount(ConversationHistoryLoader);

    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Loading conversation');
    expect(wrapper.classes()).toContain('agent-ui-theme');
    expect(wrapper.findAll('.agent-ui-conversation-history-loader__block')).toHaveLength(7);
  });
});
