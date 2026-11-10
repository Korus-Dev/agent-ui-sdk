import type { AgentRequestResponse } from 'multi-agents-sdk/consumer-types';
import type { ClientRequestResponse } from './chat/contracts';

export type SessionRequestResponse = Omit<AgentRequestResponse, 'agentId'>;

/** Convert a controlled question/tool-confirmation intent for the neutral driver. */
export function requestResponseFromClientResponse({ id, payload }: ClientRequestResponse): SessionRequestResponse {
  if (payload?.cancelled) return { id, outcome: { kind: 'cancelled' } };
  if (payload?.answers) return { id, outcome: { kind: 'answered', answers: payload.answers } };
  if (payload?.decision) return { id, outcome: { kind: 'decision', decision: payload.decision } };
  throw new Error('A request response needs an answer, decision or cancellation.');
}

/** Convert the pane's approval decision/scope without native session identity. */
export function requestResponseFromApproval(
  id: string,
  decision: 'approve' | 'deny',
  scope: 'once' | 'session',
): SessionRequestResponse {
  return { id, outcome: { kind: 'decision', decision: decision === 'deny' ? 'deny' : scope === 'session' ? 'allow_conversation' : 'allow' } };
}
