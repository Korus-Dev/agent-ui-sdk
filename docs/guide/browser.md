# Browser panel

The browser panel embeds a real web view in your app, with navigation, bookmarks, zoom, device viewports, screenshots and **annotation**: a person can click an element or draw an area, add a comment, and send the annotations to the agent as a prompt.

| Entry | Runs in | Provides |
| --- | --- | --- |
| `/browser-ui` | Renderer | `BrowserPanel`, `BrowserBookmarks`, `BrowserExtensionIcon`, `AnnotationSendButton` |
| `/browser` | Renderer or trusted | Contracts, bookmark, partition, viewport and URL helpers |
| `/electron/browser` | Electron main process | `BrowserPane`, the manager that owns navigation and annotation policy |

Element Plus is an optional peer needed by the panel's controls. Keep the Electron manager outside the renderer dependency graph.

## Renderer

```vue
<script setup lang="ts">
import { BrowserPanel, type BrowserUiHost } from '@korus-dev/agent-ui-sdk/browser-ui';

const host: BrowserUiHost = {
  platform: 'desktop',
  api: window.browserApi,                         // your preload's BrowserUiApi
  guestPartition: (ownerId, document) => `persist:browser-${document ? 'doc' : 'web'}-${ownerId}`,
  bookmarks: () => settings.bookmarks,
  saveBookmarks: async bookmarks => { await settings.saveBookmarks(bookmarks); },
  openExternal: url => window.hostApi.openExternal(url),
  onEvent: listener => window.browserApi.onEvent(listener),
};
</script>

<template>
  <BrowserPanel
    :host="host"
    owner-id="workspace-1"
    initial-url="http://localhost:5173"
    @send-prompt="prompt => conversation.send(prompt)"
  />
</template>
```

| `BrowserPanel` prop | Purpose |
| --- | --- |
| `host` (required) | `BrowserUiHost`: the trusted operations and settings |
| `ownerId` (required) | Your identity for the pane. Not a provider session |
| `browserId` | Distinguishes several panes for one owner; defaults to `'primary'` |
| `initialUrl`, `openRequestId` | Where to start; bump `openRequestId` to navigate again |
| `visible` | Hide the pane without destroying it |
| `document` | `{ path, title }` to show a local visualization instead of navigating |

Events: `send-prompt(prompt)` when annotations are sent, `url-change(url)` and `open-browser-settings`.

### BrowserUiHost

| Member | Purpose |
| --- | --- |
| `api` | `BrowserUiApi`: open, navigate, go back and forward, reload, zoom, screenshot, bounds, visibility, annotation mode, DevTools, extensions, close |
| `platform` | `'desktop'` or `'web'` |
| `guestPartition(ownerId, document)` | The Electron session partition for a guest |
| `bookmarks`, `saveBookmarks` | Bookmark store, owned by the host |
| `extensionIcon(id)` | Icon URL for a browser extension |
| `openExternal(url)` | Open a link in the OS browser |
| `onEvent` | Subscribe to `browser.annotationCreated` |
| `onViewportRequest` | Receive viewport resize requests |
| `translate` | A `BrowserTranslator` for panel strings |

Hosts supply navigation, permissions, bookmarks, annotation dispatch and persistence. Owner ids are application identities, not provider sessions; keep wire identity mapping in your adapter.

## Main process

`BrowserPane` is constructed once and owns every hosted pane:

```ts
import { BrowserPane, safePartitionName } from '@korus-dev/agent-ui-sdk/electron/browser';

const browser = new BrowserPane({
  partitionFor: (scopeId, visualization) => safePartitionName(`${visualization ? 'viz' : 'web'}-${scopeId}`),
  sharedPartition: 'persist:browser-shared',
  preservedOrigins: ['https://accounts.example.com'],
  onAnnotation: annotation => windowFor(annotation.ownerId)?.webContents.send('browser:annotation', annotation),
  onViewportRequest: (request, window) => window.webContents.send('browser:viewport', request),
});

ipcMain.handle('browserOpen', (event, ownerId, browserId, url, guestId) =>
  browser.open(windowOf(event), ownerId, browserId, url, workspaceRoot, guestId));
```

