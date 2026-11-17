<template>
  <button
    class="agent-ui-theme chat-composer__voice agent-ui-interactive"
    :data-variant="recording ? 'primary' : undefined"
    :data-appearance="recording ? 'solid' : undefined"
    :class="{ 'chat-composer__voice--recording': recording }"
    type="button"
    :disabled="disabled"
    :aria-pressed="recording"
    :aria-label="label"
    :title="title"
    @click="emit('toggle')"
    @pointerenter="hovered = recording && $event.pointerType !== 'touch'"
    @pointerleave="hovered = false"
  >
    <slot v-if="recording && !hovered && $slots.recording" name="recording" />
    <component :is="hovered ? MicrophoneOffIcon : MicrophoneIcon" v-else aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { MicrophoneIcon, MicrophoneOffIcon } from '../shared/icons/app-icons'
import { ref, watch } from 'vue'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = defineProps<{
  disabled: boolean
  label: string
  recording: boolean
  title: string
}>()

const emit = defineEmits<{
  toggle: []
}>()
// Stryker restore all
const hovered = ref(false)
watch(() => props.recording, () => { hovered.value = false })
</script>

<style scoped>
.chat-composer__voice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--chat-composer-compact-control-size, var(--chat-composer-button-size-small, 28px));
  height: var(--chat-composer-compact-control-size, var(--chat-composer-button-size-small, 28px));
  border: 0;
  border-radius: var(--radius-full);
  --agent-ui-state-rest-foreground: var(--color-text-muted);
  --agent-ui-state-primary-solid-foreground: #fff;
  --agent-ui-state-disabled-opacity: 0.42;
}

.chat-composer__voice svg {
  width: 20px;
  height: 20px;
  stroke-width: 1.8;
}

</style>
