import type { HarnessCapabilities, HarnessProvider, HarnessDriver, ModelOption, SessionState } from '@korus-dev/multi-agent-sdk';
import type { ClientSendMessageOptions, SessionRequestResponse } from '@korus-dev/agent-ui-sdk';
export type Conversation = { id: string; provider: HarnessProvider; state: SessionState; capabilities: HarnessCapabilities; models: ModelOption[] };
export type Snapshot = { conversations: Conversation[] };
export type Commands = {
  create: [provider: HarnessProvider];
  send: [id: string, prompt: string, options?: ClientSendMessageOptions];
  steer: [id: string, prompt: string, options?: ClientSendMessageOptions];
  interrupt: [id: string];
  respond: [id: string, response: SessionRequestResponse];
  permission: [id: string, permission: string];
  goal: [id: string, objective: string];
  clearGoal: [id: string];
  history: [id: string];
  content: [id: string, input: Parameters<HarnessDriver['readConversationContent']>[1]];
  turnHistory: [id: string, turnId: string];
  deleteTurn: [id: string, turnId: string];
  retryTurn: [id: string, turnId: string];
  editTurn: [id: string, turnId: string, content: string, options?: Pick<ClientSendMessageOptions, 'content'>];
  release: [id: string];
  relaySnapshot: [];
  relayReset: [];
};
export type SampleBridge = {
  snapshot(): Promise<Snapshot>;
  call<K extends keyof Commands>(method: K, ...args: Commands[K]): Promise<unknown>;
  subscribe(listener: (snapshot: Snapshot) => void): () => void;
};
declare global { interface Window { sample?: SampleBridge } }
