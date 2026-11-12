# Samples

Runnable Electron applications that show the Agent UI SDK in different product shapes, plus the deterministic [component lab](../lab).

| Sample | Product shape | Run |
| --- | --- | --- |
| [Basic](./electron/basic) | Several conversations, existing history and a sidebar | `npm run dev:basic` |
| [Spark](./electron/spark) | Focused, themed chat with isolated sign-in | `npm run dev:spark` |
| [Relay](./electron/relay) | Operations board backed by an app-owned MCP server | `npm run dev:relay` |
| [Component lab](../lab) | Mocked scenarios for every control | `npm run dev:lab` |

Run commands from the repository root. Each Electron sample accepts `--backend codex|claude|cursor|antigravity` (`npm run dev:spark -- --backend claude`); Codex is the default. No provider execution is imported into a renderer.

Basic has its own chat-list application and service. Spark and Relay share a neutral session binding under `shared/`.

`npm run test:samples` checks the host and the Relay contracts. `npm run test:samples:browser` checks the renderer with controlled harness snapshots in Chromium and WebKit; it does not establish live provider compatibility.

See the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples) for the boundaries each sample demonstrates.
