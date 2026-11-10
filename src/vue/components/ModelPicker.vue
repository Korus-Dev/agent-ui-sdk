<template>
  <div class="model-picker">
    <div v-if="$slots.header || serviceTiers.length" class="model-picker__header">
      <slot name="header" />
      <slot v-if="serviceTiers.length" name="service-tier" :items="tierItems" :tiers="serviceTiers" :select="selectTier">
        <select :aria-label="serviceTierLabel" :value="selection.serviceTier ?? ''" :disabled="disabled" @change="selectTier(($event.target as HTMLSelectElement).value)">
          <option value="">{{ standardTierLabel }}</option>
          <option v-for="tier in serviceTiers" :key="tier.id" :value="tier.id">{{ tier.name }}</option>
        </select>
      </slot>
    </div>
    <AppMenu class="app-menu--embedded" :items="modelItems" :ariaLabel="modelLabel" @select="selectModel" />
    <div v-if="loading" class="model-picker__loading" aria-busy="true" role="status" :aria-label="loadingLabel">
      <span v-for="row in 4" :key="row" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ModelOption } from '@korus-dev/multi-agent-sdk';
import AppMenu from '../shared/menu/AppMenu.vue';
import type { AppMenuItem } from '../shared/menu/app-menu';
import type { ModelSelection } from '../model-selection';

const props = withDefaults(defineProps<{
  models: readonly ModelOption[];
  selection: ModelSelection;
  disabled?: boolean;
  loading?: boolean;
  modelLabel?: string;
  serviceTierLabel?: string;
  standardTierLabel?: string;
  loadingLabel?: string;
}>(), { disabled: false, loading: false, modelLabel: 'Model', serviceTierLabel: 'Service tier', standardTierLabel: 'Standard', loadingLabel: 'Loading models' });
const emit = defineEmits<{ 'update:selection': [selection: ModelSelection]; select: [] }>();
const model = computed(() => props.selection.model);
const reasoningEffort = computed(() => props.selection.reasoningEffort);
const selectedModel = computed(() => props.models.find(option => option.model === model.value));
const serviceTiers = computed(() => selectedModel.value?.serviceTiers ?? []);
const tierItems = computed<AppMenuItem[]>(() => [
  { id: '', label: props.standardTierLabel, type: 'radio', checked: !props.selection.serviceTier, disabled: props.disabled },
  ...serviceTiers.value.map(tier => ({ id: tier.id, label: tier.name, type: 'radio' as const, checked: props.selection.serviceTier === tier.id, disabled: props.disabled })),
]);
const modelItems = computed<AppMenuItem[]>(() => [
  ...props.models.map((option, index): AppMenuItem => {
    const selected = model.value === option.model;
    if (!option.supportedReasoningEfforts?.length) return { id: `model:${index}`, label: option.displayName ?? option.model, type: 'radio', checked: selected, disabled: props.disabled };
    const summary = selected ? reasoningEffort.value : '';
    return {
      id: `submenu:${index}`, type: 'submenu', label: option.displayName ?? option.model, checked: selected, disabled: props.disabled,
      ...(summary ? { value: summary } : {}),
      items: [
        ...(option.supportedReasoningEfforts ?? []).map((effort, effortIndex): AppMenuItem => ({
          id: `effort:${index}:${effortIndex}`, label: effort.reasoningEffort, type: 'radio', disabled: props.disabled,
          checked: selected && reasoningEffort.value === effort.reasoningEffort,
        })),
      ],
    };
  }),
]);

function selectModel(id: string) {
  if (props.disabled) return;
  const [kind, index, effortIndex] = id.split(':');
  const option = props.models[Number(index)];
  if (!option) return;
  const efforts = option.supportedReasoningEfforts ?? [];
  const effort = kind === 'effort' ? efforts[Number(effortIndex)]?.reasoningEffort
    : efforts.find(value => value.reasoningEffort === props.selection.reasoningEffort)?.reasoningEffort
      ?? option.defaultReasoningEffort ?? efforts[0]?.reasoningEffort ?? null;
  const tier = option.serviceTiers?.some(value => value.id === props.selection.serviceTier) ? props.selection.serviceTier : null;
  emit('update:selection', { model: option.model, reasoningEffort: effort ?? null, serviceTier: tier ?? null });
  emit('select');
}
function selectTier(id: string) {
  if (props.disabled || (id && !serviceTiers.value.some(tier => tier.id === id))) return;
  emit('update:selection', { ...props.selection, serviceTier: id || null });
}
</script>

<style scoped>
.model-picker__header { display: flex; align-items: center; margin-bottom: var(--space-4, 8px); border-bottom: 1px solid var(--color-border, #ddd); }
.model-picker__loading { display: grid; gap: var(--space-4, 8px); padding: var(--space-4, 8px) var(--space-6, 12px); }
.model-picker__loading span { height: 14px; border-radius: var(--radius-sm, 4px); background: var(--color-surface-base, #eee); }
</style>
