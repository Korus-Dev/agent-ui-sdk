import type { BrowserTranslator } from '../../browser/ui-contracts';
const messages: Record<string, string> = {
    "outline": "Outline",
    "documentOutline": "Document outline",
    "headingLevel": "{title} (heading level {level})",
    "loadingMarkdown": "Loading markdown...",
    "noMarkdownContent": "No markdown content.",
    "unableToLoadMarkdown": "Unable to load markdown."
  };
export const markdownTranslation: BrowserTranslator = (key, parameters = {}) => {
 const text = key === 'visualize.kind.mermaid' ? 'Mermaid diagram' : messages[key.replace('surface.markdownPanel.', '')] ?? key;
 return text.replace(/\{([^}]+)\}/g, (match, name: string) => String(parameters[name] ?? match));
};
