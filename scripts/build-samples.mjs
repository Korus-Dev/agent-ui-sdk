import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
await build({ configFile: 'samples/shared/vite.config.ts' });
mkdirSync('dist-samples/main', { recursive: true });
// esbuild is supplied by tsx; preserve provider dependencies as external imports.
const { build: bundle } = await import('esbuild');
await bundle({ entryPoints: ['samples/shared/electron.ts'], outdir: 'dist-samples/main', platform: 'node', target: 'node22', format: 'esm', bundle: true, packages: 'external' });
await bundle({ entryPoints: ['samples/shared/preload.cts'], outfile: 'dist-samples/main/preload.cjs', platform: 'node', format: 'cjs', bundle: true, external: ['electron'] });
execFileSync(process.execPath, ['scripts/typecheck.mjs', 'vue', '-p', 'samples/shared/tsconfig.json', '--noEmit'], { stdio: 'inherit' });
