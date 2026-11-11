import { randomUUID } from 'node:crypto';
import { createHarness } from '@korus-dev/multi-agent-sdk';
import { toHarnessPromptOptions } from '@korus-dev/agent-ui-sdk/host';
import type { ConversationRef, ConversationRefData, HarnessEvent, Message, PromptOptions, Session, HarnessProvider } from '@korus-dev/multi-agent-sdk';
import type { ClientAttachment } from '@korus-dev/multi-agent-sdk';
import { chatOperations, type ChatOperation, type ChatStateEvent, type ChatSummary, type ChatView, type SampleApi } from '../shared/api';

/** Consumer-owned persistence of the chats this app created. */
export type ChatRecord = { id: string; title: string; updatedAt: string; ref: ConversationRefData };
export type ChatStore = { load(): ChatRecord[]; save(records: ChatRecord[]): void };

type Chat = {
  id: string;
  title: string;
  updatedAt: string;
  ref?: ConversationRef;
  session?: Session;
};

/** Chat service over the neutral harness driver. The launch command chooses the backend. */
export function createChatService(
  folder: string,
  store: ChatStore,
  resolveAttachment: (attachment: ClientAttachment) => NonNullable<PromptOptions['attachments']>[number],
  emit: (event: ChatStateEvent) => void,
  backend: HarnessProvider = 'codex',
  factory = createHarness,
) {
  // The selected runtime resolves its standard home, auth and config.
  const harness = factory(backend, {
    client: { name: 'agent-sample-app', title: 'Agent Sample App', version: '0.0.0' },
  });
  const chats = new Map<string, Chat>();
  const owned = new Map<string, ChatRecord>(store.load().map(record => [record.id, record]));
  for (const { ref, ...chat } of owned.values()) chats.set(chat.id, { ...chat, ref: harness.restoreRef(ref) });
  const lister = harness.open({ id: 'sample-lister', folder: null });
  // Refs are opaque handles; their plain data identifies a conversation across list calls.
  const refKey = (ref: ConversationRef) => JSON.stringify(harness.getRefData(ref).data);

  const firstUserText = (messages: readonly Message[]) => {
    const part = messages.find(item => item.role === 'user')?.parts.find(item => item.type === 'text');
    return part && 'text' in part ? String(part.text).trim().slice(0, 80) : '';
  };
  const chatBySession = (session: Session) => [...chats.values()].find(chat => chat.session === session);

  harness.onEvent((event: HarnessEvent) => {
    if (event.type !== 'session.changed') return;
    const chat = chatBySession(event.session);
    if (!chat) return;
    const title = firstUserText(event.state.messages) || event.state.title;
    if (title) chat.title = title;
    const ref = harness.getConversationRef(event.session);
    if (ref) {
      owned.set(chat.id, { id: chat.id, title: chat.title, updatedAt: new Date().toISOString(), ref: harness.getRefData(ref) });
      store.save([...owned.values()]);
    }
    emit({ chatId: chat.id, state: event.state, title: chat.title });
  });

  async function view(chat: Chat, session: Session, extra: Partial<ChatView> = {}): Promise<ChatView> {
    return {
      id: chat.id,
      title: chat.title,
      state: harness.readSession(session),
      capabilities: harness.getCapabilities(session),
      models: await harness.listModels(session).catch(() => []),
      ...extra,
    };
  }

  async function bind(chat: Chat): Promise<Session> {
    if (chat.session) return chat.session;
    const session = harness.open({ id: chat.id, folder });
    if (chat.ref) {
      try {
        await harness.resumeConversation(session, { ref: chat.ref, storageState: 'active' });
        await harness.loadConversation(session);
      } catch (error) {
        await harness.release(session);
        throw error;
      }
    }
    chat.session = session;
    return session;
  }

  const api: Omit<SampleApi, 'onChatState'> = {
    async status() {
      const auth = await harness.authenticate({ action: 'check' });
      return { backend, runtime: harness.getRuntimeStatus(), connected: auth.connected };
    },
    async chats(): Promise<ChatSummary[]> {
      const known = new Map([...chats.values()].flatMap(chat => {
        const ref = chat.ref ?? (chat.session ? harness.getConversationRef(chat.session) : null);
        return ref ? [[refKey(ref), chat] as const] : [];
      }));
      for (const summary of await harness.listConversations(lister, { limit: 200 })) {
        const existing = known.get(refKey(summary.ref)) ?? chats.get(summary.id);
        if (existing) { existing.ref ??= summary.ref; continue; }
        chats.set(summary.id, { id: summary.id, title: summary.title || summary.preview || 'Untitled', updatedAt: summary.updatedAt, ref: summary.ref });
      }
      return [...chats.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
    },
    async newChat() {
      const chat: Chat = { id: `new-${randomUUID()}`, title: 'New chat', updatedAt: new Date().toISOString() };
      chats.set(chat.id, chat);
      return view(chat, await bind(chat));
    },
    async chat(id) {
      const chat = chats.get(id);
      if (!chat) throw new Error('Unknown chat');
      return view(chat, await bind(chat));
    },
    async prompt(id, prompt, options) {
      const chat = chats.get(id);
      if (!chat) throw new Error('Unknown chat');
      chat.updatedAt = new Date().toISOString();
      await harness.sendPrompt(await bind(chat), prompt, toHarnessPromptOptions(options, resolveAttachment));
    },
    async call(id, method, ...args) {
      const session = chats.get(id)?.session;
      if (!session || !chatOperations.includes(method as ChatOperation)) throw new Error(`Cannot ${method} this chat`);
      // Renderer-safe prompt options (attachment references) are converted here, in the trusted process.
      const values = method === 'steerPrompt' ? [args[0], toHarnessPromptOptions(args[1] as never, resolveAttachment)] : args;
      const result = await (harness[method] as (...values: unknown[]) => Promise<unknown>).call(harness, session, ...values);
      // Other operations return opaque session handles; their effects arrive as chat state events.
      return (method === 'readConversationContent' ? result : undefined) as never;
    },
  };
  return { api, close: () => harness.close() };
}
