<template>
  <ComposerMenuItems
    :aria-label="ariaLabel"
    :items="items"
    :pinned-item-count="pinnedItemCount"
    @select="forwardSelection"
  >
    <template v-if="$slots.icon" #icon="scope"><slot name="icon" v-bind="scope" /></template>
    <template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template>
  </ComposerMenuItems>
</template>

<script setup lang="ts" generic="Payload = unknown">
import type { ComposerMenuItem, ComposerMenuSelectableItem } from '../composer-menu';
import ComposerMenuItems from './composer-menu-items';

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
withDefaults(defineProps<{
  ariaLabel?: string;
  items: readonly ComposerMenuItem<Payload>[];
  pinnedItemCount?: number;
}>(), {
  ariaLabel: 'Composer actions',
  pinnedItemCount: 0,
});

const emit = defineEmits<{
  select: [item: ComposerMenuSelectableItem<Payload>];
}>();
// Stryker restore all

function forwardSelection(item: ComposerMenuSelectableItem<unknown>): void {
  emit('select', item as ComposerMenuSelectableItem<Payload>);
}
</script>

<style>
.agent-ui-composer-menu-list {
  display: flex;
  flex-direction: column;
  width: var(--agent-ui-composer-menu-width, 220px);
  padding: var(--agent-ui-composer-menu-padding, var(--space-2));
  border: 1px solid var(--agent-ui-border-color, var(--color-border, #dedede));
  border-radius: var(--agent-ui-composer-menu-radius, 12px);
  color: var(--agent-ui-text-color, var(--color-text, #0d0d0d));
  background: var(--agent-ui-surface-color, var(--color-surface-lowest, #fff));
  box-shadow: var(--agent-ui-composer-menu-shadow, var(--shadow-menu, 0 4px 6px rgb(0 0 0 / 8%), 0 2px 4px rgb(0 0 0 / 5%)));
  box-sizing: border-box;
  font-family: var(--agent-ui-font-family, var(--font-family-base, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif));
  font-size: var(--agent-ui-composer-menu-font-size, var(--chat-menu-font-size, 13.5px));
  line-height: 18px;
}

.agent-ui-composer-menu-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--chat-menu-control-min-height, 28px);
  margin-block: 0.125px;
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-radius: var(--agent-ui-composer-menu-item-radius, 12px);
  color: inherit;
  background: transparent;
  font-family: inherit;
  font-size: var(--agent-ui-composer-menu-item-font-size, var(--chat-menu-font-size, 13.5px));
  line-height: var(--chat-menu-line-height, 20px);
  text-align: left;
  cursor: pointer;
}

.agent-ui-composer-menu-list--pinned {
  max-height: min(420px, calc(100dvh - 80px));
}

.agent-ui-composer-menu-list__pinned {
  flex: 0 0 auto;
  max-height: min(210px, calc((100dvh - 80px) / 2));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.agent-ui-composer-menu-list__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.agent-ui-composer-menu-list__item:hover:not(:disabled),
.agent-ui-composer-menu-list__item:focus-visible {
  background: var(--agent-ui-hover-color, var(--color-surface-low, #f4f4f4));
  outline: none;
}

.agent-ui-composer-menu-list__item:disabled {
  color: var(--agent-ui-muted-text-color, var(--color-text-muted, #666));
  cursor: not-allowed;
  opacity: 0.58;
}

.agent-ui-composer-menu-list__item--danger {
  color: var(--agent-ui-danger-color, var(--color-error, #d5351f));
}

.agent-ui-composer-menu-list__item--switch {
  padding-block: var(--space-1);
}

.agent-ui-composer-menu-list__item--submenu {
  padding-right: var(--space-2);
}

.agent-ui-composer-menu-list__icon,
.agent-ui-composer-menu-list__chevron,
.agent-ui-composer-menu-list__selection {
  width: var(--agent-ui-composer-menu-icon-size, 16px);
  height: var(--agent-ui-composer-menu-icon-size, 16px);
  flex: 0 0 auto;
}

.agent-ui-composer-menu-list__chevron,
.agent-ui-composer-menu-list__selection {
  color: var(--agent-ui-muted-text-color, var(--color-text-muted, #666));
}

.agent-ui-composer-menu-list__chevron {
  stroke-width: 2.5px;
}

.agent-ui-composer-menu-list__icon--empty {
  visibility: hidden;
}

.agent-ui-composer-menu-list__icon:is(svg),
.agent-ui-composer-menu-list__icon svg {
  opacity: 0.5;
  stroke-width: 2px;
}

.agent-ui-composer-menu-list__item[aria-checked="true"] .agent-ui-composer-menu-list__icon:is(svg),
.agent-ui-composer-menu-list__item[aria-checked="true"] .agent-ui-composer-menu-list__icon svg {
  opacity: 1;
  stroke-width: 2.5px;
}

.agent-ui-composer-menu-list__item[role="menuitemradio"] .agent-ui-composer-menu-list__icon:is(svg):not(.agent-ui-composer-menu-list__radio-check),
.agent-ui-composer-menu-list__item[role="menuitemradio"] .agent-ui-composer-menu-list__icon svg {
  opacity: 0.4;
  stroke-width: 2px;
}

.agent-ui-composer-menu-list__item[role="menuitemradio"][aria-checked="true"] .agent-ui-composer-menu-list__selection {
  color: inherit;
  opacity: 1;
}

.agent-ui-composer-menu-list__copy {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  white-space: nowrap;
}

.agent-ui-composer-menu-list__label {
  font-weight: var(--font-weight-regular);
}

.agent-ui-composer-menu-list__description,
.agent-ui-composer-menu-list__value {
  color: var(--agent-ui-muted-text-color, var(--color-text-muted, #666));
  font-size: var(--agent-ui-composer-menu-description-font-size, var(--chat-menu-description-font-size, 12px));
}

.agent-ui-composer-menu-list__value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-ui-composer-menu-list__value-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.agent-ui-composer-menu-list__value-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--agent-ui-hover-color, var(--color-surface-low, #f4f4f4));
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
}

.agent-ui-composer-menu-list__separator {
  height: 1px;
  flex-shrink: 0;
  margin: var(--space-2) var(--space-1);
  background: var(--agent-ui-border-color, var(--color-border, #dedede));
}

.agent-ui-composer-menu-list__heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4) var(--space-2) calc(var(--space-4) + var(--agent-ui-composer-menu-icon-size, 16px) + var(--space-3));
  color: var(--agent-ui-muted-text-color, var(--color-text-muted, #666));
  font-size: var(--agent-ui-composer-menu-heading-font-size, var(--chat-menu-font-size, 13.5px));
  font-weight: var(--font-weight-regular);
  line-height: 18px;
}

.agent-ui-composer-menu-list__heading-label {
  min-width: 0;
  flex: 1 1 auto;
}

.agent-ui-composer-menu-list__heading-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.agent-ui-composer-menu-list__heading-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.agent-ui-composer-menu-list__heading-action:hover:not(:disabled),
.agent-ui-composer-menu-list__heading-action:focus-visible {
  color: var(--agent-ui-text-color, var(--color-text, #0d0d0d));
  background: var(--agent-ui-hover-color, var(--color-surface-low, #f4f4f4));
  outline: none;
}

.agent-ui-composer-menu-list__heading-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.agent-ui-composer-menu-list__heading-action > svg {
  width: 16px;
  height: 16px;
}

.agent-ui-composer-menu-list__submenu {
  position: relative;
}

.agent-ui-composer-menu-list__submenu-list {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 100%;
}

.agent-ui-composer-menu-list__submenu-list--bottom-aligned {
  top: auto;
  bottom: 0;
}

.agent-ui-composer-menu-list__submenu-list--wide {
  width: 360px;
  max-width: min(360px, calc(100vw - 24px));
}

.agent-ui-composer-menu-list__icon-toggle {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--agent-ui-muted-text-color, var(--color-text-muted, #666));
}

.agent-ui-composer-menu-list__icon-toggle > svg {
  width: 16px;
  height: 16px;
}

.agent-ui-composer-menu-list__item[aria-checked="true"] .agent-ui-composer-menu-list__icon-toggle {
  color: var(--agent-ui-primary-color, var(--color-primary, #1b4fb2));
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.agent-ui-composer-menu-list__switch {
  position: relative;
  width: 28px;
  height: 16px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--agent-ui-border-color, var(--color-border-strong, #b0b0b0));
  transition: background-color 120ms ease;
}

.agent-ui-composer-menu-list__switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--agent-ui-surface-color, var(--color-surface-lowest, #fff));
  box-shadow: 0 1px 2px rgb(0 0 0 / 24%);
  transition: transform 120ms ease;
}

.agent-ui-composer-menu-list__switch--checked {
  background: var(--agent-ui-primary-color, var(--color-primary, #1b4fb2));
}

.agent-ui-composer-menu-list__switch--checked .agent-ui-composer-menu-list__switch-thumb {
  transform: translateX(12px);
}

.agent-ui-composer-menu-list__color-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.agent-ui-composer-menu-list__submenu:not(.agent-ui-composer-menu-list__submenu--open) > .agent-ui-composer-menu-list__submenu-list {
  display: none;
}
</style>
