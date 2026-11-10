import type { HarnessCapabilities, SessionState, Turn } from '@korus-dev/multi-agent-sdk/consumer-types';

const activeTurnFixture = {
  id: 'turn-1', status: 'inProgress' as const, error: null, willRetry: false,
  startedAt: null, completedAt: null, durationMs: null,
} satisfies Turn;

export const sessionFixture = {
  messages: [
    { id: 'user-1', agentId: 'owner-1', role: 'user', status: 'complete', createdAt: '2026-11-10T00:00:00Z', turnId: 'turn-1', parts: [{ type: 'text', text: 'Inspect this project' }] },
    { id: 'assistant-1', agentId: 'owner-1', role: 'assistant', status: 'streaming', createdAt: '2026-11-10T00:00:01Z', turnId: 'turn-1', parts: [
      { type: 'reasoning', summary: 'Checking the files', itemId: 'reason-1', summaryIndex: 0 },
      { type: 'text', text: 'I found the entry point.' },
      { type: 'tool', id: 'tool-1', kind: 'read', title: 'Read entry point', status: 'running', input: { path: 'src/index.ts' } },
    ] },
  ],
  busy: true, activeTurnId: 'turn-1', turns: [activeTurnFixture],
  requests: [
    { id: 'approval-1', kind: 'approval', conversationId: 'conversation-1', approval: { id: 'approval-1', conversationId: 'conversation-1', itemId: 'tool-1', kind: 'command', title: 'Run checks', command: 'npm test', allowedScopes: ['once'] } },
    { id: 'question-1', kind: 'question', conversationId: 'conversation-1', turnId: 'turn-1', question: { itemId: 'question-item', delivery: 'async', blocking: false, questions: [{ id: 'language', header: 'Language', question: 'Which language?', isOther: true, isSecret: false, options: null }] } },
    { id: 'confirmation-1', kind: 'toolConfirmation', conversationId: 'conversation-1', confirmation: { integrationId: 'files', integrationName: 'Files', toolName: 'write', summary: 'Write output', argumentsPreview: '{}', allowConversation: true } },
  ],
  error: null, title: 'Project inspection', goal: null, contextUsage: null, plan: null,
} satisfies SessionState;

export const capabilitiesFixture = {
  attachments: false, models: false, skills: false, reasoningEffort: false, thinkingBudget: false,
  planMode: 'unsupported', goals: false, steerPrompt: false, interrupt: true, history: false,
  deleteTurn: false, editTurn: false, retryTurn: false, approvals: true,
  permissions: [{ id: 'read-only' }],
} satisfies HarnessCapabilities;

export const failedTurnFixture = {
  id: 'turn-1', status: 'failed' as const,
  error: { message: 'Connection dropped; retry scheduled', additionalDetails: 'Attempt 2', codexErrorInfo: null },
  willRetry: true,
  startedAt: '2026-11-10T00:00:00Z', completedAt: '2026-11-10T00:00:18Z', durationMs: 12_000,
} satisfies Turn;

export const timedFailedSessionFixture = {
  ...sessionFixture, busy: false, activeTurnId: null, requests: [], turns: [failedTurnFixture],
  messages: [{
    ...sessionFixture.messages[1]!, status: 'error' as const,
    parts: [{ type: 'text' as const, text: 'The check failed.', phase: 'commentary' as const }],
  }],
} satisfies SessionState;
