import type { ReferenceSendPromptOptions } from '@korus-dev/multi-agent-sdk';
import { shallowRef } from 'vue';
import type { Harness, Session, PromptOptions } from '@korus-dev/multi-agent-sdk';
import { createConversationPaneController, sessionStateToConversationPaneState } from '@korus-dev/agent-ui-sdk';

/**
 * Minimal controlled conversation. The host owns subscription lifetime and any
 * attachment-reference resolution, additional catalog controls and workflows.
 * No runtime harness import, provider dispatch or native session identity.
 */
export function sessionPaneExample(
  driver: Pick<Harness, 'readSession' | 'getCapabilities' | 'onEvent' | 'sendPrompt' | 'interrupt' | 'respondToRequest'>,
  session: Session,
  resolvePromptOptions: (options?: ReferenceSendPromptOptions) => PromptOptions | undefined,
) {
  const state = shallowRef(driver.readSession(session));
  const unsubscribe = driver.onEvent(event => {
    if (event.type === 'session.changed' && event.session === session) state.value = event.state;
  });
  const controller = createConversationPaneController({
    state: () => sessionStateToConversationPaneState(state.value, driver.getCapabilities(session)),
    actions: {
      submit: async (prompt, options) => { await driver.sendPrompt(session, prompt, resolvePromptOptions(options)); },
      interrupt: async () => { await driver.interrupt(session, state.value.activeTurnId ?? undefined); },
      respond: async response => { await driver.respondToRequest(session, response); },
    },
  });
  return { controller, dispose: unsubscribe };
}
