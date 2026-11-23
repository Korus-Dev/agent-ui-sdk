<template>
  <component
    v-if="resolvedIcon"
    :is="resolvedIcon"
    class="chat-tool-icon"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  BrainIcon,
  FileArrowRightIcon,
  FileTextIcon,
  FolderIcon,
  ListDetailsIcon,
  MessageIcon,
  PencilIcon,
  PhotoIcon,
  PlugIcon,
  SearchIcon,
  SwitchHorizontalIcon,
  Terminal2Icon,
  ToolIcon,
  Trash2Icon,
  UsersIcon,
  WorldIcon,
  WorldSearchIcon,
} from '../shared/icons/app-icons'
import type { ToolPresentation } from './tool-presentation'
import { parseToolStatusDescriptor } from './tool-status'
import { isImageGenerationToolCall, type MessageToolCall } from './types'

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = defineProps<{
  presentation?: ToolPresentation
  toolCall: MessageToolCall
}>()
// Stryker restore all

const resolvedIcon = computed<Component | undefined>(() => {
  if (props.presentation?.icon === null) return undefined
  if (props.presentation?.icon) return props.presentation.icon

  if (isImageGenerationToolCall(props.toolCall)) return PhotoIcon
  if (props.toolCall.kind === 'webSearch') return WorldSearchIcon
  if (props.toolCall.kind === 'subagent') return UsersIcon

  const descriptor = parseToolStatusDescriptor(props.toolCall.status)
  if (descriptor) {
    switch (descriptor.action) {
      case 'create': return PencilIcon
      case 'delete': return Trash2Icon
      case 'edit': return PencilIcon
      case 'explore':
      case 'list': return FolderIcon
      case 'fetch': return WorldIcon
      case 'manage_agents': return UsersIcon
      case 'mcp': return PlugIcon
      case 'message': return MessageIcon
      case 'move': return FileArrowRightIcon
      case 'plan': return ListDetailsIcon
      case 'read': return FileTextIcon
      case 'run': return Terminal2Icon
      case 'search': return SearchIcon
      case 'switch_mode': return SwitchHorizontalIcon
      case 'think': return BrainIcon
    }
  }

  return isCommandLikeToolCall(props.toolCall) ? Terminal2Icon : ToolIcon
})

function isCommandLikeToolCall(toolCall: MessageToolCall): boolean {
  if (toolCall.kind === 'command') return true
  if (isRecord(toolCall.args) && typeof toolCall.args.command === 'string') return true

  return [toolCall.function, toolCall.status].some((value) => (
    typeof value === 'string'
    && /(?:^|\s)(?:\/bin\/)?(?:bash|cmd|fish|powershell|pwsh|sh|zsh)(?:\s|$)/i.test(value)
  ))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
</script>

<style scoped>
.chat-tool-icon {
  width: 15px;
  height: 15px;
}
</style>
