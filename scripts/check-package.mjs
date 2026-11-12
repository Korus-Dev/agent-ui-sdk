import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root = process.cwd();
const temp = mkdtempSync(path.join(tmpdir(), 'agent-ui-pack-'));
try {
  const [archive] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temp], { encoding: 'utf8' }));
  const files = new Set(archive.files.map(file => file.path));
  const metadata = JSON.parse(readFileSync('package.json', 'utf8'));
  const exported = Object.entries(metadata.exports);
  const entries = exported.filter(([, value]) => typeof value === 'object' && value.default?.endsWith('.js'));
  for (const file of files) {
    assert(!/(^|\/)(?:\.env[^/]*|node_modules|src|tests|\.vitepress)(?:\/|$)|\.tgz$/.test(file), `Private or generated package file: ${file}`);
    assert(/^(?:dist\/|assets\/|native\/|package.json$|README.md$|CHANGELOG.md$|LICENSE$)/.test(file), `Unexpected package file: ${file}`);
  }
  for (const [entry, value] of exported) {
    if (typeof value === 'object') assert.equal(Object.keys(value)[0], 'types', `Types must come first: ${entry}`);
    for (const target of typeof value === 'string' ? [value] : Object.values(value)) {
      if (entry === './assets/*') {
        assert.equal(target, './assets/*');
        assert([...files].some(file => file.startsWith('assets/')), 'Missing exported assets');
      } else {
        assert(!entry.includes('*'), `Unexpected wildcard export: ${entry}`);
        assert(files.has(target.slice(2)), `Missing exported target: ${target}`);
      }
    }
  }
  for (const target of [metadata.main, metadata.types]) assert(files.has(target.slice(2)), `Missing legacy root entry: ${target}`);
  for (const required of ['dist/styles.css', 'assets/apple-speechanalyzer-cli', 'native/apple-speech.swift', 'README.md', 'LICENSE', 'CHANGELOG.md']) assert(files.has(required), `Missing ${required}`);
  writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  // Optional peers are supplied explicitly so all public declarations can resolve.
  const peers = Object.keys(metadata.peerDependencies ?? {}).map(name => `${name}@${metadata.devDependencies[name]}`);
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', path.join(temp, archive.filename), ...peers], { cwd: temp, stdio: 'inherit' });
  // This entry imports Electron's native APIs; the macOS smoke job loads it in Electron.
  const electronOnlyEntries = ['./electron/browser'];
  const specifier = entry => metadata.name + (entry === '.' ? '' : entry.slice(1));
  const runtimeEntries = entries.filter(([entry]) => !electronOnlyEntries.includes(entry));
  writeFileSync(path.join(temp, 'imports.mjs'), runtimeEntries.map(([entry]) => `await import(${JSON.stringify(specifier(entry))});`).join('\n'));
  execFileSync(process.execPath, [path.join(temp, 'imports.mjs')], { cwd: temp, stdio: 'inherit' });
  writeFileSync(path.join(temp, 'consumer.ts'), entries.map(([entry], index) => `import type * as Public${index} from '${specifier(entry)}';`).join('\n') + `
import { Composer, ConversationPane, type ComposerState } from '${metadata.name}';
import { toHarnessPromptOptions } from '${metadata.name}/host';
const draft: ComposerState = { text: '', selectionStart: 0, selectionEnd: 0 };
void [draft, Composer, ConversationPane]; toHarnessPromptOptions({ selection: { model: 'catalog-model' } });
type PaneProps = Parameters<typeof ConversationPane>[0];
const paneProps: PaneProps = { messages: [], requests: [], placeholder: 'Ask' }; void paneProps;
`);
  // Resolve public declarations with no checkout aliases or declaration suppression.
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--types', 'node', '--typeRoots', path.join(root, 'node_modules/@types'), '--module', 'ESNext', '--moduleResolution', 'Bundler', '--target', 'ES2022', path.join(temp, 'consumer.ts')], { stdio: 'inherit' });
  console.log(`Verified ${files.size} packed files, ${runtimeEntries.length} Node ESM imports and ${entries.length} strict Bundler entry types; Electron-only runtime checked by the macOS smoke job.`);
} finally { rmSync(temp, { recursive: true, force: true }); }
