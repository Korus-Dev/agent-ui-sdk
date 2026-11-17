<template>
  <div
    class="agent-ui-theme chat-message-actions"
    :class="`chat-message-actions--${message.role}`"
    :aria-busy="deleting ? 'true' : undefined"
    :aria-label="t('chat.actions.label')"
  >
    <span
      v-if="sentAtLabel && message.role === 'user'"
      class="chat-message-actions__sent-at"
      :title="sentAtTitle"
    >
      {{ sentAtLabel }}
    </span>
    <ChatCopyButton
      v-if="showCopy"
      :action="copyMessage"
      :copied-label="t('chat.actions.copied')"
      :disabled="deleting"
      :label="t('chat.actions.copy')"
      :show-icon="iconsVisible"
    />
    <ChatIconButton
      v-if="message.role === 'user' && canEdit && showEdit"
      :disabled="deleting"
      :label="t('chat.actions.edit')"
      @click="emit('edit')"
    >
      <PencilIcon v-if="iconsVisible" />
    </ChatIconButton>
    <ChatIconButton
      v-if="message.role === 'user' && showQuote"
      :disabled="deleting"
      :label="t('chat.actions.quote')"
      @click="emit('quote')"
    >
      <QuoteIcon v-if="iconsVisible" />
    </ChatIconButton>
    <ChatIconButton
      v-if="message.role === 'assistant' && canRetry && showRetry"
      :disabled="mutationDisabled || deleting"
      :label="t('chat.actions.retry')"
      @click="emit('retry')"
    >
      <RotateClockwiseIcon v-if="iconsVisible" />
    </ChatIconButton>
    <ChatIconButton
      v-if="canFork && showFork"
      :disabled="mutationDisabled || deleting"
      :label="t('chat.actions.fork')"
      @click="emit('fork')"
    >
      <ArrowForkIcon v-if="iconsVisible" class="chat-message-actions__fork-icon" />
    </ChatIconButton>
    <ChatIconButton
      v-if="canDelete && showDelete"
      danger
      :disabled="mutationDisabled || deleting"
      :label="deleting ? t('chat.actions.deleting') : t('chat.actions.delete')"
      @click="emit('delete')"
    >
      <Loader2Icon v-if="iconsVisible && deleting" class="chat-message-actions__spinner" />
      <Trash2Icon v-else-if="iconsVisible" />
    </ChatIconButton>
    <span
      v-if="sentAtLabel && message.role === 'assistant'"
      class="chat-message-actions__sent-at"
      :title="sentAtTitle"
    >
      {{ sentAtLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ArrowForkIcon, Loader2Icon, PencilIcon, QuoteIcon, RotateClockwiseIcon, Trash2Icon } from '../shared/icons/app-icons'
import { computed } from 'vue'
import { useChatTranslate } from './chat-i18n'
import ChatCopyButton from './ChatCopyButton.vue'
import ChatIconButton from './ChatIconButton.vue'
import { formatMessageSentAt, fullMessageSentAt } from './message-time'
import type { MessageActionsPresentation } from './contracts'
import type { ChatMessage } from './types'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = withDefaults(defineProps<{
  canDelete?: boolean
  canEdit?: boolean
  canFork?: boolean
  canRetry?: boolean
  copyAction?: () => Promise<void> | void
  deleting?: boolean
  message: ChatMessage
  iconsVisible?: boolean
  mutationDisabled?: boolean
  presentation?: MessageActionsPresentation
}>(), {
  iconsVisible: true,
  canDelete: true,
  canEdit: true,
  canFork: false,
  canRetry: true,
})
// Stryker restore all

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const emit = defineEmits<{
  copy: []
  delete: []
  edit: []
  fork: []
  quote: []
  retry: []
}>()
// Stryker restore all
const t = useChatTranslate()
const showCopy = computed(() => props.presentation?.copy !== false)
const showDelete = computed(() => props.presentation?.delete !== false)
const showEdit = computed(() => props.presentation?.edit !== false)
const showFork = computed(() => props.presentation?.fork !== false)
const showQuote = computed(() => props.presentation?.quote !== false)
const showRetry = computed(() => props.presentation?.retry !== false)
const sentAtLabel = computed(() => props.message.createdAt ? formatMessageSentAt(props.message.createdAt) : '')
const sentAtTitle = computed(() => props.message.createdAt ? fullMessageSentAt(props.message.createdAt) : undefined)

async function copyMessage() {
  await props.copyAction?.()
  emit('copy')
}
</script>

<style scoped>
.chat-message-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) 0;
}

.chat-message-actions--user {
  justify-content: flex-end;
}

.chat-message-actions--assistant {
  justify-content: flex-start;
}

/* Message actions rest in the same muted color as tool calls. */
.chat-message-actions :deep(.chat-icon-button) {
  --agent-ui-state-rest-foreground: var(--color-text-muted);
}

.chat-message-actions {
  /* The space between an icon and its button edge: the label gets the same, so icon-to-icon and icon-to-label gaps match. */
  --chat-message-actions-inset: calc((var(--chat-message-action-control-size, var(--space-12)) - var(--icon-sm)) / 2);
}

.chat-message-actions--assistant .chat-message-actions__sent-at {
  margin-inline-start: var(--chat-message-actions-inset);
}

.chat-message-actions--user .chat-message-actions__sent-at {
  margin-inline-end: var(--chat-message-actions-inset);
}

.chat-message-actions__sent-at {
  color: var(--color-text-muted);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-16);
  white-space: nowrap;
}

.chat-message-actions__fork-icon {
  transform: rotate(90deg);
}

.chat-message-actions__spinner {
  animation: chat-message-actions-spin 800ms linear infinite;
}

@keyframes chat-message-actions-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
