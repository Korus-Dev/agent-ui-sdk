import type { AgentRequest } from '@korus-dev/multi-agent-sdk';

/** The requests the pane answers inline: questions and tool confirmations. Approvals use the approval prompt. */
export type ConversationQuestionRequest = Extract<AgentRequest, { kind: 'question' }>;
export type ConversationConfirmationRequest = Extract<AgentRequest, { kind: 'toolConfirmation' }>;
export type ConversationRequest = ConversationQuestionRequest | ConversationConfirmationRequest;
export function isQuestionRequest(request: ConversationRequest): request is ConversationQuestionRequest {
  return request.kind === 'question';
}
export function isConfirmationRequest(request: ConversationRequest): request is ConversationConfirmationRequest {
  return request.kind === 'toolConfirmation';
}
export function questionPayload(request: ConversationQuestionRequest): ConversationQuestionRequest['question'] {
  return request.question;
}
export function confirmationPayload(request: ConversationConfirmationRequest): ConversationConfirmationRequest['confirmation'] {
  return request.confirmation;
}
