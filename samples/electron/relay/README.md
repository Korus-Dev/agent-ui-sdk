# Relay Electron sample

A logistics operations board with a conversation beside it. The trusted host runs an app-owned MCP server over a seeded JSON store (`list_exceptions`, `get_shipment`, `find_recovery_options`, `draft_customer_update`, `rebook_shipment`). UI actions create a visible prompt grounded in the selected shipment, and tools retrieve the authoritative record. Rebooking requires explicit confirmation.

```bash
npm run dev:relay -- --backend codex
```

Backends are `codex`, `claude`, `cursor` and `antigravity`; Codex is the default.

Configuration, authentication, workspace and Electron data are isolated under `~/.agent-ui-sdk/samples/relay/<backend>/`. Sign in with this sample profile rather than your standard runtime home. See the [sample guide](https://korus-dev.github.io/agent-ui-sdk/guide/samples#relay-business-ui-and-mcp-tools).
