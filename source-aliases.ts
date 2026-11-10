import path from 'node:path';
// Package-local development resolution; no dependency on the host workspace config.
export const sourceAliases = [
  { find: /^ai-app-sdk\/host$/, replacement: path.resolve(import.meta.dirname, 'src/host/contracts.ts') },
  { find: /^ai-app-sdk\/speech$/, replacement: path.resolve(import.meta.dirname, 'src/speech/index.ts') },
  { find: /^multi-agents-sdk\/surface$/, replacement: path.resolve(import.meta.dirname, '../multi-agents-sdk/src/core/surface.ts') },
  { find: /^multi-agents-sdk\/surface-bridge$/, replacement: path.resolve(import.meta.dirname, '../multi-agents-sdk/src/core/surface-bridge.ts') },
  { find: /^multi-agents-sdk\/events$/, replacement: path.resolve(import.meta.dirname, '../multi-agents-sdk/src/core/typed-event-bus.ts') },
];
