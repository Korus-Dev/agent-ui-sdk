import { ImagePreviewPool, imagePreviewPoolKey } from './chat/image-preview-pool';
import type {
  HostCapabilities,
  HostAttachment,
  HostAttachmentInput,
  NativeRendererApi,
} from '@korus-dev/agent-ui-sdk/host';
import {
  hasInjectionContext,
  inject,
  onScopeDispose,
  provide,
  type InjectionKey,
} from 'vue';

type NativeWindow = Window & {
  agentUiHostCapabilities?: NativeRendererApi;
};

const hostCapabilitiesKey: InjectionKey<HostCapabilities | undefined> = Symbol(
  'agent-ui-sdk-host-capabilities',
);

export type AttachmentPicker = () => Promise<HostAttachment[]>;
export type AttachmentIngester = (
  files: readonly HostAttachmentInput[],
) => Promise<HostAttachment[]>;

export function provideHostCapabilities(
  capabilities: HostCapabilities | undefined,
  options?: { imagePreviewBudgetBytes: number; viewportImageLoading?: boolean },
): HostCapabilities | undefined {
  provide(hostCapabilitiesKey, capabilities);
  if (options && options.imagePreviewBudgetBytes > 0) {
    const pool = new ImagePreviewPool(reference => /^(?:data:image\/|https?:|blob:|\/\/)/i.test(reference)
      ? Promise.resolve(reference) : capabilities?.readImagePreview?.(reference) ?? Promise.resolve(null), options.imagePreviewBudgetBytes, options.viewportImageLoading);
    provide(imagePreviewPoolKey, pool);
    onScopeDispose(() => pool.clear());
  }
  return capabilities;
}

export function useHostCapabilities(): HostCapabilities | undefined {
  const fallback = getGlobalHostCapabilities();
  return hasInjectionContext() ? inject(hostCapabilitiesKey, fallback) : fallback;
}

export function getGlobalHostCapabilities(): HostCapabilities | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as NativeWindow).agentUiHostCapabilities;
}

/** @deprecated Use `getGlobalHostCapabilities` or the scoped provider. */
export function getNativeRendererApi(): NativeRendererApi | undefined {
  return getGlobalHostCapabilities();
}

export async function pickAttachments(
  override?: AttachmentPicker,
  capabilities: HostCapabilities | undefined = getGlobalHostCapabilities(),
): Promise<HostAttachment[]> {
  const pick = override ?? capabilities?.pickAttachments;
  return pick ? pick() : [];
}

export async function ingestAttachments(
  files: readonly File[],
  override?: AttachmentIngester,
  capabilities: HostCapabilities | undefined = getGlobalHostCapabilities(),
): Promise<HostAttachment[]> {
  if (files.length === 0) return [];
  const ingest = override ?? capabilities?.ingestAttachments;
  if (!ingest) return [];

  const inputs = await Promise.all(files.map(async (file) => ({
    name: file.name,
    ...(file.type ? { mimeType: file.type } : {}),
    data: await file.arrayBuffer(),
  })));
  return ingest(inputs);
}
