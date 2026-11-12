# Presentation and theming

Capabilities describe supported operations. Presentation controls hide optional UI. Theming changes how everything looks. None of them substitutes for authorization in the trusted host.

## Presentation flags

Pass `presentation` to `ConversationPane`, `Composer`, `MessageList` or `Message`. Omitted values preserve the full SDK experience.

```ts
const presentation = {
  composer: { actionMenu: false, contextUsage: false, voice: false },
  messages: { actions: { copy: false, quote: false }, toolBlocks: false },
  shelf: { goal: false, queuedPrompts: false, turnGitDiff: false },
};
```

| Flag | Hides |
| --- | --- |
| `composer.actionMenu` | The plus menu (attach, permissions, modes, host items) |
| `composer.contextUsage` | The context window indicator |
| `composer.voice` | The microphone |
| `messages.actions.copy`, `delete`, `edit`, `fork`, `quote`, `retry` | The matching message action |
| `messages.toolBlocks` | Tool calls and groups in the transcript |
| `shelf.goal`, `queuedPrompts`, `turnGitDiff` | The matching shelf row |

Presentation never changes capabilities or the operations available through the controller. `resolveConversationPresentation(presentation)` returns the fully resolved object, and `defaultConversationPresentation` is the all-on baseline.

A focused chat typically combines a few flags with a theme and host instructions. See the [Spark sample](/guide/samples#spark-focused-chat).

## Themes

Apply a theme to an application-owned ancestor and restore it during cleanup:

```ts
import { applyTheme } from '@korus-dev/agent-ui-sdk';

const restore = applyTheme(element, {
  mode: 'system',
  tokens: { primaryColor: '#3659d9', messageFontSize: '16px' },
});
// Later: restore();
```

`mode` is `'light'`, `'dark'` or `'system'` (the default). It sets `data-theme` on the element; `system` follows `prefers-color-scheme`. `restore()` puts back the previous attribute and token values. The SDK never owns or mutates the surrounding application shell.

Token names may be semantic (`primaryColor`), prefixed (`--agent-ui-primary-color`) or camel case; all normalize to `--agent-ui-*`. A `null`, `undefined` or empty value removes the token.

You can also set tokens in CSS on any `.agent-ui-theme` element or ancestor:

```css
.my-chat {
  --agent-ui-primary-color: #3659d9;
  --agent-ui-message-font-size: 16px;
}
```

### Theme tokens

| Token | Controls |
| --- | --- |
| `--agent-ui-font-family`, `--agent-ui-mono-font-family` | Text and code fonts |
| `--agent-ui-primary-color`, `--agent-ui-on-primary-color` | Accent and text on it |
| `--agent-ui-primary-container-color`, `--agent-ui-on-primary-container-color` | Accent containers |
| `--agent-ui-secondary-color`, `--agent-ui-secondary-container-color`, `--agent-ui-on-secondary-container-color` | Secondary accent |
| `--agent-ui-background-color`, `--agent-ui-app-surface-color` | Page and app backgrounds |
| `--agent-ui-surface-color`, `--agent-ui-surface-raised-color`, `--agent-ui-surface-high-color`, `--agent-ui-surface-highest-color` | Cards, composer and menus |
| `--agent-ui-shell-main-color`, `--agent-ui-shell-sidebar-color` | Shell regions for hosts that share tokens |
| `--agent-ui-text-color`, `--agent-ui-muted-text-color` | Body and secondary text |
| `--agent-ui-border-color`, `--agent-ui-strong-border-color` | Dividers and emphasized borders |
| `--agent-ui-hover-color`, `--agent-ui-overlay-color`, `--agent-ui-shine-color` | Interaction and overlay effects |
| `--agent-ui-success-color`, `--agent-ui-warning-color`, `--agent-ui-danger-color` | Status colors |
| `--agent-ui-message-font-size`, `--agent-ui-message-line-height` | Transcript text |
| `--agent-ui-composer-font-size`, `--agent-ui-composer-line-height` | Prompt text |
| `--agent-ui-menu-font-size`, `--agent-ui-menu-line-height`, `--agent-ui-menu-description-font-size`, `--agent-ui-menu-control-min-height` | Menus |
| `--agent-ui-composer-button-size`, `--agent-ui-composer-control-size`, `--agent-ui-composer-compact-control-size`, `--agent-ui-message-action-control-size` | Control sizes |

Light defaults start from a primary of `#1b4fb2`, a `#f9f9f9` background and white surfaces; dark defaults from `#7da6ff`, `#0d0f12` and `#15181d`. Components also expose narrower variables, such as `--agent-ui-scroll-to-bottom-size`, where a control needs its own override.

::: tip
Rely on tokens and slots instead of private DOM selectors. Class names inside the SDK are implementation details.
:::

## Slots versus tokens versus flags

| You want to… | Use |
| --- | --- |
| Remove an optional control | A [presentation flag](#presentation-flags) |
| Change colors, fonts or sizes | [Tokens](#theme-tokens) |
| Add content beside SDK content | An additive [slot](/guide/conversation-pane#slots) |
| Change wording | [`provideChatTranslate`](/guide/vue-providers#translation) |
| Change tool icons and titles | [`provideToolPresentation`](/guide/vue-providers#tool-presentation) |
| Replace a region | A replacement slot or [your own layout](/guide/assembling) |

Use application-owned components for sidebars, account menus and dashboards. Slots and semantic tokens let them share a visual language with the SDK.
