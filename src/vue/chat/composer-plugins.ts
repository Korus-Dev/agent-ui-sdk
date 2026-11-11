import type { PluginSummary } from '@korus-dev/multi-agent-sdk';
import { filterComposerSearchItems } from './composer-search';

export function filterComposerPlugins(
  plugins: PluginSummary[],
  query: string,
  maxResults = -1,
): PluginSummary[] {
  return filterComposerSearchItems(plugins, query, [
    { values: (plugin) => [plugin.id] },
    { values: (plugin) => [plugin.name, plugin.displayName] },
    { values: (plugin) => [plugin.shortDescription, plugin.longDescription] },
  ], maxResults);
}

export function pluginDisplayName(plugin: PluginSummary): string {
  return plugin.displayName || plugin.name;
}

export function pluginDescription(plugin: PluginSummary): string {
  return plugin.shortDescription || plugin.longDescription || '';
}

export function pluginInsertText(plugin: PluginSummary): string {
  return plugin.name || plugin.id;
}

export function pluginMatchesMention(plugin: PluginSummary, mention: string): boolean {
  const normalized = mention.trim().toLowerCase();
  return [plugin.id, plugin.name, plugin.displayName]
    .some((candidate) => candidate?.trim().toLowerCase() === normalized);
}
