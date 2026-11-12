import type { Capabilities } from '@korus-dev/agent-ui-sdk';

export const sparkCapabilities: Capabilities = {
  models: false,
  skills: false,
  reasoningEffort: false,
  planMode: false,
  goals: false,
  steerPrompt: false,
  interrupt: true,
  history: true,
  deleteTurn: false,
  editTurn: false,
  retryTurn: false,
  approvals: false,
  permissions: [],
};
