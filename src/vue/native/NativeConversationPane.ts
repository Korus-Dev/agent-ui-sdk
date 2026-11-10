import { computed, defineComponent, h, onMounted, ref, watch, type Component, type ComponentObjectPropsOptions, type PropType } from 'vue';
import Pane from '../components/CodexConversationPane.vue';
import { resolveCodexConversationPaneValue } from '../conversation-pane-controller';
import type { CodexConversationPaneState, CodexConversationPaneActions, CodexConversationPaneControllerSource } from '../conversation-pane-controller';
import type { CodexSurfaceController } from './use-codex-surface';
import { codexCapabilities } from './codex-capabilities';
import { codexCommands } from './codex-commands';

const events = ['attach', 'attachmentsChange', 'cancel', 'clientResponse', 'copyMessage', 'clearGoal', 'continueInterruptedTurn', 'deleteTurn', 'deleteQueuedPrompt', 'updateQueuedPrompt', 'editGoal', 'editTurn', 'forkTurn', 'loadOlderHistory', 'loadTurnHistory', 'error', 'interrupt', 'menuSelect', 'messageTextSelectionChange', 'mentionSelect', 'openLink', 'openVisualization', 'resolveApproval', 'quoteMessage', 'retryTurn', 'selectApprovalPreset', 'sendFollowUp', 'submit', 'steer', 'steerQueuedPrompt', 'update:modelId', 'update:composerState', 'update:modelValue', 'update:planMode', 'update:reasoningEffort', 'update:serviceTier'];

// Reuse Vue's actual prop types for camelization and Boolean casting. Defaults
// belong to the generic pane or native snapshot, so absence must stay undefined.
const paneProps = (Pane as unknown as { props: ComponentObjectPropsOptions }).props;
type PaneProps = Parameters<typeof Pane>[0];
const inputProps = Object.fromEntries(Object.entries(paneProps).map(([key, option]) => [key, {
  ...(option && typeof option === 'object' && !Array.isArray(option) ? option : { type: option }),
  default: undefined,
}])) as { [Key in keyof PaneProps]-?: { type: PropType<PaneProps[Key]>; default: undefined } };

