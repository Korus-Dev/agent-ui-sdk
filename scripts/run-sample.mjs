import { parseSampleLaunchArgs } from '../samples/shared/launch-options.ts';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { shape, backend } = parseSampleLaunchArgs(process.argv.slice(2));
const children = [];
const launch = (command, args, env = {}) => { const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } }); children.push(child); return child; };
const stop = () => children.forEach(child => child.kill());
process.once('SIGINT', stop); process.once('SIGTERM', stop);
launch(require('electron'), [shape === 'basic' ? 'dist-samples/basic/main/main.mjs' : 'dist-samples/main/electron.js'], { SAMPLE_SHAPE: shape, SAMPLE_BACKEND: backend });

for (const child of children) child.on('exit', code => { stop(); process.exitCode = code ?? 1; });
