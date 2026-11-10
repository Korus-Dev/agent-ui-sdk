# Contributing

Use Node.js from `.node-version`, run `npm ci`, then `npm run check`. Run browser workflows with `npx playwright install chromium webkit` and `npm run test:lab:browser`. See [development and testing](docs/guide/testing.md).

Keep the package focused on reusable conversation UI, host capability contracts and optional trusted adapters. Provider execution belongs in `multi-agent-sdk`; product navigation and persistence belong in applications. New provider behavior must be capability-driven.

Add tests at the owning public boundary and prove meaningful regressions red before green. Preserve the coverage floor. Document public API changes and verify the built npm archive. Never commit credentials, runtime homes, local conversations or `.env` files.

Do not publish or commit on someone else's behalf without explicit authorization. See [release setup](docs/guide/releasing.md) for publication prerequisites.