/** Explicit native compatibility: the generic pane receives only controlled data/actions. */
export default defineComponent({
  name: 'NativeConversationPane',
  inheritAttrs: false,
  emits: events,
  props: {
    ...inputProps,
    surface: Object as PropType<CodexSurfaceController>,
    controller: [Object, Function] as PropType<CodexConversationPaneControllerSource>,
  },
  setup(props, { attrs, slots, emit, expose }) {
    const nativeError = ref<string | null>(null);
    const pane = ref<{ focusComposer(): void }>();
    expose({ focusComposer: () => pane.value?.focusComposer() });
    const forwarded = () => {
      const s = props.surface?.state;
      const inherited = s ? {
        messages: s.messages, activeTurnId: s.activeTurnId, turns: s.turns,
        answeredClientRequestIds: props.surface!.answeredClientRequestIds,
        clientRequests: s.clientRequests, approvals: s.approvals,
        busy: s.busy, conversationKey: s.activeConversationId, contextUsage: s.contextUsage,
        disabled: s.status !== 'ready', error: s.error, goal: s.goal,
        historyLoading: s.historyLoading, hasOlderHistory: s.historyState?.hasOlder,
        loadingOlderHistory: s.historyState?.loadingOlder,
        modelCatalogStatus: s.modelCatalogStatus, models: s.models,
        approvalPreset: s.approvalPreset, approvalPresets: s.approvalPresets,
        planMode: s.planMode, plugins: s.plugins, queuedPrompts: s.queuedPrompts,
        selectedModelId: s.selectedModelId, selectedReasoningEffort: s.selectedReasoningEffort,
        selectedServiceTier: s.selectedServiceTier, skillCatalogStatus: s.skillCatalogStatus,
        skills: s.skills, turnGitDiff: s.turnGitDiff,
      } : {};
      return { emptyTitle: 'Start a conversation with Codex', placeholder: 'Ask Codex…', capabilities: codexCapabilities, commands: codexCommands,
        ...inherited, ...Object.fromEntries(Object.entries(props as Record<string, unknown>).filter(([key, value]) => key !== 'surface' && key !== 'controller' && value !== undefined)), ...attrs };
    };
    const state = (): CodexConversationPaneState => {
      // Vue-normalized inputs are shared by the generic props and controlled state.
      const p = forwarded() as Parameters<typeof Pane>[0];
      return {
        identity: { conversationKey: p.conversationKey, activeTurnId: p.activeTurnId, messages: p.messages ?? [], turns: p.turns, busy: p.busy, disabled: p.disabled, error: nativeError.value ?? p.error },
        history: { loading: p.historyLoading, hasOlder: p.hasOlderHistory, loadingOlder: p.loadingOlderHistory },
        thread: { approvals: p.approvals, clientRequests: p.clientRequests, answeredClientRequestIds: p.answeredClientRequestIds, goal: p.goal, contextUsage: p.contextUsage, queuedPrompts: p.queuedPrompts, turnGitDiff: p.turnGitDiff },
        composer: { state: p.composerState ?? (p.modelValue === undefined ? undefined : { text: p.modelValue, selectionStart: p.modelValue.length, selectionEnd: p.modelValue.length }), attachments: p.attachments, promptHistory: p.promptHistory, placeholder: p.placeholder, suggestedPrompt: p.suggestedPrompt, followUpBehavior: p.followUpBehavior, leadingMenuItems: p.leadingMenuItems, menuItems: p.menuItems, modelMenuItems: p.modelMenuItems, approvalPreset: p.approvalPreset, planMode: p.planMode, selectedModelId: p.selectedModelId, selectedReasoningEffort: p.selectedReasoningEffort, selectedServiceTier: p.selectedServiceTier },
        catalogs: { files: p.files, models: p.models, commands: p.commands, skills: p.skills, plugins: p.plugins, mentionGroups: p.mentionGroups, modelCatalogStatus: p.modelCatalogStatus, skillCatalogStatus: p.skillCatalogStatus },
        capabilities: { ...codexCapabilities, ...p.capabilities, approvalPresets: p.approvalPresets ?? p.capabilities?.approvalPresets },
        policy: { actionsDisabled: p.actionsDisabled, attachEnabled: p.attachEnabled, canDeleteTurn: p.canDeleteTurn, canEditTurn: p.canEditTurn, canForkTurn: p.canForkTurn, canRetryTurn: p.canRetryTurn, followUpsDisabled: p.followUpsDisabled },
      };
    };
    const notify = (event: string, ...args: unknown[]) => emit(event, ...args);
    const invoke = async (event: string, args: unknown[], action: (s: CodexSurfaceController) => Promise<unknown>) => {
      notify(event, ...args);
      if (props.surface) await action(props.surface);
    };
    const actions: CodexConversationPaneActions = {
      submit: (prompt, options) => invoke('submit', options ? [prompt, options] : [prompt], s => s.sendMessage(prompt, options)),
      steer: (prompt, options) => invoke('steer', options ? [prompt, options] : [prompt], s => s.steerMessage(prompt, options)),
      cancel: () => invoke('cancel', [], s => s.interrupt()),
      interrupt: () => invoke('interrupt', [], s => s.interrupt()),
      continueInterruptedTurn: () => invoke('continueInterruptedTurn', [], s => s.continueInterruptedTurn()),
      clientResponse: response => invoke('clientResponse', [response], s => s.respondToClientRequest(response)),
      resolveApproval: (id, decision, scope) => invoke('resolveApproval', [id, decision, scope], s => s.resolveApproval(id, decision, scope)),
      deleteTurn: id => invoke('deleteTurn', [id], s => s.deleteTurn(id)),
      editTurn: payload => invoke('editTurn', [payload], s => s.editTurn(payload.turnId, payload.content, payload.options)),
      forkTurn: id => invoke('forkTurn', [id], s => s.forkTurn(id)),
      retryTurn: id => invoke('retryTurn', [id], s => s.retryTurn(id)),
      sendFollowUp: prompt => invoke('sendFollowUp', [prompt], s => s.sendMessage(prompt)),
      clearGoal: () => invoke('clearGoal', [], s => s.clearGoal()),
      deleteQueuedPrompt: id => invoke('deleteQueuedPrompt', [id], s => s.deleteQueuedPrompt(id)),
      updateQueuedPrompt: (id, prompt, options) => invoke('updateQueuedPrompt', options ? [id, prompt, options] : [id, prompt], s => options ? s.updateQueuedPrompt(id, prompt, options) : s.updateQueuedPrompt(id, prompt)),
      steerQueuedPrompt: (id, prompt, options) => invoke('steerQueuedPrompt', prompt === undefined ? [id] : options ? [id, prompt, options] : [id, prompt], s => prompt === undefined ? s.steerQueuedPrompt(id) : options ? s.steerQueuedPrompt(id, prompt, options) : s.steerQueuedPrompt(id, prompt)),
      loadTurnHistory: async id => {
        const surface = props.surface;
        const key = forwarded().conversationKey;
        if (surface?.loadTurnHistory && key) await surface.loadTurnHistory(id, String(key));
        else notify('loadTurnHistory', id);
      },
      loadOlderHistory: async () => {
        const surface = props.surface;
        const key = forwarded().conversationKey;
        if (surface && key) await surface.loadOlderConversationHistory(String(key));
        else notify('loadOlderHistory');
      },
      requestSkills: async () => {
        const s = props.surface;
        if (!s?.listSkills || s.state.skillCatalogStatus === 'loaded' || s.state.skillCatalogStatus === 'loading') return;
        const cwd = s.state.conversations.find(c => c.id === s.state.activeConversationId)?.cwd;
        await s.listSkills(cwd ? { cwd } : {});
      },
      selectApprovalPreset: preset => invoke('selectApprovalPreset', [preset], s => s.updateConversationSettings({ approvalPreset: preset })),
      updateSettings: async settings => {
        for (const [key, event] of Object.entries({ modelId: 'update:modelId', planMode: 'update:planMode', reasoningEffort: 'update:reasoningEffort', serviceTier: 'update:serviceTier' })) {
          if (key in settings) notify(event, settings[key as keyof typeof settings]);
        }
        if (props.surface) await props.surface.updateConversationSettings(settings);
      },
      updateAttachments: attachments => notify('attachmentsChange', attachments),
      updateComposerState: value => { notify('update:composerState', value); notify('update:modelValue', value.text); },
      onMessageCopied: index => notify('copyMessage', index),
      quoteMessage: index => notify('quoteMessage', index),
      menuSelect: item => notify('menuSelect', item),
      mentionSelect: (item, group) => notify('mentionSelect', item, group),
      openLink: link => notify('openLink', link),
      openVisualization: value => notify('openVisualization', value),
      editGoal: () => notify('editGoal'),
    };
    const nativeActions = computed(() => {
      const id = props.surface?.state.activeConversationId;
      return { ...actions, readPromptHistory: id ? async () => (await props.surface!.readConversationPromptHistory(id)).prompts : undefined };
    });

    watch(() => [props.surface?.state.status, props.surface?.state.error], ([status, error]) => {
      if (status === 'ready' && error == null) nativeError.value = null;
    });
    onMounted(() => {
      if (props.surface?.state.status === 'idle') void props.surface.connect().catch(error => {
        nativeError.value = error instanceof Error ? error.message : String(error);
      });
    });
    const controlled = () => {
      const controller = resolveCodexConversationPaneValue(props.controller);
      if (!controller) return props.surface ? { state, actions: nativeActions } : undefined;
      return {
        state: () => {
          const value = resolveCodexConversationPaneValue(controller.state);
          return { ...value, composer: { ...value.composer, placeholder: value.composer?.placeholder ?? 'Ask Codex…' }, capabilities: { ...codexCapabilities, ...value.capabilities } };
        },
        actions: controller.actions,
      };
    };
    return () => h(Pane as Component, {
      ...forwarded(), ref: pane,
      controller: controlled(),
      ...Object.fromEntries(events.map(event => ['on' + event[0]!.toUpperCase() + event.slice(1), (...args: unknown[]) => notify(event, ...args)])),
    }, slots);
  },
});
