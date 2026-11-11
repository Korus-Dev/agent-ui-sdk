import type { PromptOptions, PromptReferenceAttachment, ReferenceSendPromptOptions } from '@korus-dev/multi-agent-sdk';

type Attachment = NonNullable<PromptOptions['attachments']>[number];
/** Call in the trusted host. The pane's opaque attachment references require a host resolver. */
export function toHarnessPromptOptions(
  options: ReferenceSendPromptOptions = {},
  resolveAttachment?: (attachment: PromptReferenceAttachment) => Attachment,
): PromptOptions {
  if (options.attachments?.length && !resolveAttachment) throw new Error('Attachments require a trusted host resolver.');
  const { attachments, providerOptions: _providerOptions, ...prompt } = options;
  return { ...prompt, ...(attachments === undefined ? {} : { attachments: attachments.map(attachment => resolveAttachment!(attachment)) }) };
}
