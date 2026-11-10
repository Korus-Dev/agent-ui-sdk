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
  const entries = [metadata.main, './host.js', './native.js', './electron.js', './electron/preload.js', './electron/browser.js', './speech.js', './browser.js', './browser-ui.js', './documents.js'];
  const publicFiles = new Set(entries.flatMap(file => [file.slice(2), file.slice(2).replace(/\.js$/, '.d.ts')]).concat('styles.css'));
  for (const file of files) {
    assert(!/(^|\/)(?:\.env[^/]*|node_modules|src|tests|\.vitepress)(?:\/|$)|\.tgz$/.test(file), `Private or generated package file: ${file}`);
    assert(publicFiles.has(file) || /^(dist\/|assets\/|native\/|package.json$|README.md$|CHANGELOG.md$|LICENSE$)/.test(file), `Unexpected package file: ${file}`);
  }
  assert(!Object.hasOwn(metadata, 'exports'), 'The package uses main/types and static public forwarding files');
  assert(files.has(metadata.types.slice(2)), 'Missing root types');
  for (const target of entries) {
    assert(files.has(target.slice(2)), `Missing published entry: ${target}`);
    assert(files.has(target.slice(2).replace(/\.js$/, '.d.ts')), `Missing declaration: ${target}`);
  }
  for (const required of ['dist/styles.css', 'assets/apple-speechanalyzer-cli', 'native/apple-speech.swift', 'README.md', 'LICENSE', 'CHANGELOG.md']) assert(files.has(required), `Missing ${required}`);
  writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  // Optional peers are supplied explicitly so all public declarations can resolve.
  const peers = Object.keys(metadata.peerDependencies ?? {}).map(name => `${name}@${metadata.devDependencies[name]}`);
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', path.join(temp, archive.filename), ...peers], { cwd: temp, stdio: 'inherit' });
  // This entry imports Electron's native APIs; the macOS smoke job loads it in Electron.
  const electronOnlyEntries = ['./electron/browser.js'];
  const runtimeEntries = entries.filter(entry => !electronOnlyEntries.includes(entry));
  writeFileSync(path.join(temp, 'imports.mjs'), runtimeEntries.map((entry, index) => `await import(${JSON.stringify(metadata.name + (index === 0 ? '' : '/' + entry.slice(2)))});`).join('\n'));
  execFileSync(process.execPath, [path.join(temp, 'imports.mjs')], { cwd: temp, stdio: 'inherit' });
  writeFileSync(path.join(temp, 'consumer.ts'), entries.map((name, index) => `import * as entry${index} from '${metadata.name}${index === 0 ? '' : '/' + name.slice(2)}';\nvoid entry${index};`).join('\n') + '\nconst draft: entry0.ComposerState = { text: \'\', selectionStart: 0, selectionEnd: 0 }; void draft; void entry0.Composer; void entry0.ConversationPane; entry1.toHarnessPromptOptions({ model: \'catalog-model\' });\ntype NativeProps = InstanceType<typeof entry2.NativeConversationPane>[\'$props\']; const nativeProps: NativeProps = { messages: [], approvals: [], placeholder: \'Ask\' }; void nativeProps;\n');
  // Resolve public declarations with no checkout aliases or declaration suppression.
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--types', 'node', '--typeRoots', path.join(root, 'node_modules/@types'), '--module', 'ESNext', '--moduleResolution', 'Bundler', '--target', 'ES2022', path.join(temp, 'consumer.ts')], { stdio: 'inherit' });
  console.log(`Verified ${files.size} packed files, ${runtimeEntries.length} Node ESM imports and ${entries.length} strict Bundler entry types; Electron-only runtime checked by the macOS smoke job.`);
} finally { rmSync(temp, { recursive: true, force: true }); }
