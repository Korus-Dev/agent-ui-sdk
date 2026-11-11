// @vitest-environment jsdom
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as ui from '../../src/vue/index';
import * as electron from '../../src/electron/index';
import * as preload from '../../src/electron/preload';

// Follow emitted runtime imports only; type-only host contracts do not load a runtime.
function runtimeGraph(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  let source = readFileSync(entry, 'utf8');
  if (entry.endsWith('.vue')) source = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
  const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const imports = ts.preProcessFile(emitted).importedFiles.map(item => item.fileName);
  for (const name of imports) {
    if (!name.startsWith('.')) {
      expect(name).not.toMatch(/^(node:|electron(?:\/|$)|ws$|@korus-dev\/agent-ui-sdk\/(native|electron|speech|browser)|@korus-dev\/multi-agent-sdk\/(host-bridge|surface(?:-bridge)?|codex|native|providers|backend)(?:\/|$))/);
      continue;
    }
    const base = path.resolve(path.dirname(entry), name);
    const file = [base, base + '.ts', base + '.vue', path.join(base, 'index.ts')].find(candidate => existsSync(candidate) && /\.(ts|vue)$/.test(candidate));
    if (file) runtimeGraph(file, seen);
  }
  return seen;
}

describe('public UI boundary', () => {
  it('keeps backend-specific adapters outside every UI entry', () => {
    for (const entry of [ui, electron, preload]) {
      expect(Object.keys(entry).filter(name => /codex|claude|antigravity/i.test(name))).toEqual([]);
    }
    const metadata = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8'));
    expect(metadata.exports).not.toHaveProperty('./native');
  });
  it('exports provider-neutral controls and keeps Codex integrations opt-in', () => {
    for (const name of ['Composer', 'ConversationPane', 'MessageList', 'Message', 'ApprovalPrompt', 'createConversationPaneController']) {
      expect(ui).toHaveProperty(name);
    }
    expect(Object.keys(ui).filter(name => /codex/i.test(name))).toEqual([]);
    for (const name of ['useSurface', 'useLiveChat', 'useCodexHost', 'useCodexLiveChat', 'codexCommands', 'codexCapabilities']) expect(ui).not.toHaveProperty(name);
  });

  // This audit transpiles the complete source graph on cold CI workers.
  it('keeps trusted runtimes outside conversation and document root imports', () => {
    const graph = runtimeGraph(path.resolve(import.meta.dirname, '../../src/vue/index.ts'));
    for (const name of ['MarkdownPanel', 'SourcePreviewPanel', 'DiffPreviewPanel']) runtimeGraph(path.resolve(import.meta.dirname, `../../src/vue/documents/${name}.vue`), graph);
    const files = [...graph];
    for (const file of files) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/(?:from\s*|import\()['"]@korus-dev\/multi-agent-sdk\/(?:host-bridge|surface(?:-bridge)?|codex|native|providers)(?:['"/])/);
      expect(path.relative(path.resolve(import.meta.dirname, '../../src'), file)).not.toMatch(/(?:Korus|ConversationSidebar|Treemap)/i);
    }
    expect(Object.keys(ui).filter(name => /korus|sidebar|treemap/i.test(name))).toEqual([]);
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter(file => /\/src\/(electron|speech)\/|\/src\/browser\/electron\.ts$/.test(file))).toEqual([]);
  }, 10_000);
});
