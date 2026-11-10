// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import ModelPicker from '../../src/vue/components/ModelPicker.vue';

it('renders the supplied catalog and emits a selection without persisting consumer data', async () => {
  const persist = vi.spyOn(Storage.prototype, 'setItem');
  const selection = { model: 'vendor:model', reasoningEffort: 'low', serviceTier: null };
  const wrapper = mount(ModelPicker, { props: { selection, models: [{
    id: 'catalog-id', model: 'vendor:model', supportedReasoningEfforts: [{ reasoningEffort: 'high', description: '' }],
    serviceTiers: [{ id: 'custom-speed', name: 'Custom speed' }],
  }] } });
  try {
    expect(wrapper.text()).toContain('vendor:model');
    await wrapper.findAll('[role="menuitemradio"]').find(item => item.text() === 'high')!.trigger('click');
    expect(wrapper.emitted('update:selection')).toStrictEqual([[{ model: 'vendor:model', reasoningEffort: 'high', serviceTier: null }]]);
    expect(selection.reasoningEffort).toBe('low');
    await wrapper.get('select').setValue('custom-speed');
    expect(wrapper.emitted('update:selection')?.at(-1)).toStrictEqual([{ model: 'vendor:model', reasoningEffort: 'low', serviceTier: 'custom-speed' }]);
    expect(persist).not.toHaveBeenCalled();
  } finally { wrapper.unmount(); persist.mockRestore(); }
});

it('exposes loading and disabled state while keeping provider controls host-owned', () => {
  const wrapper = mount(ModelPicker, { props: { models: [{ id: 'one', model: 'one' }], selection: {}, loading: true, disabled: true }, slots: { header: '<span>Host tabs</span>' } });
  expect(wrapper.text()).toContain('Host tabs');
  expect(wrapper.get('[role="menuitemradio"]').attributes('disabled')).toBeDefined();
  expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBe('true');
  wrapper.unmount();
});
