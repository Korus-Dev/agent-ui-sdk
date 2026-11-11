# Native host capabilities

The root UI consumes renderer-safe host contracts from `/host`. Install optional host capabilities for attachment picking, ingestion, previews, clipboard and speech. Applications own native authorization, lifecycle, durable storage and retention.

## Electron

Import trusted adapters from `/electron` and preload helpers from `/electron/preload`. Use context isolation, disable Node integration in renderers, validate every IPC sender, restrict navigation with `installWindowPolicy`, and expose only the methods the UI needs. The Electron sample demonstrates a narrow session bridge; its opaque driver handles never cross IPC.

The SDK ships ESM. For a sandboxed preload, bundle `/electron/preload` into the application's CommonJS preload file and keep `electron` external to the bundle. To load the ESM entry directly, use a `.mjs` preload with `sandbox: false`; keep `contextIsolation: true` and `nodeIntegration: false`. Electron's sandbox cannot load an ESM preload directly.

`/electron/browser` uses native Electron APIs and must run inside Electron. Its packed JavaScript is loaded in a real Electron process by the macOS CI smoke job; all other public runtime entries are also checked in plain Node ESM.

`registerNativeIpc` installs capability handlers in the trusted host. `exposeNativeRendererApi` exposes `window.agentUiHostCapabilities` from the preload, with `agent-ui-native:*` IPC channels. Use the exported typed IPC helpers for application-owned session bridges. The UI SDK does not expose provider execution or a provider host global.

## Speech

`/speech` exposes Apple and OpenAI speech session helpers. Apple speech uses the packaged universal helper under `assets/` and Swift source under `native/`; rebuild it on macOS with Xcode 26 or later using `npm run build:apple-speech`. Apple SpeechAnalyzer requires macOS 26 or later. Keep credentials and speech connections in the trusted host, and release recording/session resources when the view closes.

Conversation state, capabilities and actions reach the same `ConversationPane` through the neutral session controller. Provider-specific login, account and realtime protocol operations belong in Multi Agent SDK or the application's host adapter.
