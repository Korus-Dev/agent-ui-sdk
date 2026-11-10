import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { sourceAliases } from '../source-aliases';
import { liveChatServer } from './live-chat-server';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), liveChatServer()],
  optimizeDeps: { exclude: ['@korus-dev/agent-ui-sdk'] },
  resolve: { alias: sourceAliases, dedupe: ['vue'] },
  build: { outDir: '../dist-lab', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5176,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] },
  },
});
