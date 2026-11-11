# Consumer integration

## Diff overview

`DiffPreviewPanel` accepts `overview?: boolean` (default `false`). In overview mode, `#overview="{ files, select }"` replaces the diff body. Loading, parse errors, load errors and empty states stay SDK-owned. `DiffOverviewFile` and `DiffOverviewSlot` are exported from the root and `@korus-dev/agent-ui-sdk/documents`.

`files` contains file metadata (`key`, `directory`, `fullPath`, `name`, `iconKind`, `openable`, `addedLines`, `removedLines`) after the existing lockfile/file-kind filters. The objects may contain additional internal rendering fields. `select(path: string): Promise<void>` focuses that file and emits `select(path)`. The host handles `@select` by setting `overview=false`; the promise settles after Vue renders and attempts to scroll to the selection. Returning to overview clears the focused file subset. Exposed `showFiles(paths: string[], location?: CodeLocation)` remains available with its previous behavior except that mode is host-owned.

Korus owns treemap selection/filter state and the mode toggle. Replace `view="map"` / `update:view` / `#map` with `:overview="mode === 'map'"` / `@select="mode = 'diff'"` / `#overview`. `kinds` and `setKinds` are retired; derive and store those in Korus.

## Browser owner identity

The exact mechanical mapping is `agentId` → `ownerId`, `AgentId` → `OwnerId`, and template `agent-id` → `owner-id` within `src/browser/*`, `src/vue/browser/*` and their browser tests. Method/callback names, argument order, partition algorithm and callback meanings are unchanged. After the mechanical fidelity check, browser-facing error/confirmation copy was adapted separately: references to agents became owner, workspace or Browser pane as appropriate; shared-data confirmation no longer assumes agents. Corresponding error assertions retain their meaning. This affects `BrowserPanel` props, `BrowserAnnotation.ownerId`, `BrowserViewportRequest.ownerId`, `BrowserUiApi` parameter labels, browser manager pane records/options/callback parameter labels and partition helpers. `BrowserState` remains its existing navigation-only structure.

Korus must map its existing wire `agentId` fields to `ownerId` at its browser adapter. Keep companion payloads compatible. No app or wire code is changed here.

## Removed API and coverage

`CodexConversationSidebar`, its root export, and its dedicated test suite are retired together. The retired behavior is branded navigation, active-row selection, new-conversation action and `window.confirm`-gated deletion. Those are host navigation responsibilities. No surviving control assertion or the 85% statement gate was removed. New overview tests cover metadata, host selection, focused diff rendering, return-to-overview reset, loading/error/empty precedence.

The unused `ChartTreemapIcon` and other unused icon exports are removed. `src/vue/icons/app-icons.ts` is consolidated into `src/vue/shared/icons/app-icons.ts`: original export lines were transferred mechanically, deduped by exported name and pruned to imported names; control imports now use the latter. No component file was relocated. Canonical component filenames and CSS names are listed below.

## Canonical naming and imports

The root Vue API is provider-neutral. Optional entries use an explicit exports map with extensionless imports, such as `@korus-dev/agent-ui-sdk/electron/preload`. Root forwarding files and `.js` subpath aliases are removed. TypeScript consumers use `moduleResolution: Bundler`.

| Previous API | Canonical API |
| --- | --- |
| `CodexComposer`, `CodexMessageList`, generic `CodexConversationPane` | `Composer`, `MessageList`, `ConversationPane` |
| `Codex*` presentation, theme, composer and capability types/helpers | Existing neutral names, now the implementations |
| `SurfaceMessage*` | Multi's `ConversationMessage*` |
| `NativeConversationPane` and native `CodexConversationPane` | Root `ConversationPane` with a neutral session/controller binding |
| `/native` hooks and catalogs | Removed; provider operations belong in Multi Agent SDK/application hosts |
| Provider-specific Electron integration/preload/host IPC helpers | Removed; use generic capability and typed IPC helpers |

### Korus runtime changes

Use the same root `ConversationPane` for every harness. Supply neutral session state, capabilities and session-bound actions through `createSessionConversationController` or the lower-level grouped controller. Neither requires a provider name.

- The legacy `/native` entry, Codex host hooks/pane, provider command catalogs, Codex Electron host bridge and combined provider preload helpers are removed. There is no replacement backend-specific UI hook.
- `registerNativeIpc`, `exposeNativeRendererApi`, typed IPC, attachment registries, speech and browser adapters remain generic optional modules.
- `window.codexAppSdkNative` becomes `window.agentUiHostCapabilities`; `nativeRendererGlobal` carries that key.
- Every generic `codex-native:*` channel becomes `agent-ui-native:*`; suffixes and argument order stay the same. Provider execution channels/globals are owned by the application and are no longer shipped by this SDK.
- Theme tokens `--codex-*` become `--agent-ui-*`; `.codex-chat-theme` becomes `.agent-ui-theme`, other generic `.codex-*` classes become `.agent-ui-*`. Theme selection uses `data-theme`; generating/message attributes use `data-agent-ui-*`.
- Shared custom-block injection uses `Symbol.for('agent-ui.custom-blocks')`; use the exported key.

