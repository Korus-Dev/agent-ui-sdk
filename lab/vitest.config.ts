import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../source-aliases';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  resolve: { alias: sourceAliases },
  test: { environment: 'jsdom', include: ['tests/**/*.spec.ts'], setupFiles: ['../tests/vue/setup.ts'] },
});
