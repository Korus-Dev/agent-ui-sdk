<template>
  <div ref="root" class="provider-model-selector__root" @keydown.esc.stop.prevent="close(true)">
      <button ref="trigger" class="provider-model-selector" type="button" :disabled="disabled" :aria-label="t('modelPicker.label')" aria-haspopup="dialog" :aria-expanded="open" @click.stop="toggle">
        <ProviderIcon v-if="provider" :provider="provider" />
        <span class="provider-model-selector__label">{{ selectedModel?.displayName ?? (provider ? providerDisplayName(provider) : '') }}</span>
        <span v-if="reasoningEffort" class="provider-model-selector__effort">{{ reasoningEffort }}</span>
        <span v-if="serviceTierName" class="provider-model-selector__effort">{{ serviceTierName }}</span>
        <ChevronDown class="provider-model-selector__chevron" aria-hidden="true" />
      </button>
    <div v-if="open" ref="popover" class="provider-model-selector__popover" :class="[`provider-model-selector__popover--${placement}`, `provider-model-selector__popover--${align}`]" :style="popoverStyle" role="dialog" :aria-label="t('modelPicker.label')" @mouseover="placeFlyout" @focusin="placeFlyout">
    <ModelPicker :models="models" :selection="{ model, reasoningEffort, serviceTier }" :disabled="disabled" :loading="loading"
      :model-label="t('modelPicker.model')" :service-tier-label="t('modelPicker.serviceTier')"
      :standard-tier-label="t('modelPicker.standardTier')" :loading-label="t('modelPicker.loading')"
      @update:selection="updateModelSelection" @select="open = false">
      <template #header>
      <div class="provider-model-selector__tabs" :role="tabs.length ? 'tablist' : undefined" :aria-label="tabs.length ? t('surface.agentDialog.codingAgent') : undefined">
        <template v-if="tabs.length">
          <button v-for="choice in tabs" :key="choice" class="provider-model-selector__tab" :class="{ 'provider-model-selector__tab--active': choice === provider }" type="button" role="tab" :aria-selected="choice === provider" :title="providerDisplayName(choice)" :aria-label="providerDisplayName(choice)" :disabled="disabled" @click="provider = choice"><ProviderIcon :provider="choice" /></button>
        </template>
        <span v-else-if="provider && harnessChoice(provider)?.icon" class="provider-model-selector__current" role="img" :title="providerDisplayName(provider)" :aria-label="providerDisplayName(provider)"><ProviderIcon :provider="provider" /></span>
      </div>
      </template>
      <template #service-tier="{ items, select }">
        <span class="provider-model-selector__tier" :title="serviceTiers.length ? tierTooltip : t('modelPicker.speedUnavailable')">
          <span v-if="serviceTiers.length > 1" class="provider-model-selector__tier-menu">
            <button class="provider-model-selector__tier-button" :class="{ 'provider-model-selector__tier-button--active': activeTier }" type="button" aria-haspopup="menu" :aria-expanded="tierOpen" :disabled="disabled" :aria-label="tierAccessibleName" @click.stop="tierOpen = !tierOpen"><UltrafastIcon v-if="activeTier === 'ultrafast'" :size="16" /><BoltIcon v-else aria-hidden="true" /></button>
            <AppMenu v-if="tierOpen" class="app-menu--embedded provider-model-selector__tier-list" :ariaLabel="t('modelPicker.serviceTier')" :items="items" @select="id => { select(id); tierOpen = false; }" />
          </span>
          <button v-else class="provider-model-selector__tier-button" :class="{ 'provider-model-selector__tier-button--active': activeTier }" type="button" :disabled="disabled || !serviceTiers.length" :aria-label="tierAccessibleName" :aria-pressed="Boolean(activeTier)" @click="select(activeTier ? '' : serviceTiers[0]!.id)"><UltrafastIcon v-if="activeTier === 'ultrafast'" :size="16" /><BoltIcon v-else aria-hidden="true" /></button>
        </span>
      </template>
    </ModelPicker>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Component } from 'vue';
import type { ModelOption } from '../chat/contracts';
import ModelPicker from './ModelPicker.vue';
import UltrafastIcon from '../chat/UltrafastIcon.vue';
import { useChatTranslate } from '../chat/chat-i18n';
import type { ModelSelection } from '../model-selection';
import AppMenu from '../shared/menu/AppMenu.vue';
import { BoltIcon, ChevronDown } from '../shared/icons/app-icons';