Korus confirmed it consumes none of the retired provider-specific UI APIs. Its generic controlled pane and native execution through Multi remain the integration path. Samples own their launch-selected backends and authentication in application host code.

## Audit and validation boundaries

The composed pane keeps optimistic state, submission wiring, goal intents and the existing escape-interrupt composable. These are control behavior and capability-driven; no provider-name branch, host filesystem/storage policy or host workflow was found to extract. Goal, turn git info and visualization blocks render props and emit intent; visualization `path` is an opaque host-owned target and is never loaded by the block.

Build and test configs use package-local `source-aliases.ts`, derived from the explicit package exports maps, including Multi's prompt, renderer, native and host-bridge development entries. They do not import the parent's shared aliases. Typechecking resolves installed npm declarations by default and locally built declarations when `SDK_LOCAL_SOURCE=1`. `npm run check` verifies types, coverage, the tarball consumer, docs, lab and samples; browser and native smoke jobs verify their respective runtimes.

## Neutral session composition

`createSessionConversationController({ state, capabilities, conversationKey, controls?, client, onControlsChange? })` supplies the standard conversation binding. Its controller renders rich canonical messages, requests, goals and context, the in-composer model selector and capability-driven plan/goal/permission controls. The session-bound client is renderer-safe and may use IPC; no provider runtime or native session handle enters the renderer.

The binding owns an ephemeral follow-up queue with editing, deletion, steering, sequential dispatch and retryable failed admission. It observes authoritative busy/request state, including same-tick turns, and protects pending admission from conflicting queue actions. Model/effort/tier and plan settings accompany sends and steers. Goal commands route to `setGoal`/`clearGoal`; approval/question/confirmation responses route to `respondToRequest`; permission choices retain their opaque native IDs. Permission display labels belong to the UI. Optional `onControlsChange` lets an application control preferences; otherwise pending selections live only for the binding's lifetime. Provider-reported `SessionState.selection` supplies the restored model, effort and tier; pending edits take precedence until the runtime acknowledges them. The SDK performs no serialization or persistence.

Keep one binding per conversation while its queued work is needed, including across navigation. Dispose it when its owner closes; disposal stops observation and further dispatch, without cancelling an already-admitted native turn. Apps supply the neutral client operations and native host adapter once. The SDK Electron adapter supplies attachment picking, paste/drop ingestion, capability references and previews. `toHarnessPromptOptions` from `/host` converts renderer-safe send options at the trusted boundary; attachments require an explicit resolver such as `ElectronAttachmentRegistry.resolve`. A raw path never replaces the opaque reference in renderer state. The low-level controller remains available for custom behavior and application navigation.

`sessionStateToConversationPaneState(state, capabilities, conversationKey?, controls?)` composes a controlled pane from `SessionState` and `HostCapabilities` imported as types from `@korus-dev/multi-agent-sdk`. It passes canonical messages through without cloning: they already satisfy the pane's semantic message contract. The existing neutral `toChatMessage` adapter also accepts canonical `Message` and converts tool, reasoning, attachment and text parts for custom renderers. No provider dispatch or Korus integration is required. Supply the neutral model catalog as `controls: { models, modelCatalogStatus? }` to render the selector inside the composer. Provider-reported `state.selection` selects the restored model, effort and tier. An optional controlled `selection` overrides those values for applications that own preferences. Catalog labels fall back to the model identifier; selection actions use executable model identifiers rather than catalog keys. The controller’s `updateSettings` action reports `modelId`, `reasoningEffort` and `serviceTier`; a custom host updates its controlled selection and uses it for subsequent prompts. The standard session controller performs that binding automatically.

The adapter presents busy/error/active-turn state, goals, context usage, turn status and pending approval/question/confirmation requests. Turns pass through by identity, preserving supplied error, retry, timing, detail and usage fields. Unknown values remain unknown. Canonical question and confirmation requests pass through by identity with optional turn/item identity unchanged. `ConversationRequest` is a UI-owned union of canonical requests and existing serialized compatibility envelopes; leaf controls read both shapes without translating native identity. A confirmation renderer may use the request ID as a local tool-row key when no item ID exists; it never writes that key into the request. Plans and titles have no pane field and remain available to host chrome through the original snapshot.

Capabilities drive controls. `native` and `prompted` plan modes enable the plan toggle; `unsupported` disables it. Opaque harness permission IDs are never converted into legacy approval presets; the preset list stays empty. The standard binding supplies the shared Permissions menu and routes choices to the client’s `setPermission`. Its checked option follows backend-confirmed `SessionState.permission`, with explicit controlled preferences and pending user choices taking precedence. Unknown backend state does not select a fabricated default. The low-level mapper leaves that menu to its host. Host adapters own native I/O and attachment-reference resolution; the shared pane owns attachment presentation and interactions.

