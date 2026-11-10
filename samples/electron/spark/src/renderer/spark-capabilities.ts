import type { CodexCapabilities } from '@korus-dev/agent-ui-sdk';

export const sparkCapabilities: CodexCapabilities = {
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
  approvalPresets: [],
};
