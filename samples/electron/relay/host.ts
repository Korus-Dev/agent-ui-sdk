import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createRelayMcpServer } from './src/mcp/server';
import { initializeRelayState, readRelayState, resetRelayState } from './src/mcp/relay-store';

/** Private per-process endpoint; the token never reaches the renderer. */
export async function startRelayHost(statePath: string) {
  await initializeRelayState(statePath);
  const token = randomBytes(24).toString('hex');
  const resources = new Set<() => Promise<void>>();
  const server = createServer(async (req, res) => {
    if (req.url !== `/${token}` || req.headers.origin) { res.writeHead(403).end(); return; }
    const mcp = createRelayMcpServer(statePath);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const cleanup = async () => { resources.delete(cleanup); await transport.close(); await mcp.close(); };
    resources.add(cleanup); res.on('close', () => { void cleanup(); });
    try { await mcp.connect(transport); await transport.handleRequest(req, res); }
    catch (error) { if (!res.headersSent) res.writeHead(500).end(String(error)); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('MCP server did not bind.');
  return { endpoint: { name: 'relay', url: `http://127.0.0.1:${address.port}/${token}` },
    snapshot: () => readRelayState(statePath), reset: () => resetRelayState(statePath),
    async close() { server.closeAllConnections(); await Promise.all([...resources].map(close => close())); await new Promise<void>(resolve => server.close(() => resolve())); },
  };
}