[examples/session-pane.ts](examples/session-pane.ts) is a low-level explicit binding of an opaque `Session` to the controller. It subscribes only to that session's `session.changed` events, exposes disposal, and wires submit/interrupt/request responses using the public `requestResponseFromClientResponse` and `requestResponseFromApproval` helpers. Both return `SessionRequestResponse`, which matches the neutral driver response without native identity. Its required `resolvePromptOptions` callback resolves host-owned attachment references and maps client model/reasoning fields into harness prompt selection; the example never treats a reference as a filesystem path. Hosts add actions/catalogs for any further capabilities they expose. The caller passes the resulting controller to `ConversationPane`.

`ClientAttachment` and `ClientSendMessageOptions` are the UI action types shared with Multi Agent SDK. Multi's pure `/prompt` entry supplies prompt helpers; native execution stays outside all UI controls.

Fixture-backed tests in `tests/boundaries/session-composition.spec.ts` verify canonical message rendering and identity, capability mapping, all three pending request kinds, busy/error updates, terminal tool state, controlled submit/interrupt intents, session event isolation, option resolution, approval/question responses and subscription disposal. The fixture is also mounted with a pending approval: clicking its actual Allow button routes through the pane, controller and reusable converter to `driver.respondToRequest`; the approval disappears on the next request-free snapshot. Converter tests cover answers, cancellation, each tool-confirmation decision, approval scopes and rejection of empty responses. `tsconfig.composition.json` typechecks the actual example, fixture and composition test in addition to source. This is separate from Vitest's transpile-only execution.

The timed failure fixture verifies real error/retry evidence reaches the message list unchanged and an authoritative 12-second duration remains visible even when wall-clock timestamps span 18 seconds. The rendered Retry action routes to the controller; an update with unknown timing does not manufacture a duration.

Optional `SessionState.answeredClientRequestIds` maps to the controller's answered set only when supplied; absence remains undefined and a supplied empty list remains a known empty set. `historyLoading` maps to `history.loading`; optional `historyState` supplies `hasOlder` and `loadingOlder`. Absent paging flags remain absent rather than becoming false. Tests verify rendered answered-question suppression, known paging/loading state, the conversation loading indicator and transitions back to absent history evidence.

### Attachment previews and retention

Image rendering belongs to the SDK. The standard binding resolves `conversation-image:` references through its session-bound `client.readConversationContent`, using bounded chunks, and supplies the result to transcript thumbnails and image views. The same client scopes reads to its own neutral session. Native attachment-picker references use the configured host preview reader. A preview in a live conversation does not require application persistence, and a provider path must not become an unrestricted filesystem reader.

The Electron attachment registry and conversation-content references are runtime capabilities, not durable attachment IDs. Applications own any durable originals, preview cache, retention policy and authorization for restored content. If persistence is needed independently of provider history, save application-owned attachment IDs and metadata, then restore them through the host adapter; do not save an expiring `electron-attachment:` reference as a permanent ID. Provider-retained history can supply images again through a fresh session/content reader when available. The SDK never creates an application attachment database or chooses its storage policy. For application-retained images, restore `MessageAttachment.url` to an application-owned reference such as `app-attachment:<id>` and resolve it through `HostCapabilities.readImagePreview`. The SDK prefers this preview reference over the original provider path. The host can return cached image bytes as a supported data URL or a served image URL, while retaining filesystem/storage authorization outside the renderer. An unavailable historical image remains a named file chip.

Controlled submission callbacks may return `{ renderOptimisticMessage: false }` for commands or queued work that must not create an immediate transcript row. The standard binding uses this for goals and queued submissions, while preserving normal optimistic message rendering.

## One controlled conversation pane

`ConversationPane` receives all state and actions through controlled inputs. It has no provider host prop, connection lifecycle, authentication or provider defaults. `readPromptHistory`, skill discovery and other optional operations are application-owned controller actions. The root starts with unavailable capabilities and an empty command catalog; supplied capabilities/catalogs determine the controls.

All harnesses use the same neutral session/controller composition. Keep provider lifecycle and protocol handling in Multi Agent SDK or application host adapters. Slots and `focusComposer` remain part of the generic pane.

## Controlled model picker

`ModelPicker` accepts a neutral `models` catalog and consumer-owned `selection` (`model`, `reasoningEffort`, `serviceTier`). It emits `update:selection` for user choices and `select` when a model/effort choice completes. It never loads catalogs or stores preferences. Optional model labels fall back to the model identifier. `loading`, `disabled` and accessible-label props are explicit inputs. The `header` slot hosts application provider controls; `service-tier` supplies controlled tier items and a selection callback when the host wants its own icons. Korus owns the outer popover, provider tabs/icons, remembered defaults, remote-host routing, loading races and persistence. History selection remains application-owned.

## Dictation ownership

Microphone capture, audio worklets, transcription adapters, native speech bindings and composer dictation interactions belong to this package. Worklet assets resolve relative to the installed module in web and Electron builds. Applications supply transcription configuration, credentials and preferences through host contracts; the harness receives the transcribed prompt text.
