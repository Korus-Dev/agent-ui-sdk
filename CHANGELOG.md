# Changelog

## 0.29.1

- Built on Multi Agent SDK 0.29.0.
- The work and tool group summary lines no longer draw a focus outline.
- A finished turn's answer stays visible when its work details are shown or hidden, even when a tool call (such as a closing bookkeeping call) follows it. Before, opening and closing "View details" could make the answer disappear.

## 0.29.0

- Breaking: `@korus-dev/multi-agent-sdk` is now a peer dependency at `^0.29.0` only; Multi Agent SDK 0.27 and 0.28 are no longer supported. Built on Multi Agent SDK 0.29.0.
- The default tool presentation uses semantic tool actions for verbs and icons (fetch, manage agents, MCP, message, move, switch mode, think, and subagents) and titles failed and canceled outcomes even when no action descriptor is available.
- A turn with a Working header shows a single Working label while waiting for the next assistant update.

## 0.28.1

- Built on Multi Agent SDK 0.28.3.
- The harness picker's speed button cycles through standard and the model's speeds on each click, whatever their number, instead of opening a menu for models with several. This also fixes the speed menu losing its background and border when the stylesheet loaded in a different order. The picker also stays open when a click re-renders the control that was clicked, which used to count as a click outside.

## 0.28.0

- Built on Multi Agent SDK 0.28.3.
- Shared interaction states: give a control the `agent-ui-interactive` class (with `data-variant="primary"` or `"destructive"` and optionally `data-appearance="solid"`, or the class aliases `agent-ui-interactive--primary`, `--destructive` and `--solid`) and it gets rest, hover or highlight, pressed, selected or open (`aria-expanded`), focus-visible and disabled styling, fills and text color, from one rule set in the `agent-ui-states` cascade layer. The public `--agent-ui-state-*` tokens (including `-rest`, `-rest-foreground` and the solid and foreground tokens) are separate from the `--color-surface-*` elevations, and `--agent-ui-hover-color` still supplies the neutral hover. The resolved values (`--agent-ui-interactive-rest`, `-hover`, `-pressed`, `-selected` and the matching `-foreground` values) are readable by framework adapters. `--agent-ui-surface-low-color` now sets the `--color-surface-low` elevation on its own, with `--agent-ui-hover-color` as its fallback. `data-appearance="text"` (and `--text`) covers disclosure toggles and tabs, and Solid hover and pressed fills move away from the foreground (toward white or black, whichever is opposite), so text contrast never drops on hover. `data-selection="none"` (or `--selection-none`) keeps an open disclosure (`aria-expanded`) in its rest look while it still hovers, presses and focuses; the diff panel's group and file headers use it. `data-selection="ring"` (or `--ring`) keeps a selected swatch's own color and shows an outer ring in the focus ring color. `data-agent-ui-scope` (or the class `agent-ui-scope`) turns every button, tab, option and menu item in a container into an interactive control. The icon button, `CopyButton`, the composer controls, all menu rows, the model picker and its tabs, queued prompt and goal actions, follow-up chips, request and approval buttons, question options, the quick open rows, the message editor, the work and tool group headers, the pending-question chip, the diff and Markdown panels, the annotation controls and the in-app browser use the primitive and no longer carry their own state CSS. Keyboard-focused controls show the focus ring or the hover fill instead of component-specific outlines, an `AppMenu` submenu trigger reports `aria-expanded` only while its submenu is open, and the undocumented `--agent-ui-scroll-to-bottom-hover-background` token is gone (use the state tokens).
- The conversation pane's surfaces can be restyled without selectors: the canvas, timeline content, footer and composer carry `data-agent-ui-surface` (`canvas`, `content`, `footer`, `composer`; `WorkbenchLayout` also `header`) and paint from `--agent-ui-canvas-background`, `--agent-ui-content-background`, `--agent-ui-footer-background` and `--agent-ui-composer-background`. Their backgrounds sit in the `agent-ui-surfaces` CSS cascade layer, so unlayered host CSS wins whatever its specificity. Defaults are unchanged.
- The context compaction divider draws a line on each side of its title instead of one line behind a label with an opaque background, so it matches any conversation backdrop or gradient skin.
- The highlighted row of the slash, skill, plugin and file mention menus uses the themeable hover color (`--agent-ui-hover-color`, then `--color-surface-low`) instead of `--color-surface`, which read as a black bar on dark themes.

## 0.27.4

- `@korus-dev/multi-agent-sdk` is accepted at `^0.27.1 || ^0.28.0`, and the package is built and validated against Multi Agent SDK 0.28.1.

## 0.27.3

- Built on Multi Agent SDK 0.27.3.
- `DiffPreviewPanel` takes `omittedFiles` (`DiffOmittedFile[]`: `path`, `addedLines`, `removedLines`) for files whose patch was left out because it is too large. Their header shows the real counts and the body reads "Diff too large to be shown" (translatable as `surface.gitDiffPreviewPanel.diffTooLarge`) with no line numbers or annotate affordance.

## 0.27.2

- Built on Multi Agent SDK 0.27.2. Claude's reasoning text, which that release delivers as `reasoning` parts, shows inline in the conversation.
- Reasoning parts of a harness that states no work phases (`capabilities.workPhases` false, such as Claude) show their text inline, in order, as ordinary paragraphs, including when the turn is grouped under Working/Done. Harnesses that state phases keep reasoning as work summaries.
- New `CopyButton` export: an icon button that copies through your `action`, shows a check for 1.5 seconds on success and does nothing visible when the action fails. It takes `size` (`small` or `regular`), keeps a constant accessible `label` while the tooltip switches to `copiedLabel`, and accepts a default slot for a text label beside the icon.
- Pasting in the composer and the message editor inserts a link that is on the clipboard without plain text (a URL-only pasteboard, as copied from Messages on macOS), read from `text/uri-list` or `text/x-moz-url`.
- While a comment on selected code is written, the selected text stays highlighted. It is released on save, cancel, dismiss and unmount. It uses the CSS Custom Highlight API and does nothing where that is unavailable; hosts need no code.
- The harness picker's trigger shows the speed in use even when the model catalog does not list that tier, and the speed button no longer reads as active for the standard tiers (`normal`, `default`).
- `@korus-dev/multi-agent-sdk` is now a peer dependency (`^0.27.1`) instead of a regular dependency. Install it alongside the UI SDK so the application and the UI share one copy of its types. Patch releases of Multi Agent SDK no longer require a UI release.

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
