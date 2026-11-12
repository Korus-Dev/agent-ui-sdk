import type { Capabilities, CommandSummary } from '../../src/vue/chat/contracts';

export const exampleCapabilities: Capabilities = {
  models: true,
  skills: true,
  reasoningEffort: true,
  serviceTier: true,
  planMode: true,
  goals: true,
  steerPrompt: true,
  interrupt: true,
  history: true,
  deleteTurn: true,
  editTurn: true,
  retryTurn: true,
  approvals: true,
  permissions: [{ id: 'ask-for-approval' }, { id: 'approve-for-me' }, { id: 'full-access', dangerous: true }],
} as const;


export const exampleCommands: readonly CommandSummary[] = [
  {
    id: 'codex.compact',
    name: 'compact',
    displayName: 'Compact',
    description: 'Compact the current Codex context.',
    slashName: 'compact',
    submitOnSelect: true,
  },
  {
    id: 'codex.review',
    name: 'review',
    displayName: 'Review',
    description: 'Review current Codex changes and find issues.',
    slashName: 'review',
    submitOnSelect: true,
  },
  {
    id: 'codex.plan',
    name: 'plan',
    displayName: 'Plan',
    description: 'Switch to Codex Plan mode.',
    slashName: 'plan',
    submitOnSelect: true,
  },
  {
    id: 'codex.goal',
    name: 'goal',
    displayName: 'Goal',
    description: 'Set or view the Codex thread goal.',
    slashName: 'goal',
    composerMode: {
      label: 'Goal',
      placeholder: 'Describe the goal',
    },
  },
] as const;
