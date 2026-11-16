<template>
  <div
    class="agent-ui-theme chat-message chat-message--compaction"
    :class="{ 'chat-message--compaction-running': running }"
  >
    <div class="chat-message__compaction-line" />
    <span class="chat-message__compaction-title" :data-label="title">
      <span
        class="chat-message__compaction-label"
        :class="{ 'agent-ui-text-shimmer': running }"
      >
        {{ title }}
      </span>
    </span>
    <div class="chat-message__compaction-line" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = defineProps<{
  completedTitle: string
  runningTitle: string
  status?: 'completed' | 'running'
}>()
// Stryker restore all

const running = computed(() => props.status === 'running')
const title = computed(() => running.value ? props.runningTitle : props.completedTitle)
</script>

<style scoped>
.chat-message {
  display: flex;
}

.chat-message--compaction {
  align-items: center;
  gap: var(--space-6);
  min-height: 28px;
}

.chat-message--compaction-running .chat-message__compaction-line {
  opacity: 0.64;
}

/* A line on each side of the title: no label background, so any conversation backdrop shows through. */
.chat-message__compaction-line {
  flex: 1 1 0;
  min-width: 0;
  border-top: 1px solid var(--color-border);
}

.chat-message__compaction-title {
  flex: 0 1 auto;
  display: inline-block;
}

.chat-message__compaction-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-14);
}
</style>
