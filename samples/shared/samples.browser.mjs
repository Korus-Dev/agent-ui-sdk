import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';
import { sessionFixture, capabilitiesFixture } from '../../tests/fixtures/consumer-session.ts';
import { createRelaySeedState, relaySnapshot } from '../electron/relay/src/shared/relay-contracts.ts';
const server = await createServer({ configFile: 'samples/shared/vite.config.ts', server: { port: 5187, strictPort: true } });
await server.listen();
const basicServer = await createServer({ configFile: 'samples/electron/basic/vite.config.ts', server: { port: 5188, strictPort: true } });
await basicServer.listen();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ state, capabilities, relay }) => {
        // Simulate the conversation that the trusted Electron host opens from CLI options.
        const backend = new URLSearchParams(location.search).get('backend') ?? 'codex';
        let value = { backend, authentication: { connected: !location.search.includes('signedOut=1'), pending: false, error: null }, conversations: [{ id: 'session-1', provider: backend, capabilities, models: [],
          state: { ...state, title: backend, busy: false, activeTurnId: null, requests: [], messages: [], turns: [] } }] };
        const initialConversation = value.conversations[0];
        if (!value.authentication.connected) value.conversations = [];
        let listener;
        const basicListeners = new Set();
        const view = () => ({ id: 'basic-1', title: 'Existing chat', state: value.conversations[0]?.state ?? initialConversation.state, capabilities, models: [] });
        window.sampleApi = {
          status: async () => ({ backend, connected: true, runtime: { status: 'running' } }),
          chats: async () => [{ id: 'basic-1', title: 'Existing chat', updatedAt: '2026-11-10T00:00:00Z' }],
          newChat: async () => view(), chat: async () => view(),
          prompt: async () => { const state = { ...view().state, messages: [{ id: 'reply', agentId: 'sample', role: 'assistant', status: 'complete', createdAt: new Date().toISOString(), parts: [{ type: 'text', text: 'Response from ' + backend }] }] }; for (const listener of basicListeners) listener({ chatId: 'basic-1', title: 'Existing chat', state }); },
          call: async () => {},
          onChatState: listener => { basicListeners.add(listener); return () => basicListeners.delete(listener); },
        };
        window.sample = {
          snapshot: async () => value,
          subscribe: callback => { listener = callback; return () => { listener = undefined; }; },
          call: async (method, ...args) => {
            if (method === 'authenticate') {
              if (args[0] === 'logout') value = { ...value, authentication: { connected: false, pending: false, error: null }, conversations: [] };
              if (args[0] === 'login') value = { ...value, authentication: { connected: true, pending: false, error: null }, conversations: [initialConversation] };
              listener?.(value); return value.authentication;
            }
            if (method === 'create') {
              const id = String(value.conversations.length + 1);
              value = { ...value, conversations: [...value.conversations, { ...initialConversation, id }] }; listener?.(value); return id;
            }
            if (method === 'relaySnapshot' || method === 'relayReset') return relay;
            if (method === 'send') {
              value = { ...value, conversations: value.conversations.map(c => c.id !== args[0] ? c : { ...c, state: { ...c.state,
                messages: [{ id: 'reply', agentId: 'sample', role: 'assistant', status: 'complete', createdAt: new Date().toISOString(), parts: [{ type: 'text', text: 'Response from ' + backend }] }] } }) };
              listener?.(value);
            }
          },
        };
      }, { state: sessionFixture, capabilities: capabilitiesFixture, relay: relaySnapshot(createRelaySeedState()) });
      for (const shape of ['basic', 'spark', 'relay']) {
        for (const backend of ['codex', 'claude', 'cursor', 'antigravity']) {
          await page.goto(`http://127.0.0.1:${shape === 'basic' ? 5188 : 5187}?sample=${shape}&backend=${backend}`);
          if (shape === 'basic') { await page.getByRole('button', { name: 'Existing chat' }).click(); }
          const editor = page.locator('[contenteditable="true"]'); await editor.waitFor();
          assert.equal(await page.locator('.sample-app > aside').count(), 0, 'Samples have no harness sidebar');
          assert.equal(await page.getByLabel('Harness', { exact: true }).count(), 0, 'Backend selection stays in the CLI');
          if (engine === chromium && backend === 'codex') await page.screenshot({ path: `/tmp/agent-ui-sample-${shape}-empty.png` });
          await editor.fill('Hello'); await editor.press('Enter');
          await page.getByText('Response from ' + backend, { exact: true }).waitFor();
          if (shape === 'relay') await page.getByText('SHP-4827', { exact: true }).first().waitFor();
          const bounds = await editor.boundingBox(); assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 860, 'Composer remains visible');
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Layout fits the window');
          if (engine === chromium && backend === 'codex') await page.screenshot({ path: `/tmp/agent-ui-sample-${shape}.png` });
        }
      }
      for (const shape of ['spark', 'relay']) {
        await page.goto(`http://127.0.0.1:5187?sample=${shape}&backend=codex&signedOut=1`);
        await page.getByRole('heading', { name: shape === 'spark' ? 'Welcome to Spark!' : 'Run the shift with Relay', exact: true }).waitFor();
        if (engine === chromium) await page.screenshot({ path: `/tmp/agent-ui-sample-${shape}-login.png` });
        await page.getByRole('button', { name: shape === 'spark' ? 'Sign in with ChatGPT' : 'Continue with ChatGPT', exact: true }).click();
        await page.locator('[contenteditable="true"]').waitFor();
        if (shape === 'spark') {
          await page.getByLabel('Grown-up account menu').click();
          await page.getByRole('button', { name: 'Sign out', exact: true }).click();
          await page.getByRole('heading', { name: 'Welcome to Spark!', exact: true }).waitFor();
        }
      }
      await page.setViewportSize({ width: 760, height: 900 });
      await page.goto('http://127.0.0.1:5187?sample=relay&backend=claude');
      await page.locator('[contenteditable="true"]').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Narrow Relay layout fits the window');
      assert.deepEqual(errors, []);
      console.log(`${engine.name()}: Basic, Spark and Relay use four launch-selected backends with their own app layouts`);
    } finally { await browser.close(); }
  }
} finally { await server.close(); await basicServer.close(); }
