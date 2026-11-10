# Presentation and providers

Capabilities describe supported operations; presentation controls hide optional UI. Neither substitutes for authorization in the trusted host.

```ts
const presentation = {
  composer: { actionMenu: false, contextUsage: false, voice: false },
  messages: { actions: { copy: false, quote: false }, toolBlocks: false },
  shelf: { goal: false, queuedPrompts: false, turnGitDiff: false },
};
```

Apply a theme to an application-owned ancestor and restore it during cleanup:

```ts
import { applyTheme } from '@korus-dev/agent-ui-sdk';
const restore = applyTheme(element, {
  mode: 'system',
  tokens: { primaryColor: '#3659d9', messageFontSize: '16px' },
});
// Later: restore();
```

Semantic CSS tokens include `--codex-font-family`, `--codex-mono-font-family`, `--codex-primary-color`, `--codex-background-color`, `--codex-surface-color`, `--codex-text-color`, `--codex-muted-text-color`, `--codex-border-color`, `--codex-message-font-size`, `--codex-message-line-height`, `--codex-composer-font-size` and `--codex-menu-font-size`. Existing token names remain stable across neutral component aliases.

Call scoped providers during Vue setup. Descendants use the nearest provider:

| Provider | Purpose |
| --- | --- |
| `provideChatTranslate` | Translation with SDK English defaults |
| `provideToolCallDetails` | Raw tool disclosure policy, disabled by default |
| `provideToolPresentation` | App-owned tool icons and titles |
| `provideHostCapabilities` | Clipboard, attachments and speech ports |

A tool presentation resolver receives the tool call, status descriptor, kind and metadata. Return `undefined` to retain defaults, `{ icon: null }` to suppress the icon, or a title/icon override. Prefer this scoped provider over the compatibility global title presenter.

Use app-owned components for sidebars, account menus and dashboards. SDK slots and semantic tokens let them share a visual language without relying on private DOM selectors.
