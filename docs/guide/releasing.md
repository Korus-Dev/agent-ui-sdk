# Releasing

CI checks pull requests and pushes to main. Publishing is an explicit manual workflow on main, using npm trusted publishing through GitHub OIDC. No long-lived npm token belongs in this repository.

Before the first publication:

1. Create the public `Korus-Dev/agent-ui-sdk` GitHub repository and configure Actions/Pages as appropriate.
2. Publish compatible `@korus-dev/codex-sdk` and `@korus-dev/multi-agent-sdk` versions first; replace placeholder dependency versions here with published versions.
3. Choose the package version and update `package.json` and `package-lock.json` together.
4. Configure npm trusted publishing for this repository and `.github/workflows/publish.yml`. For a new package, complete npm's initial package/trusted-publisher setup as required by the registry.
5. Run the quality gates, review the archive and dispatch **Publish to npm** with the exact committed version.

The release workflow runs on Linux, checks that the requested version equals `package.json`, runs `npm ci --ignore-scripts`, the quality gate and the production dependency audit, then packs once with `--ignore-scripts` and publishes that tarball with provenance. Browser and native checks run in CI. A separate job creates a GitHub release only after publication succeeds. A GitHub release failure does not roll back npm publication; check the registry before retrying.

The documentation workflow builds GitHub Pages on main when documentation or its build configuration changes, and also supports manual dispatch. Deployment is restricted to main. Enable Pages with Actions as the build source. Neither writing workflows nor passing local checks publishes the npm package.