/** One harness the person can pick from. The app supplies the wording and the icon. */
export type HarnessChoice = { id: string; label: string; icon?: Component };

const props = withDefaults(defineProps<{
  models: readonly ModelOption[];
  selection: ModelSelection;
  disabled?: boolean;
  loading?: boolean;
  /** The harnesses offered as tabs. Tabs appear only when there are at least two. */
  harnesses?: readonly HarnessChoice[];
  /** The id of the selected harness. */
  harness?: string;
  /** Which side of the trigger the picker opens on. A composer at the bottom of a view wants `'top'`. */
  placement?: 'top' | 'bottom';
  /** Which edge of the trigger the picker lines up with. `'end'` also opens the model submenus leftward. */
  align?: 'start' | 'end';
}>(), { placement: 'bottom', align: 'start' });
const emit = defineEmits<{ 'update:selection': [selection: ModelSelection]; 'update:harness': [harness: string] }>();

const chatTranslate = useChatTranslate();
const labels: Record<string, string> = {
  'modelPicker.label': 'chat.modelSelector.label', 'modelPicker.model': 'chat.modelSelector.model',
  'modelPicker.serviceTier': 'chat.modelSelector.serviceTier', 'modelPicker.standardTier': 'chat.modelSelector.standardTier',
  'modelPicker.loading': 'chat.modelSelector.loading', 'modelPicker.currentServiceTier': 'chat.modelSelector.currentServiceTier',
  'modelPicker.normalSpeed': 'chat.modelSelector.normalSpeed', 'modelPicker.fastMode': 'chat.modelSelector.fastMode',
  'modelPicker.speedUnavailable': 'chat.modelSelector.speedUnavailable',
  'surface.agentDialog.codingAgent': 'chat.modelSelector.agent',
};
const t = (key: string, params?: Record<string, unknown>) => chatTranslate(labels[key]!, params);
const harnessChoice = (id: string | undefined) => props.harnesses?.find(choice => choice.id === id);
const providerDisplayName = (id: string) => harnessChoice(id)?.label ?? id;
const ProviderIcon = (iconProps: { provider: string }) => {
  const icon = harnessChoice(iconProps.provider)?.icon;
  return icon ? h(icon, { class: 'provider-icon', 'aria-hidden': 'true' }) : null;
};
const provider = computed({ get: () => props.harness, set: value => { if (value !== undefined) emit('update:harness', value); } });
const tabs = computed(() => (props.harnesses?.length ?? 0) > 1 ? props.harnesses!.map(choice => choice.id) : []);
const model = computed(() => props.selection.model ?? null);
const reasoningEffort = computed(() => props.selection.reasoningEffort ?? null);
const serviceTier = computed(() => props.selection.serviceTier ?? null);
const open = ref(false);
const tierOpen = ref(false);
watch([open, provider, model], () => { tierOpen.value = false; });
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
function toggle() { if (!props.disabled) open.value = !open.value; }
function close(restoreFocus = false) {
  if (!open.value && !tierOpen.value) return;
  open.value = false;
  tierOpen.value = false;
  if (restoreFocus) void nextTick(() => trigger.value?.focus());
}
function closeOnOutsideClick(event: MouseEvent) {
  if (root.value && event.target && !root.value.contains(event.target as Node)) close(false);
}
onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutsideClick);
  stopTracking();
});

