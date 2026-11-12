# Session binding

`createSessionConversationController` binds a reactive Multi Agent SDK session snapshot to the pane. Construct **one binding per conversation** and dispose it when that conversation view closes.

```ts
import { shallowRef, onBeforeUnmount } from 'vue';
import { createSessionConversationController } from '@korus-dev/agent-ui-sdk';
import { bridge } from './bridge'; // your typed window.bridge, see the quick start

const initial = await bridge.read();
const state = shallowRef(initial.state);
const off = bridge.subscribe(next => { state.value = next; });

const binding = createSessionConversationController({
  conversationKey: 'conversation-1',
  state,
  capabilities: () => initial.capabilities,
  client: bridge,
});
onBeforeUnmount(() => { off(); binding.dispose(); });
```

It returns `{ controller, queuedPrompts, dispose }`:

- `controller` goes to `<ConversationPane :controller="…" />`;
- `queuedPrompts` is a ref of the prompts waiting behind the active turn;
- `dispose()` stops the binding's watchers. After disposal, operations reject.

## Options

| Option | Required | Purpose |
| --- | --- | --- |
| `state` | yes | A `SessionState` (value, ref or getter). Use a `shallowRef`; messages are large |
| `capabilities` | yes | The session's `HarnessCapabilities` |
| `conversationKey` | yes | Stable identity for this conversation; the pane resets scroll and drafts when it changes |
| `client` | yes | Session-bound operations; see below |
| `controls` | no | Model catalog, selection and preferences; see [controls](#controls) |
| `presentPermission` | no | Wording for the harness's permissions; see [permissions](#permissions) |
| `onControlsChange` | no | Persist preferences in the host. Without it, settings are ephemeral to the binding |

## Client operations

The client is your renderer-safe port. Every operation is optional, and an omitted operation rejects with "This conversation operation is not connected." if invoked. Advertise only capabilities your host connects.

| Operation | Needed for |
| --- | --- |
| `sendPrompt(prompt, options?)` | Sending. Always provide it |
| `steerPrompt(prompt, options?)` | Steering the active turn and steering queued prompts |
| `interrupt()` | Stop button and double-Escape |
| `respondToRequest(response)` | Approvals, questions and tool confirmations |
| `setPermission(id)` | Changing the permission from the composer menu |
| `setGoal(objective)`, `clearGoal()` | `/goal` command and the goal shelf |
| `readConversationContent(input)` | Restored conversation images |
| `loadTurnHistory(id)`, `loadOlderHistory()` | History loading |
| `deleteTurn(id)`, `editTurn(id, content, options?)`, `retryTurn(id)` | Turn mutations |

`respondToRequest` receives a `SessionRequestResponse`, which is an `AgentRequestResponse` without `agentId`. Keep response ids and choices unchanged across your transport.

## Prompt submission and the queue

The binding owns the prompt queue:

- A prompt sent while the session is busy, or while earlier prompts are queued, joins the queue instead. The queue drains one prompt at a time when the session becomes idle and has no pending requests.
- A prompt leaves the queue only after the host admits it. If `sendPrompt` rejects, the prompt stays queued for editing or retry and the pane shows the error.
- Queued prompts can be edited, deleted or steered into the active turn.
- Selected model, reasoning effort and service tier, and plan mode, are merged into each prompt's options.
- With `capabilities.goals`, a `/goal <objective>` prompt calls `setGoal`, `/goal clear` calls `clearGoal`, and neither renders an optimistic message.

`submit` returns `{ renderOptimisticMessage: false }` for queued prompts and goal commands. A host can return `sentPrompt` when it decorates the text the user typed, so the optimistic row matches what was actually sent.

## Controls

`controls` carries the host-owned catalog and local preferences:

```ts
createSessionConversationController({
  // …
  controls: () => ({
    models: view.value.models,
    modelCatalogStatus: 'loaded',
    selection: { model: 'gpt-5.5', reasoningEffort: 'high' },
    planMode: false,
  }),
  onControlsChange: async controls => { await store.savePreferences(controls); },
});
```

| Field | Purpose |
| --- | --- |
| `models` | `ModelOption[]` from the harness; the picker shows them as given |
| `selection` | `{ model, reasoningEffort, serviceTier }`; `null` or `undefined` leaves the session default |
| `planMode` | Plan mode toggle state |
| `modelCatalogStatus` | `notLoaded`, `loading`, `loaded` or `error` |

The model catalog comes from the provider. Do not invent a universal list.

## Permissions

The session owns permission. When `capabilities.permissions` lists options, the binding adds a **Permissions** submenu to the composer menu. Each entry uses the harness's own id.

```ts
createSessionConversationController({
  // …
  presentPermission: ({ id, dangerous }) => ({
    label: myLabels[id],
    description: dangerous ? 'Runs tools without asking.' : undefined,
  }),
});
```

Without `presentPermission`, a label is derived from the id and dangerous options get a default description. Choosing an option calls `client.setPermission(id)`; the binding shows the choice until the session reports it, then defers to the session. The permission never passes through `onControlsChange`.

## Host menu items

The binding owns the composer's leading menu (the permissions submenu) and routes `menuSelect` to it, and it has no option for other host items. To add your own `composer.menuItems` and handle their selection, wrap the controller as shown in [Assembling a custom layout](/guide/assembling#swap-one-piece-inside-the-pane).

## State projection

`sessionStateToConversationPaneState(state, capabilities, key?, controls?)` is the pure projection the binding uses. It maps `SessionState` (messages, turns, requests, goal, context usage, history state) and `HarnessCapabilities` into the pane's grouped state, deriving policy such as `canForkTurn` from `conversationFork`. Use it directly with [`createConversationPaneController`](/guide/conversation-pane#controlled-pane) when you need a different action set.

## Request responses

Two helpers translate pane intents into harness responses while preserving identity:

```ts
import { requestResponseFromApproval, requestResponseFromClientResponse } from '@korus-dev/agent-ui-sdk';

requestResponseFromApproval('request-1', 'approve', 'session'); // allow for the conversation
requestResponseFromClientResponse({ id: 'request-2', payload: { answers: { q1: { answers: ['Yes'] } } } });
```

## Translating prompt options

At the trusted boundary, call `toHarnessPromptOptions` from `/host`. The pane's options carry opaque attachment references; the host supplies a resolver:

```ts
import { toHarnessPromptOptions } from '@korus-dev/agent-ui-sdk/host';

await harness.sendPrompt(session, prompt, toHarnessPromptOptions(options, ref => attachments.resolve(ref)));
```

Attachments without a resolver throw. `providerOptions` from the renderer are dropped.
