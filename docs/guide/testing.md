# Development and testing

```bash
npm ci
npm run check
```

The aggregate gate checks library/composition/lab types, runs coverage, builds the package, validates its packed contents, builds and tests samples, and builds documentation. Browser checks run separately with `npm run test:lab:browser` after `npx playwright install chromium webkit` (add `--with-deps` on Linux). CI runs both gates.

Tests should protect observable behavior at the owning boundary: DOM interactions, emitted events, state transitions, wire contracts, cleanup and failures. Demonstrate a regression's red state before accepting a new test. Use controlled promises and fake clocks for scheduling; use real browsers for scrolling, selection and layout. Avoid source-text assertions or duplicate tests that only inflate coverage.

The library retains an 85% statement coverage floor. The component lab covers deterministic streaming, requests, authored content, image previews and speech with controlled audio. Sample tests exercise the neutral host and retained Relay business behavior without requiring logged-in providers.

`npm run check:package` checks the actual npm archive, exported JavaScript/declarations, runtime imports and package allowlist. `npm run build:apple-speech` rebuilds the macOS helper. Runtime authentication, physical microphones and live provider compatibility require separate live checks; the deterministic suite does not establish them.
