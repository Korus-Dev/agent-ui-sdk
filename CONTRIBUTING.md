# Contributing

Use Node.js from `.node-version`, run `npm ci`, then `npm run check`. This final gate checks source and test types, coverage, builds, the installed npm tarball and documentation. See [development and testing](docs/guide/testing.md).

Agents iterate only with `npm run test:ai -- <name-or-path>` or `npm run test:ai` for the full unit suite, including deterministic lab specs. Do not call `vitest`, `npx vitest` or `npm test` directly for agent runs. `test:ai` is for development; `npm run check` remains the final handoff gate. Browser/Playwright tests, Electron smoke/native macOS tests, sample builds and launches, and publishing require an explicit task instruction rather than an agent's independent decision.

Keep the package focused on reusable conversation UI, host capability contracts and optional trusted adapters. Provider execution belongs in `multi-agent-sdk`; product navigation and persistence belong in applications. New provider behavior must be capability-driven.

Add tests at the owning public boundary and prove meaningful regressions red before green. Preserve the coverage floor. Document public API changes and verify the built npm archive. Never commit credentials, runtime homes, local conversations or `.env` files.

Do not create branches, commit, push or publish without explicit authorization. Preserve unrelated work. See [release setup](docs/guide/releasing.md) for publication prerequisites.
