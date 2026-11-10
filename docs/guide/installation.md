# Installation

```bash
npm install @korus-dev/agent-ui-sdk vue
```

Use Node.js 22.19 or later for development and trusted host adapters, and Vue 3.5 or later. The package is ESM-only and designed for Electron applications using a Vue-aware bundler such as Vite. TypeScript consumers should use `target: ES2022`, `module: ESNext` and `moduleResolution: Bundler`. NodeNext type resolution is not part of the supported consumer contract. Import the stylesheet once in your renderer:

```ts
import { ConversationPane, Composer, MessageList } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
```

Electron is an optional peer for desktop hosts. Element Plus is an optional peer for browser UI and document panels that use its controls; install it when using those components:

```bash
npm install element-plus
```

Keep trusted adapters in the main process or server. Root UI imports do not initialize a harness or Electron. See [entry points](../api/index.md) for import boundaries and [the pane guide](conversation-pane.md) for state and actions.

For a checkout, run `npm ci`. Published dependencies are the default. To develop sibling SDKs together, copy `.env.example` to `.env` and set `SDK_LOCAL_SOURCE=1`. Build `codex-sdk`, then `multi-agent-sdk`, then this package. `SDK_SOURCE_ROOT` selects the parent directory containing those repositories. Vite uses source aliases; typechecking uses dependency declarations. Set `SDK_LOCAL_SOURCE=0` to verify installed packages.
