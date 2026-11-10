import { normalizePromptContent, promptContentText } from '@korus-dev/multi-agent-sdk/prompt.js';
import type { PromptPart as CodexPromptPart } from '@korus-dev/multi-agent-sdk';

export type CodexComposerState = {
  text: string;
  content?: readonly CodexPromptPart[];
  selectionStart: number;
  selectionEnd: number;
  activeCommandId?: string | null;
};

export function normalizeCodexComposerState(state: CodexComposerState): CodexComposerState {
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
