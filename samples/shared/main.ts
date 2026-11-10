import { createApp } from 'vue';
import '@korus-dev/agent-ui-sdk/styles.css';

async function start() {
  const shape = new URLSearchParams(location.search).get('sample') ?? 'relay';
  document.title = shape === 'spark' ? 'Spark' : shape === 'relay' ? 'Relay' : 'Basic';
  if (shape === 'spark') {
    const { default: Spark } = await import('../electron/spark/src/renderer/App.vue');
    await import('../electron/spark/src/renderer/styles.css');
    createApp(Spark).mount('#app');
  } else {
    const { default: App } = await import('./App.vue');
    await import('./styles.css');
    if (shape === 'relay') await import('../electron/relay/src/renderer/styles.css');
    createApp(App).mount('#app');
  }
}
void start();
