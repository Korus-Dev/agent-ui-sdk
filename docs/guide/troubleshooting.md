# Troubleshooting

## The pane renders but looks unstyled

Import the stylesheet once in your renderer: `import '@korus-dev/agent-ui-sdk/styles.css'`. It carries control styles, code and math styles and the packaged KaTeX fonts. Check that your bundler handles CSS imports from `node_modules`, and that a global reset does not override the pane's `box-sizing`.

## The pane has no height, or the whole page scrolls

`ConversationPane` fills its container and scrolls its own transcript. Give the container a definite height (`height: 100%` up a chain of parents, or a fixed height). In a custom layout, make one child own scrolling with `WorkbenchLayout scroll-mode="child"`.

## A control is missing

Controls follow capabilities. Check, in order:

1. The capability flag (`steerPrompt`, `goals`, `planMode`, `models`, `editTurn`, …) is true for the session.
2. The catalog is supplied: models for the picker, commands, skills or mention groups for their menus.
3. A [presentation flag](/guide/presentation#presentation-flags) is not hiding it.
4. The client operation exists. A capability without a connected operation shows the control but rejects when used.
5. For the permissions menu, `capabilities.permissions` is non-empty.

## "This conversation operation is not connected."

The session binding calls a `client` operation you did not provide. Add it, or turn the matching capability off. Operations are optional so that hosts expose only what they implement.

## "Conversation binding is disposed."

An action ran after `binding.dispose()`. Create one binding per conversation view and dispose it when that view closes. Do not reuse a disposed binding for another conversation.

## Streaming feels slow or scroll jumps

Replace message objects only when they change. If every token produces new objects for all messages, the memoized rendering and scroll anchoring cannot hold. Use a `shallowRef` for session state and keep identities stable. See [History and performance](/guide/history#stable-identities).

## Older messages never load

`hasOlderHistory` (or `history.hasOlder`) must be true and `loadOlderHistory` connected.

## Attachments fail

- `toHarnessPromptOptions` throws "Attachments require a trusted host resolver" when you pass attachments without a resolver. Provide one, such as `registry.resolve`.
- "Attachment reference type does not match": a reference was reused with a different `type`. Send the `HostAttachment` back unchanged.
- Size errors name the byte limit. Raise `maxAttachmentBytes` or `maxTotalAttachmentBytes` in `registerNativeIpc` if appropriate.
- Past 20 files at once are rejected.

## The microphone does not appear

The composer shows it when the host advertises `transcription`, the `voice` presentation flag is on and the browser can record audio. `exposeNativeRendererApi` enables transcription by default only on macOS; pass `{ transcription: true }` to enable it elsewhere with your own provider. Apple dictation needs macOS 26 or later and the packaged helper under `assets/`.

## Electron: preload fails to load

Electron's sandbox cannot load an ESM preload. Bundle the preload to CommonJS with `electron` external, or use a `.mjs` preload with `sandbox: false`. See [preload format](/guide/electron#preload-format).

## Electron: "Rejected … from an untrusted sender"

`isTrustedSender` returned false. `isRendererSender` accepts only the main frame of a window showing the renderer URL. Check that you pass the same URL you load (the dev server or the packaged `file:` URL) and that the call does not come from an iframe or a navigated page.

## Types do not resolve

Use `moduleResolution: "Bundler"` with `module: "ESNext"`. The package uses an explicit exports map with extensionless entries; NodeNext resolution is not supported. Import optional entries by their subpath (`@korus-dev/agent-ui-sdk/electron/preload`).

## Element Plus component not found

The browser panel and some document panels use Element Plus controls. Install `element-plus` (2.13 or later) and register it in your app.

## Everything works in the lab but not in my app

The lab uses mocked state. Compare your session snapshot with a complete `SessionState` from Multi Agent SDK: the pane expects `messages`, `turns`, `requests` and `busy` on every snapshot.

## Still stuck

Search the [issues](https://github.com/Korus-Dev/agent-ui-sdk/issues), and when you open one include the package version, your Vue version, the harness and a minimal session snapshot.
