# Component lab

A visual lab for the Agent UI SDK conversation components. Every scenario uses deterministic mocked state, so it needs no provider login, app-server or Electron.

It covers rich mentions, multiline composer behavior, prompt recall, streaming, steering, editable queues, tool states, reasoning-aware live activity titles, attachments, context and diff shelves, requests, inline HTML, images, empty and error states, and light, dark and system themes.

```bash
npm run dev:lab          # Vite dev server using SDK source aliases
npm run build:lab        # Output in dist-lab
npm run test:lab         # Component tests
npm run test:lab:browser # Chromium and WebKit workflows
```

Component changes appear directly without rebuilding `dist`. The speech workflow uses controlled audio rather than a physical microphone. See the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples#component-lab).
