import { normalizePromptContent, promptContentText } from '@korus-dev/multi-agent-sdk/prompt';
import type { PromptPart } from '@korus-dev/multi-agent-sdk';

export type ComposerState = {
  text: string;
  content?: readonly PromptPart[];
  selectionStart: number;
  selectionEnd: number;
  activeCommandId?: string | null;
};

export function normalizeComposerState(state: ComposerState): ComposerState {
  const length = state.text.length;
  const selectionStart = Math.max(0, Math.min(state.selectionStart, length));
  const selectionEnd = Math.max(selectionStart, Math.min(state.selectionEnd, length));
  return {
    text: state.text,
    ...(state.content && promptContentText(state.content) === state.text
      ? { content: normalizePromptContent(state.content) } : {}),
    selectionStart,
    selectionEnd,
    ...(state.activeCommandId ? { activeCommandId: state.activeCommandId } : {}),
  };
}
