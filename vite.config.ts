import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
import { sourceAliases } from './source-aliases.ts';
import metadata from './package.json' with { type: 'json' };
const documentEntries = Object.fromEntries(fs.readdirSync(path.join(import.meta.dirname, 'src/documents')).filter(file => file.endsWith('.ts')).map(file => [`documents/${file.slice(0, -3)}`, path.join(import.meta.dirname, 'src/documents', file)]));
const browserEntries = Object.fromEntries(fs.readdirSync(path.join(import.meta.dirname, 'src/browser')).filter(file => file.endsWith('.ts')).map(file => [`browser/${file.slice(0, -3)}`, path.join(import.meta.dirname, 'src/browser', file)]));
export default defineConfig({
  base: './',
  resolve: { alias: sourceAliases },
  plugins: [vue()],
  build: { lib: { entry: { ...browserEntries, ...documentEntries, ...Object.fromEntries(Object.entries({"vue/index":"src/vue/entry.ts","vue/browser/index":"src/vue/browser/index.ts","host/contracts":"src/host/contracts.ts","electron/index":"src/electron/index.ts","electron/preload":"src/electron/preload.ts","speech/index":"src/speech/index.ts"}).map(([name, file]) => [name, path.resolve(import.meta.dirname, file)])) }, formats: ['es'], cssFileName: 'styles' }, sourcemap: true,
    rollupOptions: { external: id => id.startsWith('node:') || ['vue', 'electron', ...Object.keys(metadata.dependencies ?? {}), ...Object.keys(metadata.peerDependencies ?? {})].some(name => id === name || id.startsWith(name + '/')), output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' } } },
});
