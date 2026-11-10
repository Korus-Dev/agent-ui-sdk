import { shallowRef, watch } from 'vue';
import { readEmbeddedConversationImage } from '../host/conversation-images';
import type { HarnessCapabilities, HarnessDriver, SessionState } from '@korus-dev/multi-agent-sdk/consumer-types';
import type { ClientSendMessageOptions } from '@korus-dev/multi-agent-sdk/ui-types';
import { createCodexConversationPaneController, resolveCodexConversationPaneValue as read, type CodexConversationPaneActions as Actions, type CodexConversationPaneValueSource as Source } from './conversation-pane-controller';
import { sessionStateToConversationPaneState, type SessionConversationControls } from './session-conversation-pane';
import { requestResponseFromApproval, requestResponseFromClientResponse, type SessionRequestResponse } from './session-request-response';
import { createQueuedChatPrompt } from './chat/queued-prompts';
import { approvalPresetOptions } from './chat/approval-presets';
import type { CodexComposerMenuItem } from './composer-menu';
import { ShieldCheckIcon } from './shared/icons/app-icons';

/** Renderer-safe, session-bound operations. A host may implement these over IPC. */
export type SessionConversationClient = {
  sendPrompt(prompt: string, options?: ClientSendMessageOptions): Promise<unknown>;
  steerPrompt?(prompt: string, options?: ClientSendMessageOptions): Promise<unknown>;
  interrupt?(): Promise<unknown>;
  respondToRequest?(response: SessionRequestResponse): Promise<unknown>;
  setPermission?(id: string): Promise<unknown>;
  setGoal?(objective: string): Promise<unknown>;
  clearGoal?(): Promise<unknown>;
  readConversationContent?(input: Parameters<HarnessDriver['readConversationContent']>[1]): ReturnType<HarnessDriver['readConversationContent']>;
  loadTurnHistory?(id: string): Promise<unknown>;
  loadOlderHistory?(): Promise<unknown>;
  deleteTurn?(id: string): Promise<unknown>;
  editTurn?(id: string, content: string, options?: Pick<ClientSendMessageOptions, 'content'>): Promise<unknown>;
  retryTurn?(id: string): Promise<unknown>;
};
export type SessionConversationControllerOptions = {
  state: Source<SessionState>;
  capabilities: Source<HarnessCapabilities>;
  conversationKey: string | number;
  client: SessionConversationClient;
  controls?: Source<SessionConversationControls>;
  /** Optional controlled preferences. Without this hook settings are ephemeral. */
  onControlsChange?(controls: SessionConversationControls): void | Promise<void>;
};
type QueuedPrompt = { id: string; text: string; options: ClientSendMessageOptions };

