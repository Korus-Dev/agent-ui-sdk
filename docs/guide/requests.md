# Requests and approvals

A running turn can stop and ask the person for something. The harness reports these as `AgentRequest` values in `SessionState.requests`, and the pane answers them through one action: `respond(AgentRequestResponse)`.

| `kind` | What it is | Where it shows |
| --- | --- | --- |
| `approval` | Permission to run a tool, change a file or reach the network | `ApprovalPrompt`, replacing the composer |
| `toolConfirmation` | An external tool asks for confirmation | **Approve tool call** card, replacing the composer |
| `question` | The agent asks the person one or more questions | Question card, replacing the composer; also inline in the transcript when answered |

While a request is pending, the composer is replaced. The unfinished draft, attachments, pending command mode and caret selection are retained, and focus returns to the saved selection when the request resolves. Resolving or cancelling never submits or clears the draft.

The pane shows one approval at a time, in supplied order, before confirmations and questions.

## Wiring

With the [session binding](/guide/session-binding), connect `respondToRequest`:

```ts
// bridge: the typed preload handle from the quick start
client: {
  respondToRequest: response => bridge.respondToRequest(response),
}
```

Without it, the pane rejects when the person answers. Keep request ids and choices unchanged across your transport; the harness matches them.

For a controlled pane, supply `thread.requests` and handle `actions.respond`. Remove a request from `requests` once the harness accepts the answer.

## Approvals

`ApprovalPrompt` renders a `ProviderApprovalRequest` with a summary, the requested permissions (filesystem access and network destinations) and actions:

| Action | Shown when |
| --- | --- |
| **Allow** | `allowedScopes` includes `once` (the default) |
| **Allow for session** | `allowedScopes` includes `session` and `requiresHumanApproval` is not set |
| **Deny** | `canDeny` is not `false` |

It emits `resolve(decision, scope)` with `'approve' | 'deny'` and `'once' | 'session'`. Translate that with `requestResponseFromApproval(approvalId, decision, scope)`, which produces an `allow`, `allow_conversation` or `deny` decision.

Replace the prompt with the pane's `approval` slot:

```vue
<ConversationPane :controller="controller">
  <template #approval="{ approval }">
    <MyApprovalSheet :approval="approval" @decide="decide(approval.id, $event)" />
  </template>
</ConversationPane>
```

Applications own approval **policy**. The SDK renders what the harness requests and returns the person's decision; it does not decide what is safe.

## Tool confirmations

Confirmations share the approval card's layout: a summary, an optional description, expandable details and left-aligned actions. The decision is one of:

| Decision | Meaning |
| --- | --- |
| `allow` | Approve this call |
| `allow_conversation` | Approve for the rest of the conversation |
| `always_allow` | Approve permanently, where the harness supports it |
| `deny` | Refuse |

A controlled host can reuse this experience for external tools by supplying `toolConfirmation` requests that match the transcript tool's `itemId`. The host retains ownership of executing the decision.

## Questions

Questions use `AskUserQuestion`:

```ts
type AskUserQuestion = {
  id: string;
  header: string;
  question: string;
  isOther: boolean;      // allow a free-text answer
  isSecret: boolean;     // mask the input
  multiSelect?: boolean;
  options: { label: string; description: string }[] | null;
};
```

Answers return as `Record<questionId, { answers: string[] }>`. A person can also dismiss a question; the pane keeps a **Pending question** chip beside the composer so it can be reopened or cancelled.

Translate a card's response for the harness:

```ts
import { requestResponseFromClientResponse } from '@korus-dev/agent-ui-sdk';

requestResponseFromClientResponse({ id, payload: { answers } });   // answered
requestResponseFromClientResponse({ id, payload: { cancelled: true } }); // cancelled
requestResponseFromClientResponse({ id, payload: { decision: 'deny' } }); // decision
```

It throws when the payload has none of an answer, a decision or a cancellation.

## Restored history

`answeredClientRequestIds` tells the transcript which requests already have answers, so restored conversations show settled questions instead of live cards. Leave it undefined when the provider supplies no evidence.

## Using the cards directly

`ApprovalPrompt`, `QuestionRequest`, `ToolConfirmation` and `ToolUserInputRequest` work outside the pane. See [Components](/guide/components#requests).
