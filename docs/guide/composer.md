# Composer and input

Use `Composer` independently or inside `ConversationPane`. It supports multiline rich text, authored mention chips, attachments, prompt recall, queue editing, steering and optional voice input. See [Components](/guide/components#composer) for every prop, event and slot.

## Mentions and commands

Three prefixes open suggestion menus from catalogs your host supplies:

| Prefix | Catalog |
| --- | --- |
| `/` | Host commands |
| `$` | Skills |
| `@` | Plugins, files and host mention groups |

Accepting a suggestion creates a typed chip. Literal typed or pasted text remains literal. A chip's visible label is only a rendering: the structured `content` (`PromptPart[]`) records what was selected.

**Preserve `ComposerState.content` with drafts** and forward the submission's `options.content` through sending, steering and queue edits, so selected targets survive their visible labels.

```ts
const actions = {
  submit: (prompt, options) => backend.send(prompt, options), // options.content carries chips
  updateComposerState: state => saveDraft(conversationId, state),
};
```

Opening the skill menu can request discovery through `requestSkills`. The host returns catalog state (`skillCatalogStatus`) and handles failures.

### Host mention groups

Provide your own `@` targets with `mentionGroups`:

```ts
const mentionGroups: ComposerMentionGroup<Ticket>[] = [{
  id: 'tickets',
  label: 'Tickets',
  placement: 'before', // or 'after' the built-in plugins and files
  items: tickets.map(ticket => ({
    id: ticket.id,
    value: ticket.key,        // stable text stored after the "@"
    label: ticket.title,      // friendly text rendered by the chip
    description: ticket.team,
    payload: ticket,
  })),
}];
```

Selecting an item calls `actions.mentionSelect(item, group)`. Render custom rows with the pane's `suggestion-item` and `mention` slots; user messages render the same chips with `mentionGroups`.

## Keyboard

| Key | Action |
| --- | --- |
| Enter | Submit |
| Shift+Enter | Insert a line break |
| Cmd/Ctrl+Enter | The other follow-up action while busy (steer when the primary is queue, and vice versa) |
| Up / Down | Recall earlier prompts when the caret is at the end of the draft |
| Tab, Right Arrow, Space or Enter on an empty draft | Accept the `suggestedPrompt` hint into the draft |
| Shift+Tab | Toggle plan mode, when supported |
| Double Escape | Interrupt the active turn (`escapeInterrupt`) |
| Cmd/Ctrl+Z | Native undo/redo, including pasted text |

Pasting text inserts plain text without rich formatting.

## Working while a turn runs

While busy, a submit follows `followUpBehavior`: **queue** (the default) adds a prompt to the shelf, **steer** redirects the running turn. Cmd/Ctrl+Enter performs the other. Queued prompts can be edited, deleted or steered into the active turn; editing is disabled while the composer holds a draft. The [session binding](/guide/session-binding#prompt-submission-and-the-queue) manages the queue for you.

Capability flags control steering, interruption, goals, plan mode and other optional actions. The composer never offers an operation the session does not advertise.

### Goals and plan mode

Goal mode collects an objective before sending `/goal …`. Plan mode toggles planning for the next turns. The two are mutually exclusive. With a session binding, `/goal <objective>` calls your `setGoal`, and `/goal clear` calls `clearGoal`; the goal appears in the shelf with edit and clear actions.

## Model, reasoning and speed

Models, reasoning efforts and service tiers use the provider's own ids. The composer shows a model selector when `capabilities.models` is set, a reasoning submenu for models that list `supportedReasoningEfforts`, and a speed submenu for models with `serviceTiers`. Do not invent a universal model list or map one harness's permission ids onto another's.

Host-owned menu items render before Plan mode with `leadingMenuItems`. The model selector is the [harness picker](/guide/components#harnessmodelselector): harness tabs, models, reasoning and speed in one popover. Permission options come from `capabilities.permissions`; see [permissions](/guide/session-binding#permissions).

## Voice input

`Composer` shows a microphone when the host advertises transcription and the `voice` presentation flag is on. Two paths exist:

- **Streaming** (`HostCapabilities.streamingTranscription`): live partial text and an audio-level indicator while recording.
- **Batch** (`transcribeAudio`): record, then transcribe once.

`useComposerVoice` owns recording, transcription and cleanup for a custom voice UI. Provider realtime conversation protocols belong in the application host or Multi Agent SDK. See [native capabilities](/guide/native-capabilities#speech).

## Attachments

Attachments need a trusted host picker or ingester and opaque references. Drag-and-drop and paste of files are ingested through the same capability. Call `toHarnessPromptOptions` from `/host` when translating the pane's options for a harness, and provide a trusted resolver for attachment references.

::: warning
Never treat a renderer-supplied path as permission to read a file. Applications own retention and durable attachment storage.
:::

## Drafts

The draft is `ComposerState`: `text`, structured `content`, `selectionStart`, `selectionEnd` and `activeCommandId`. Persist it from `update:composerState` (or `actions.updateComposerState`) per conversation to survive navigation. Resolving or cancelling a request never submits or clears the draft.

## Building your own composer

`ComposerMenu`, `ComposerMenuList`, `ComposerSendButton`, `HarnessModelSelector`, `RichTextEditor`, voice controls and shelf controls can be composed into a custom layout. See [Assembling a custom layout](/guide/assembling).
