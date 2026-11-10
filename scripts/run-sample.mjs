import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const [shape = 'basic', mode = 'dev'] = process.argv.slice(2);
if (!['basic', 'spark', 'relay'].includes(shape) || !['dev', 'start'].includes(mode)) throw new Error('Unknown sample or mode.');
const children = [];
const launch = (command, args, env = {}) => { const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } }); children.push(child); return child; };
const stop = () => children.forEach(child => child.kill());
process.once('SIGINT', stop); process.once('SIGTERM', stop);
launch(require('electron'), ['dist-samples/main/electron.js'], { SAMPLE_SHAPE: shape });

for (const child of children) child.on('exit', code => { stop(); process.exitCode = code ?? 1; });
