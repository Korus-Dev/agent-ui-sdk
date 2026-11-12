import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { sdkSources } from './sdk-sources.mjs';
await build({ configFile: 'samples/shared/vite.config.ts' });
mkdirSync('dist-samples/main', { recursive: true });
// esbuild is supplied by tsx; preserve provider dependencies as external imports.
const { build: bundle } = await import('esbuild');
// With SDK_LOCAL_SOURCE=1 the main-process bundles must use the same sibling sources as Vite;
// otherwise Electron resolves the installed (published) packages at runtime.
const { aliases } = sdkSources(process.cwd());
const localSdkSources = { name: 'local-sdk-sources', setup(build) {
  build.onResolve({ filter: /^@korus-dev\// }, args => {
    const match = aliases.find(alias => alias.find.test(args.path));
    return match ? { path: match.replacement } : undefined;
  });
} };
const nodeBundle = { platform: 'node', target: 'node22', format: 'esm', bundle: true, packages: 'external', plugins: [localSdkSources] };
await bundle({ entryPoints: ['samples/shared/electron.ts'], outdir: 'dist-samples/main', ...nodeBundle });
await bundle({ entryPoints: ['samples/shared/preload.cts'], outfile: 'dist-samples/main/preload.cjs', platform: 'node', format: 'cjs', bundle: true, external: ['electron'] });
execFileSync(process.execPath, ['scripts/typecheck.mjs', 'vue', '-p', 'samples/shared/tsconfig.json', '--noEmit'], { stdio: 'inherit' });

await build({ configFile: 'samples/electron/basic/vite.config.ts' });
await bundle({ entryPoints: ['samples/electron/basic/electron/main.ts'], tsconfig: 'tsconfig.json', outfile: 'dist-samples/basic/main/main.mjs', ...nodeBundle });
await bundle({ entryPoints: ['samples/electron/basic/electron/preload.ts'], tsconfig: 'tsconfig.json', outfile: 'dist-samples/basic/main/preload.cjs', platform: 'node', format: 'cjs', bundle: true, external: ['electron'] });
