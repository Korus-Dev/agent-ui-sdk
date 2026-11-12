# API entry points

The package exposes intentional, layer-specific entry points with explicit, extensionless exports. Import from the narrowest entry that owns the capability you need. Each has matching JavaScript and declaration targets; `main` and `types` remain as the root fallback.

| Import suffix | Runtime | Main exports |
| --- | --- | --- |
| root | Renderer | Conversation controls, session and controller composition, themes, providers, document panels, neutral types |
| `/styles.css` | Renderer CSS | Control styles, syntax and math styles, packaged fonts |
| `/host` | Anywhere | `HostCapabilities` contracts, speech types, `toHarnessPromptOptions`, conversation image helpers |
| `/electron` | Electron main | Typed IPC, window policy, `registerNativeIpc`, `ElectronAttachmentRegistry` |
| `/electron/preload` | Electron preload | `exposeNativeRendererApi`, `createNativeRendererApi`, `TypedIpcRenderer` |
| `/electron/browser` | Electron main | `BrowserPane` |
| `/speech` | Trusted Node | Apple and OpenAI speech sessions and transcription |
| `/browser` | Renderer or trusted | Browser contracts, bookmark, partition, viewport and URL helpers |
| `/browser-ui` | Renderer | `BrowserPanel`, `BrowserBookmarks`, `BrowserExtensionIcon`, `AnnotationSendButton` |
| `/documents` | Renderer or trusted | File classification and diff-overview contracts |

All suffixes are relative to `@korus-dev/agent-ui-sdk`. Electron and speech entries require a trusted Node host; keep them outside renderer imports. Vue is a required peer. Electron and Element Plus are optional peers for the pieces that use them.

## Typical imports

```ts
// Renderer
import { ConversationPane, createSessionConversationController } from '@korus-dev/agent-ui-sdk';
import '@korus-dev/agent-ui-sdk/styles.css';
import { BrowserPanel } from '@korus-dev/agent-ui-sdk/browser-ui';

// Electron main
import { registerNativeIpc, installWindowPolicy } from '@korus-dev/agent-ui-sdk/electron';
import { toHarnessPromptOptions } from '@korus-dev/agent-ui-sdk/host';
import { BrowserPane } from '@korus-dev/agent-ui-sdk/electron/browser';

// Preload
import { exposeNativeRendererApi } from '@korus-dev/agent-ui-sdk/electron/preload';
```

TypeScript consumers should use Bundler module resolution with a Vue-aware bundler. NodeNext type resolution is not part of the supported contract.

## Reference pages

| Page | Covers |
| --- | --- |
| [Vue components](/api/vue) | Every exported component, with props, events and slots for the main ones, plus helpers and providers |
| [Session and controller](/api/session) | `createSessionConversationController`, the grouped controller, state projection, request helpers |
| [Contracts and presentation](/api/contracts) | `Capabilities`, catalog types, presentation, requests, goals and message types |
| [Host capabilities](/api/host) | Attachments, clipboard, speech contracts and prompt translation |
| [Electron](/api/electron) | Main and preload adapters |
| [Browser](/api/browser) | Browser contracts, panel and manager |
| [Speech](/api/speech) | Apple and OpenAI sessions |
| [Documents](/api/documents) | File kinds and diff overview |

## Provider boundaries

The root controls and host capability contracts are provider-neutral. Shared conversation types come from Multi Agent SDK's canonical, neutral model: `Message`, `Turn`, `AgentRequest` and `AgentRequestResponse`, `HarnessCapabilities`, `SessionState`, `HarnessDefaults`, `PromptPart`, `ReferenceSendPromptOptions`, `PluginSummary` and `SkillSummary`. UI presentation types describe renderer choices rather than provider execution.

Every harness uses `ConversationPane` with the same session and controller binding. The SDK has no provider-specific panes, hooks, command catalogs, authentication or transport bridges. Applications obtain normalized state and capabilities from Multi Agent SDK and supply session-bound actions. A provider label may be displayed as application-owned text; it does not select UI behavior.

## Stability

The controller, session binding, host capability and presentation contracts are product-shaped and documented here. The SDK is pre-1.0; breaking changes are called out in the [changelog](https://github.com/Korus-Dev/agent-ui-sdk/blob/main/CHANGELOG.md).
