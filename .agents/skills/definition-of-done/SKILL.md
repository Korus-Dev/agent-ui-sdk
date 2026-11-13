---
name: definition-of-done
description: Verify Agent UI SDK work before handoff, commit, or push. Use after repository changes.
---

# Definition of Done

Use proportional evidence. The user's requested validation depth is authoritative.

## Before handoff

- Inspect `git status --short`; preserve unrelated changes.
- Add focused behavioral tests at the owning boundary, and show a regression test
  failing for the defect before accepting it green. Read `docs/guide/testing.md`
  before changing tests.
- Iterate with `npm run test:ai -- <name-or-path>`, or `npm run test:ai` for the
  whole unit suite, which includes the deterministic lab specs but not the sample
  specs. Never call `vitest` or `npx vitest` directly, and do not use `npm test`
  for agent runs.
- Finish with `npm run check`. It owns the typechecks (source and tests), tests with
  the coverage gate, the build, the real npm tarball check (`check:package`), the
  VitePress build, the lab and sample builds, and the sample tests. For a narrow
  change, run the affected script first, but `npm run check` remains the handoff gate.
- Do not lower the 85% statement coverage threshold.
- Run `git diff --check` after the final edit.
- Browser and Playwright suites (`test:lab:browser`, `test:samples:browser`),
  Electron smoke and native macOS tests (`test:native:smoke`), sample builds or
  launches, and publishing need an explicit task instruction. For selection,
  clipboard, layout, scrolling or focus behavior that jsdom cannot prove, say so and
  record the browser check as not run. Normal checks must not log in, run paid
  prompts, record microphones, or change the user's provider homes.
- Never commit credentials, runtime homes, local conversations or `.env` files.

## Scope

This package is reusable Vue conversation controls, renderer-safe host contracts,
and optional Electron, browser and speech adapters. Provider execution belongs in
multi-agent-sdk, raw Codex protocol in codex-sdk, and product navigation and
persistence in applications. Keep behavior capability-driven, preserve the
renderer/host boundary, and never expose provider handles, credentials or
filesystem authority through renderer APIs.

## VitePress gate

Treat VitePress as a public SDK surface. For every change, decide and report one:

- **Updated:** an exported component, prop, event, slot, host contract, adapter or
  recommended workflow changed. Update `docs/api/` for exact contracts,
  `docs/guide/` for usage, `INTEGRATION.md` when host integration steps change, and
  the samples when they demonstrate the change. Add a user-visible entry under
  `## Unreleased` in `CHANGELOG.md`. Update `README.md` only for discovery, update
  `docs/.vitepress/config.mts` when pages move or are added, then run
  `npm run build:docs`.
- **No impact:** state why the change is internal.

A public contract change is incomplete until its documentation matches.

## Report

Summarize the outcome and public API, checks actually run and not run (browser,
native), VitePress impact, and remaining unrelated changes. Explain selected
failures or warnings. Do not create branches, commit, push, bump versions, or
publish without explicit authorization; each is a separate action. Release follows
the cascade codex-sdk → multi-agent-sdk → agent-ui-sdk → Korus, and only after
Nicolas confirms Korus runs with the SDK working trees in local-source mode
(`SDK_LOCAL_SOURCE=1`); green CI alone is not enough.
