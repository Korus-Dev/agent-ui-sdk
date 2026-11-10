import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { sourceAliases } from '../source-aliases';
export default defineConfig({ root: new URL('..', import.meta.url).pathname, plugins: [vue()], resolve: { alias: sourceAliases, dedupe: ['vue'] }, test: { include: ['samples/**/*.spec.ts'], environment: 'jsdom', setupFiles: ['tests/vue/setup.ts'], maxWorkers: 4 } });
