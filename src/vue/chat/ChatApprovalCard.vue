<template>
  <section class="agent-ui-theme agent-ui-request-card chat-tool-confirmation">
    <header class="agent-ui-request-header chat-tool-confirmation__header">
      <span class="agent-ui-request-eyebrow chat-tool-confirmation__tag">
        <ShieldCheckIcon :size="16" aria-hidden="true" />
        Approve tool call
      </span>
    </header>
    <span class="agent-ui-request-title chat-tool-confirmation__question">{{ summary }}</span>
    <p v-if="description" class="agent-ui-request-description chat-tool-confirmation__description">{{ description }}</p>
    <details v-if="details || $slots.details" class="chat-tool-confirmation__details">
      <summary class="chat-tool-confirmation__details-summary">Details</summary>
      <div class="chat-tool-confirmation__details-body">
        <slot name="details"><pre>{{ details }}</pre></slot>
      </div>
    </details>
    <footer class="agent-ui-request-footer chat-tool-confirmation__actions">
      <button
        v-for="action in actions"
        :key="action.id"
        class="agent-ui-request-button chat-tool-confirmation__button"
        :class="{ 'agent-ui-request-button--primary': action.primary, 'chat-tool-confirmation__button--primary': action.primary }"
        type="button"
        :disabled="disabled"
        @click="$emit('decide', action.id)"
      >{{ action.label }}</button>
    </footer>
  </section>
</template>

<script setup lang="ts" generic="Decision extends string">
import { ShieldCheckIcon } from '../shared/icons/app-icons'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
defineProps<{
  summary: string
  description?: string
  details?: string
  disabled?: boolean
  actions: readonly { id: Decision; label: string; primary?: boolean }[]
}>()
defineEmits<{ decide: [decision: Decision] }>()
// Stryker restore all

</script>

<style scoped src="./request-controls.css"></style>

<style scoped>
.chat-tool-confirmation__details-body pre {
  margin: 0;
  font: inherit;
  white-space: inherit;
}

.chat-tool-confirmation__details {
  margin: 0;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-12);
  line-height: var(--line-height-20);
}

.chat-tool-confirmation__details-summary {
  width: fit-content;
  cursor: pointer;
}

.chat-tool-confirmation__details-body {
  max-height: 12rem;
  overflow: auto;
  margin: var(--space-3) 0 0;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-low);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-12);
  line-height: var(--line-height-20);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
