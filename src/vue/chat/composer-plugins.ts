import type { Plugin } from '@korus-dev/multi-agent-sdk';
import { filterComposerSearchItems } from './composer-search';

export function filterComposerPlugins(
  plugins: Plugin[],
  query: string,
  maxResults = -1,
): Plugin[] {
  return filterComposerSearchItems(plugins, query, [
    { values: (plugin) => [plugin.id] },
    { values: (plugin) => [plugin.name, plugin.displayName] },
    { values: (plugin) => [plugin.shortDescription, plugin.longDescription] },
  ], maxResults);
}

export function pluginDisplayName(plugin: Plugin): string {
  return plugin.displayName || plugin.name;
}

export function pluginDescription(plugin: Plugin): string {
  return plugin.shortDescription || plugin.longDescription || '';
}

export function pluginInsertText(plugin: Plugin): string {
  return plugin.name || plugin.id;
}

export function pluginMatchesMention(plugin: Plugin, mention: string): boolean {
  const normalized = mention.trim().toLowerCase();
  return [plugin.id, plugin.name, plugin.displayName]
    .some((candidate) => candidate.trim().toLowerCase() === normalized);
}
