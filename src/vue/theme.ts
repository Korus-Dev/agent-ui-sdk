export type ThemeMode = 'dark' | 'light' | 'system';

export type ThemeOptions = {
  mode?: ThemeMode;
  /** CSS custom properties. Both `--agent-ui-*` and semantic names are accepted. */
  tokens?: Readonly<Record<string, string | null | undefined>>;
};

/**
 * Applies the optional SDK theme contract to an application-owned element.
 * The SDK never owns or mutates the surrounding application shell.
 */
export function applyTheme(
  element: HTMLElement,
  options: ThemeOptions = {},
): () => void {
  const previousTheme = element.getAttribute('data-theme');
  const previousTokens = new Map<string, string>();
  const mode = options.mode ?? 'system';
  element.setAttribute('data-theme', mode);

  for (const [rawName, value] of Object.entries(options.tokens ?? {})) {
    const name = themeTokenName(rawName);
    if (!previousTokens.has(name)) {
      previousTokens.set(name, element.style.getPropertyValue(name));
    }
    if (value === null || value === undefined || !value.trim()) {
      element.style.removeProperty(name);
    } else {
      element.style.setProperty(name, value);
    }
  }

  return () => {
    if (previousTheme === null) element.removeAttribute('data-theme');
    else element.setAttribute('data-theme', previousTheme);
    for (const [name, value] of previousTokens) {
      if (value) element.style.setProperty(name, value);
      else element.style.removeProperty(name);
    }
  };
}

function themeTokenName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.startsWith('--agent-ui-')) return trimmed;
  const normalized = trimmed
    .replace(/^--/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z\d-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  if (!normalized) throw new TypeError('Agent UI theme token names cannot be empty');
  return `--agent-ui-${normalized}`;
}
