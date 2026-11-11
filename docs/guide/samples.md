# Samples

Run commands from the repository root after `npm ci` and `npm run build`. Samples use public UI entry points and the neutral `multi-agent-sdk` session contract. Choose the backend when launching: `npm run dev:basic -- --backend claude`, `npm run dev:spark -- --backend cursor`, or `npm run dev:relay -- --backend codex`. Supported values are `codex`, `claude`, `cursor` and `antigravity`; the default is `codex`. Install the chosen runtime first.

| Sample | Run | Purpose |
| --- | --- | --- |
| Basic Electron | `npm run dev:basic` | Conversation pane over isolated IPC |
| Spark | `npm run dev:spark` | Branded chat, sign-in, chat navigation and theme tokens |
| Relay | `npm run dev:relay` | Operations board, visible business prompts and MCP tools |
| Component lab | `npm run dev:lab` | Deterministic rendering and interaction scenarios |

`npm run build:samples` builds the shared renderer, Electron host and preload, and checks sample types. Electron launch commands build first. The Electron samples share lifecycle and bridge plumbing under `samples/shared` so the examples focus on product differences.

Basic lists and resumes existing conversations from the selected runtime’s standard home. Relay opens its conversation after sign-in without a backend sidebar. Spark provides its branded chat navigation. The application owns conversation navigation. The same pane handles queueing, requests, model selection and supported turn actions for each harness. Catalogs and permission options come from the chosen provider; the sample does not claim all operations exist on every harness.

Relay retains its seeded JSON operations store and read/write MCP tools. UI actions create a visible prompt grounded in the selected shipment; tools retrieve the authoritative record. Rebooking requires explicit confirmation. The trusted host starts a private loopback MCP endpoint and registers it through `mcpServers`; no endpoint token or native handle is exposed to the renderer. Native approval policy remains authoritative.

Spark uses a focused presentation and host instructions without pinning a provider-specific model ID. It is a customization example, not a child-safety product.

The component lab uses mocked states and needs no provider login. See `lab/README.md` for development and browser workflows.

## Isolated homes

Spark and Relay each use `~/.agent-ui-sdk/samples/<sample>/<backend>/` for runtime configuration and sign-in. Their `workspace/`, `state/` and `desktop/` directories also separate the workspace, SDK state and Electron profile. Basic uses the selected runtime’s standard home, authentication and configuration. Spark and Relay do not copy standard runtime homes or accounts.

Spark and Relay open Codex sign-in in the browser from their login screens. The native authentication host closes after the browser callback, then the neutral chat driver starts with the same home. Claude sign-in currently uses its CLI: the screen shows the `CLAUDE_CONFIG_DIR=… claude auth login` command for this sample home; complete it and choose **Check Claude sign-in**. Other backends use their native authentication operations.
