import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, loadConfigFromFile } from 'vite';
import { expect, it, onTestFinished, vi } from 'vitest';

// Builds the published recorder entry: transform-time unit tests do not exercise asset URLs.
it('loads its packaged worklet relative to the installed module under file URLs', async () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const output = await mkdtemp(path.join(os.tmpdir(), 'agent-ui-speech-assets-'));
  onTestFinished(async () => { vi.unstubAllGlobals(); await rm(output, { recursive: true, force: true }); });
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, path.join(root, 'vite.config.ts'));
  if (!loaded) throw new Error('Missing SDK build configuration');
  await build({ ...loaded.config, configFile: false, root, logLevel: 'silent', build: { ...loaded.config.build,
    outDir: output, sourcemap: false,
    lib: { entry: { recorder: path.join(root, 'src/vue/audio/browser-speech-recorder.ts') }, formats: ['es'], fileName: () => 'recorder.js' },
  } });
  await access(path.join(output, 'recorder.js'));
  const addModule = vi.fn(async (source: string) => {
    const url = new URL(source);
    expect(url.protocol).toBe('file:');
    expect(url.href.startsWith(pathToFileURL(output + path.sep).href)).toBe(true);
    await access(url);
  });
  const stream = { getTracks: () => [] };
  const source = { connect() {}, disconnect() {} };
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => stream } });
  vi.stubGlobal('AudioContext', class {
    sampleRate = 16000; audioWorklet = { addModule }; destination = {};
    createMediaStreamSource() { return source; } async resume() {} async close() {}
  });
  vi.stubGlobal('AudioWorkletNode', class { port = { close() {}, onmessage: null }; connect() {} disconnect() {} });
  const { BrowserSpeechRecorder } = await import(pathToFileURL(path.join(output, 'recorder.js')).href);
  const recorder = new BrowserSpeechRecorder();
  await recorder.start(async () => {}, vi.fn());
  expect(addModule).toHaveBeenCalledOnce();
  recorder.release();
});
