# Architecture

The SDK is a renderer-side conversation UI with optional trusted adapters beside it. Each layer has a specific trust boundary and public vocabulary.

![Agent UI SDK architecture](/architecture.svg)

## Where the SDK sits

Three packages cooperate. Only the first is this one.

| Package | Owns | Must not own |
| --- | --- | --- |
| `@korus-dev/agent-ui-sdk` | Vue conversation controls, session and controller composition, host capability contracts, optional Electron, speech and browser adapters | Provider execution, protocol handling, authentication, navigation, persistence |
| `@korus-dev/multi-agent-sdk` | Harness sessions for Codex, Claude, Cursor and Antigravity: neutral state, capabilities, requests and prompts | UI |
| `@korus-dev/codex-sdk` | The raw Codex protocol | Neutral session semantics, UI |

Release order follows the dependency order: `codex-sdk`, then `multi-agent-sdk`, then `agent-ui-sdk`.

## One package, several entry points

The package has explicit, extensionless exports so that trusted code never ships to a renderer by accident.

| Entry | Layer | Trust |
| --- | --- | --- |
| root | Vue controls, session composition, themes, providers, document panels | Renderer |
| `/styles.css` | Control styles and packaged fonts | Renderer |
| `/host` | Capability contracts and prompt-option translation | Neutral |
| `/browser`, `/browser-ui`, `/documents` | Browser contracts, browser panel, file classification | Renderer |
| `/electron`, `/electron/preload` | Typed IPC, window policy, native capabilities | Main process and preload |
| `/electron/browser`, `/speech` | Guarded browser manager, speech sessions | Trusted process |

A boundary test walks the emitted runtime import graph of the root entry and fails if it reaches Node, Electron, `ws` or provider execution modules.

## Data flow

1. The trusted host runs a harness session and receives neutral `SessionState` snapshots plus `HarnessCapabilities`.
2. Your bridge carries the snapshot to the renderer and carries session-bound actions back. Identity stays in the host; the renderer holds opaque handles at most.
3. `createSessionConversationController` projects the snapshot into `ConversationPaneState` and maps pane actions onto your client operations.
4. `ConversationPane` renders from that state. Capabilities decide which controls exist; [presentation flags](/guide/presentation) decide which optional ones are shown.

```text
Harness session ──snapshot──▶ your bridge ──▶ SessionState
                                                  │
        client operations ◀── controller ◀── createSessionConversationController
                                                  │
                                           ConversationPane
```

Snapshots are authoritative. Keep message identities stable across updates so settled Markdown, selection and scroll position survive streaming.

## Capability-driven behavior

The UI never asks which provider it is talking to. It asks what the session can do:

- `Capabilities` flags (steering, interruption, goals, plan mode, history, turn editing, approvals, models, skills, reasoning effort, service tier) enable controls.
- `capabilities.permissions` lists the harness's own permission ids; the app supplies wording.
- Catalogs for models, commands, skills, plugins, files and mention groups arrive as host-owned state.
- Policy flags (`attachEnabled`, `canForkTurn`, `canEditTurn`, …) reflect host decisions.

Do not invent a universal model list, and do not map one harness's permission ids onto another's.

## The renderer boundary

No raw provider payloads, Node primitives, filesystem paths, credentials or Electron objects need to cross into renderer code. Attachments are `HostAttachment` records whose `reference` is an opaque host capability, never a path. See the [security boundary](/guide/security).

## Optional adapters

- **Electron** (`/electron`): `registerNativeIpc` installs validated handlers for attachments, clipboard, links, image previews and speech; `installWindowPolicy` keeps windows on the app renderer; typed IPC helpers carry your own session bridge.
- **Speech** (`/speech`): Apple SpeechAnalyzer through a packaged universal helper, and OpenAI realtime dictation. Both consume mono Float32 PCM.
- **Browser** (`/electron/browser`, `/browser-ui`): a main-process manager owns navigation, annotation and viewport policy for renderer-hosted webviews; the Vue panel is the UI.

## Where code belongs

| Concern | Lives in |
| --- | --- |
| Rendering messages, composer, requests, tools | This SDK |
| Running sessions, model catalogs, authentication | `@korus-dev/multi-agent-sdk` |
| Navigation, titles, conversation lists | Your application |
| Durable attachments, retention, drafts | Your application |
| Authorization and policy | Your trusted process |
| Diff views and treemaps | Your application, over the document panels |
