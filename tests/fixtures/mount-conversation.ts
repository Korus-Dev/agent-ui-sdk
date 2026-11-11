import { mount, type ComponentMountingOptions, type VueWrapper } from '@vue/test-utils';
import { ConversationPane, resolveConversationPaneValue, type ConversationPaneController } from '../../src/vue';
import { exampleCapabilities, exampleCommands } from './pane-catalogs';

type PaneProps = Parameters<typeof ConversationPane>[0];
type Options = Omit<ComponentMountingOptions<typeof ConversationPane>, 'props'> & {
  props?: Partial<PaneProps>;
};

/** Explicit provider fixtures keep the generic pane's production defaults neutral. */
export function mountConversation(options: Options = {}): VueWrapper {
  const defaults = { capabilities: exampleCapabilities, commands: exampleCommands, placeholder: 'Ask Codex…', emptyTitle: 'Start a conversation with Codex' };
  const original = options.props ?? {};
  const controller = original.controller;
  const binding: ConversationPaneController | undefined = controller ? {
    state: () => {
      const value = resolveConversationPaneValue(resolveConversationPaneValue(controller).state);
      return { ...value, capabilities: { ...exampleCapabilities, ...value.capabilities }, composer: { placeholder: 'Ask Codex…', ...value.composer } };
    },
    actions: () => resolveConversationPaneValue(resolveConversationPaneValue(controller).actions),
  } : undefined;
  return mount(ConversationPane, { ...options, props: { ...defaults, ...original, ...(binding ? { controller: binding } : {}) } } as never) as VueWrapper;
}