/** One binding per conversation; the host owns its lifetime and persistence. */
export function createSessionConversationController(options: SessionConversationControllerOptions) {
  const queue = shallowRef<QueuedPrompt[]>([]);
  const local = shallowRef<SessionConversationControls>({});
  const error = shallowRef<string | null>(null);
  let disposed = false;
  let sending = false;
  let pendingDrain = false;
  const queueOperations = new Set<string>();
  const requireEditable = (id: string) => {
    requireOpen();
    if (queueOperations.has(id)) throw new Error('Prompt admission is in progress.');
  };
  const state = () => read(options.state);
  const capabilities = () => read(options.capabilities);
  const controls = () => ({ ...read(options.controls ?? {}), ...local.value });
  const requireOpen = () => { if (disposed) throw new Error('Conversation binding is disposed.'); };
  const call = async <Args extends unknown[]>(method: ((...args: Args) => Promise<unknown>) | undefined, ...args: Args) => {
    requireOpen();
    if (!method) throw new Error('This conversation operation is not connected.');
    return method.apply(options.client, args);
  };
  const updateControls = async (patch: Partial<SessionConversationControls>) => {
    requireOpen();
    const value = { ...controls(), ...patch };
    // The host can control preferences; otherwise retain only this binding's settings.
    if (options.onControlsChange) await options.onControlsChange(value);
    else {
      const next = { ...local.value, ...patch };
      if (next.permission === state().permission) delete next.permission;
      local.value = next;
    }
  };
  const promptOptions = (input?: ClientSendMessageOptions): ClientSendMessageOptions => {
    const current = controls();
    const selected = { ...state().selection, ...current.selection };
    return { ...input,
      ...(selected?.model == null ? {} : { model: selected.model }),
      ...(selected?.reasoningEffort == null ? {} : { reasoningEffort: selected.reasoningEffort }),
      ...(selected?.serviceTier === undefined ? {} : { serviceTier: selected.serviceTier }),
      planMode: current.planMode ?? false,
    };
  };
  async function deliver(prompt: string, settings: ClientSendMessageOptions) {
    requireOpen();
    sending = true;
    try {
      const goal = capabilities().goals && /^\/goal(?:\s+([\s\S]*))?$/.exec(prompt.trim());
      if (goal) {
        if (goal[1]?.trim() === 'clear') await call(options.client.clearGoal);
        else if (goal[1]?.trim()) await call(options.client.setGoal, goal[1].trim());
        else throw new Error('Enter a goal objective.');
        return { renderOptimisticMessage: false };
      } else await options.client.sendPrompt(prompt, settings);
    } finally { sending = false; }
  }

  async function drain() {
    if (disposed || sending || state().busy || state().requests.length || !queue.value.length || error.value) return;
    const next = queue.value[0]!;
    if (queueOperations.has(next.id)) { pendingDrain = true; return; }
    queueOperations.add(next.id);
    // Remove only after admission, preserving a failed prompt for editing/retry.
    try {
      await deliver(next.text, next.options);
      queue.value = queue.value.filter(item => item.id !== next.id);
    } catch (cause) { error.value = cause instanceof Error ? cause.message : String(cause); }
    finally { queueOperations.delete(next.id); flushPending(); }
  }
  function flushPending() {
    if (pendingDrain) { pendingDrain = false; void drain(); }
  }
  const submit = async (prompt: string, input?: ClientSendMessageOptions) => {
    requireOpen(); error.value = null;
    const settings = promptOptions(input);
    if (state().busy || sending || queue.value.length) {
      queue.value = [...queue.value, { ...createQueuedChatPrompt(prompt), options: settings }];
      if (!state().busy && !sending) void drain();
      return { renderOptimisticMessage: false };
    } else {
      try { return await deliver(prompt, settings); }
      finally { flushPending(); }
    }
  };
  const stop = watch(() => [state().busy, state().requests.length] as const, ([busy, requests], [wasBusy, oldRequests]) => {
    if (!busy && !requests && (wasBusy || oldRequests)) {
      if (sending) pendingDrain = true;
      else void drain();
    }
  }, { flush: 'sync' });
  const stopSelection = watch(() => state().selection, selection => {
    if (!selection || !local.value.selection) return;
    const pending = Object.fromEntries(Object.entries(local.value.selection)
      .filter(([key, value]) => selection[key as keyof typeof selection] !== value));
    const { selection: _acknowledged, ...rest } = local.value;
    local.value = Object.keys(pending).length ? { ...rest, selection: pending } : rest;
  }, { flush: 'sync' });
  const stopPermission = watch(() => state().permission, permission => {
    if (permission !== undefined && local.value.permission === permission) {
      const { permission: _acknowledged, ...rest } = local.value;
      local.value = rest;
    }
  }, { flush: 'sync' });
  const permissions = (): CodexComposerMenuItem[] => capabilities().permissions.length ? [{
    id: 'session-permissions', type: 'submenu', label: 'Permissions', icon: ShieldCheckIcon,
    submenuAlignment: 'bottom', submenuWidth: 'wide',
    items: capabilities().permissions.map((permission, index) => {
      const copy = approvalPresetOptions.find(preset => preset.id === permission.id);
      return { id: `session-permission:${index}`, type: 'radio',
        label: copy?.label ?? permission.id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, char => char.toUpperCase()),
        description: copy?.description ?? (permission.dangerous ? 'Allows tools to run without approval.' : undefined),
        checked: (controls().permission ?? state().permission) === permission.id,
      };
    }),
  }, { id: 'session-permissions-divider', type: 'separator' }] : [];
  const actions: Actions = {
    readImagePreview: async reference => {
      requireOpen();
      if (reference.startsWith('conversation-image:')) {
        const readContent = options.client.readConversationContent;
        if (!readContent) return null;
        return readEmbeddedConversationImage(reference, input => readContent.call(options.client, { contentId: input.contentId, offset: input.offset }));
      }
      return null;
    },
    submit,
    steer: async (prompt, input) => { await call(options.client.steerPrompt, prompt, promptOptions(input)); },
    steerQueuedPrompt: async (id, text, input) => {
      requireEditable(id);
      const entry = queue.value.find(item => item.id === id);
      if (!entry) throw new Error('Unknown queued prompt.');
      queueOperations.add(id);
      try {
        await call(options.client.steerPrompt, text ?? entry.text, { ...entry.options, ...input });
        queue.value = queue.value.filter(item => item.id !== id);
        error.value = null;
      } finally { queueOperations.delete(id); flushPending(); }
    },
    deleteQueuedPrompt: id => { requireEditable(id); queue.value = queue.value.filter(item => item.id !== id); error.value = null; void drain(); },
    updateQueuedPrompt: (id, text, input) => {
      requireEditable(id);
      if (!text.trim() || !queue.value.some(item => item.id === id)) throw new Error('Unknown or empty queued prompt.');
      queue.value = queue.value.map(item => item.id === id ? { ...item, text, options: { ...item.options, ...input } } : item);
      error.value = null;
      void drain();
    },
    interrupt: async () => { await call(options.client.interrupt); },
    cancel: async () => { await call(options.client.interrupt); },
    resolveApproval: async (id, decision, scope) => { await call(options.client.respondToRequest, requestResponseFromApproval(id, decision, scope)); },
    clientResponse: async response => { await call(options.client.respondToRequest, requestResponseFromClientResponse(response)); },
    clearGoal: async () => { await call(options.client.clearGoal); },
    loadTurnHistory: async id => { await call(options.client.loadTurnHistory, id); },
    loadOlderHistory: async () => { await call(options.client.loadOlderHistory); },
    deleteTurn: async id => { await call(options.client.deleteTurn, id); },
    editTurn: async ({ turnId, content, options: input }) => { await call(options.client.editTurn, turnId, content, input); },
    retryTurn: async id => { await call(options.client.retryTurn, id); },
    sendFollowUp: async prompt => { await submit(prompt); },
    updateSettings: async settings => { await updateControls({
      selection: { ...state().selection, ...controls().selection,
        ...(settings.modelId === undefined ? {} : { model: settings.modelId }),
        ...(settings.reasoningEffort === undefined ? {} : { reasoningEffort: settings.reasoningEffort }),
        ...(settings.serviceTier === undefined ? {} : { serviceTier: settings.serviceTier }),
      },
      ...(settings.planMode === undefined ? {} : { planMode: settings.planMode }),
    }); },
    menuSelect: async item => {
      const match = /^session-permission:(\d+)$/.exec(item.id);
      const permission = match && capabilities().permissions[Number(match[1])];
      if (!permission) throw new Error('Unknown permission option.');
      await call(options.client.setPermission, permission.id);
      await updateControls({ permission: permission.id });
    },
  };
  const controller = createCodexConversationPaneController({
    state: () => {
      const snapshot = state();
      const pane = sessionStateToConversationPaneState(snapshot, capabilities(), options.conversationKey, controls());
      return { ...pane,
        identity: { ...pane.identity, error: error.value ?? pane.identity.error },
        thread: { ...pane.thread, queuedPrompts: queue.value },
        composer: { ...pane.composer, leadingMenuItems: permissions() },
      };
    },
    actions,
  });
  return { controller: { ...controller, actions }, queuedPrompts: queue, dispose() { disposed = true; stop(); stopSelection(); stopPermission(); } };
}
