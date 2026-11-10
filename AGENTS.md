# Agent UI SDK contributor instructions

Keep this package focused on reusable Vue conversation controls, renderer-safe
host contracts, and optional Electron, browser and speech adapters. Provider
execution belongs in multi-agent-sdk; raw Codex protocol belongs in codex-sdk.
Product navigation and persistence belong in applications.

Preserve capability-driven behavior and the renderer/host boundary. Do not expose
provider handles, credentials or filesystem authority through renderer APIs.

Use behavioral tests at the owning boundary. Follow [testing](docs/guide/testing.md),
prove regressions red before fixing them, and preserve the 85% statement coverage
gate. Run `npm run check` and `git diff --check` before handoff. Document public
contract changes and verify the real npm tarball with `npm run check:package`.
Record unavailable native and live-provider validation explicitly.

During development, run tests only with `npm run test:ai -- <name-or-path>`, or
`npm run test:ai` for the full unit suite. Do not call `vitest`, `npx vitest` or
`npm test` directly for agent runs. `npm run check` stays the final handoff gate;
`test:ai` is for iterating. The unit suite includes deterministic lab specs, but
not the separately configured sample specs.

Do not independently invoke browser/Playwright tests, Electron smoke/native macOS
tests, sample builds or sample launches, or publishing. Those operations require
an explicit task instruction; the final `npm run check` gate remains required.

Preserve unrelated work. Do not create branches, commit, push or publish without
explicit user authorization. Normal checks must not log in, execute paid prompts,
record microphones or change the user's provider homes. Never commit credentials,
runtime homes, local conversations or `.env` files.

Follow the release cascade: codex-sdk → multi-agent-sdk → agent-ui-sdk → Korus.
Wait for the upstream version to be published, then update the exact dependency
pin and regenerate the lockfile with npm together. Verify a clean
`npm ci --ignore-scripts`, `npm run check` and the production audit before release.
