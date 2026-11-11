<template>
  <div
    class="agent-ui-theme agent-ui-conversation-history-loader"
    role="status"
    aria-live="polite"
    aria-label="Loading conversation"
  >
    <div class="agent-ui-conversation-history-loader__inner">
      <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--user" />
      <div class="agent-ui-conversation-history-loader__group">
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--wide" />
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--medium" />
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--short" />
      </div>
      <div class="agent-ui-conversation-history-loader__group">
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--tool" />
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--wide" />
        <div class="agent-ui-conversation-history-loader__block agent-ui-conversation-history-loader__block--medium" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-ui-conversation-history-loader {
  --conversation-history-loader-shine: var(--color-shine, rgb(255 255 255 / 64%));
  display: grid;
  align-items: center;
  height: 100%;
  padding: var(--space-8) var(--space-32);
}

.agent-ui-conversation-history-loader__inner {
  display: grid;
  gap: var(--space-8);
}

.agent-ui-conversation-history-loader__group {
  display: grid;
  gap: var(--space-3);
  max-width: 560px;
}

.agent-ui-conversation-history-loader__block {
  position: relative;
  overflow: hidden;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-surface-base);
}

.agent-ui-conversation-history-loader__block::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--conversation-history-loader-shine) 48%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: agent-ui-conversation-history-loader-shine 1.35s ease-in-out infinite;
}

.agent-ui-conversation-history-loader__block--user {
  justify-self: end;
  width: min(260px, 55%);
  height: 34px;
  border-radius: var(--radius-xl);
}

.agent-ui-conversation-history-loader__block--wide {
  width: min(520px, 100%);
}

.agent-ui-conversation-history-loader__block--medium {
  width: min(420px, 82%);
}

.agent-ui-conversation-history-loader__block--short {
  width: min(280px, 58%);
}

.agent-ui-conversation-history-loader__block--tool {
  width: min(340px, 72%);
  height: 28px;
  border-radius: var(--radius-lg);
}

@keyframes agent-ui-conversation-history-loader-shine {
  to {
    transform: translateX(100%);
  }
}
</style>
