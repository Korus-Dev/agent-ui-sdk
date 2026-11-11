// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import type { NativeAttachment, NativeRendererApi } from '../../src/host/contracts';
import {
  getNativeRendererApi,
  ingestAttachments,
  pickAttachments,
  provideHostCapabilities,
  useHostCapabilities,
} from '../../src/vue/native-capabilities';

describe('native renderer capabilities', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'agentUiHostCapabilities');
  });

  it('discovers the native renderer bridge when present', () => {
    expect(getNativeRendererApi()).toBeUndefined();
    const bridge = { pickAttachments: vi.fn() } as unknown as NativeRendererApi;
    Object.defineProperty(window, 'agentUiHostCapabilities', { configurable: true, value: bridge });
    expect(getNativeRendererApi()).toBe(bridge);
  });

  it('scopes host capabilities to the current Vue tree', () => {
    const globalBridge = { capabilities: { attachments: false } } as unknown as NativeRendererApi;
    const scopedBridge = { capabilities: { attachments: true } } as unknown as NativeRendererApi;
    Object.defineProperty(window, 'agentUiHostCapabilities', { configurable: true, value: globalBridge });
    let resolved: NativeRendererApi | undefined;
    const Child = defineComponent({
      setup() {
        resolved = useHostCapabilities();
        return () => h('span');
      },
    });
    const Parent = defineComponent({
      setup() {
        provideHostCapabilities(scopedBridge);
        return () => h(Child);
      },
    });

    mount(Parent);

    expect(resolved).toBe(scopedBridge);
  });

  it('picks attachments through an override, native bridge, or empty fallback', async () => {
    const picked = [nativeAttachment('one.txt')];
    const override = vi.fn(async () => picked);
    await expect(pickAttachments(override)).resolves.toBe(picked);

    const nativePick = vi.fn(async () => picked);
    Object.defineProperty(window, 'agentUiHostCapabilities', {
      configurable: true,
      value: { pickAttachments: nativePick } as unknown as NativeRendererApi,
    });
    await expect(pickAttachments()).resolves.toBe(picked);
    Reflect.deleteProperty(window, 'agentUiHostCapabilities');
    await expect(pickAttachments()).resolves.toStrictEqual([]);
  });

  it('short-circuits empty ingestion and missing native support', async () => {
    const override = vi.fn();
    await expect(ingestAttachments([], override)).resolves.toStrictEqual([]);
    expect(override).not.toHaveBeenCalled();
    await expect(ingestAttachments([file('one.txt', '', new Uint8Array([1]))])).resolves.toStrictEqual([]);
  });

  it('serializes browser files for override ingestion', async () => {
    const ingested = [nativeAttachment('one.txt')];
    const override = vi.fn(async () => ingested);
    const bytes = new Uint8Array([1, 2, 3]);
    await expect(ingestAttachments([
      file('one.txt', 'text/plain', bytes),
      file('unknown.bin', '', new Uint8Array([4])),
    ], override)).resolves.toBe(ingested);
    expect(override).toHaveBeenCalledWith([
      { name: 'one.txt', mimeType: 'text/plain', data: bytes.buffer },
      { name: 'unknown.bin', data: new Uint8Array([4]).buffer },
    ]);
  });

  it('uses the native ingestion bridge by default', async () => {
    const ingest = vi.fn(async () => []);
    Object.defineProperty(window, 'agentUiHostCapabilities', {
      configurable: true,
      value: { ingestAttachments: ingest } as unknown as NativeRendererApi,
    });
    await ingestAttachments([file('one.txt', 'text/plain', new Uint8Array([1]))]);
    expect(ingest).toHaveBeenCalledOnce();
  });
});

function file(name: string, type: string, data: Uint8Array): File {
  const buffer = Uint8Array.from(data).buffer;
  const value = new File([buffer], name, { type });
  Object.defineProperty(value, 'arrayBuffer', {
    configurable: true,
    value: async () => buffer,
  });
  return value;
}

function nativeAttachment(name: string): NativeAttachment {
  return {
    id: `attachment-${name}`,
    type: 'file',
    reference: `attachment:${name}`,
    name,
    mimeType: 'text/plain',
    size: 3,
  };
}
