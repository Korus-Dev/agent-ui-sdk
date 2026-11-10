export function safePartitionName(agentId: string): string {
  return agentId.replace(/[^a-zA-Z\d_-]/gu, '-').slice(0, 80) || 'default';
}