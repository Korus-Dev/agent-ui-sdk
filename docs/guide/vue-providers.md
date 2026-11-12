# Vue providers

Scoped providers configure behavior for a subtree without changing component props. Call them during Vue `setup`; descendants use the nearest provider.

| Provider | Reader | Purpose |
| --- | --- | --- |
| `provideChatTranslate` | `useChatTranslate` | Translation, with SDK English defaults |
| `provideToolCallDetails` | `useToolCallDetails` | Raw tool disclosure policy, disabled by default |
| `provideToolPresentation` | `useToolPresentation` | App-owned tool icons and titles |
| `provideHostCapabilities` | `useHostCapabilities` | Clipboard, attachments, speech and image ports |
| `customBlocksKey` | `useCustomBlocks` | Components for assistant code fences |

```vue
<script setup lang="ts">
import { provideChatTranslate, provideToolCallDetails, provideToolPresentation } from '@korus-dev/agent-ui-sdk';

provideToolCallDetails(true);
provideChatTranslate((key, params) => i18n.t(key, params));
provideToolPresentation(({ toolCall }) =>
  toolCall.function === 'search' ? { title: 'Searching the knowledge base' } : undefined);
</script>
```

## Translation

Every string the SDK renders goes through one translate function. The default returns English from a built-in table of `chat.*` keys (for example `chat.actions.copy`, `chat.work.doneViewDetailsFor`, `chat.contextUsage.usedAndLeft`) with `{name}` placeholders.

Provide your own to localize, falling back to the default for keys you do not handle:

```ts
import { defaultChatTranslate, provideChatTranslate } from '@korus-dev/agent-ui-sdk';

provideChatTranslate((key, params) => messages[key]
  ? format(messages[key], params)
  : defaultChatTranslate(key, params));
```

Document and browser panels take a separate `translate` prop (`BrowserTranslator`) because they can be used without a conversation.

## Tool call details

Raw tool inputs and outputs are hidden by default. Enable them for a trusted subtree:

```ts
provideToolCallDetails(true);
```

The `showToolDetails` prop on `ConversationPane`, `MessageList` and `Message` overrides the provider. Review sensitive content before enabling disclosure; tool arguments can contain secrets and file contents.

## Tool presentation

A resolver receives the tool call, its status descriptor, kind and metadata:

```ts
type ToolPresentationResolver = (context: {
  toolCall: MessageToolCall;
  descriptor?: ToolStatusDescriptor;
  kind?: string;
  metadata?: Readonly<Record<string, unknown>>;
}) => { icon?: Component | null; title?: string } | undefined;
```

Return `undefined` to retain defaults, `{ icon: null }` to suppress the icon, or a title and icon override. Grouping, streaming behavior and the rest of the row stay SDK-owned.

```ts
provideToolPresentation(({ toolCall, kind }) => {
  if (kind === 'imageGeneration') return { icon: PaletteIcon };
  if (toolCall.function.startsWith('mcp__relay__')) return { title: 'Relay operation' };
});
```

Prefer this scoped provider over `registerToolTitlePresenter`, a compatibility global that applies to every tree.

## Host capabilities

`provideHostCapabilities(capabilities, options?)` supplies the [host capability](/guide/native-capabilities) port to a subtree. When none is provided, `useHostCapabilities` falls back to `window.agentUiHostCapabilities`, which `exposeNativeRendererApi` installs from your preload.

```ts
provideHostCapabilities(myCapabilities, { imagePreviewBudgetBytes: 32 * 1024 * 1024 });
```

Passing `imagePreviewBudgetBytes` creates a bounded preview pool for restored images that is cleared when the scope is disposed. `getGlobalHostCapabilities()` reads the global directly; `getNativeRendererApi()` is a deprecated alias.

Use the scoped provider in tests and in apps that render several conversations with different hosts.

## Custom blocks

Register Vue components for assistant code fences by language. See [custom blocks](/guide/messages-tools#custom-blocks).

```ts
app.provide(customBlocksKey, { chart: ChartBlock });
```
