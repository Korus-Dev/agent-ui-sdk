import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { sourceAliases } from '../../source-aliases';
export default defineConfig({ root: import.meta.dirname, base: './', plugins: [vue()], resolve: { alias: sourceAliases, dedupe: ['vue'] }, build: { outDir: '../../dist-samples/renderer', emptyOutDir: true }, server: { host: '127.0.0.1', port: 5177, strictPort: true } });
