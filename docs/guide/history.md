# History and performance

Long conversations stay responsive because DOM rendering and provider history loading are independent concerns.

## Lazy rendering

By default `MessageList` mounts a recent slice of the transcript and progressively prepends older messages as the person scrolls, preserving the reading position.

| Prop | Default | Purpose |
| --- | --- | --- |
| `renderStrategy` | `'lazy'` | `'eager'` mounts every message (type: `ConversationRenderStrategy`) |
| `initialMessageBatchSize` | `50` | Messages mounted first |
| `messageBatchSize` | `25` | Messages mounted per step toward the past |

Use `'eager'` when you need every message in the DOM, for example for printing or in-page search. The older `lazyMessages` prop is deprecated in favor of `renderStrategy`.

```vue
<ConversationPane :controller="controller" render-strategy="eager" />
```

## Provider history

The host supplies history state and loaders; the pane renders them.

| State | Meaning |
| --- | --- |
| `history.hasOlder` | More messages exist before the first one loaded |
| `history.loadingOlder` | An older page is loading |
| `history.loading` | The initial load is running; the pane shows the history skeleton |

Connect `loadOlderHistory` to fetch an older page. The list requests it as the person scrolls near the top, once every mounted message is showing and `hasOlder` is true. With a [session binding](/guide/session-binding), `SessionState.historyLoading` and `historyState` feed these values.

### Summary turns

Providers can restore a long conversation as **summary** turns: the final answer is present, the work behind it is not. A `Turn` with `itemsView: 'summary'` shows "View details" on its work group; expanding it calls `loadTurnHistory(turnId)`. While `detailsLoading` is true the group shows a loading row; a `detailsError` stays visible and retryable.

Do not infer native history completeness from the number of DOM nodes.

## Stable identities

Keep message identities stable across streaming updates. The SDK memoizes the conversion from a harness `Message` to a rendered message by object identity, so replacing every message object on each token defeats it. Update objects in place, or reuse unchanged references, so settled Markdown, text selection and scroll position survive.

## Images

Image previews are lazy and scoped to the conversation. Bind `readConversationContent` on the client for session images, or `readImagePreview` on host capabilities for opaque references. Pass `{ imagePreviewBudgetBytes }` to `provideHostCapabilities` to bound preview memory with a pool that is cleared when the providing scope is disposed.

Runtime references are not permanent attachment ids. Store durable copies and enforce retention in the application.

## Verifying behavior

Unit tests do not establish browser geometry or physical-device behavior. The component lab's Chromium and WebKit workflows check scrolling, streaming isolation, image layout, editing and selection. See [Testing](/guide/testing).
