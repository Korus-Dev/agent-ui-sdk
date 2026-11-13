<template>
  <ChatIconButton
    class="copy-button"
    :class="{ 'copy-button--small': size === 'small', 'copy-button--labelled': $slots.default }"
    :disabled="disabled"
    :label="label"
    :title="copied ? copiedLabel : label"
    @click="copy"
  >
    <CheckIcon v-if="copied" />
    <CopyIcon v-else />
    <slot />
  </ChatIconButton>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { CheckIcon, CopyIcon } from '../shared/icons/app-icons'
import ChatIconButton from './ChatIconButton.vue'

const props = withDefaults(defineProps<{
  /** Copies something; when it throws or rejects the button shows no check and the caller reports the error. */
  action: () => Promise<unknown> | unknown
  /** The tooltip while the check shows. */
  copiedLabel: string
  disabled?: boolean
  /** The accessible name, which never changes, and the tooltip before copying. */
  label: string
  size?: 'small' | 'regular'
}>(), { size: 'regular' })

const copied = ref(false)
let resetTimeout: ReturnType<typeof setTimeout> | null = null

async function copy() {
  try {
    await props.action()
  } catch {
    return
  }
  copied.value = true
  if (resetTimeout) clearTimeout(resetTimeout)
  resetTimeout = setTimeout(() => {
    copied.value = false
    resetTimeout = null
  }, 1_500)
}

onBeforeUnmount(() => {
  if (resetTimeout) clearTimeout(resetTimeout)
})
</script>

<style scoped>
.copy-button--small {
  --chat-message-action-control-size: 20px;
  --chat-icon-button-icon-size: 12px;
}

.copy-button--labelled {
  width: auto;
  gap: var(--space-2);
  padding-inline: var(--space-3);
  font: 500 var(--font-size-12) / 1 var(--font-family-ui);
}
</style>
