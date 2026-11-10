<template>
  <NativeConversationPane
    v-if="mode === 'bare'"
    :surface="surface"
    :conversation-key="hostKey"
    has-older-history
    loading-older-history
    disabled
    actions-disabled
  />
  <NativeConversationPane
    v-else-if="mode === 'false'"
    :surface="surface"
    :conversation-key="hostKey"
    :has-older-history="false"
    :loading-older-history="false"
    :disabled="false"
    :busy="false"
    :actions-disabled="false"
    :selected-model-id="null"
  />
  <NativeConversationPane v-else :surface="surface" />
</template>

<script setup lang="ts">
import { NativeConversationPane, type CodexSurfaceController } from '../../../src/vue/native';
defineProps<{ surface: CodexSurfaceController; mode: 'bare' | 'false' | 'absent'; hostKey?: string | number | null }>();
</script>
