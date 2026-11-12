# Basic Electron sample

A multi-conversation client: it lists existing conversations from the selected runtime, resumes their history, starts new ones and shows each in `ConversationPane` with its own session binding.

```bash
npm run dev:basic -- --backend codex
```

Backends are `codex`, `claude`, `cursor` and `antigravity`; Codex is the default.

Basic uses the runtime's standard home, authentication and configuration, so sign in with that runtime's normal CLI first. Set `SAMPLE_FOLDER` to choose the working directory (default: the current directory).

Start with `electron/service.ts` (the harness and chat service in the main process), `electron/preload.ts` (the narrow bridge) and `src/App.vue` (one `createSessionConversationController` per chat). See the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples#basic-electron) and the [quick start](https://korus-dev.github.io/agent-ui-sdk/guide/quick-start).
