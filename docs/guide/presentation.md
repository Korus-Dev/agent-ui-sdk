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

Semantic CSS tokens include `--agent-ui-font-family`, `--agent-ui-mono-font-family`, `--agent-ui-primary-color`, `--agent-ui-background-color`, `--agent-ui-surface-color`, `--agent-ui-text-color`, `--agent-ui-muted-text-color`, `--agent-ui-border-color`, `--agent-ui-message-font-size`, `--agent-ui-message-line-height`, `--agent-ui-composer-font-size` and `--agent-ui-menu-font-size`. Apply these tokens to an application-owned `.agent-ui-theme` element or pass them through `applyTheme`.

Call scoped providers during Vue setup. Descendants use the nearest provider:

| Provider | Purpose |
| --- | --- |
| `provideChatTranslate` | Translation with SDK English defaults |
| `provideToolCallDetails` | Raw tool disclosure policy, disabled by default |
| `provideToolPresentation` | App-owned tool icons and titles |
| `provideHostCapabilities` | Clipboard, attachments and speech ports |

A tool presentation resolver receives the tool call, status descriptor, kind and metadata. Return `undefined` to retain defaults, `{ icon: null }` to suppress the icon, or a title/icon override. Prefer this scoped provider over the compatibility global title presenter.

Use app-owned components for sidebars, account menus and dashboards. SDK slots and semantic tokens let them share a visual language without relying on private DOM selectors.
