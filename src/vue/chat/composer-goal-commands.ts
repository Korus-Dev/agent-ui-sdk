import type { CodexCommandSummary } from './contracts';

export function composerCommandsWithGoals(commands: readonly CodexCommandSummary[], goals: boolean): readonly CodexCommandSummary[] {
  const isGoal = (command: CodexCommandSummary) => (command.slashName ?? command.name) === 'goal';
  if (!goals) return commands.filter(command => !isGoal(command));
  if (commands.some(command => isGoal(command) && command.composerMode)) return commands;
  return [...commands.filter(command => !isGoal(command)), { id: 'goal', name: 'goal', slashName: 'goal', composerMode: { label: 'Goal', placeholder: 'Describe the goal' } }];
}
