<template>
  <img v-if="source" :src="source" class="browser-extension-icon" :class="{ 'browser-extension-icon--large': size === 'large' }" alt="" aria-hidden="true" />
  <PuzzleIcon v-else class="browser-extension-icon" :class="{ 'browser-extension-icon--large': size === 'large' }" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PuzzleIcon } from '../shared/icons/app-icons';

const props = defineProps<{ source?: string; size?: 'small' | 'large' }>();
const source = computed(() => props.source);
</script>

<style scoped>
.browser-extension-icon {
  display: block;
  width: var(--icon-lg);
  height: var(--icon-lg);
  flex: 0 0 auto;
  object-fit: contain;
}

.browser-extension-icon--large {
  width: var(--space-16);
  height: var(--space-16);
}
</style>
