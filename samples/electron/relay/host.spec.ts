import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startRelayHost } from './host';
describe('Relay multi-harness MCP endpoint', () => {
  it('serves real tools over HTTP and requires confirmation before committing recovery', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'relay-http-'));
    const host = await startRelayHost(path.join(directory, 'operations.json'));
    const client = new Client({ name: 'relay-test', version: '1' });
    try {
      expect((await fetch(host.endpoint.url.replace(/\/[^/]+$/, '/wrong'))).status).toBe(403);
      expect((await fetch(host.endpoint.url, { headers: { Origin: 'https://foreign.example' } })).status).toBe(403);
      await client.connect(new StreamableHTTPClientTransport(new URL(host.endpoint.url)));
      const tools = await client.listTools(); expect(tools.tools.map(tool => tool.name)).toContain('rebook_shipment');
      const denied = await client.callTool({ name: 'rebook_shipment', arguments: { shipmentId: 'SHP-4827', optionId: 'expedited-air', confirmed: false } });
      expect(denied.isError).toBe(true);
      expect((await host.snapshot()).shipments[0]!.selectedRecoveryOptionId).toBeUndefined();
      const committed = await client.callTool({ name: 'rebook_shipment', arguments: { shipmentId: 'SHP-4827', optionId: 'expedited-air', confirmed: true } });
      expect(committed.isError).not.toBe(true);
      expect((await host.snapshot()).shipments[0]!.selectedRecoveryOptionId).toBe('expedited-air');
    } finally { await client.close(); await host.close(); await rm(directory, { recursive: true, force: true }); }
  });
});
