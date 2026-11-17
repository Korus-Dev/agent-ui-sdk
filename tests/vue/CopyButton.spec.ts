// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '../../src/vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(CopyButton, { props: { action: () => undefined, label: 'Copy link', copiedLabel: 'Copied', ...props } });
const showsCheck = (wrapper: ReturnType<typeof mountButton>) => wrapper.find('svg.tabler-icon-check').exists();

describe('CopyButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('swaps to a check after copying and back after 1.5 seconds, without changing the accessible label', async () => {
    const wrapper = mountButton({ action: vi.fn().mockResolvedValue(undefined) });
    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(showsCheck(wrapper)).toBe(true);
    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy link');
    expect(wrapper.get('button').attributes('title')).toBe('Copied');

    vi.advanceTimersByTime(1_500);
    await flushPromises();
    expect(showsCheck(wrapper)).toBe(false);
    expect(wrapper.get('button').attributes('title')).toBe('Copy link');
  });

  it('shows no check and does not throw when the action rejects or throws', async () => {
    for (const action of [() => Promise.reject(new Error('denied')), () => { throw new Error('denied'); }]) {
      const wrapper = mountButton({ action });
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(showsCheck(wrapper)).toBe(false);
    }
  });

  it('puts the default slot beside the icon and sizes the small variant', () => {
    const wrapper = mount(CopyButton, { props: { action: () => undefined, label: 'Copy', copiedLabel: 'Copied', size: 'small' }, slots: { default: '<span class="text">Copy</span>' } });
    expect(wrapper.find('.text').exists()).toBe(true);
    expect(wrapper.classes()).toContain('copy-button--small');
  });

  it('clears its reset timer on unmount', async () => {
    const wrapper = mountButton();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
