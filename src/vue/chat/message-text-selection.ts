import type { ChatMessage } from './types';

export type MessageTextSelectionAnchor = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type MessageTextSelection = {
  anchor: MessageTextSelectionAnchor;
  messageId?: string;
  messageIndex: number;
  role: ChatMessage['role'];
  text: string;
  turnId?: string;
};
