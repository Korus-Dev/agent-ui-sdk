<template>
  <button
    class="agent-ui-theme agent-ui-scroll-to-bottom"
    type="button"
    :aria-label="label"
    :title="label"
    @click="emit('click')"
  >
    <ArrowDownIcon aria-hidden="true" :size="24" :stroke-width="1.75" />
  </button>
</template>

<script setup lang="ts">
import { ArrowDownIcon } from '../shared/icons/app-icons';

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
withDefaults(defineProps<{
  label?: string;
}>(), {
  label: 'Scroll to bottom',
});

const emit = defineEmits<{
  click: [];
}>();
// Stryker restore all
</script>

<style scoped>
.agent-ui-scroll-to-bottom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--agent-ui-scroll-to-bottom-size, 48px);
  height: var(--agent-ui-scroll-to-bottom-size, 48px);
  padding: 0;
  border: 1px solid var(--agent-ui-scroll-to-bottom-border, var(--color-border, #e3e5e8));
  border-radius: 50%;
  appearance: none;
  color: var(--agent-ui-scroll-to-bottom-color, var(--color-text, #202124));
  background: var(--agent-ui-scroll-to-bottom-background, var(--color-surface-lowest, #fff));
  box-shadow: var(--agent-ui-scroll-to-bottom-shadow, 0 1px 3px rgb(0 0 0 / 8%));
  cursor: pointer;
  pointer-events: auto;
  transition: background 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}

.agent-ui-scroll-to-bottom > svg {
  pointer-events: none;
}

.agent-ui-scroll-to-bottom:hover,
.agent-ui-scroll-to-bottom:focus-visible {
  background: var(--agent-ui-scroll-to-bottom-hover-background, var(--color-surface-low, #f5f6f7));
  box-shadow: var(--agent-ui-scroll-to-bottom-hover-shadow, 0 2px 6px rgb(0 0 0 / 12%));
}

.agent-ui-scroll-to-bottom:active {
  transform: scale(0.96);
}
</style>
