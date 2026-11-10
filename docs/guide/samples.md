# Samples

Run commands from the repository root after `npm ci` and `npm run build`. Samples use public UI entry points and the neutral `multi-agent-sdk` session contract. Select Codex, Claude, Cursor or Antigravity when creating a conversation. Install and authenticate the chosen native runtime first; samples do not bundle credentials or sign you in automatically.

| Sample | Run | Purpose |
| --- | --- | --- |
| Basic Electron | `npm run dev:electron` | Multiple live conversations over isolated IPC |
| Spark | `npm run dev:spark` | Focused chat, host instructions and semantic theme tokens |
| Relay | `npm run dev:relay` | Operations board, visible business prompts and MCP tools |
| Component lab | `npm run dev:lab` | Deterministic rendering and interaction scenarios |

`npm run build:samples` builds the shared renderer, Electron host and preload, and checks sample types. Electron launch commands build first. The Electron samples share lifecycle and bridge plumbing under `samples/shared` so the examples focus on product differences.

The application owns conversation navigation. The same pane handles queueing, requests, model selection and supported turn actions for each harness. Catalogs and permission options come from the chosen provider; the sample does not claim all operations exist on every harness.

Relay retains its seeded JSON operations store and read/write MCP tools. UI actions create a visible prompt grounded in the selected shipment; tools retrieve the authoritative record. Rebooking requires explicit confirmation. The trusted host starts a private loopback MCP endpoint and registers it through `mcpServers`; no endpoint token or native handle is exposed to the renderer. Native approval policy remains authoritative.

Spark demonstrates a simpler presentation and host instructions, rather than pinning a Codex model ID. It is a customization example, not a child-safety product.

The component lab uses mocked states and needs no provider login. See `lab/README.md` for development and browser workflows.
