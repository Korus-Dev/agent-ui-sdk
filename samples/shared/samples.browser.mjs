import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';
import { sessionFixture, capabilitiesFixture } from '../../tests/fixtures/consumer-session.ts';
const server = await createServer({ configFile: 'samples/shared/vite.config.ts', server: { port: 5187, strictPort: true } });
await server.listen();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ state, capabilities }) => {
        let value = { conversations: [] }; let listener;
        window.sample = {
          snapshot: async () => value,
          subscribe: callback => { listener = callback; return () => { listener = undefined; }; },
          call: async (method, ...args) => {
            if (method === 'create') {
              const id = String(value.conversations.length + 1);
              value = { conversations: [...value.conversations, { id, provider: args[0], capabilities, models: [], state: { ...state, title: `${args[0]} conversation`, busy: false, activeTurnId: null, requests: [], messages: [], turns: [] } }] };
              listener?.(value); return id;
            }
            if (method === 'send') {
              value = { conversations: value.conversations.map(c => c.id !== args[0] ? c : { ...c, state: { ...c.state, messages: [{ id: 'reply', agentId: 'sample', role: 'assistant', status: 'complete', createdAt: new Date().toISOString(), parts: [{ type: 'text', text: 'Response from selected harness' }] }] } }) };
              listener?.(value);
            }
            if (method === 'release') { value = { conversations: value.conversations.filter(c => c.id !== args[0]) }; listener?.(value); }
          },
        };
      }, { state: sessionFixture, capabilities: capabilitiesFixture });
      await page.goto('http://127.0.0.1:5187');
      for (const provider of ['claude', 'cursor', 'antigravity', 'codex']) {
        await page.getByLabel('Harness', { exact: true }).selectOption(provider);
        await page.getByRole('button', { name: 'New conversation', exact: true }).click();
        await page.getByRole('button', { name: `${provider} conversation`, exact: true }).waitFor();
        const editor = page.locator('[contenteditable="true"]'); await editor.fill('Hello'); await editor.press('Enter');
        await page.getByText('Response from selected harness', { exact: true }).waitFor();
        const bounds = await editor.boundingBox(); assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 860, 'Composer remains visible');
        await page.getByRole('button', { name: 'Close conversation', exact: true }).click();
        await page.getByText('Choose a harness and start a conversation.', { exact: true }).waitFor();
      }
      await page.goto('http://127.0.0.1:5187?sample=spark');
      await page.getByRole('heading', { name: 'Spark' }).waitFor();
      await page.getByText('What would you like to explore?').waitFor();
      assert.deepEqual(errors, []);
      console.log(`${engine.name()}: multi-harness create/send/close and Spark shell passed`);
    } finally { await browser.close(); }
  }
} finally { await server.close(); }
