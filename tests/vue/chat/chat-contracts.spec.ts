// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

import {
  defaultChatTranslate,
  provideChatTranslate,
  useChatTranslate,
} from '../../../src/vue/chat/chat-i18n';
import {
  defaultConversationPresentation,
  resolveConversationPresentation,
} from '../../../src/vue/chat/contracts';
import { isImageGenerationToolCall, type MessageToolCall } from '../../../src/vue/chat/types';

const toolCall = (overrides: Partial<MessageToolCall>): MessageToolCall => ({
  args: {},
  function: 'other',
  id: 'tool-1',
  result: null,
  state: 'completed',
  ...overrides,
});

describe('chat public contracts', () => {
  it('publishes and resolves the complete default presentation', () => {
    expect(defaultConversationPresentation).toStrictEqual({
      composer: { actionMenu: true, contextUsage: true, voice: true },
      messages: {
        actions: { copy: true, delete: true, edit: true, fork: true, quote: true, retry: true },
        toolBlocks: true,
      },
      shelf: { goal: true, queuedPrompts: true, turnGitDiff: true },
    });
    expect(resolveConversationPresentation()).toStrictEqual(defaultConversationPresentation);
  });

  it('preserves every explicit false presentation override', () => {
    expect(resolveConversationPresentation({
      composer: { actionMenu: false, contextUsage: false, voice: false },
      messages: {
        actions: { copy: false, delete: false, edit: false, fork: false, quote: false, retry: false },
        toolBlocks: false,
      },
      shelf: { goal: false, queuedPrompts: false, turnGitDiff: false },
    })).toStrictEqual({
      composer: { actionMenu: false, contextUsage: false, voice: false },
      messages: {
        actions: { copy: false, delete: false, edit: false, fork: false, quote: false, retry: false },
        toolBlocks: false,
      },
      shelf: { goal: false, queuedPrompts: false, turnGitDiff: false },
    });
  });

  it('recognizes image generation by either public protocol identity', () => {
    expect(isImageGenerationToolCall(toolCall({ kind: 'imageGeneration' }))).toBe(true);
    expect(isImageGenerationToolCall(toolCall({ function: 'image_generation' }))).toBe(true);
    expect(isImageGenerationToolCall(toolCall({ kind: 'dynamicTool', function: 'image-generation' }))).toBe(false);
  });

});

describe('chat translation', () => {
  it.each([
    ['chat.actions.cancel', 'Cancel'],
    ['chat.actions.editPrompt', 'Edit prompt'],
    ['chat.actions.label', 'Message actions'],
    ['chat.actions.resubmit', 'Resubmit'],
  ])('translates %s exactly', (key, expected) => {
    expect(defaultChatTranslate(key)).toBe(expected);
  });

  it('substitutes present and missing parameters and delegates tool keys', () => {
    expect(defaultChatTranslate('chat.contextUsage.usedAndLeft', { used: 40 })).toBe(
      '40% used (% left)',
    );
    expect(defaultChatTranslate('chat.tool.command.read.running', { target: 'README.md' })).toBe(
      'Reading README.md',
    );
  });

  it('uses the nearest tree-scoped translation provider', () => {
    const Consumer = defineComponent({
      setup() {
        const translate = useChatTranslate();
        return () => h('span', translate('host.label', { count: 2 }));
      },
    });
    const Provider = defineComponent({
      setup() {
        provideChatTranslate((key, params) => `${key}:${String(params?.count)}`);
        return () => h(Consumer);
      },
    });

    expect(mount(Provider).text()).toBe('host.label:2');
  });
});
