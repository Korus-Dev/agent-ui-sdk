import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

assert.equal(process.platform, 'darwin', 'Run the native smoke check on macOS 26 or later.');
const root = fileURLToPath(new URL('..', import.meta.url));
const temp = mkdtempSync(path.join(tmpdir(), 'agent-ui-native-smoke-'));
let application;
try {
  const [archive] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temp], {
    cwd: root, encoding: 'utf8',
  }));
  execFileSync('tar', ['-xzf', path.join(temp, archive.filename), '-C', temp]);
  const extracted = path.join(temp, 'package');
  const metadata = JSON.parse(readFileSync(path.join(extracted, 'package.json'), 'utf8'));
  symlinkSync(path.join(root, 'node_modules'), path.join(extracted, 'node_modules'));
  mkdirSync(path.join(temp, 'node_modules', '@korus-dev'), { recursive: true });
  symlinkSync(extracted, path.join(temp, 'node_modules', metadata.name));

  const { resolveAppleSpeechAnalyzerPath } = await import(pathToFileURL(path.join(extracted, metadata.exports['./speech'].default)).href);
  const helper = resolveAppleSpeechAnalyzerPath();
  assert.equal(realpathSync(helper), realpathSync(path.join(extracted, 'assets/apple-speechanalyzer-cli')));
  execFileSync('codesign', ['--verify', '--strict', helper], { stdio: 'inherit' });
  // Unsupported locales fail before speech asset installation or audio processing.
  const speech = spawnSync(helper, ['--locale', 'zz-ZZ'], { encoding: 'utf8', timeout: 20_000 });
  assert.ifError(speech.error);
  assert.equal(speech.signal, null, `Speech helper terminated: ${speech.stderr}`);
  assert.equal(speech.status, 1, `Unexpected speech helper exit: ${speech.stdout}\n${speech.stderr}`);
  const events = speech.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.match(events[0].message, /Speech recognition does not support zz-ZZ\.|On-device speech recognition is unavailable on this Mac\./);
  console.log('Packaged Apple speech helper launched and returned its expected protocol error.');

  const fixture = path.join(temp, 'app');
  cpSync(path.join(root, 'tests/native-smoke'), fixture, { recursive: true });
  application = await electron.launch({ args: [path.join(fixture, 'main.mjs')], timeout: 30_000 });
  const page = await application.firstWindow({ timeout: 30_000 });
  await page.waitForLoadState('load');
  const result = await page.evaluate(async () => ({
    snapshot: await window.smoke.snapshot(),
    capabilities: window.agentUiHostCapabilities.capabilities,
    isolated: typeof window.require === 'undefined' && typeof window.process === 'undefined',
  }));
  assert.deepEqual(result.snapshot, { smoke: 'packaged-sdk', connected: true });
  assert.equal(result.isolated, true, 'The renderer must not have Node access.');
  assert.equal(result.capabilities.attachments, true);
  assert.equal(result.capabilities.transcription, true);
  console.log('Packaged Electron main/preload bridge passed a real renderer IPC round trip.');
} finally {
  try { await application?.close(); }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
