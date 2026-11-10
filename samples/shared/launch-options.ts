import path from 'node:path';
import { parseArgs } from 'node:util';
import type { HarnessProvider } from '@korus-dev/multi-agent-sdk';

export function parseSampleLaunchArgs(args: readonly string[]) {
  const { values, positionals } = parseArgs({ args: [...args], allowPositionals: true,
    options: { backend: { type: 'string', default: 'codex' } } });
  const shape = positionals[0] ?? 'basic';
  if (positionals.length > 1 || !['basic', 'spark', 'relay'].includes(shape)) {
    throw new Error('Choose a sample: basic, spark or relay.');
  }
  const backend = values.backend;
  if (!['codex', 'claude', 'cursor', 'antigravity'].includes(backend)) {
    throw new Error('Choose a backend: codex, claude, cursor or antigravity.');
  }
  return { shape: shape as 'basic' | 'spark' | 'relay', backend: backend as HarnessProvider };
}

export function sampleDirectories(shape: 'spark' | 'relay', backend: HarnessProvider, userHome: string) {
  const home = path.join(userHome, '.agent-ui-sdk', 'samples', shape, backend);
  return { home, workspace: path.join(home, 'workspace'), desktop: path.join(home, 'desktop'), state: path.join(home, 'state') };
}
