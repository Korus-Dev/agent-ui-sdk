# Connect a conversation

`ConversationPane` combines history, requests, messages, queues and the composer. It is headerless: your application owns conversation navigation and surrounding panels.

## Session binding

Use `createSessionConversationController` with a reactive `SessionState`, harness capabilities and session-bound operations. Construct one binding per conversation and dispose it when that conversation view closes:

```ts
import { shallowRef, onBeforeUnmount } from 'vue';
import { createSessionConversationController } from '@korus-dev/agent-ui-sdk';

// bridge is your renderer-safe, session-bound application port.
const state = shallowRef(await bridge.readSession());
const off = bridge.subscribe(value => { state.value = value; });
const binding = createSessionConversationController({
  conversationKey: 'conversation-1',
  state,
  capabilities: () => bridge.capabilities,
  client: bridge,
});
onBeforeUnmount(() => { off(); binding.dispose(); });
```

```vue
<ConversationPane :controller="binding.controller" />
```

The client supplies `sendPrompt` and optional steering, interruption, request responses, permissions, goals, image-content reads, history and turn mutations. Omitted operations reject if invoked; only advertise capabilities that the host actually connects. Model controls receive provider catalogs through `controls.models`. Preferences are local to the binding unless `onControlsChange` persists them in the host.

The binding handles queued submissions, queue editing and steering. Failed admission preserves the queued prompt for recovery. It maps canonical approval, question and confirmation requests without inventing provider IDs. Keep request response IDs and choices unchanged across your transport.

## Fully controlled views

Use `sessionStateToConversationPaneState` with `createConversationPaneController` when your host owns queueing or needs custom actions. State groups separate identity/messages, thread requests and goals, composer preferences, catalogs, history, capabilities and policy. Reactive getters preserve streaming updates; avoid freezing a one-time snapshot.

The typed example in `examples/session-pane.ts` demonstrates a session subscription and request responses. The runnable samples connect the same pane over Electron IPC.

## Slots and actions

Use `empty`, additive `message-header`, `message-block`, `message-text`, `message-attachment`, `message-tool`, `message-actions`, `approval`, `before-composer`, `after-composer`, `composer-context`, `composer-shelf-actions` and composer/menu slots to customize the view. Prefer additive slots to replacing SDK-owned message rendering.

Keep application navigation, durable storage, conversation titles, routing and authorization in the host. Closing a view disposes its UI binding; releasing or deleting a native conversation is a separate host operation.
