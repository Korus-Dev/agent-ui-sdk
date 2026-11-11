<template>
  <component v-if="renderer && !failed && code.length <= 100_000" :is="renderer" :source="code" :language="language" :complete="complete" />
  <pre v-else class="agent-ui-theme"><code>{{ code }}</code></pre>
</template>
<script setup lang="ts">
import { computed, onErrorCaptured, ref, watch } from 'vue'
import { useCustomBlocks } from './custom-blocks'
const props = defineProps<{ language: string; code: string; complete: boolean }>()
const renderers = useCustomBlocks()
const renderer = computed(() => renderers[props.language])
const failed = ref(false)
watch(() => props.code, () => { failed.value = false })
onErrorCaptured(() => { failed.value = true; return false })
</script>
