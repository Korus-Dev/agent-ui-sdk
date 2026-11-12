// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import Composer from '../../src/vue/components/Composer.vue';
import { HarnessModelSelector } from '../../src/vue';

const icon = (name: string) => defineComponent({ render: () => h('svg', { 'data-icon': name }) });
const harnesses = [{ id: 'codex', label: 'Codex', icon: icon('codex') }, { id: 'claude', label: 'Claude', icon: icon('claude') }];
const models = [
  { id: 'opus', model: 'opus', displayName: 'Opus 5.5', supportedReasoningEfforts: [{ reasoningEffort: 'low', description: '' }, { reasoningEffort: 'high', description: '' }], defaultReasoningEffort: 'high' },
  { id: 'haiku', model: 'haiku', displayName: 'Haiku 4.5' },
  { id: 'fast', model: 'fast', displayName: 'Fast one', serviceTiers: [{ id: 'priority', name: 'Priority', description: '' }, { id: 'flex', name: 'Flex', description: '' }] },
];
const selection = { model: 'opus', reasoningEffort: 'high', serviceTier: null };
const mounted: Array<{ unmount(): void }> = [];
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = ''; });
const mountSelector = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(HarnessModelSelector, { props: { models, selection, harnesses, harness: 'claude', ...props }, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
};
const open = async (props: Record<string, unknown> = {}) => {
  const wrapper = mountSelector(props);
  await wrapper.get('button.provider-model-selector').trigger('click');
  return wrapper;
};
const row = (wrapper: { findAll(selector: string): Array<{ text(): string; trigger(event: string): Promise<void> }> }, text: string) =>
  wrapper.findAll('[role="menuitemradio"]').find(item => item.text().includes(text))!;

it('shows the selected model, effort and harness icon on the trigger', () => {
  const trigger = mountSelector().get('button.provider-model-selector');
  expect(trigger.text()).toContain('Opus 5.5');
  expect(trigger.text()).toContain('high');
  expect(trigger.find('[data-icon="claude"]').exists()).toBe(true);
});

it('opens a popover with one tab per harness and reports the harness the person picks', async () => {
  const wrapper = await open();
  expect(wrapper.get('button.provider-model-selector').attributes('aria-expanded')).toBe('true');
  const tabs = wrapper.findAll('[role="tab"]');
  expect(tabs.map(tab => tab.attributes('aria-label'))).toEqual(['Codex', 'Claude']);
  expect(tabs.map(tab => tab.attributes('aria-selected'))).toEqual(['false', 'true']);
  await tabs[0]!.trigger('click');
  expect(wrapper.emitted('update:harness')).toEqual([['codex']]);
});

it('shows no tabs for a single harness', async () => {
  const wrapper = await open({ harnesses: [harnesses[0]], harness: 'codex' });
  expect(wrapper.find('[role="tab"]').exists()).toBe(false);
});

it('reports the model the person picks and closes', async () => {
  const wrapper = await open();
  await row(wrapper, 'Haiku 4.5').trigger('click');
  expect(wrapper.emitted('update:selection')).toEqual([[{ model: 'haiku', reasoningEffort: null, serviceTier: null }]]);
  expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
});

it('closes on Escape, returning focus to the trigger, and on a click outside', async () => {
  const wrapper = await open();
  await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' });
  expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  expect(document.activeElement).toBe(wrapper.get('button.provider-model-selector').element);
  await wrapper.get('button.provider-model-selector').trigger('click');
  expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  document.body.click();
  await flushPromises();
  expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
});

it('opens above or below the trigger as asked, and never when disabled', async () => {
  expect((await open()).get('[role="dialog"]').classes()).toContain('provider-model-selector__popover--bottom');
  expect((await open({ placement: 'top' })).get('[role="dialog"]').classes()).toContain('provider-model-selector__popover--top');
  const disabled = await open({ disabled: true });
  expect(disabled.find('[role="dialog"]').exists()).toBe(false);
});

it('offers the speed choices of the selected model in a menu and reports the tier', async () => {
  const wrapper = await open({ selection: { model: 'fast', reasoningEffort: null, serviceTier: null } });
  const button = wrapper.get('.provider-model-selector__tier-button');
  expect(wrapper.find('.provider-model-selector__tier-list').exists()).toBe(false);
  await button.trigger('click');
  const tiers = wrapper.get('.provider-model-selector__tier-list');
  await tiers.findAll('[role="menuitemradio"]').find(item => item.text().includes('Priority'))!.trigger('click');
  expect(wrapper.emitted('update:selection')?.at(-1)).toEqual([{ model: 'fast', reasoningEffort: null, serviceTier: 'priority' }]);
  expect(wrapper.find('.provider-model-selector__tier-list').exists()).toBe(false);
});

it('is the composer model selector: it opens upward and reports picks as composer events', async () => {
  const props = { disabled: false, isSending: false, capabilities: { models: true, reasoningEffort: true } as never, models, selectedModelId: 'opus', selectedReasoningEffort: 'high', harnesses, harness: 'claude' };
  const picker = mount(Composer, { props, attachTo: document.body });
  mounted.push(picker);
  await picker.get('button.provider-model-selector').trigger('click');
  expect(picker.get('[role="dialog"]').classes()).toContain('provider-model-selector__popover--top');
  await row(picker, 'Haiku 4.5').trigger('click');
  expect(picker.emitted('update:modelId')).toEqual([['haiku']]);
  await picker.get('button.provider-model-selector').trigger('click');
  await picker.findAll('[role="tab"]')[0]!.trigger('click');
  expect(picker.emitted('update:harness')).toEqual([['codex']]);
});
