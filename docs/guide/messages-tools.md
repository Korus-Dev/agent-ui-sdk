# Messages and tools

`MessageList`, `Message`, `MessageTurn` and the leaf blocks render semantic conversation data. Harness `Message` values from Multi Agent SDK render directly; `toChatMessage` and `toChatMessages` adapt supported inputs to the renderer's `ChatMessage`. Native provider normalization belongs in the harness SDK.

## Rich content

Markdown supports:

- code highlighting (Shiki) with a copy button;
- KaTeX math, with packaged fonts in `styles.css`;
- Mermaid diagrams;
- images, with lazy loading and a fullscreen gallery;
- attachments and generated media;
- [inline HTML](#inline-html) and [custom blocks](#custom-blocks).

`MessageBlock`, `MediaBlock`, `AttachmentBlock`, `MermaidBlock` and `VisualizationBlock` are reusable independently. `renderMarkdown` and `renderCodeBlock` expose the same rendering for your own surfaces.

### Links

Links in messages and file targets in tool calls arrive as a `ConversationLink`:

```ts
type ConversationLink =
  | { kind: 'external'; href: string }
  | { kind: 'file'; href: string; path: string; line?: number; column?: number; /* turn and item ids, diff content */ };
```

Handle `actions.openLink` (or `openLink`) to open files in your editor and external links in the OS browser. `conversationLinkFromHref` and `parseEditorFileReference` help with your own link handling.

### Images and visualizations

Image links use the host's `openLink` action, and image opening uses `openImage(image, context)`, where `context.intent` is `'open'` or `'fullscreen'`. Return `true` when your host handled it; otherwise the SDK shows its lightbox. Tool-result images render as media independently of bounded tool text, including when history is restored.

`openVisualization({ path, title })` lets the host display a generated visualization, for example in the [browser panel](/guide/browser).

## Custom blocks

Register Vue components for assistant code fences by language.

```ts
import { customBlocksKey } from '@korus-dev/agent-ui-sdk';
import ChartBlock from './ChartBlock.vue';

app.provide(customBlocksKey, { chart: ChartBlock });
```

The component receives `source`, `language` and `complete` props. Streaming blocks arrive incomplete; render progressively or wait for `complete`. A fence whose language has no registered component, a source over 100,000 characters, or a component that throws, falls back to a plain code block.

## Inline HTML

Assistant output that is a complete HTML document in an `html` fence, or wrapped in `<artifact title="…">`, renders as a sandboxed preview (`sandbox="allow-scripts"`) with source and download controls. Other fenced HTML stays inert code. Previews are isolated from the host page; they do not grant access to the renderer or privileged APIs.

## Tool calls

Tool groups preserve the chronological relationship between work and final output: a turn shows "Working" with its elapsed time and then "Done · 1m 49s" above its work. When the harness states each text part's phase (`capabilities.workPhases`), the work collapses under that summary ("Done · View details") with the final answer after it. Without stated phases the work stays visible and there is no toggle; the pane treats text after the last tool or reasoning step as the answer.

- Raw tool inputs and outputs are **hidden by default**. `provideToolCallDetails(true)` enables disclosure for a trusted subtree; review sensitive content before enabling it.
- `provideToolPresentation` customizes icons and titles without replacing grouping or streaming behavior. See [Vue providers](/guide/vue-providers#tool-presentation).
- `toolVisibility` hides specific calls from the transcript only. It never affects what the harness runs.
- The `messages.toolBlocks` presentation flag hides tool blocks entirely.

```vue
<ConversationPane
  :controller="controller"
  :tool-visibility="call => call.function !== 'internal_bookkeeping'"
/>
```

## Message actions

Actions are constrained by turn state and host policy. Active turns do not expose historical mutation actions.

| Action | Requires |
| --- | --- |
| Copy | Always available; `onMessageCopied` reports it |
| Quote | Host handles `quoteMessage` |
| Edit | `capabilities.editTurn` and `canEditTurn` |
| Retry | `capabilities.retryTurn` and `canRetryTurn` |
| Delete | `capabilities.deleteTurn` and `canDeleteTurn` |
| Fork | A host-supported successful-turn operation (`canForkTurn`) |

Visibility does not authorize a mutation. Enforce policy in the trusted host. Hide individual actions with `presentation.messages.actions`.

## Text selection

With `messageTextSelection`, the pane emits `messageTextSelectionChange` with the selected text, its message and turn, and a viewport anchor. Use it to offer "Quote" or "Ask about this" UI.

## Streaming

Keep message identities stable across streaming updates so settled Markdown, selection and scroll position survive. The renderer converts incrementally and re-renders only the changing tail.

See [History and performance](/guide/history) for lazy rendering and long transcripts.
