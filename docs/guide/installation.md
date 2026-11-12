# Installation

## Requirements

| Requirement | Version |
| --- | --- |
| Node.js (development and trusted adapters) | 22.19 or later |
| Vue | 3.5 or later |
| Bundler | A Vue-aware ESM bundler such as Vite |
| Electron (optional) | 30 or later |
| Element Plus (optional) | 2.13 or later |

The package is ESM-only. TypeScript consumers should use `target: ES2022`, `module: ESNext` and `moduleResolution: Bundler`. NodeNext resolution is not part of the supported consumer contract.

## Install

```bash
npm install @korus-dev/agent-ui-sdk vue
```

Import the stylesheet once in your renderer:

```ts
import { ConversationPane, Composer, MessageList } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
```

The stylesheet carries control styles, code and math styles, and the packaged KaTeX fonts.

### Optional peers

Electron is an optional peer for desktop hosts. Element Plus is an optional peer used only by the browser panel; install it when you use that component:

```bash
npm install element-plus
```

### Provider execution

The SDK renders conversations; it does not run them. Install `@korus-dev/multi-agent-sdk` in your trusted host and the runtime for each harness you support (Codex, Claude, Cursor or Antigravity). See the [quick start](/guide/quick-start) for how the pieces connect.

## Import boundaries

Root UI imports do not initialize a harness or load Electron. Keep trusted adapters in the Electron main process or on your server:

| Import | Where it may run |
| --- | --- |
| `@korus-dev/agent-ui-sdk` | Renderer |
| `@korus-dev/agent-ui-sdk/styles.css` | Renderer |
| `@korus-dev/agent-ui-sdk/host` | Anywhere: types and a pure prompt-option translation |
| `@korus-dev/agent-ui-sdk/browser`, `/browser-ui`, `/documents` | Renderer |
| `@korus-dev/agent-ui-sdk/electron` | Electron main process |
| `@korus-dev/agent-ui-sdk/electron/preload` | Electron preload script |
| `@korus-dev/agent-ui-sdk/electron/browser`, `/speech` | Trusted Node or Electron process only |

See [entry points](/api/) for the full list.

## Work from a checkout

```bash
git clone https://github.com/Korus-Dev/agent-ui-sdk.git
cd agent-ui-sdk
npm ci
npm run dev:lab
```

The component lab uses mocked state and needs no provider login. To run a sample against a real harness, see [samples](/guide/samples).

Published sibling SDKs are used by default. To develop them together with this package, see [local SDK sources](/guide/development#develop-against-local-sdk-sources).
