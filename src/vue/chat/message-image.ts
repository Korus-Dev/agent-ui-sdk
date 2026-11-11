import type { ChatMessage } from './types'

export type MessageImage = {
  alt: string
  kind: 'attachment' | 'media'
  mimeType?: string
  name?: string
  path?: string
  src: string
  title?: string
}

export type MessageImageOpenHandler = (
  image: MessageImage,
  context?: MessageImageContext,
) => boolean | void | Promise<boolean | void>

export type MessageImageOpenIntent = 'fullscreen' | 'open'

export type MessageImageContext = {
  intent: MessageImageOpenIntent
  index?: number
  message?: ChatMessage
}
