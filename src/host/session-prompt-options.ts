import type { PromptOptions } from '@korus-dev/multi-agent-sdk';
import type { ClientAttachment, ClientSendMessageOptions } from '@korus-dev/multi-agent-sdk';

type Attachment = NonNullable<PromptOptions['attachments']>[number];
/** Call in the trusted host. Opaque renderer references require a host resolver. */
export function toHarnessPromptOptions(
  options: ClientSendMessageOptions = {},
  resolveAttachment?: (attachment: ClientAttachment) => Attachment,
): PromptOptions {
  if (options.outputSchema !== undefined) throw new Error('Structured output is unavailable for neutral prompts.');
  if (options.attachments?.length && !resolveAttachment) throw new Error('Attachments require a trusted host resolver.');
  return {
    ...(options.content === undefined ? {} : { content: options.content }),
    ...(options.inputMethod === undefined ? {} : { inputMethod: options.inputMethod }),
    ...(options.planMode === undefined ? {} : { planMode: options.planMode }),
    ...(options.skills === undefined ? {} : { skills: [...options.skills] }),
    ...(options.attachments === undefined ? {} : { attachments: options.attachments.map(attachment => resolveAttachment!(attachment)) }),
    ...((options.model === undefined && options.reasoningEffort === undefined && options.serviceTier === undefined) ? {} : {
      selection: { ...(options.model === undefined ? {} : { model: options.model }),
        ...(options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort }),
        ...(options.serviceTier === undefined ? {} : { serviceTier: options.serviceTier }) },
    }),
  };
}
