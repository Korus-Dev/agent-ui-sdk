# Development and testing

```bash
npm ci
npm run check
```

The aggregate gate checks source and all TypeScript tests, fixtures and test configurations, runs coverage, builds the package, installs and validates its npm tarball, and builds documentation. It then builds the lab and samples and runs sample unit tests. CI runs it on Linux with Node 22.19, 24 and 26, followed by `npm audit --omit=dev --audit-level=high`. Browser checks run separately on Linux with `npm run test:lab:browser` and `npm run test:samples:browser` after `npx playwright install chromium webkit` (add `--with-deps` on Linux).

A separate macOS job uses Node 24 to rebuild the Apple speech helper and run `npm run test:native:smoke`. It extracts the npm archive, verifies and launches its Apple speech helper with an unsupported locale, then starts Electron, loads `/electron/browser.js` and exercises the packaged main/preload bridge through an isolated renderer. The backend is stubbed; the smoke check requires no provider login, microphone or speech asset download. The normal build verifies native asset presence, executable mode and Mach-O headers on Linux too; native compilation and execution stay in the macOS job.

Agents iterate with `npm run test:ai -- <name-or-path>` or `npm run test:ai` for the full unit suite. This quiet run includes deterministic lab specs and prints failures, a short summary and a final `[TESTS:DONE]` marker. Sample unit tests use a separate configuration and are covered by the final gate. Do not call `vitest`, `npx vitest` or `npm test` directly for agent runs. `npm run check` remains the final handoff gate. Browser/Playwright tests, Electron smoke/native macOS tests, sample builds and launches, and publishing require an explicit task instruction.

Tests should protect observable behavior at the owning boundary: DOM interactions, emitted events, state transitions, wire contracts, cleanup and failures. Demonstrate a regression's red state before accepting a new test. Use controlled promises and fake clocks for scheduling; use real browsers for scrolling, selection and layout. Avoid source-text assertions or duplicate tests that only inflate coverage.

The library retains an 85% statement coverage floor. The component lab covers deterministic streaming, requests, authored content, image previews and speech with controlled audio. Sample tests exercise the neutral host and retained Relay business behavior without requiring logged-in providers.

`npm run check:package` packs the npm archive, checks its allowlist and public JavaScript/declarations, installs it in a temporary consumer, imports runtime entries in plain Node and checks consumer types with strict ESNext/Bundler settings. The explicit Electron-only entry is included in the consumer typecheck and loaded by the macOS smoke job. `npm run build:apple-speech` rebuilds the macOS helper. Runtime authentication, physical microphones and live provider compatibility require separate live checks; the deterministic suite does not establish them.
