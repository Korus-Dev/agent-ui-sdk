import { filterComposerSearchItems } from './composer-search';

export type ComposerMentionItem<Payload = unknown> = {
  id: string;
  /** Stable text stored after the `@` prefix. */
  value: string;
  /** Friendly text rendered by the default mention UI. */
  label: string;
  description?: string;
  payload?: Payload;
};

export type ComposerMentionGroup<Payload = unknown> = {
  id: string;
  label: string;
  /** Custom groups render before built-in plugins/files unless explicitly placed after them. */
  placement?: 'before' | 'after';
  items: readonly ComposerMentionItem<Payload>[];
};

export type ComposerVisibleMentionGroup<Payload = unknown> = Omit<
  ComposerMentionGroup<Payload>,
  'items'
> & {
  items: readonly ComposerMentionItem<Payload>[];
};

export function filterComposerMentionGroups<Payload>(
  groups: readonly ComposerMentionGroup<Payload>[],
  query: string,
): ComposerVisibleMentionGroup<Payload>[] {
  return groups.flatMap((group) => {
    const items = filterComposerSearchItems([...group.items], query, [
      { values: (item) => [item.id, item.value, item.label] },
      { values: (item) => [item.description] },
    ]);
    return items.length > 0 ? [{ ...group, items }] : [];
  });
}

export function findComposerMention<Payload>(
  groups: readonly ComposerMentionGroup<Payload>[],
  value: string,
): { group: ComposerMentionGroup<Payload>; item: ComposerMentionItem<Payload> } | undefined {
  const normalized = value.trim().toLowerCase();
  for (const group of groups) {
    const item = group.items.find((candidate) => candidate.value.trim().toLowerCase() === normalized);
    if (item) return { group, item };
  }
  return undefined;
}
