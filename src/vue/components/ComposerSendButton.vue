<template>
  <button
    class="agent-ui-theme agent-ui-composer-send-button"
    :class="{
      'agent-ui-composer-send-button--busy': busy || interruptArmed,
      'agent-ui-composer-send-button--interrupt-armed': interruptArmed,
      'agent-ui-composer-send-button--disabled': disabled && !hoverActive,
    }"
    type="button"
    :disabled="disabled && !hoverToEnable"
    :aria-disabled="disabled && hoverToEnable && !hoverActive ? 'true' : undefined"
    :aria-label="interruptArmed ? interruptArmedLabel : busy ? interruptLabel : submitLabel"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="handleClick"
  >
    <PlayerPlayFilledIcon v-if="!busy && !interruptArmed" aria-hidden="true" :size="16" />
    <svg
      v-if="busy"
      class="agent-ui-composer-send-button__spinner"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="28" stroke-dashoffset="10" />
    </svg>
    <svg
      v-if="busy || interruptArmed"
      class="agent-ui-composer-send-button__stop"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PlayerPlayFilledIcon } from '../shared/icons/app-icons';

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = withDefaults(defineProps<{
  busy?: boolean;
  disabled?: boolean;
  hoverToEnable?: boolean;
  interruptArmed?: boolean;
  interruptArmedLabel?: string;
  interruptLabel?: string;
  submitLabel?: string;
}>(), {
  busy: false,
  disabled: false,
  hoverToEnable: false,
  interruptArmed: false,
  interruptArmedLabel: 'Press Escape again or click to stop generation',
  interruptLabel: 'Interrupt',
  submitLabel: 'Send',
});

const emit = defineEmits<{
  click: [];
}>();
// Stryker restore all

const hovered = ref(false);
const hoverActive = computed(() => props.hoverToEnable && hovered.value);

function handleClick(): void {
  if (props.disabled && !hoverActive.value) return;
  emit('click');
}
</script>

<style scoped>
.agent-ui-composer-send-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--chat-composer-send-size, var(--chat-composer-control-size, var(--agent-ui-composer-button-size, 32px)));
  height: var(--chat-composer-send-size, var(--chat-composer-control-size, var(--agent-ui-composer-button-size, 32px)));
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--agent-ui-composer-button-foreground, var(--color-surface-lowest, #fff));
  background: var(--agent-ui-composer-button-background, var(--color-text, #202124));
  cursor: pointer;
  transition: opacity 120ms ease, transform 120ms ease, background 120ms ease;
}

.agent-ui-composer-send-button:hover:not(:disabled) {
  background: var(--agent-ui-composer-button-hover-background, color-mix(in srgb, var(--color-text, #202124) 86%, var(--color-background, #fff)));
}

.agent-ui-composer-send-button:active:not(:disabled) {
  transform: scale(0.94);
}

.agent-ui-composer-send-button:disabled,
.agent-ui-composer-send-button--disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.agent-ui-composer-send-button__spinner,
.agent-ui-composer-send-button__stop {
  position: absolute;
}

.agent-ui-composer-send-button__spinner {
  animation: agent-ui-composer-spin 800ms linear infinite;
}

.agent-ui-composer-send-button__stop {
  opacity: 0;
}

.agent-ui-composer-send-button--busy:hover .agent-ui-composer-send-button__spinner {
  opacity: 0;
}

.agent-ui-composer-send-button--busy:hover .agent-ui-composer-send-button__stop {
  opacity: 1;
}

.agent-ui-composer-send-button--interrupt-armed .agent-ui-composer-send-button__spinner {
  opacity: 0;
}

.agent-ui-composer-send-button--interrupt-armed .agent-ui-composer-send-button__stop {
  opacity: 1;
}

@keyframes agent-ui-composer-spin {
  to { transform: rotate(360deg); }
}
</style>
