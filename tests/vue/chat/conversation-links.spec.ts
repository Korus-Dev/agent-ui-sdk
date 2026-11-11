import { describe, expect, it } from 'vitest';

import {
  conversationLinkFromHref,
  parseEditorFileReference,
} from '../../../src/vue/chat/conversation-links';

describe('conversation links', () => {
  it('parses trimmed editor references with an optional multi-digit column', () => {
    expect(parseEditorFileReference('  src/chat/message.ts:12:34  ')).toStrictEqual({
      path: 'src/chat/message.ts',
      line: 12,
      column: 34,
    });
    expect(parseEditorFileReference('src/chat/message.ts:12')).toStrictEqual({
      path: 'src/chat/message.ts',
      line: 12,
    });
  });

  it.each([
    'bad:src/chat/message.ts:12',
    'garbage\nsrc/chat/message.ts:12',
    'src/chat/message.ts:12 suffix',
    'src/chat/message.ts:0',
    'src/chat/message.ts:9007199254740992',
    'src/chat/message.ts:12:0',
    'src/chat/message.ts:12:9007199254740992',
  ])('rejects invalid editor reference %s', (value) => {
    expect(parseEditorFileReference(value)).toBeNull();
  });

  it.each([
    'http://example.com/docs',
    'https://example.com/docs',
    'mailto:hello@example.com',
    'tel:+15551234567',
  ])('classifies supported absolute link %s as external', (href) => {
    expect(conversationLinkFromHref(href)).toStrictEqual({ href, kind: 'external' });
  });

  it('normalizes authored whitespace while preserving malformed path escapes', () => {
    expect(conversationLinkFromHref('  http://example.com/docs  ')).toStrictEqual({
      href: 'http://example.com/docs',
      kind: 'external',
    });
    expect(conversationLinkFromHref('docs/design.md   ?raw=1#overview')).toStrictEqual({
      href: 'docs/design.md   ?raw=1#overview',
      kind: 'file',
      path: 'docs/design.md',
    });
    expect(conversationLinkFromHref('docs/bad%escape.md')).toStrictEqual({
      href: 'docs/bad%escape.md',
      kind: 'file',
      path: 'docs/bad%escape.md',
    });
  });
});
