import { createApp } from 'vue';
import App from './App.vue';
import '@korus-dev/agent-ui-sdk/styles.css';
import './styles.css';
createApp(App).mount('#app');

import '../electron/relay/src/renderer/styles.css';
