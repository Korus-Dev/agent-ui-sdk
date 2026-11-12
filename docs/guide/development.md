# Development

## Setup

Use the Node.js version in `.node-version` (22.19 or later), then:

```bash
npm ci
npm run check
```

`npm run check` is the final gate: source and test types, coverage, build, the packed consumer, documentation, lab and samples.

## Repository layout

| Path | Contents |
| --- | --- |
| `src/vue/` | Root entry: components, session composition, themes, providers |
| `src/vue/chat/` | Message, composer, tool and request controls and their helpers |
| `src/vue/components/` | Top-level components: `ConversationPane`, `Composer`, `MessageList`, … |
| `src/vue/documents/`, `src/vue/browser/` | Document panels and the browser panel |
| `src/host/` | `/host` contracts and prompt-option translation |
| `src/electron/` | `/electron` and `/electron/preload` |
| `src/browser/` | `/browser`, `/electron/browser` and browser UI contracts |
| `src/speech/` | `/speech` sessions |
| `src/documents/` | `/documents` helpers |
| `native/`, `assets/` | Swift source and the packaged Apple speech helper |
| `lab/` | The component lab and its browser workflows |
| `samples/` | Basic, Spark and Relay |
| `examples/` | Typed integration examples |
| `tests/` | Unit and boundary tests, mirroring the entries |
| `scripts/` | Build, packaging and verification scripts |
| `docs/` | This site |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Type-check the source |
| `npm run typecheck:tests` | Type-check tests, fixtures and test configurations |
| `npm run test:ai -- <name-or-path>` | Iterate on one spec, quietly |
| `npm run test:ai` | The full unit suite, including deterministic lab specs |
| `npm run test:coverage` | Unit suite with the 85% statement gate |
| `npm run build` | Build `dist`, verify CSS, fonts and native assets |
| `npm run check:package` | Pack the tarball, install it in a temporary consumer and verify it |
| `npm run dev:docs`, `npm run build:docs` | Run or build this site |
| `npm run dev:lab`, `npm run build:lab`, `npm run test:lab` | The component lab |
| `npm run test:lab:browser`, `npm run test:samples:browser` | Chromium and WebKit workflows |
| `npm run dev:basic`, `dev:spark`, `dev:relay` | Run an Electron sample |
| `npm run test:samples` | Sample unit tests |
| `npm run test:native:smoke` | macOS Electron and Apple speech smoke test |
| `npm run build:apple-speech` | Rebuild the Apple speech helper (macOS, Xcode 26+) |

Install browsers once for the browser workflows: `npx playwright install chromium webkit` (add `--with-deps` on Linux).

## Develop against local SDK sources

Published sibling SDKs are used by default. To change them together with this package, copy `.env.example` to `.env`:

```bash
SDK_LOCAL_SOURCE=1
# Optional: the directory that contains the sibling repositories (default: ..)
SDK_SOURCE_ROOT=..
```

With `SDK_LOCAL_SOURCE=1`, Vite aliases the sibling packages to their source and typechecking uses their declarations. The folders `codex-sdk`, `multi-agent-sdk` and `agent-ui-sdk` must sit under `SDK_SOURCE_ROOT`; the build fails with a clear message when one is missing. Build `codex-sdk`, then `multi-agent-sdk`, then this package. Set `SDK_LOCAL_SOURCE=0` to verify against installed packages, as CI does.

## Principles for changes

- **Capability-driven.** New behavior is gated by a capability or a host-supplied value, never by a provider name.
- **Renderer-safe.** Do not import Node, Electron, `ws` or provider execution from the root entry. The boundary test will fail.
- **Host-owned persistence.** Add props, events and controller actions; do not store durable state in the SDK.
- **Public contracts are documented.** Update these pages and the [API reference](/api/) with any change to an export, prop, event or slot.
- **Neutral names.** Use the Multi Agent SDK's canonical types (`Message`, `Turn`, `AgentRequest`, `HarnessDefaults`, …) instead of provider-shaped ones.

## Adding a control

1. Put the component beside its family and export it from `src/vue/index.ts`.
2. Take state and actions through props and events. Avoid reaching for globals; use the scoped providers in `chat/` for translation, tool presentation and host capabilities.
3. Add user-visible strings to `chat-i18n.ts` under a `chat.*` key.
4. Style with `--agent-ui-*` tokens and the shared `--color-*` and `--space-*` variables, and give the root the `agent-ui-theme` class.
5. Add behavioral tests at the public boundary, a lab scenario if the control has meaningful states, and a [components](/guide/components) entry.

## Documentation

The site is VitePress. Run `npm run dev:docs` to preview it, and `npm run build:docs` to build exactly what GitHub Pages serves. The documentation workflow deploys from `main` when `docs/**` or the build configuration changes.

Guides describe the current behavior and the outcomes it gives users. Keep API tables in sync with `src/`; the entry-point and component references are the canonical lists.
