// @vitest-environment jsdom

import { nextTick, shallowRef } from 'vue';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  createConversationPaneController,
  resolveConversationPaneValue,
  type ConversationPaneActions,
  type ConversationPaneState,
  type ClientSendMessageOptions,
} from '../../src/vue';
import type { ConversationMessage } from '@korus-dev/multi-agent-sdk';

function message(id: string): ConversationMessage {
  return {
    id,
    role: 'assistant',
    status: 'complete',
    parts: [{ type: 'text', text: id }],
  };
}

function state(messages: readonly ConversationMessage[]): ConversationPaneState {
  return {
    identity: { conversationKey: 'thread-1', messages },
    composer: { state: { text: '', selectionStart: 0, selectionEnd: 0 } },
  };
}

describe('createConversationPaneController', () => {
  it('types controlled submissions with opaque renderer attachments', () => {
    type SubmitOptions = Parameters<NonNullable<ConversationPaneActions['submit']>>[1];
    type SteerOptions = Parameters<NonNullable<ConversationPaneActions['steer']>>[1];

    expectTypeOf<SubmitOptions>().toEqualTypeOf<ClientSendMessageOptions | undefined>();
    expectTypeOf<SteerOptions>().toEqualTypeOf<ClientSendMessageOptions | undefined>();
  });

  it('accepts ref-like sources from another Vue package resolution', () => {
    const messages = [message('message-1')];
    const externalState: { readonly value: ConversationPaneState } = {
      get value() { return state(messages); },
    };
    const controller = createConversationPaneController({
      state: externalState,
      actions: { submit: () => undefined },
    });

    expect(controller.state).toBe(externalState);
    expect(resolveConversationPaneValue(controller.state).identity.messages).toBe(messages);
  });

  it('resolves function sources and preserves nullable direct values', () => {
    const currentState = state([message('message-function')]);
    const source = vi.fn(() => currentState);

    expect(resolveConversationPaneValue(source)).toBe(currentState);
    expect(source).toHaveBeenCalledOnce();
    expect(resolveConversationPaneValue<null>(null)).toBeNull();
  });

  it('resolves reactive state and actions without cloning message identities', async () => {
    const messages = [message('message-1')];
    const current = shallowRef(state(messages));
    const submit = vi.fn();
    const actionMap: ConversationPaneActions = { submit };
    const controller = createConversationPaneController({
      state: current,
      actions: actionMap,
    });

    expect(resolveConversationPaneValue(controller.state).identity.messages).toBe(messages);
    expect(resolveConversationPaneValue(controller.actions).submit).toBe(submit);

    const nextMessages = [message('message-2')];
    current.value = state(nextMessages);
    await nextTick();

    expect(resolveConversationPaneValue(controller.state).identity.messages).toBe(nextMessages);
    expect(resolveConversationPaneValue(controller.state).identity.messages).not.toBe(messages);
  });
});
