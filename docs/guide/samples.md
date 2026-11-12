# Samples

Four runnable samples demonstrate how the SDK composes into different products. They use only public entry points and the neutral `multi-agent-sdk` session contract, so they double as integration references.

| Sample | Product shape | Run |
| --- | --- | --- |
| [Basic Electron](#basic-electron) | Several conversations, existing history and a sidebar | `npm run dev:basic` |
| [Spark](#spark-focused-chat) | Branded, focused chat with isolated sign-in | `npm run dev:spark` |
| [Relay](#relay-business-ui-and-mcp-tools) | An operations board backed by an app-owned MCP server | `npm run dev:relay` |
| [Component lab](#component-lab) | Mocked scenarios for every control, no provider needed | `npm run dev:lab` |

Run commands from the repository root after `npm ci`. The Electron launch commands build the samples first; `npm run build:samples` builds the shared renderer, the Electron host and preload, and checks sample types.

## Choosing a backend

Pass the backend after `--`:

```bash
npm run dev:basic -- --backend claude
npm run dev:spark -- --backend cursor
npm run dev:relay -- --backend codex
```

Supported values are `codex`, `claude`, `cursor` and `antigravity`; the default is `codex`. Install the chosen runtime first. The same pane handles queueing, requests, model selection and supported turn actions for each harness. Catalogs and permission options come from the chosen provider, and the samples do not claim every operation exists on every harness.

## Basic Electron

A multi-conversation client. It lists and resumes existing conversations from the selected runtime's standard home, starts new ones, and shows each in `ConversationPane` with its own session binding. Bindings are kept across navigation so queued prompts survive switching.

- Uses the runtime's standard home, authentication and configuration. Sign in with that runtime's normal CLI first.
- `SAMPLE_FOLDER` chooses the working directory (default: the current directory).
- Shows how to connect a harness to a renderer: a chat service in the main process, a narrow preload API, and `createSessionConversationController` in the renderer.

Start here to learn the Electron integration. The [quick start](/guide/quick-start) is a smaller version of this sample.

## Spark: focused chat

A branded chat for children, showing how far presentation can go without forking the pane:

- fixed capabilities (no model picker, goals, plan mode or approvals);
- host instructions that set tone and boundaries, without pinning a provider-specific model id;
- a themed look through [tokens](/guide/presentation#theme-tokens);
- its own sign-in screen and chat navigation.

Spark is a customization example, not a child-safety product.

## Relay: business UI and MCP tools

A logistics operations board with a conversation beside it. It shows how an application and an agent share a domain:

- A seeded JSON operations store and an **app-owned MCP server** with read and write tools: `list_exceptions`, `get_shipment`, `find_recovery_options`, `draft_customer_update` and `rebook_shipment`.
- UI actions create a visible prompt grounded in the selected shipment; tools retrieve the authoritative record, so the model never relies on the prompt for state.
- Rebooking requires explicit confirmation.
- The trusted host starts a private loopback MCP endpoint and registers it through `mcpServers`. No endpoint token or native handle reaches the renderer, and the native approval policy stays authoritative.

## Component lab

The lab renders every control against deterministic mocked state, so it needs no provider login or Electron. It covers rich mentions, multiline composer behavior, prompt recall, streaming, steering, editable queues, tool states, attachments, context and diff shelves, requests, inline HTML, images, empty and error states and themes.

```bash
npm run dev:lab          # Vite dev server using SDK source aliases
npm run build:lab        # Output in dist-lab
npm run test:lab         # Component tests
npm run test:lab:browser # Chromium and WebKit workflows
```

Component changes appear in the lab directly, without rebuilding `dist`. The speech workflow uses controlled audio rather than a physical microphone. See `lab/README.md`.

## Isolated homes

Spark and Relay use `~/.agent-ui-sdk/samples/<sample>/<backend>/` for runtime configuration and sign-in, with separate `workspace/`, `state/` and `desktop/` directories for the workspace, SDK state and Electron profile. They never copy your standard runtime homes or accounts. Basic uses the selected runtime's standard home.

Spark and Relay open Codex sign-in in the browser from their login screens. The native authentication host closes after the browser callback, then the neutral chat driver starts with the same home. Claude sign-in uses its CLI: the screen shows the `CLAUDE_CONFIG_DIR=… claude auth login` command for the sample home; complete it and choose **Check Claude sign-in**. Other backends use their native authentication operations.

## Tests

`npm run test:samples` checks the host and the retained Relay contracts (store, tools, prompts, board) without a logged-in provider. `npm run test:samples:browser` runs the renderer against controlled harness snapshots in Chromium and WebKit. Neither establishes live provider compatibility; see [Testing](/guide/testing).

## Samples are demonstrations

They are product demonstrations, not templates for child safety or a production logistics backend. Copy the integration patterns, then supply your own product shell, authorization and data.
