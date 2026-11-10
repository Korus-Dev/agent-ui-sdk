export type QueuedChatPrompt = {
  id: string;
  text: string;
  options?: Pick<import('multi-agents-sdk/ui-types').SendMessageOptions, 'content'>;
};

let nextQueuedPromptId = 0;

export function createQueuedChatPrompt(text: string): QueuedChatPrompt {
  nextQueuedPromptId += 1;
  return {
    id: `queued-prompt-${nextQueuedPromptId}`,
    text,
  };
}
