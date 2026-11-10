# Native host capabilities

The root UI consumes renderer-safe host contracts from `/host.js`. Install optional host capabilities for attachment picking, ingestion, previews, clipboard and speech. Applications own native authorization, lifecycle, durable storage and retention.

## Electron

Import trusted adapters from `/electron.js` and preload helpers from `/electron/preload.js`. Use context isolation, disable Node integration in renderers, validate every IPC sender, restrict navigation with `installWindowPolicy`, and expose only the methods the UI needs. The Electron sample demonstrates a narrow session bridge; its opaque driver handles never cross IPC.

The compatibility `registerElectronMain` and surface helpers remain available for native Codex integrations. Generic session applications should use the neutral harness contract rather than treating that surface as a universal provider API.

## Speech

`/speech.js` exposes Apple and OpenAI speech session helpers. Apple speech uses the packaged universal helper under `assets/` and Swift source under `native/`; rebuild it on macOS with Xcode 26 or later using `npm run build:apple-speech`. Apple SpeechAnalyzer requires macOS 26 or later. Keep credentials and speech connections in the trusted host, and release recording/session resources when the view closes.

`useNativeSurface`, `useNativeLiveChat`, `NativeConversationPane` and native catalogs are opt-in through `/native.js`. These compatibility controls use the Codex surface contract. They are separate from neutral `SessionState` bindings.
