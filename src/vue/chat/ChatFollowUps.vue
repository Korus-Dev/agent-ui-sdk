<template>
  <div class="agent-ui-theme chat-follow-ups">
    <button
      v-for="prompt in prompts"
      :key="prompt"
      class="chat-follow-ups__chip agent-ui-interactive"
      :disabled="disabled"
      type="button"
      @click="emit('send-follow-up', prompt)"
    >
      {{ prompt }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
defineProps<{
  disabled?: boolean
  prompts: string[]
}>()

const emit = defineEmits<{
  'send-follow-up': [prompt: string]
}>()
// Stryker restore all
</script>

<style scoped>
.chat-follow-ups {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: var(--space-4) 0;
}

.chat-follow-ups__chip {
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-6);
  --agent-ui-state-rest: var(--color-surface-lowest);
  --agent-ui-state-rest-foreground: var(--color-text-muted);
  /* A chip inverts on hover. */
  --agent-ui-state-hover: var(--color-text-muted);
  --agent-ui-state-hover-foreground: var(--color-surface-lowest);
  --agent-ui-state-disabled-opacity: 0.55;
  font-family: var(--font-family-base);
  font-size: var(--font-size-14);
  line-height: var(--line-height-20);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
