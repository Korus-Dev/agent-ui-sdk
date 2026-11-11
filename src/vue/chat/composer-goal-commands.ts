import type { CommandSummary } from './contracts';

export function composerCommandsWithGoals(commands: readonly CommandSummary[], goals: boolean): readonly CommandSummary[] {
  const isGoal = (command: CommandSummary) => (command.slashName ?? command.name) === 'goal';
  if (!goals) return commands.filter(command => !isGoal(command));
  if (commands.some(command => isGoal(command) && command.composerMode)) return commands;
  return [...commands.filter(command => !isGoal(command)), { id: 'goal', name: 'goal', slashName: 'goal', composerMode: { label: 'Goal', placeholder: 'Describe the goal' } }];
}
