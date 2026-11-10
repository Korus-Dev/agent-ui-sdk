import { inject, provide, type InjectionKey } from 'vue';
import type { BrowserTranslator } from '../../browser/ui-contracts';
import { documentDefaults } from './document-defaults';
import { markdownTranslation } from './messages';
const key: InjectionKey<BrowserTranslator> = Symbol('document-translator');
const defaults: Record<string, string> = {
  ...Object.fromEntries(Object.entries(documentDefaults).flatMap(([group, messages]) => Object.entries(messages).map(([name, value]) => [`surface.${group}.${name}`, value]))),
  'chat.codeAnnotations.annotate': 'Annotate', 'chat.codeAnnotations.annotateLine': 'Annotate this line',
  'chat.codeAnnotations.commentLabel': 'Code annotation comment', 'chat.codeAnnotations.commentPlaceholder': 'What should change?', 'chat.codeAnnotations.save': 'Add annotation',
  'dynamic.misc.sendAnnotation': 'Send annotation',
};
export const documentTranslation: BrowserTranslator = (key, parameters = {}) => {
  const template = defaults[key] ?? markdownTranslation(key, parameters);
  const text = template.includes(' | ') ? template.split(' | ')[parameters.count === 1 ? 0 : 1]! : template;
  return text.replace(/\{([^}]+)\}/g, (match, name: string) => String(parameters[name] ?? match));
};
export const useDocumentTranslation = () => inject(key, documentTranslation);
export function provideDocumentTranslation(translate?: BrowserTranslator) { const current = translate ?? useDocumentTranslation(); provide(key, current); return current; }