// The popover and its submenus are fixed-position, placed from the trigger's rectangle: they stay inside the
// viewport, are never clipped by a scrolling ancestor such as a dialog, and the model list can scroll on its own.
const popover = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const viewportMargin = 8;
const popoverGap = 6;
function placePopover() {
  const anchor = trigger.value?.getBoundingClientRect();
  if (!anchor) return;
  const above = props.placement === 'top';
  const room = above ? anchor.top - popoverGap - viewportMargin : window.innerHeight - anchor.bottom - popoverGap - viewportMargin;
  popoverStyle.value = {
    '--provider-count': String(props.harnesses?.length ?? 0),
    '--provider-available-height': `${Math.max(120, room)}px`,
    ...(above ? { bottom: `${window.innerHeight - anchor.top + popoverGap}px` } : { top: `${anchor.bottom + popoverGap}px` }),
    left: `${anchor.left}px`,
  };
  // The width is only known once rendered: line up with the requested edge, then keep inside the viewport.
  void nextTick(() => {
    const width = popover.value?.offsetWidth;
    if (!width) return;
    const wanted = props.align === 'end' ? anchor.right - width : anchor.left;
    const left = Math.max(viewportMargin, Math.min(wanted, window.innerWidth - width - viewportMargin));
    popoverStyle.value = { ...popoverStyle.value, left: `${left}px` };
  });
}
// A submenu opens to the right of its row, or to the left when there is no room; it is fixed so the scrolling list cannot clip it.
function placeFlyout(event: Event) {
  const row = (event.target as HTMLElement | null)?.closest<HTMLElement>('.app-menu__submenu');
  const flyout = row?.querySelector<HTMLElement>(':scope > .app-menu__submenu-menu');
  if (!row || !flyout) return;
  const anchor = row.getBoundingClientRect();
  flyout.style.position = 'fixed';
  requestAnimationFrame(() => {
    const { offsetWidth: width, offsetHeight: height } = flyout;
    const fitsRight = anchor.right + width <= window.innerWidth - viewportMargin;
    flyout.style.right = 'auto';
    flyout.style.left = `${fitsRight ? anchor.right : Math.max(viewportMargin, anchor.left - width)}px`;
    flyout.style.top = `${Math.max(viewportMargin, Math.min(anchor.top, window.innerHeight - viewportMargin - height))}px`;
  });
}
function track() {
  window.addEventListener('resize', placePopover);
  window.addEventListener('scroll', placePopover, true);
}
function stopTracking() {
  window.removeEventListener('resize', placePopover);
  window.removeEventListener('scroll', placePopover, true);
}
watch(open, isOpen => {
  if (!isOpen) return stopTracking();
  placePopover();
  track();
});

// A selection the catalog does not list (not loaded yet, or retired) still shows its id.
const selectedModel = computed(() => props.models.find(option => option.model === model.value)
  ?? (model.value ? { id: model.value, model: model.value, displayName: model.value } : undefined));
const serviceTiers = computed(() => selectedModel.value?.serviceTiers ?? []);
const currentTierName = computed(() => serviceTiers.value.find(tier => tier.id === serviceTier.value)?.name ?? (activeTier.value ?? t('modelPicker.standardTier')));
const tierAccessibleName = computed(() => t('modelPicker.currentServiceTier', { tier: currentTierName.value }));
const tierTooltip = computed(() => !activeTier.value ? t('modelPicker.normalSpeed') : currentTierName.value.toLowerCase() === 'fast' ? t('modelPicker.fastMode') : currentTierName.value);
// Lowercase like the effort next to it, so the two read as one setting.
const tierLabel = (name: string) => name.toLowerCase();
// Standard speed is reported as 'normal' or 'default' by some harnesses: it is not a speed to call out.
const activeTier = computed(() => serviceTier.value && !['normal', 'default'].includes(serviceTier.value) ? serviceTier.value : null);
// A tier the catalog does not list (an older chat, or a catalog still loading) still shows its id.
const serviceTierName = computed(() => activeTier.value ? tierLabel(selectedModel.value?.serviceTiers?.find(tier => tier.id === activeTier.value)?.name ?? activeTier.value) : '');
function updateModelSelection(value: ModelSelection) {
  emit('update:selection', value);
}
</script>

<style scoped>
/* Reads as a form field so it sits naturally next to other form controls. */
.provider-model-selector {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  max-width: 100%;
  min-height: 32px;
  padding: 0 var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface-lowest);
  font: inherit;
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-regular);
  text-align: left;
  cursor: pointer;
}

.provider-model-selector:hover:not(:disabled),
.provider-model-selector:focus-visible {
  border-color: var(--color-border-strong);
}

.provider-model-selector:disabled {
  opacity: 0.5;
  cursor: default;
}

.provider-model-selector__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-model-selector__effort {
  flex: none;
  margin-left: calc(var(--space-2) * -1);
  color: var(--color-text-muted);
}