| Option | Purpose |
| --- | --- |
| `partitionFor(scopeId, visualization)` | Session partition for a pane. Web panes and visualization panes must differ |
| `sharedPartition` | The partition cleared by `clearBrowsingData` |
| `preservedOrigins` | Origins kept when browsing data is cleared |
| `annotationEditor` | A preload and loader for a custom annotation editor window |
| `onGuestReady`, `onGuestSelected` | Hooks for extension attachment and selection |
| `onAnnotation` (required) | Receives each created `BrowserAnnotation` |
| `onViewportRequest` | Receives viewport resize requests |

Methods include `open`, `openVisualization`, `navigate`, `goBack`, `goForward`, `reload`, `openDevTools`, `getZoom`, `setZoom`, `copyScreenshot`, `setBounds`, `setVisible`, `setAnnotationMode`, `clearAnnotations`, `clearBrowsingData`, `close`, `closeAll`, `closeHostedBy(window, ownerId?)` and `viewportApplied`.

The renderer passes only a guest id; it never receives the guest `WebContents`. The manager verifies that the guest is a webview of the requesting window, owned by the expected partition, before it accepts it.

### Driving the browser from an agent

`execute(ownerId, browserId, command, args)` lets your trusted process operate a pane on an agent's behalf, for example from an MCP tool:

| Command | Arguments | Result |
| --- | --- | --- |
| `dom` | `selector?` | URL, title and a description of the element (text, bounded HTML, rectangle) |
| `click` | One CSS `selector` that matches exactly one element, or both `x` and `y` in viewport CSS pixels | Clicks are serialized per page |
| `type` | `selector`, `text`, `clear?` | Types into an editable element |
| `scroll` | `selector?`, `deltaY?` | Scrolls the page or an element |
| `screenshot` | none | `{ mimeType: 'image/png', data: base64 }` |
| `console` | `limit?` | Recent console messages |
| `viewport` | `preset` or `width` and `height` | Resizes the viewport; resolves when the renderer applies it |

Viewport presets are `fit`, `responsive`, `phone` (390×844), `tablet` (768×1024) and `desktop` (1280×800), or a custom size between 240–2000 by 320–2000 CSS pixels. `parseBrowserViewport` validates input.

## Annotations

With annotation mode on, a person clicks an element or drags an area and writes a comment. Each becomes a `BrowserAnnotation`:

```ts
type BrowserAnnotation = {
  id: string;
  ownerId: string;
  browserId: string;
  url: string;
  kind: 'element' | 'area';
  selector?: string;
  label?: string;
  comment?: string;
  rect: { x: number; y: number; width: number; height: number };
};
```

`AnnotationSendButton` (`count`, `label`, `disabled`) shows pending annotations and emits `click`. Compose a visible prompt from them so the person sees what is sent.

## Bookmarks and URLs

`BrowserBookmarks` is the bookmark picker (`bookmarks`, `url`, `title`, `save`, `active`; emits `open`). It stores title and URL pairs.

- `bookmarkUrl(value)` accepts explicit `http` and `https` URLs only, and rejects URLs with credentials. Credentials must never be persisted.
- `normalizeBrowserBookmarks(value)` drops invalid entries and duplicates.
- `externalBrowserUrl(url)` returns a safe `http` or `https` URL, or `null`.
- `safePartitionName(ownerId)` produces a partition-safe name.

## Untrusted content

Browser content and inline HTML are untrusted. Use isolated host boundaries and enforce navigation, filesystem and network policy in the trusted process. Visualizations load into a separate partition and are limited to 1 MiB. See the [security boundary](/guide/security#untrusted-content).
