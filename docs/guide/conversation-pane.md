# Conversation pane

`ConversationPane` combines history, requests, messages, queues and the composer. It is headerless: your application owns conversation navigation and the panels around it.

```vue
<script setup lang="ts">
import { ConversationPane } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
</script>

<template>
  <ConversationPane :controller="binding.controller" autofocus />
</template>
```

The pane resolves everything it needs from one `controller`: a state source and an actions source. There are two ways to create one.

| Approach | Use it when |
| --- | --- |
| [`createSessionConversationController`](/guide/session-binding) | You have a Multi Agent SDK session and want queueing, steering, permissions, goals and request handling wired for you. **Recommended.** |
| [`createConversationPaneController`](#controlled-pane) | Your host owns conversation state, queueing or custom actions and wants grouped, reactive control. |

The pane also accepts the same data as individual props and `@event` listeners. When a `controller` is supplied it takes precedence over controlled props.

## Controlled pane

`createConversationPaneController` adapts grouped state and actions without creating a session, fetching history or cloning messages. It keeps the reactive sources you give it, so a `ref`, `computed` or getter preserves streaming updates; avoid freezing a one-time snapshot.

```ts
import {
  createConversationPaneController,
  sessionStateToConversationPaneState,
} from '@korus-dev/agent-ui-sdk';

const controller = createConversationPaneController({
  state: () => sessionStateToConversationPaneState(state.value, capabilities, 'conversation-1'),
  actions: {
    submit: (prompt, options) => backend.send(prompt, options),
    interrupt: () => backend.interrupt(),
    respond: response => backend.respond(response),
  },
});
```

`examples/session-pane.ts` in the repository shows a typed version that subscribes to a harness session.

### State groups

State separates concerns instead of exposing a long list of paired props:

| Group | Holds |
| --- | --- |
| `identity` | `conversationKey`, `activeTurnId`, `turns`, `messages`, `busy`, `disabled`, `error` |
| `history` | `hasOlder`, `loading`, `loadingOlder` |
| `thread` | `requests`, `answeredClientRequestIds`, `goal`, `queuedPrompts`, `turnGitDiff`, `contextUsage` |
| `composer` | draft `state`, `attachments`, `promptHistory`, `placeholder`, `suggestedPrompt`, `followUpBehavior`, menu items, `permission`, `planMode`, selected model, reasoning effort and service tier |
| `catalogs` | `models`, `commands`, `skills`, `plugins`, `files`, `mentionGroups` and their load status |
| `capabilities` | The [`Capabilities`](/api/contracts#capabilities) the pane honors |
| `policy` | `attachEnabled`, `canDeleteTurn`, `canEditTurn`, `canRetryTurn`, `canForkTurn`, `actionsDisabled`, `followUpsDisabled` |

### Actions

All actions are optional. Omit those your host does not support and leave the matching capability off.

| Action | Purpose |
| --- | --- |
| `submit(prompt, options?)` | Send a prompt. May return `{ renderOptimisticMessage?, sentPrompt? }` |
| `steer(prompt, options?)` | Redirect the active turn |
| `interrupt()` / `cancel()` | Stop the active turn |
| `respond(response)` | Answer a pending request, in the shape `Harness.respondToRequest` takes |
| `updateSettings(defaults)` | Change model, reasoning effort, service tier or permission |
| `setPlanMode(enabled)` | Toggle plan mode |
| `updateComposerState(state)` | Persist the draft |
| `updateAttachments(attachments)` | Persist composer attachments |
| `updateQueuedPrompt`, `deleteQueuedPrompt`, `steerQueuedPrompt` | Edit the queue |
| `deleteTurn`, `editTurn`, `retryTurn`, `forkTurn` | Mutate a turn |
| `loadOlderHistory`, `loadTurnHistory(turnId)` | Fetch more history |
| `clearGoal`, `editGoal` | Goal actions |
| `readImagePreview(reference)` | Resolve a local image reference |
| `readPromptHistory()` | Load user prompts for Up/Down recall |
| `requestSkills()` | Discover the skill catalog when its menu opens |
| `menuSelect`, `mentionSelect` | Host menu items and mention groups |
| `openImage`, `openLink`, `openVisualization` | Host-owned navigation |
| `quoteMessage`, `onMessageCopied`, `sendFollowUp`, `continueInterruptedTurn`, `attach` | Message and composer extras |

## Props and events

The prop surface mirrors the controller groups: `messages`, `turns`, `busy`, `capabilities`, `models`, `commands`, `skills`, `plugins`, `files`, `mentionGroups`, `composerState`, `attachments`, `permissions` and so on. Behavior props worth knowing:

| Prop | Default | Purpose |
| --- | --- | --- |
| `autofocus` | `false` | Focus the composer on mount |
| `ariaLabel` | `'Conversation'` | Accessible label for the pane |
| `escapeInterrupt` | `true` | Double-Escape interrupts the active turn |
| `renderStrategy` | `'lazy'` | `'eager'` mounts the whole transcript; see [history](/guide/history) |
| `initialMessageBatchSize`, `messageBatchSize` | `50`, `25` | Lazy mounting batch sizes |
| `presentation` | all on | [Presentation flags](/guide/presentation) |
| `toolVisibility` | all visible | Predicate hiding tool calls from the transcript only |
| `showToolDetails` | off | Reveal raw tool input and output, for trusted views |
| `transformMessage` | none | Adjust each message before rendering |
| `followUpBehavior` | `'queue'` | Primary follow-up action while busy; Cmd/Ctrl+Enter uses the other |
| `emptyTitle`, `emptyDescription` | "Start a conversation" | Empty state copy |
| `transcribeAudio`, `pickAttachments`, `ingestAttachments` | host capabilities | Per-pane overrides for host ports |

Without a controller the pane emits typed events: `submit`, `steer`, `interrupt`, `respond`, `deleteTurn`, `editTurn`, `retryTurn`, `forkTurn`, `loadOlderHistory`, `loadTurnHistory`, `openLink`, `openVisualization`, `menuSelect`, `mentionSelect`, `update:composerState`, `update:modelId`, `update:reasoningEffort`, `update:serviceTier`, `update:permission`, `update:planMode` and more. See the [component reference](/api/vue#conversationpane).

## Slots

Prefer additive slots to replacing SDK-owned message rendering.

| Slot | Replaces or adds |
| --- | --- |
| `empty` | The empty state |
| `message-header` | Content above each message |
| `message-block`, `message-text`, `message-attachment`, `message-tool` | One rendered block |
| `message-actions` | Message action buttons |
| `message-status`, `message-thinking` | Streaming indicators |
| `message` | A whole message |
| `approval` | The approval prompt |
| `before-composer`, `after-composer` | Content around the composer |
| `composer-context`, `composer-drawers`, `composer-shelf-actions` | Composer chrome |
| `composer-after-input`, `composer-after`, `composer-attachment-actions` | Composer extras |
| `composer-replacement` | The entire composer |
| `menu-icon`, `menu-item`, `suggestion-item`, `mention` | Menu and mention rendering |

```vue
<ConversationPane :controller="binding.controller">
  <template #message-header="{ message }">
    <AppMessageHeader :message="message" />
  </template>
  <template #empty="{ title }">
    <AppWelcome :title="title" />
  </template>
</ConversationPane>
```

## What stays in the host

Keep navigation, durable storage, conversation titles, routing and authorization in your application. Closing a view disposes its UI binding; releasing or deleting a native conversation is a separate host operation.

For fixed layouts, `WorkbenchLayout` provides a body with optional `header` and `footer` slots and a `scrollMode` of `'body'` or `'child'`.
