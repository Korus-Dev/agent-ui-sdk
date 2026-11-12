# Testing

```bash
npm ci
npm run check
```

The aggregate gate checks source and every TypeScript test, fixture and test configuration, runs coverage, builds the package, installs and validates its npm tarball, and builds the documentation. It then builds the lab and samples and runs the sample unit tests.

## What runs where

| Check | Where | Command |
| --- | --- | --- |
| Quality gate | Linux, Node 22.19, 24 and 26 | `npm run check`, then `npm audit --omit=dev --audit-level=high` |
| Browser workflows | Linux, Node 24, Chromium and WebKit | `npm run test:lab:browser`, `npm run test:samples:browser` |
| Native smoke | macOS, Node 24 | `npm run test:native:smoke` |

Install browsers first with `npx playwright install chromium webkit` (add `--with-deps` on Linux).

The macOS job rebuilds the Apple speech helper, extracts the npm archive, verifies and launches the helper with an unsupported locale, then starts Electron, loads `/electron/browser` and exercises the packaged main and preload bridge through an isolated renderer. The backend is stubbed, so the smoke check needs no provider login, microphone or speech asset download. The normal build also verifies native asset presence, executable mode and Mach-O headers on Linux; compilation and execution stay on macOS.

## Iterating

```bash
npm run test:ai -- Composer      # one spec by name or path
npm run test:ai                  # the full unit suite
```

`test:ai` is a quiet run that prints failures, a short summary and a final `[TESTS:DONE]` marker. It includes the deterministic lab specs; sample unit tests use a separate configuration and are covered by the final gate. `npm run check` remains the final handoff gate.

Browser and Playwright tests, Electron smoke and native macOS tests, sample builds and launches, and publishing are explicit steps rather than part of everyday iteration.

## Writing tests

Protect observable behavior at the owning boundary: DOM interactions, emitted events, state transitions, wire contracts, cleanup and failures.

- Show a regression's red state before accepting a new test.
- Use controlled promises and fake clocks for scheduling.
- Use real browsers for scrolling, selection and layout; jsdom cannot establish geometry.
- Avoid source-text assertions and duplicate tests that only inflate coverage.

The library holds an **85% statement coverage** floor.

## Test areas

| Area | Covers |
| --- | --- |
| `tests/boundaries` | Public entry exports, the renderer import graph, session composition, the session controller and permission presentation |
| `tests/vue` | Components, controllers, providers, theme and rendering identity |
| `tests/host`, `tests/electron` | Host contracts, native IPC, the attachment registry, window policy and streaming speech |
| `tests/browser` | The Electron browser manager |
| `tests/speech` | Apple and OpenAI speech sessions |
| `lab/tests` | Lab component specs and the Chromium and WebKit workflows |
| `samples/**` | The neutral host, retained Relay business behavior and renderer workflows |

The component lab covers deterministic streaming, requests, authored content, image previews and speech with controlled audio. Sample tests exercise the neutral host and Relay without requiring logged-in providers.

## Verifying the package

`npm run check:package` packs the npm archive, checks its allowlist and public JavaScript and declarations, installs it in a temporary consumer, imports every runtime entry in plain Node and checks consumer types with strict ESNext and Bundler settings. The Electron-only entry is included in the consumer typecheck and loaded by the macOS smoke job.

Runtime authentication, physical microphones and live provider compatibility need separate live checks; the deterministic suite does not establish them.
