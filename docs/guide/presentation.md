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

### Interaction states

One shared style owns how controls look at rest, hover, pressed, selected or open, focused and disabled, in fills and in text color. Give a control the `agent-ui-interactive` class, in the SDK or in your own code (native or Element Plus buttons), and it behaves like the SDK's own controls:

```html
<button class="agent-ui-interactive">Neutral</button>
<button class="agent-ui-interactive" data-variant="primary">Primary tint</button>
<button class="agent-ui-interactive" data-variant="primary" data-appearance="solid">Primary solid</button>
<button class="agent-ui-interactive" data-variant="destructive" data-appearance="solid">Delete</button>
```

| Attribute | Values |
| --- | --- |
| `data-variant` | `neutral` (default), `primary`, `destructive` |
| `data-appearance` | `ghost` (default: tinted fills over a transparent rest), `text` (no fills: disclosure toggles, tabs and links change only through the foreground tokens, the focus ring, cursor and disabled state), `solid` (primary and destructive only: a filled button that keeps its own foreground in every state) |

The class reads `:hover`, `:active`, `:focus-visible`, `:disabled`, `[aria-disabled="true"]` and `[data-disabled]`. A keyboard-highlighted row sets `data-highlighted`. Selected or open is `aria-pressed`, `aria-selected` or `aria-expanded` set to `true`, an `aria-current` with any value but `false`, or `data-selected`; a checked menu item (`aria-checked`) shows its check mark instead. `data-focus="fill"` makes keyboard focus highlight the row like hover instead of drawing a ring, which menu rows use. `data-selection="none"` (or `agent-ui-interactive--selection-none`) shows no selected look at all, for disclosures: a heading that is open (`aria-expanded="true"`) keeps its rest fill and foreground, and still gets hover, pressed, focus and disabled states. `data-selection="ring"` (or `agent-ui-interactive--ring`) opts a control out of the selected fill: a selected swatch or identity tile keeps its own color and shows an outer ring in the focus ring color instead, sized by `--agent-ui-state-selection-ring-width` and `--agent-ui-state-selection-ring-offset`. Disabled controls are dimmed, show no hover fill and use the default cursor; the resting cursor (`pointer`) is owned by the class too.

A panel or toolbar with many buttons can mark its container `data-agent-ui-scope` (or give it the class `agent-ui-scope`, for generated markup that only accepts a class, such as an Element Plus dialog's `customClass`) instead: every `button`, `[role="button"]`, `[role="tab"]`, `[role="option"]` and menu item role (`menuitem`, `menuitemradio`, `menuitemcheckbox`) inside then behaves as an interactive control (switches, checkboxes, radios and tree items do not: their field geometry is distinct), and each can still carry its own `data-variant` and `data-appearance`.

A control declares no paint of its own, only geometry. A control that rests in other colors sets the rest tokens instead of `background` and `color`, because an unlayered declaration would beat the shared states:

```css
.my-button { --agent-ui-state-rest: var(--my-surface); --agent-ui-state-rest-foreground: var(--my-muted); }
```

The state tokens are separate from the elevation surfaces (`--color-surface-*`), so a host can restyle states without changing how cards and canvases look. Set them on any ancestor:

| Token | Controls |
| --- | --- |
| `--agent-ui-state-rest`, `--agent-ui-state-rest-foreground` | The resting fill (default transparent) and text color (default inherited) |
| `--agent-ui-state-hover`, `-pressed`, `-selected` | Neutral fills. `--agent-ui-hover-color` still supplies the hover when `--agent-ui-state-hover` is not set |
| `--agent-ui-state-hover-foreground`, `-selected-foreground` | Neutral text color in those states (default `--color-text`) |
| `--agent-ui-state-primary-hover`, `-pressed`, `-selected`, `-foreground` | The `primary` variant, ghost |
| `--agent-ui-state-destructive-hover`, `-pressed`, `-selected`, `-foreground` | The `destructive` variant, ghost |
| `--agent-ui-state-primary-solid`, `-solid-hover`, `-solid-pressed`, `-solid-foreground` | The solid `primary` appearance. Hover and pressed default to the fill moved 12% and 22% away from its foreground (toward white or black, whichever is opposite), so text contrast never drops; any fill, including custom success or warning colors, gets the same derivation. The same four exist with `destructive`, whose foreground falls back to `--color-on-error`, then `--color-on-primary` |
| `--agent-ui-state-focus-ring-color`, `-focus-ring-width`, `-focus-ring-offset` | The keyboard focus ring |
| `--agent-ui-state-disabled-opacity` | Disabled dimming (default `0.45`) |
| `--agent-ui-surface-low-color` | The `--color-surface-low` elevation, which previously followed `--agent-ui-hover-color` only |

Hosts that can only set class names (an Element Plus MessageBox, for instance) use the class aliases `agent-ui-interactive--primary`, `--destructive`, `--solid`, `--text`, `--ring` and `--selection-none`, which are the same axes in the same rules.

An adapter for a framework that has its own variables reads the resolved, read-only values the control exposes instead of recomputing them: `--agent-ui-interactive-rest`, `-hover`, `-pressed`, `-selected`, `-rest-foreground`, `-hover-foreground`, `-pressed-foreground` and `-selected-foreground`. Solid variants already resolve their rest foreground. For example `.el-button.agent-ui-interactive { --el-button-bg-color: var(--agent-ui-interactive-rest); --el-button-hover-bg-color: var(--agent-ui-interactive-hover); --el-button-text-color: var(--agent-ui-interactive-rest-foreground); }` needs no state rules of its own.

The rules sit in a low-priority `agent-ui-states` cascade layer, so your unlayered CSS for the same control wins whatever its specificity. The SDK's own controls all use it: icon buttons and `CopyButton`, the composer controls and the model picker with its tabs, every menu row, queued prompt and goal actions, follow-up chips, request and approval buttons, question options, the message editor, the work and tool group headers, the documents panels (diff, Markdown outline, annotation controls) and the in-app browser.

### Surfaces

The conversation pane has four painted surfaces. Each carries a stable `data-agent-ui-surface` attribute and paints from its own token, so a host can make one transparent, or give it any fill or gradient, by setting the token alone. No selector or specificity is needed.

| Surface (`data-agent-ui-surface`) | Token | Default |
| --- | --- | --- |
| `canvas`: the pane itself | `--agent-ui-canvas-background` | `--agent-ui-surface-color`, then the shell color |
| `content`: the conversation timeline, inside the canvas | `--agent-ui-content-background` | The shell color |
| `footer`: the area under the timeline that holds the composer, inside the canvas | `--agent-ui-footer-background` | A fade from transparent to the shell color |
| `composer`: the prompt card, inside the footer | `--agent-ui-composer-background` | `--color-surface-lowest` |

These backgrounds sit in a low-priority CSS cascade layer (`agent-ui-surfaces`), so ordinary unlayered host CSS for a surface, such as `[data-agent-ui-surface="canvas"] { background-image: … }`, wins whatever its specificity, even without setting the token. The goal, queue and diff drawer above the composer follow `--agent-ui-composer-background`. `WorkbenchLayout` marks its header and footer regions `header` and `footer` as well.

```css
/* A host that paints the backdrop itself */
.my-conversation {
  --agent-ui-canvas-background: transparent;
  --agent-ui-content-background: transparent;
  --agent-ui-footer-background: transparent;
}
```

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
