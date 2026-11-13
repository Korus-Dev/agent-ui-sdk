// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '../../src/vue';

const mountButton = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(CopyButton, { props: { action: () => undefined, label: 'Copy link', copiedLabel: 'Copied', ...props }, slots });
const showsCheck = (wrapper: ReturnType<typeof mountButton>) => wrapper.find('svg.tabler-icon-check').exists();

describe('CopyButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('swaps to a check after copying and back to the copy icon after 1.5 seconds', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountButton({ action });
    expect(showsCheck(wrapper)).toBe(false);

    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(action).toHaveBeenCalledTimes(1);
    expect(showsCheck(wrapper)).toBe(true);

    vi.advanceTimersByTime(1_499);
    await flushPromises();
    expect(showsCheck(wrapper)).toBe(true);
    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(showsCheck(wrapper)).toBe(false);
  });

  it('keeps the accessible label constant and switches only the tooltip', async () => {
    const wrapper = mountButton();
    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy link');
    expect(wrapper.get('button').attributes('title')).toBe('Copy link');

    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy link');
    expect(wrapper.get('button').attributes('title')).toBe('Copied');
  });

  it('shows no check and does not throw when the action rejects', async () => {
    const wrapper = mountButton({ action: () => Promise.reject(new Error('denied')) });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(showsCheck(wrapper)).toBe(false);
    expect(wrapper.get('button').attributes('title')).toBe('Copy link');
  });

  it('also stays quiet when the action throws synchronously', async () => {
    const wrapper = mountButton({ action: () => { throw new Error('denied'); } });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(showsCheck(wrapper)).toBe(false);
  });

  it('sizes the control and its icon from the size prop', () => {
    expect(mountButton().classes()).not.toContain('copy-button--small');
    expect(mountButton({ size: 'regular' }).classes()).not.toContain('copy-button--small');
    expect(mountButton({ size: 'small' }).classes()).toContain('copy-button--small');
  });

  it('puts the default slot beside the icon', () => {
    const wrapper = mountButton({}, { default: '<span class="text">Copy</span>' });
    expect(wrapper.find('.text').exists()).toBe(true);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.classes()).toContain('copy-button--labelled');
  });

  it('restarts the reset timer on a second copy and cleans up on unmount', async () => {
    const wrapper = mountButton();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    vi.advanceTimersByTime(1_000);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    vi.advanceTimersByTime(1_000);
    expect(showsCheck(wrapper)).toBe(true);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not copy while disabled', async () => {
    const action = vi.fn();
    const wrapper = mountButton({ action, disabled: true });
    await wrapper.get('button').trigger('click');
    expect(action).not.toHaveBeenCalled();
  });
});
