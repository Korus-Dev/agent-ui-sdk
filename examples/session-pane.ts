import { shallowRef } from 'vue';
import type { HarnessDriver, Session, PromptOptions } from '@korus-dev/multi-agent-sdk/consumer-types';
import {
  createConversationPaneController,
  sessionStateToConversationPaneState,
  requestResponseFromClientResponse,
  requestResponseFromApproval,
  type ClientSendMessageOptions,
} from '../src/vue';

/**
 * Minimal controlled conversation. The host owns subscription lifetime and any
 * attachment-reference resolution, additional catalog controls and workflows.
 * No runtime harness import, provider dispatch or native session identity.
 */
export function sessionPaneExample(
  driver: Pick<HarnessDriver, 'readSession' | 'getCapabilities' | 'onEvent' | 'sendPrompt' | 'interrupt' | 'respondToRequest'>,
  session: Session,
  resolvePromptOptions: (options?: ClientSendMessageOptions) => PromptOptions | undefined,
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
      resolveApproval: async (id, decision, scope) => {
        await driver.respondToRequest(session, requestResponseFromApproval(id, decision, scope));
      },
      clientResponse: async response => {
        await driver.respondToRequest(session, requestResponseFromClientResponse(response));
      },
    },
  });
  return { controller, dispose: unsubscribe };
}
