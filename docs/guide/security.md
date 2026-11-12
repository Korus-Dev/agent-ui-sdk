# Security boundary

The SDK draws a line between a renderer that shows conversations and a trusted process that can do things. This page lists the guarantees the SDK helps with and the work that stays with your application.

## What the SDK provides

| Guarantee | How |
| --- | --- |
| Root imports never reach trusted code | A boundary test walks the emitted import graph of the root entry and fails on Node, Electron, `ws` or provider execution modules |
| Attachments are opaque in the renderer | `HostAttachment.reference` is a host capability, never a path; the Electron registry keeps paths in the main process |
| Native IPC is validated | Every `registerNativeIpc` handler checks argument shapes and byte limits, and rejects untrusted senders when `isTrustedSender` is set |
| Windows stay on the renderer | `installWindowPolicy` denies new windows and foreign navigations |
| Browser guests are verified | `BrowserPane` accepts a guest only if it is a webview of the requesting window and partition |
| Raw tool output is opt-in | Tool inputs and outputs are hidden unless `provideToolCallDetails(true)` or `showToolDetails` |
| Previews are isolated | Inline HTML runs in a sandboxed iframe; SVG visualizations are sanitized |
| Secrets stay in the host | Speech credentials and provider handles never cross renderer IPC |

## What you still own

- **Authorization.** Capabilities and presentation flags hide UI. They never grant or revoke access. Enforce permissions, approval policy and tenancy in the trusted process.
- **Approval policy.** The pane shows the harness's approval requests; the harness decides what needs one.
- **Mutations.** Visibility of Edit, Delete, Retry or Fork does not authorize them. Check policy in the host before acting.
- **Attachment retention.** Registry entries and temporary files are not durable storage.
- **Network and filesystem policy** for the browser panel and any tool the agent runs.
- **Content you add.** Custom blocks, slots and `provideToolPresentation` run your code in the renderer.

## Renderer rules

- Never expose provider handles, credentials, filesystem authority or Electron objects through your bridge. Expose methods, not objects.
- Validate every IPC argument in the main process, even when the renderer is yours.
- Enable `contextIsolation`, disable `nodeIntegration`, and prefer `sandbox: true`.
- Pass `isTrustedSender` using `isRendererSender` for every handler.
- Install `installWindowPolicy` on every window that loads the renderer: the preload re-runs on each navigation, so any page the window reaches would otherwise receive your bridge.
- Treat everything a model writes as untrusted. Links, HTML fences and tool arguments are all model-controlled.

## Untrusted content

Three SDK surfaces render content that an agent or a website controls:

| Surface | Mitigation | Remaining risk |
| --- | --- | --- |
| Markdown links | `ConversationLink` is classified; external links go through your `openLink` | You decide what opens. Allow `http` and `https` only unless you have a reason |
| Inline HTML | Sandboxed iframe (`allow-scripts`) on a separate message channel | Scripts run in the sandbox. Do not widen it |
| Browser panel | Separate partitions, guest verification, navigation policy in the main process | A web page can still be hostile. Do not share sessions with your app |
| SVG visualizations | `sanitizeSvg` | Sanitizing is a complement to isolation, not a replacement |

Do not use sanitization as permission to render arbitrary content with privileged access.

## Tool details

Tool arguments and results can contain secrets, file contents and personal data. Keep `provideToolCallDetails` off in shared or screen-recorded builds, and review any `message-tool` slot you add. `toolVisibility` hides calls from the transcript only; it does not change what the harness records.

## Speech

Keep API keys for realtime transcription in the main process. The renderer streams audio to the main process; the main process holds the socket. The Electron bridge allows one bounded recording per renderer, owned by its invoking frame, and cancels it if that frame navigates away.

## Reporting a vulnerability

Open a private security advisory on the [GitHub repository](https://github.com/Korus-Dev/agent-ui-sdk/security/advisories) rather than a public issue.
