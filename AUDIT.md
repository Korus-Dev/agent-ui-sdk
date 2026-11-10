# Extraction and publication audit

Compared against `codex-app-sdk` at `564f7f6` and the release/quality conventions in `multi-llm-ts`. This is an assessment record; product documentation is under `docs/`.

## Scope and disposition

| Original area | Disposition here |
| --- | --- |
| Vue controls, composer, messages, providers, history rendering, themes | Retained, with neutral public names and native-only compatibility hooks |
| Electron IPC, preload, window policy, attachment registry | Retained as optional trusted entry points |
| Apple/OpenAI speech, universal helper, Swift source | Retained; helper rebuild command restored |
| Provider runtime, protocol/schema generation, authentication internals and replicas | Owned by sibling SDKs, not copied into UI runtime |
| Conversation sidebar | Intentionally host-owned; samples supply navigation |
| Component lab and browser regressions | Present; checked against original scenarios and run locally |
| Basic Electron, Spark, Relay | Retrofitted around neutral session state/actions and harness selection; shared implementation avoids three copies of bridge plumbing |
| Codex project scaffolder | Separate package in original repository; not transferred. User explicitly excluded a scaffolder for this release |
| Mutation runner | Original package-specific configuration is not portable; not copied. Coverage and observable owning-boundary checks retained |
| Original release history | Not copied as this package history; initial standalone 0.25.0 changelog created |

## Gaps closed

- VitePress site with installation, conversation binding, composer, messages/history, presentation/providers, documents/browser, native capabilities, samples, testing, release and entry-point guides.
- Public README, contribution guide, initial changelog, issue/homepage metadata and consistent version/lockfile.
- Root main/types and static public forwarding files, with no exports map, application-facing dist imports, NodeNext target or declaration rewrite step.
- Pull-request/main CI on Linux/macOS and Node 22.19/24; separate Chromium/WebKit job.
- Manual OIDC npm publishing with version/lockfile/placeholder guards, quality/browser checks, archive publication and post-publish GitHub release. Manual Pages deployment.
- Actual packed archive allowlist, static entry/declaration checks, strict Bundler consumer compilation, browser build and installed speech-asset resolution.
- Apple helper rebuild command and preservation of the redistributed KaTeX font license.
- Multi-harness sample host, isolated Electron preload/native ports, focused Spark presentation and Relay business prompts/MCP endpoint.
- Retained Relay store/tool/prompt/board tests, neutral harness session tests, real HTTP MCP test and Chromium/WebKit sample workflows.

## Original documentation coverage

| Original guides | Current destination or owner |
| --- | --- |
| installation, quick-start | docs/guide/installation.md; conversation-pane.md |
| vue, conversation-pane, surface | conversation-pane.md; api/index.md; native-capabilities.md for native compatibility |
| composer | composer.md |
| messages-tools, history, conversations | messages-tools.md; host navigation in samples |
| presentation, vue-providers, app-ui | presentation.md; documents-browser.md; sample shells |
| native-capabilities, electron, security | native-capabilities.md; documents-browser.md; sample host boundaries |
| samples, web | samples.md and sample READMEs; standalone website hosting is outside the current scope |
| development, testing | testing.md; CONTRIBUTING.md |
| architecture, backend, events, authentication, MCP, extensions, remote-control | Provider/runtime ownership stays in sibling SDKs; UI-facing integration described in pane/native/sample guides |
| scaffolding | Excluded by user for now |
| troubleshooting | Installation, native, sample and release guidance cover setup and boundaries; no copied provider-specific troubleshooting claims |
| API vue/electron | Named entry-point reference plus published declarations; native/runtime API references belong to the owning SDK |
| API codex/node/events/surface/json-rpc | Sibling SDK responsibility |
| Standalone website transport and hosting sample | Removed from the current scope at the user's request |

## Release blockers and parked work

