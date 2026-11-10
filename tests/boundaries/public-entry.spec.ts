// @vitest-environment jsdom
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as ui from '../../src/vue/index';

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
      expect(name).not.toMatch(/^(node:|electron(?:\/|$)|ws$|ai-app-sdk\/(electron|speech|browser))/);
      continue;
    }
    const base = path.resolve(path.dirname(entry), name);
    const file = [base, base + '.ts', base + '.vue', path.join(base, 'index.ts')].find(candidate => existsSync(candidate) && /\.(ts|vue)$/.test(candidate));
    if (file) runtimeGraph(file, seen);
  }
  return seen;
}

describe('public UI boundary', () => {
  it('offers neutral controls as the same implementations as compatibility names', () => {
    expect(ui.Composer).toBe(ui.CodexComposer);
    expect(ui.ConversationPane).toBe(ui.CodexConversationPane);
    expect(ui.MessageList).toBe(ui.CodexMessageList);
    expect(ui.useSurface).toBe(ui.useCodexSurface);
    expect(ui.createConversationPaneController).toBe(ui.createCodexConversationPaneController);
    expect(ui.capabilities).toBe(ui.codexCapabilities);
    expect(ui).not.toHaveProperty('CodexConversationSidebar');
  });

  it('keeps trusted runtimes outside conversation and document root imports', () => {
    const files = [...runtimeGraph(path.resolve(import.meta.dirname, '../../src/vue/index.ts'))];
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter(file => /\/src\/(electron|speech)\/|\/src\/browser\/electron\.ts$/.test(file))).toEqual([]);
  });
});
