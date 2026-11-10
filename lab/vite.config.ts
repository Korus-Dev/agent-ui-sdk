import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { sourceAliases } from '../source-aliases';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
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
