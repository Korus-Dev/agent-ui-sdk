import type { HarnessCapabilities, HarnessDriver, ModelOption, SessionState, HarnessProvider } from '@korus-dev/multi-agent-sdk';
import type { ClientSendMessageOptions } from '@korus-dev/multi-agent-sdk';

export type ChatSummary = { id: string; title: string; updatedAt: string; };
export type ChatView = {
  id: string;
  title: string;
  state: SessionState;
  capabilities: HarnessCapabilities;
  models: ModelOption[];
};
export type ChatStateEvent = { chatId: string; state: SessionState; title: string };

/** Neutral driver operations forwarded to a chat's session. Results arrive as chat state events, except content reads. */
export const chatOperations = [
  'steerPrompt', 'interrupt', 'respondToRequest', 'setPermission', 'setGoal', 'clearGoal',
  'loadTurnHistory', 'loadOlderHistory', 'deleteTurn', 'editTurn', 'retryTurn', 'readConversationContent',
] as const;
export type ChatOperation = typeof chatOperations[number];
type AfterSession<F> = F extends (session: never, ...args: infer A) => unknown ? A : never;

type ChatOperationResult<M extends ChatOperation> = M extends 'readConversationContent' ? Awaited<ReturnType<HarnessDriver['readConversationContent']>> : void;

/** Surface exposed to the renderer by the preload script. */
export type SampleApi = {
  status(): Promise<{ backend: HarnessProvider; runtime: { status: string; detail?: string }; connected: boolean }>;
  chats(): Promise<ChatSummary[]>;
  newChat(): Promise<ChatView>;
  chat(id: string): Promise<ChatView>;
  prompt(id: string, prompt: string, options?: ClientSendMessageOptions): Promise<void>;
  call<M extends ChatOperation>(id: string, method: M, ...args: AfterSession<HarnessDriver[M]>): Promise<ChatOperationResult<M>>;
  onChatState(listener: (event: ChatStateEvent) => void): () => void;
};
