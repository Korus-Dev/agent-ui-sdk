# Changelog

## 0.27.1

- Built on Multi Agent SDK 0.27.1.
- Work groups show "Working" and "Done" with the elapsed time for every harness. "View details" appears only for summary turns (`itemsView: 'summary'`) and for harnesses that state text phases (`capabilities.workPhases`); other harnesses keep their work visible with no toggle, and the pane derives the answer from the turn structure.
- The composer's model selector is now the harness picker (`HarnessModelSelector`, also exported on its own): a button that opens one popover with an optional tab per harness, that harness's models, reasoning efforts and a speed button. The speed button stays in place and is dimmed when the model has no speed options. Pass `harnesses` (`HarnessChoice[]`: `id`, `label`, `icon`) and `harness` to `ConversationPane` or `Composer` for the tabs, and handle `update:harness` or the `selectHarness` action. Without two or more harnesses it shows no tabs.
- Removed the previous model menu: the `ModelReasoningSelector` export and the `modelMenuItems` prop and controller field. Host favorites in the model menu are not supported for now.
- `ModelPicker` accepts the pane's own `ModelOption` as well as the harness's. The theme defines `--color-menu-background`, which `AppMenu` panels (such as submenus) were missing.

## 0.27.0

- The composer's permission menu lists the permissions the harness offers. `capabilities.permissions` takes `PermissionOption[]` (`id`, optional `label`, `description`, `dangerous`) and `permission` names the one in effect; a label is derived from the id when the app supplies none. `approvalPresets`, `approvalPreset`, the `ApprovalPreset` type and `approvalPresetOptions`, `defaultApprovalPreset` and `isApprovalPreset` are removed.
- Explicit package exports with extensionless optional entry points.
- Provider-neutral component, presentation and host capability names, using Multi Agent SDK 0.27.0 neutral contracts.
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
