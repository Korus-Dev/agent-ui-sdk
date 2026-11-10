<template>
  <main class="relay-sign-in">
    <section class="relay-sign-in__card" aria-labelledby="relay-sign-in-title">
      <span class="relay-sign-in__mark" aria-hidden="true">R</span>
      <p class="relay-sign-in__eyebrow">Logistics exception desk</p>
      <h1 id="relay-sign-in-title">Run the shift with Relay</h1>
      <p>Investigate shipment risk, compare recovery plans, and act through one continuous operations conversation.</p>
      <button type="button" :disabled="busy" @click="emit('sign-in')">
        {{ busy ? 'Signing in…' : label }}
      </button>
      <code v-if="loginCommand" class="relay-sign-in__command">{{ loginCommand }}</code>
      <p v-if="error" class="relay-sign-in__error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ busy?: boolean; error?: string | null; label?: string; loginCommand?: string }>(), { label: 'Continue with ChatGPT' });
const emit = defineEmits<{ 'sign-in': [] }>();
</script>
