# Releasing

CI checks pull requests and pushes to `main`. Publishing is a separate, manual workflow on `main` that uses npm trusted publishing through GitHub OIDC. No long-lived npm token belongs in this repository.

## Release order

Release dependencies in order: **codex-sdk → multi-agent-sdk → agent-ui-sdk → the consuming application**.

Each upstream release must be on npm before the next package updates its exact dependency pin and regenerates its lockfile with npm. A Codex SDK change therefore requires the downstream SDK releases before an application consumes it. Before releasing a package, run a clean `npm ci --ignore-scripts`, the quality gate and the production audit.

## Qualify before releasing

Run the SDK working trees together inside the consuming application with `SDK_LOCAL_SOURCE=1` (and `SDK_SOURCE_ROOT` if needed). Tarballs are for the isolated consumer check, not for qualification. A green CI run alone is not sufficient: wait for the maintainer's explicit go before bumping the version, committing, pushing or publishing.

## Steps

1. Choose the version and update `package.json` and `package-lock.json` together.
2. Confirm the dependency pins on `@korus-dev/codex-sdk` and `@korus-dev/multi-agent-sdk` are published versions.
3. Update `CHANGELOG.md`: move the unreleased notes under the new version.
4. Run `npm run check` and review the archive from `npm run check:package`.
5. Merge to `main`.
6. Dispatch **Publish to npm** with the exact committed version.

## What the publish workflow does

It runs on Linux and:

1. checks that the requested version equals `package.json`;
2. runs `npm ci --ignore-scripts`, the quality gate and the production dependency audit;
3. packs once with `--ignore-scripts` and publishes that tarball with provenance.

A separate job creates a GitHub release only after publication succeeds. A GitHub release failure does not roll back npm publication; check the registry before retrying. Browser and native checks run in CI.

## First publication

Before the first publication of a package, configure npm trusted publishing for this repository and `.github/workflows/publish.yml`, completing npm's initial package and trusted-publisher setup as the registry requires.

## Documentation

The documentation workflow builds GitHub Pages from `main` when documentation or its build configuration changes, and also supports manual dispatch. Deployment is restricted to `main`. Enable Pages with **GitHub Actions** as the build source. Writing workflows or passing local checks does not publish the npm package.
