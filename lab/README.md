# Component lab

A visual lab for the Agent UI SDK conversation
components. It covers rich mentions, multiline composer behavior, prompt
recall, deterministic streaming, steering, editable queues, tool states,
reasoning-aware live activity titles, attachments, context and diff shelves,
empty state, errors, and themes without starting app-server or Electron.
These fixtures remain fully mocked.

```bash
npm run dev:lab
```

The lab uses SDK source aliases in development, so component changes appear
directly without rebuilding `dist`.

Compile it without starting Vite with `npm run build:lab`. Output is written to `dist-lab`. Run `npm run test:lab` for component tests and `npm run test:lab:browser` for Chromium/WebKit browser workflows. The speech workflow uses controlled audio rather than a physical microphone.
