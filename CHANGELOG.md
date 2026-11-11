# Changelog

## Unreleased

- Explicit package exports with extensionless optional entry points.
- Provider-neutral component, presentation and host capability names, using Multi Agent SDK 0.26.0 neutral contracts.
- One capability-driven conversation pane for every harness; removed legacy provider-specific panes, hooks, catalogs and Electron execution bridges.
- The conversation pane takes neutral `requests` (`AgentRequest[]`) and answers them through `respond(AgentRequestResponse)`. Settings changes go through `updateSettings(Partial<HarnessDefaults>)` and `setPlanMode`; without a controller, the pane emits `update:permission` alongside the other `update:*` events.
- Session conversation bindings apply a permission change once, through the session, and never pass it to `onControlsChange`.
- `ConversationRenderStrategy` is defined here. Approval props use the SDK's `Provider*` approval types, and the Codex-shaped `ConversationMessage*` re-exports are removed in favor of the SDK's neutral `Message` model.
- Host preload globals, IPC channels and generic theme selectors use the canonical host and Agent UI vocabulary.

## 0.25.0

First standalone Agent UI SDK release.

- Capability-driven Vue conversation panes and reusable composer, message, request, tool, queue and goal controls.
- Neutral multi-harness session integration with optional native Codex compatibility controls.
- Document previews, browser panels and trusted Electron and speech adapters.
- Basic Electron, Spark, Relay and component-lab samples.
- VitePress guides, package consumer validation, quality CI and manual trusted npm publishing.
