import type { Capabilities } from './contracts';
/** Controls remain unavailable until the host supplies capability evidence. */
export const defaultCapabilities: Capabilities = {
  models: false, skills: false, reasoningEffort: false, serviceTier: false,
  planMode: false, goals: false, steerPrompt: false, interrupt: false,
  history: false, deleteTurn: false, editTurn: false, retryTurn: false,
  approvals: false, permissions: [],
};
