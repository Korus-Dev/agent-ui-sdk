# Assembling a custom layout

`ConversationPane` is itself assembled from the public controls on this site: a `WorkbenchLayout` holding a `MessageList` above a footer that swaps between an `ApprovalPrompt`, a question or confirmation, and the `Composer` with its shelf. When the pane's arrangement is not what you need, build your own from the same parts.

This guide builds a workspace conversation with:

- a header with a standalone model picker and a stop button;
- the transcript in a `MessageList`;
- a footer that shows an approval when one is pending, and otherwise a queue shelf above the composer.

Try the pane first: most customizations only need [slots](/guide/conversation-pane#slots) or [presentation flags](/guide/presentation), and a new layout is the last resort.

This guide assumes the typed `bridge` module from the [quick start](/guide/quick-start#_3-render-the-pane), and `Workspace.vue` uses top-level `await`, so render it inside `<Suspense>`.

## Project state

Reuse the session projection so your layout reads the same grouped state the pane does:

```ts
// useConversation.ts
import { computed, shallowRef, type ShallowRef } from 'vue';
import {
  sessionStateToConversationPaneState,
  type SessionConversationControls,
} from '@korus-dev/agent-ui-sdk';
import type { HarnessCapabilities, ModelOption, SessionState } from '@korus-dev/multi-agent-sdk';

export function useConversation(
  state: ShallowRef<SessionState>,
  capabilities: HarnessCapabilities,
  models: ModelOption[],
) {
  const controls = shallowRef<SessionConversationControls>({ models });
  const pane = computed(() => sessionStateToConversationPaneState(state.value, capabilities, 'main', controls.value));

  const approval = computed(() => {
    const request = state.value.requests.find(item => item.kind === 'approval');
    return request?.kind === 'approval' ? request : undefined;
  });
  return { pane, controls, approval };
}
```

The projection gives you `identity` (messages, turns, busy), `thread` (requests, goal, context usage), `catalogs`, `composer` selections, `capabilities` and `policy`. `AgentRequest` values have a `kind` of `approval`, `question` or `toolConfirmation`.

## Compose the view

```vue
<!-- Workspace.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';
import {
  ApprovalPrompt,
  Composer,
  ComposerShelf,
  IconButton,
  MessageList,
  ModelPicker,
  WorkbenchLayout,
  requestResponseFromApproval,
  requestResponseFromClientResponse,
  createQueuedChatPrompt,
  type ModelSelection,
  type QueuedPromptData,
} from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
import { bridge } from './bridge'; // the typed window.bridge from the quick start
import { useConversation } from './useConversation';

const initial = await bridge.read();
const state = shallowRef(initial.state);
const off = bridge.subscribe(next => { state.value = next; });
onBeforeUnmount(off);
const { pane, controls, approval } = useConversation(state, initial.capabilities, initial.models);

// Queue: this layout owns it, so it decides when prompts are sent.
const queue = shallowRef<QueuedPromptData[]>([]);

const selection = computed<ModelSelection>(() => controls.value.selection ?? state.value.selection ?? {});
const busy = computed(() => state.value.busy);

// The picker only edits local state; the choice reaches the harness with each prompt.
const withSelection = (options?: object) => ({
  ...options,
  ...(selection.value.model ? { model: selection.value.model } : {}),
  ...(selection.value.reasoningEffort ? { reasoningEffort: selection.value.reasoningEffort } : {}),
  ...(selection.value.serviceTier !== undefined ? { serviceTier: selection.value.serviceTier } : {}),
});

async function send(prompt: string, options?: { content?: unknown }) {
  if (busy.value || approval.value || queue.value.length) {
    queue.value = [...queue.value, { ...createQueuedChatPrompt(prompt), ...(options?.content ? { options: { content: options.content } } : {}) }];
    return;
  }
  await bridge.sendPrompt(prompt, withSelection(options));
}

// Drain one queued prompt each time the session goes idle.
watch([busy, approval], async ([isBusy, pending]) => {
  if (isBusy || pending || !queue.value.length) return;
  const [next, ...rest] = queue.value;
  queue.value = rest;
  await bridge.sendPrompt(next.text, withSelection(next.options));
});

function resolve(decision: 'approve' | 'deny', scope: 'once' | 'session') {
  if (!approval.value) return;
  return bridge.respondToRequest(requestResponseFromApproval(approval.value.approval.id, decision, scope));
}
</script>

<template>
  <WorkbenchLayout scroll-mode="child" class="workspace">
    <template #header>
      <header class="workspace__header">
        <ModelPicker
          :models="pane.catalogs?.models ?? []"
          :selection="selection"
          :disabled="busy"
          @update:selection="controls = { ...controls, selection: $event }"
        />
        <IconButton v-if="busy" label="Stop" bordered @click="bridge.interrupt()">■</IconButton>
      </header>
    </template>

    <MessageList
      class="workspace__messages"
      :messages="pane.identity.messages"
      :turns="pane.identity.turns"
      :busy="busy"
      :active-turn-id="pane.identity.activeTurnId"
      :reset-key="pane.identity.conversationKey"
      :presentation="{ messages: { actions: { fork: false } } }"
      @client-response="response => bridge.respondToRequest(requestResponseFromClientResponse(response))"
      @send-follow-up="send"
    />

    <template #footer>
      <div class="workspace__footer">
        <ApprovalPrompt
          v-if="approval"
          :approval="approval.approval"
          @resolve="resolve"
        />
        <template v-else>
          <ComposerShelf
            :goal="pane.thread?.goal ?? null"
            :queued-prompts="queue"
            @delete-queued-prompt="id => queue = queue.filter(item => item.id !== id)"
          />
          <Composer
            autofocus
            :disabled="false"
            :is-sending="busy"
            :capabilities="{ ...pane.capabilities, models: false }"
            :context-usage="pane.thread?.contextUsage"
            :presentation="{ composer: { voice: false } }"
            @send="send"
            @interrupt="bridge.interrupt()"
          />
        </template>
      </div>
    </template>
  </WorkbenchLayout>
</template>

<style>
.workspace { height: 100%; }
/* The header and footer overlay the body, so the transcript pads for their measured heights. */
.workspace__messages {
  --message-list-content-padding-top: calc(var(--workbench-layout-header-offset) + 12px);
  --message-list-content-padding-bottom: calc(var(--workbench-layout-footer-offset) + 12px);
}
.workspace__header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; }
.workspace__footer { margin: 0 auto; width: min(860px, 100%); padding: 0 16px 16px; }
</style>
```

A few things to notice:

- **The layout owns what the pane would own.** Without `ConversationPane`, you decide when queued prompts drain (the `watch` above), how an approval replaces the composer and where errors show. The [session binding](/guide/session-binding) does all of this for you; copy its behavior only if you need to change it.
- **One control, one owner.** The composer shows its own model selector when `capabilities.models` is on, so this layout turns that flag off for the composer and uses the header's `ModelPicker` instead.
- **The header and footer overlay the body.** `WorkbenchLayout` measures them and publishes `--workbench-layout-header-offset` and `--workbench-layout-footer-offset`; pad the transcript with those, as the CSS does.
- **Questions and tool confirmations still render.** `MessageList` shows them inline in the transcript and emits `client-response` with a `ClientRequestResponse`. Convert it with `requestResponseFromClientResponse` before handing it to `bridge.respondToRequest`, as the example does.
- **Presentation flags apply per component.** The same `presentation` object type works on `MessageList`, `Message` and `Composer`.
- **Give the layout a height.** `WorkbenchLayout` fills its container; with `scroll-mode="child"`, the `MessageList` owns scrolling.

## Swap one piece inside the pane

Often you want the pane everywhere except one region. Pass your own component through a slot instead of re-assembling everything.

Replace the composer entirely, keeping the transcript, history, requests and queue:

```vue
<ConversationPane :controller="binding.controller">
  <template #composer-replacement>
    <MyCommandBar @send="prompt => binding.controller.actions.submit?.(prompt)" />
  </template>
</ConversationPane>
```

Add your own content above the composer, such as a context drawer built from the SDK's rows:

```vue
<ConversationPane :controller="binding.controller">
  <template #composer-drawers>
    <ComposerDrawer>
      <ComposerDrawerRow>
        <template #leading><span aria-hidden="true">📎</span></template>
        3 files selected
        <template #actions><button type="button" @click="clearSelection">Clear</button></template>
      </ComposerDrawerRow>
    </ComposerDrawer>
  </template>
</ConversationPane>
```

Add host actions to the composer menu, including a submenu:

```ts
const menuItems = [
  { id: 'open-docs', type: 'action', label: 'Open documentation' },
  {
    id: 'tone',
    type: 'submenu',
    label: 'Tone',
    items: [
      { id: 'tone:concise', type: 'radio', label: 'Concise', checked: true },
      { id: 'tone:detailed', type: 'radio', label: 'Detailed', checked: false },
    ],
  },
];
```

With a controlled pane, put them in the controller's `composer.menuItems` and handle `actions.menuSelect(item)`; the item's `payload` returns unchanged. A [session binding](/guide/session-binding) builds its own controller state and only fills `composer.leadingMenuItems` (with the permissions submenu) and routes `menuSelect` to permissions, so wrap it to add your items:

```ts
import { resolveConversationPaneValue } from '@korus-dev/agent-ui-sdk';

const { controller } = binding;
const withMenu = {
  state: () => {
    const state = resolveConversationPaneValue(controller.state);
    return { ...state, composer: { ...state.composer, menuItems } };
  },
  actions: {
    ...controller.actions,
    menuSelect: item => item.id.startsWith('session-permission:')
      ? controller.actions.menuSelect?.(item)
      : handleHostMenu(item),
  },
};
```

Pass `withMenu` as the pane's `controller`.

## Use pieces alone

Any control works outside a pane when you provide its props:

```vue
<!-- A read-only transcript viewer -->
<MessageList :messages="archive.messages" :turns="archive.turns" render-strategy="eager"
             :presentation="{ messages: { actions: { delete: false, edit: false, retry: false, fork: false } } }" />

<!-- A single message in a notification -->
<Message :message="message" :show-tool-details="false" />

<!-- A standalone approval -->
<ApprovalPrompt :approval="approval" @resolve="(decision, scope) => answer(decision, scope)" />
```

Every SDK control carries the `agent-ui-theme` class itself, so theme tokens resolve inside it. To theme the surrounding region, set tokens on an ancestor or call [`applyTheme`](/guide/presentation#theme-tokens) on it.

## Checklist for a custom layout

- Import `styles.css` once.
- Give the root a definite height and let one child own scrolling.
- Keep message identities stable across streaming updates.
- Decide who owns the prompt queue, goal commands and request responses.
- Route [attachments](/guide/native-capabilities#attachments) through a trusted host picker with opaque references.
- Disable controls through `capabilities` and `policy`, not by hiding them with CSS.
