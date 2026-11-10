import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
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
  for (const file of files) assert(publicFiles.has(file) || /^(dist\/|assets\/|native\/|docs\/(?:guide\/|api\/|index\.md$)|examples\/|package.json$|README.md$|CHANGELOG.md$|INTEGRATION.md$|LICENSE$)/.test(file), `Unexpected package file: ${file}`);
  assert(!Object.hasOwn(metadata, 'exports'), 'The package uses main/types and static public forwarding files');
  assert(files.has(metadata.types.slice(2)), 'Missing root types');
  for (const target of entries) {
    assert(files.has(target.slice(2)), `Missing published entry: ${target}`);
    assert(files.has(target.slice(2).replace(/\.js$/, '.d.ts')), `Missing declaration: ${target}`);
  }
  for (const required of ['dist/styles.css', 'assets/apple-speechanalyzer-cli', 'native/apple-speech.swift', 'LICENSE']) assert(files.has(required), `Missing ${required}`);
  execFileSync('tar', ['-xzf', path.join(temp, archive.filename), '-C', temp]);
  // Resolve the extracted archive from outside the checkout, using installed external dependencies.
  symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'package', 'node_modules'));
  const modules = path.join(temp, 'node_modules'); mkdirSync(path.join(modules, '@korus-dev'), { recursive: true });
  symlinkSync(path.join(temp, 'package'), path.join(modules, metadata.name));
  for (const folder of ['vue', 'electron', 'element-plus', '@types', 'csstype', '@vue', '@babel', '@korus-dev/multi-agent-sdk']) {
    const dest = path.join(modules, folder); mkdirSync(path.dirname(dest), { recursive: true });
    symlinkSync(path.join(root, 'node_modules', folder), dest);
  }
  writeFileSync(path.join(temp, 'consumer.ts'), entries.map((name, index) => `import * as entry${index} from '${metadata.name}${index === 0 ? '' : '/' + name.slice(2)}';\nvoid entry${index};`).join('\n') + '\nconst draft: entry0.ComposerState = { text: \'\', selectionStart: 0, selectionEnd: 0 }; void draft; void entry0.Composer; void entry0.ConversationPane; entry1.toHarnessPromptOptions({ model: \'catalog-model\' });\n');
  writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ type: 'module' }));
  // External vendor declarations currently require skipLibCheck; consumer code remains strict.
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--target', 'ES2022', path.join(temp, 'consumer.ts')], { stdio: 'inherit' });
  execFileSync(process.execPath, ['--input-type=module', '-e', `import assert from 'node:assert/strict'; import { existsSync, realpathSync } from 'node:fs'; import { resolveAppleSpeechAnalyzerPath } from '${metadata.name}/speech.js'; const asset = resolveAppleSpeechAnalyzerPath(); assert(existsSync(asset)); assert.equal(realpathSync(asset), realpathSync(${JSON.stringify(path.join(temp, 'package/assets/apple-speechanalyzer-cli'))}));`], { cwd: temp, stdio: 'inherit' });
  const { build } = await import('vite');
  writeFileSync(path.join(temp, 'browser.ts'), `export { Composer, ConversationPane, createSessionConversationController } from '${metadata.name}';\nimport '${metadata.name}/styles.css';`);
  await build({ configFile: false, root: temp, logLevel: 'warn', build: { outDir: path.join(temp, 'built'), lib: { entry: path.join(temp, 'browser.ts'), formats: ['es'], cssFileName: 'consumer' }, rollupOptions: { external: ['vue', 'element-plus'], onwarn(warning, defaultHandler) { assert(!/externalized for browser compatibility/.test(warning.message), warning.message); defaultHandler(warning); } } } });
  console.log(`Verified ${archive.files.length} packed files and ${entries.length} typed published entries; standalone browser consumer built.`);
} finally { rmSync(temp, { recursive: true, force: true }); }