.provider-model-selector svg,
.provider-model-selector :deep(.provider-icon) {
  flex: none;
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.provider-model-selector__chevron {
  margin-left: auto;
  color: var(--color-text-muted);
}
</style>

<style>
.provider-model-selector__root {
  position: relative;
  display: block;
  min-width: 0;
}

.provider-model-selector__popover {
  /* Placed from the trigger in script (fixed), so it stays in the viewport and out of any clipping ancestor. */
  position: fixed;
  z-index: 20;
  display: flex;
  flex-direction: column;
  /* Each harness gets a 60px cell; the rest is the popover padding and the speed button. */
  width: max-content;
  min-width: max(240px, calc(var(--provider-count, 0) * 60px + 64px));
  max-width: calc(100vw - 16px);
  max-height: min(480px, var(--provider-available-height, 480px));
  padding: calc(var(--space-4) - 3px) var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  background: var(--color-surface-lowest);
  box-shadow: var(--shadow-menu);
}

/* The header (tabs and speed) stays put; only the model list scrolls. */
.provider-model-selector__popover .model-picker {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.provider-model-selector__popover .model-picker > .app-menu--embedded {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

/* A sliver of a scrollbar: a muted, rounded thumb and no track. */
.provider-model-selector__popover .model-picker > .app-menu--embedded::-webkit-scrollbar {
  width: 4px;
}

.provider-model-selector__popover .model-picker > .app-menu--embedded::-webkit-scrollbar-track {
  background: transparent;
}

.provider-model-selector__popover .model-picker > .app-menu--embedded::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: color-mix(in srgb, var(--color-text-muted) 45%, transparent);
}

@supports not selector(::-webkit-scrollbar) {
  .provider-model-selector__popover .model-picker > .app-menu--embedded {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--color-text-muted) 45%, transparent) transparent;
  }
}

.provider-model-selector__popover .model-picker__header {
  flex: none;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.provider-model-selector__tabs {
  display: flex;
  flex: 1;
  min-width: 0;
}

/* With no tabs, the current harness shows where they would be. It is not interactive. */
.provider-model-selector__current {
  display: inline-grid;
  place-items: center;
  width: 60px;
  min-height: 32px;
  padding: 0 0 var(--space-2);
  color: var(--color-text);
}

.provider-model-selector__current .provider-icon {
  width: var(--icon-md);
  height: var(--icon-md);
}

.provider-model-selector__tier {
  display: inline-flex;
  flex: none;
  align-items: center;
  align-self: stretch;
  position: relative;
  box-sizing: border-box;
  /* Fixed width, at the right end whether or not there are tabs. */
  width: 40px;
  /* Same offset as the tabs, so the bolt shares their center line. */
  padding: 0 0 var(--space-2) var(--space-4);
  margin-left: auto;
}

/* A short divider centered on the icons, so it never meets the line below. */
.provider-model-selector__tier::before {
  content: "";
  position: absolute;
  top: calc((100% - var(--space-2) - 20px) / 2);
  left: 0;
  width: 1px;
  height: 20px;
  background: var(--color-border);
}

.provider-model-selector__tier-menu {
  position: relative;
  display: inline-flex;
}

.provider-model-selector__tier-list {
  position: absolute;
  z-index: 21;
  top: calc(100% + 6px);
  right: 0;
  width: 188px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-lowest);
  box-shadow: var(--shadow-menu);
}

.provider-model-selector__tier-button {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
}

.provider-model-selector__tier-button:disabled {
  cursor: default;
  opacity: 0.3;
}

.provider-model-selector__tier-button--active {
  color: var(--color-primary);
}

.provider-model-selector__tier-button--active > svg {
  fill: currentcolor;
}

.provider-model-selector__tab {
  position: relative;
  display: inline-grid;
  flex: 1 1 0;
  min-width: 0;
  place-items: center;
  min-height: 32px;
  /* Nudges the icon 2px below true center, which reads as centered next to the top padding. */
  padding: 0 0 var(--space-2);
  border: 0;
  outline: none;
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
}

.provider-model-selector__tab::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
}

.provider-model-selector__tab--active {
  color: var(--color-text);
}

.provider-model-selector__tab--active::after {
  background: var(--color-primary);
}

.provider-model-selector__tab:disabled {
  cursor: default;
  opacity: 0.5;
}

.provider-model-selector__tab .provider-icon,
.provider-model-selector__tier-button > svg {
  width: var(--icon-md);
  height: var(--icon-md);
}
</style>
