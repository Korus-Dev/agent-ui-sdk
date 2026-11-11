import { randomUUID } from 'node:crypto';
import type { HostAttachment } from '@korus-dev/agent-ui-sdk/host';
import type { PromptOptions } from '@korus-dev/multi-agent-sdk';
import type { ClientAttachment } from '@korus-dev/multi-agent-sdk';

export type ElectronAttachmentRegistration = {
  type: HostAttachment['type'];
  path: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
};

type RegisteredAttachment = Omit<ElectronAttachmentRegistration, 'size'>;

/** Keeps trusted local paths out of the renderer and scopes references to one Electron integration. */
export class ElectronAttachmentRegistry {
  readonly #attachments = new Map<string, RegisteredAttachment>();

  register(input: ElectronAttachmentRegistration): HostAttachment {
    const reference = `electron-attachment:${randomUUID()}`;
    this.#attachments.set(reference, {
      type: input.type,
      path: input.path,
      name: input.name,
      mimeType: input.mimeType,
      ...(input.previewUrl === undefined ? {} : { previewUrl: input.previewUrl }),
    });
    return {
      id: reference,
      reference,
      type: input.type,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      ...(input.previewUrl === undefined ? {} : { previewUrl: input.previewUrl }),
    };
  }

  resolve(attachment: ClientAttachment): NonNullable<PromptOptions['attachments']>[number] {
    const registered = this.#registered(attachment.reference);
    if (registered.type !== attachment.type) {
      throw new TypeError('Attachment reference type does not match');
    }
    return {
      type: registered.type,
      path: registered.path,
      name: registered.name,
      mimeType: registered.mimeType,
      ...(registered.type === 'image' && registered.previewUrl
        ? { previewUrl: registered.previewUrl }
        : {}),
    };
  }

  path(reference: string): string {
    return this.#registered(reference).path;
  }

  clear(): void {
    this.#attachments.clear();
  }

  #registered(reference: string): RegisteredAttachment {
    const attachment = this.#attachments.get(reference);
    if (!attachment) throw new TypeError('Attachment reference is invalid or expired');
    return attachment;
  }
}