- The selected initial version is **0.25.0**. Nothing was committed, pushed or published.
- Both `@korus-dev/codex-sdk` and `@korus-dev/multi-agent-sdk` returned npm 404 on 2026-11-10. The intended dependency versions are now Codex 0.167.0 and Multi 0.25.0; publish those first and regenerate registry lock metadata before releasing. Fresh hosted CI installation cannot pass before that prerequisite. Local installed-package verification uses tarballs packed from sibling builds, with source aliases disabled.
- npm trusted publisher and Pages settings require repository/registry setup. The workflows have not run on GitHub.
- Dependency remediation is explicitly parked at the user's request: npm audit reported 18 advisories (6 high, 10 moderate, 2 low), including Vue/server-renderer, Electron, Vite/VitePress, test tooling, MCP/Zod and KaTeX paths. No blanket audit fix or dependency upgrade was applied. A no-skip declaration probe additionally exposed six TS2707 vendor declaration errors in Claude Agent SDK/Zod; strict consumer code is checked with the existing skipLibCheck policy, without rewriting any declarations.
- Samples select installed/authenticated runtimes. The old ChatGPT-only account screens and fixed Codex model defaults are not presented as portable authentication or selection. User chose the focused samples and no scaffolder for now; saved-conversation/account workflow parity is intentionally outside this release scope.
- New sample bridges use full snapshots for clarity. They are examples, not a production remote transport or persistence service.
- Live paid/provider turns and a physical microphone were not exercised. Deterministic provider-selection tests do not establish native provider interoperability.

## Verification

- Aggregate `SDK_LOCAL_SOURCE=0 npm run check` (Codex 0.167.0 and Multi 0.25.0 installed from candidate tarballs): types, 1,870 library/lab tests, coverage above the 85% floor, library/lab/sample builds, external packed consumer, sample tests and VitePress.
- Library statement coverage: 94.45% after the duplicate-approval fix (94.13% baseline).
- All 11 component-lab browser workflows completed, covering Chromium/WebKit where specified by each owning workflow.
- Sample create/send/close and focused Spark shell checked in Chromium and WebKit using controlled snapshots for Codex, Claude, Cursor and Antigravity.
- Relay HTTP MCP test uses actual client/server transport and verifies rejected then confirmed mutation of the store.
- Native Electron Basic, Spark and Relay launches checked with actual main/preload/renderer and native ports; Relay loaded its seeded operations snapshot. No provider turn was started.
- Neutral host tests demonstrated red under an intentional Codex-only dispatch mutation; the owner was restored and the suite passed.
- The final packed consumer also passed on Node 22.19.0, using the final Multi 0.25.0 and Codex 0.167.0 candidate artifacts.
- Pending tool confirmations are hidden in the transcript by request ID as well as item ID while displayed in the composer. Missing/mismatched item IDs have red/green regressions; resolved transcript summaries remain visible.
- Standalone HTTP/SSE hosting/sample code and the lab WebSocket live-chat demo were removed; Electron IPC, embedded-browser controls and native media APIs remain.
- Local-source mode separately checks aliases and types using main/types plus the static root entry files; owning tests import local source directly. Application and example imports contain no SDK dist paths.
- Assessment-only probes were run inline or in temporary storage; no assessment-only script is retained in the repository. Build, launch, package and release scripts are maintained tooling.

## File inventory findings

- Backend speech sources: all three (`apple-speech-session`, `apple-speech-transcription`, `openai-speech-session`) and their three owning suites are retained under `src/speech` and `tests/speech`. The Swift source and universal asset are present; the duplicate build artifact under the old native directory is not needed.
- Runtime/protocol backend tests are left with their sibling runtime owners. Browser/document controls already present here extend beyond the original Vue inventory.

- `packages/vue/src`: 130 files reviewed; 129 have same-name destinations.
  - `packages/vue/src/components/CodexConversationSidebar.vue`: Host-owned navigation, intentionally excluded.
- `packages/vue/tests`: 87 files reviewed; 85 have same-name destinations.
  - `packages/vue/tests/CodexConversationSidebar.spec.ts`: Host-owned navigation, intentionally excluded.
  - `packages/vue/tests/CodexConversationPane.spec.ts`: Native wrapper test retained as tests/vue/native/NativeConversationPane.spec.ts.
- `packages/electron/src`: 11 files reviewed; 11 have same-name destinations.
- `packages/electron/tests`: 8 files reviewed; 8 have same-name destinations.

The basename inventory is an extraction completeness check, not a claim of byte-identical behavior. Existing neutralization and host-boundary adaptations are covered by the retained tests. The entry-point migration adds root-forwarder asset discovery for the bundled speech helper; its regression is covered alongside legacy installed layouts. Other changes preserve library behavior.
