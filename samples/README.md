# Multi-harness samples

The Basic, Spark and Relay Electron applications share a neutral session binding under `shared/`. Each supports harness selection without importing provider execution into the renderer. The deterministic component lab is at `../lab`.

Run commands from the repository root. See [samples](../docs/guide/samples.md) for launch commands and boundaries. `npm run test:samples` checks the host and retained Relay contracts. `npm run test:samples:browser` checks the renderer with controlled harness snapshots in Chromium and WebKit; it does not establish live provider compatibility.
