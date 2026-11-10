export function safePartitionName(ownerId: string): string {
  return ownerId.replace(/[^a-zA-Z\d_-]/gu, '-').slice(0, 80) || 'default';
}