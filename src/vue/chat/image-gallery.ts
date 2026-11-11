import type { ComputedRef, InjectionKey } from 'vue'
import { computeMessageBlocks } from './message-blocks'
import type { ChatMessage } from './types'

export type GalleryImage = { messageId?: string; reference: string; alt: string; label: string }
export const imageGalleryKey: InjectionKey<ComputedRef<GalleryImage[]>> = Symbol('image-gallery')
export const imageGalleryMessageKey: InjectionKey<ComputedRef<ChatMessage>> = Symbol('image-gallery-message')

export function conversationImages(messages: readonly ChatMessage[]): GalleryImage[] {
  return messages.filter(message => message.role === 'assistant').flatMap(message => computeMessageBlocks(message).flatMap((block): GalleryImage[] => {
    if (block.type === 'media') return [{ messageId: message.id, reference: block.media.url,
      alt: block.media.alt || 'Generated media', label: block.media.title || 'Generated media' }]
    if (block.type === 'attachment' && block.attachment.kind === 'image') {
      const reference = block.attachment.url || block.attachment.path
      if (reference) return [{ messageId: message.id, reference, alt: block.attachment.name, label: block.attachment.name }]
    }
    return []
  }))
}
