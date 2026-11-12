# Spark Electron sample

A focused, branded chat for children: fixed capabilities, host instructions that set tone and boundaries, themed with SDK tokens, and its own sign-in and chat navigation. It is a customization example, not a child-safety product.

```bash
npm run dev:spark -- --backend codex
```

Backends are `codex`, `claude`, `cursor` and `antigravity`; Codex is the default.

Configuration, authentication, workspace and Electron data are isolated under `~/.agent-ui-sdk/samples/spark/<backend>/`. Sign in with this sample profile rather than your standard runtime home. See [presentation and theming](https://korus-dev.github.io/agent-ui-sdk/guide/presentation) and the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples#spark-focused-chat).
