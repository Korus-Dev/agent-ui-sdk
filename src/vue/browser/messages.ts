import { inject, provide, type InjectionKey } from 'vue';
import type { BrowserTranslator } from '../../browser/ui-contracts';
import { browserMessages } from './default-messages';
const translatorKey: InjectionKey<BrowserTranslator> = Symbol('browser-translator');
const defaults: Record<string, string> = {
  ...Object.fromEntries(Object.entries(browserMessages).flatMap(([group, messages]) => Object.entries(messages).map(([key, value]) => [`surface.${group}.${key}`, value]))),
  'surface.browserExtensions.extensions': 'Extensions', 'common.cancel': 'Cancel',
};
export const defaultBrowserTranslation: BrowserTranslator = (key, parameters = {}) => {
  const text = key === 'dynamic.annotation.send' ? `Send ${parameters.count ?? 0} annotations` : defaults[key] ?? key;
  return text.replace(/\{([^}]+)\}/g, (match, name: string) => String(parameters[name] ?? match));
};
export const useBrowserTranslation = () => inject(translatorKey, defaultBrowserTranslation);
export function provideBrowserTranslation(translate: BrowserTranslator = defaultBrowserTranslation) { provide(translatorKey, translate); return translate; }
