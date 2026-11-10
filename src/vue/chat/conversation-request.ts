import type { AgentRequest } from '@korus-dev/multi-agent-sdk/consumer-types';
import type { ClientRequest } from '@korus-dev/multi-agent-sdk/ui-types';

/** Canonical requests plus explicit compatibility DTOs for existing authored messages. */
export type ConversationQuestionRequest = Extract<AgentRequest, { kind: 'question' }> | Extract<ClientRequest, { kind: 'ask_user' }>;
export type ConversationConfirmationRequest = Extract<AgentRequest, { kind: 'toolConfirmation' }> | Extract<ClientRequest, { kind: 'confirm_tool' }>;
export type ConversationRequest = ConversationQuestionRequest | ConversationConfirmationRequest;
export function isQuestionRequest(request: ConversationRequest): request is ConversationQuestionRequest {
  return request.kind === 'question' || request.kind === 'ask_user';
}
export function isConfirmationRequest(request: ConversationRequest): request is ConversationConfirmationRequest {
  return request.kind === 'toolConfirmation' || request.kind === 'confirm_tool';
}
type QuestionPayload = Extract<AgentRequest, { kind: 'question' }>['question'] | Extract<ClientRequest, { kind: 'ask_user' }>['payload']['request'];
type ConfirmationPayload = Extract<AgentRequest, { kind: 'toolConfirmation' }>['confirmation'] | Extract<ClientRequest, { kind: 'confirm_tool' }>['payload']['confirmation'];
export function questionPayload(request: ConversationQuestionRequest): QuestionPayload {
  return request.kind === 'question' ? request.question : request.payload.request;
}
export function confirmationPayload(request: ConversationConfirmationRequest): ConfirmationPayload {
  return request.kind === 'toolConfirmation' ? request.confirmation : request.payload.confirmation;
}
