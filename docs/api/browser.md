# Browser

Three entries cover the embedded browser. For usage, see the [browser panel guide](/guide/browser).

| Entry | Contents |
| --- | --- |
| `/browser` | Contracts and helpers safe for any process |
| `/browser-ui` | The Vue panel and its host contract |
| `/electron/browser` | The main-process manager |

## `/browser`

### Contracts

```ts
type BrowserBounds = { x: number; y: number; width: number; height: number };
type BrowserViewportBounds = BrowserBounds & { contentOffset?: { x: number; y: number } };

const PRIMARY_BROWSER_ID = 'primary';

type BrowserState = { url: string; title: string; canGoBack: boolean; canGoForward: boolean };

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

`ownerId` is an application identity (a workspace, a conversation), not a provider session.

### Viewport

```ts
const browserDevicePresets = {
  phone: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

type BrowserViewportConfiguration = {
  preset: 'fit' | 'responsive' | 'custom' | keyof typeof browserDevicePresets;
  width?: number;
  height?: number;
};

type BrowserViewportRequest = {
  ownerId: string;
  browserId: string;
  requestId: string;
  viewport: BrowserViewportConfiguration;
};

function parseBrowserViewport(input: Record<string, unknown>): BrowserViewportConfiguration;
```

`parseBrowserViewport` accepts either a `preset` or a custom `width` (240–2000) and `height` (320–2000) in CSS pixels, never both, and throws otherwise.

### Helpers

| Export | Purpose |
| --- | --- |
| `bookmarkUrl(value)` | Returns a normalized `http` or `https` URL without credentials, or `null` |
| `normalizeBrowserBookmarks(value)` | Filters unknown input to valid, unique `BrowserBookmark` (`{ title, url }`) values |
| `externalBrowserUrl(url)` | Returns an `http` or `https` URL, or `null` |
| `safePartitionName(ownerId)` | A partition-safe name (letters, digits, `_` and `-`, up to 80 characters) |

## `/browser-ui`

```ts
import { BrowserPanel, BrowserBookmarks, BrowserExtensionIcon, AnnotationSendButton } from '@korus-dev/agent-ui-sdk/browser-ui';
import type { BrowserUiHost, BrowserUiApi, BrowserTranslator } from '@korus-dev/agent-ui-sdk/browser-ui';
```

### BrowserPanel

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `host` | `BrowserUiHost` | required | Trusted operations and settings |
| `ownerId` | `string` | required | Pane owner identity |
| `browserId` | `string` | `'primary'` | Distinguishes several panes per owner |
| `initialUrl` | `string` | | Starting address |
| `openRequestId` | `number` | | Change to navigate to `initialUrl` again |
| `visible` | `boolean` | | Hide without destroying |
| `document` | `{ path: string; title: string } \| null` | | Show a local visualization |

Events: `send-prompt(prompt)`, `url-change(url)`, `open-browser-settings`.

### BrowserUiHost

```ts
type BrowserUiHost = {
  api?: BrowserUiApi;
  platform: 'desktop' | 'web';
  guestPartition(ownerId: string, document: boolean): string;
  bookmarks?: () => readonly BrowserBookmark[];
  saveBookmarks?: (bookmarks: BrowserBookmark[]) => Promise<void>;
  extensionIcon?: (id: string) => string | undefined;
  openExternal?: (url: string) => Promise<void>;
  onEvent?: (listener: (event: BrowserUiEvent) => void) => () => void;   // { type: 'browser.annotationCreated', payload }
  onViewportRequest?: (listener: (request: BrowserViewportRequest) => void) => () => void;
  translate?: BrowserTranslator;                                          // (key, params?) => string
};
```

### BrowserUiApi

Operations the containing desktop supplies, all keyed by `ownerId` and `browserId`:

| Group | Methods |
| --- | --- |
| Open | `browserOpen(ownerId, browserId, url, guestWebContentsId)`, `browserOpenDocument(ownerId, browserId, path, title, guestWebContentsId)` |
| Navigate | `browserNavigate`, `browserGoBack`, `browserGoForward`, `browserReload`, each returning `BrowserState` |
| View | `browserSetBounds`, `browserSetVisible`, `browserGetZoom`, `browserSetZoom`, `browserViewportApplied` |
| Tools | `browserOpenDevTools`, `browserCopyScreenshot`, `browserClearBrowsingData`, `browserExtensions` |
| Annotate | `browserSetAnnotationMode`, `browserClearAnnotations` |
| Close | `browserClose` |

### Other components

| Component | Props | Events |
| --- | --- | --- |
| `BrowserBookmarks` | `bookmarks`, `url`, `title`, `save`, `active` | `open(url)`; slot `address` |
| `BrowserExtensionIcon` | `source`, `size` (`'small' \| 'large'`) | |
| `AnnotationSendButton` | `count`, `label`, `disabled` | `click` |

## `/electron/browser`

### BrowserPane

```ts
class BrowserPane {
  constructor(options: BrowserPaneOptions);
  open(window, ownerId, browserId, url, fileRoot, guestWebContentsId): Promise<BrowserState>;
  openVisualization(window, ownerId, browserId, filePath, title, guestWebContentsId): Promise<BrowserState>;
  navigate(ownerId, browserId, url): Promise<BrowserState>;
  goBack(ownerId, browserId): Promise<BrowserState>;
  goForward(ownerId, browserId): Promise<BrowserState>;
  reload(ownerId, browserId): Promise<BrowserState>;
  openDevTools(ownerId, browserId): void;
  getZoom(ownerId, browserId): number;
  setZoom(ownerId, browserId, percent): number;
  copyScreenshot(ownerId, browserId, rect?): Promise<void>;
  setBounds(ownerId, browserId, bounds: BrowserViewportBounds): void;
  setVisible(ownerId, browserId, visible): void;
  setAnnotationMode(ownerId, browserId, enabled): Promise<void>;
  resolveAnnotation(token, comment: string | null): void;
  clearAnnotations(ownerId, browserId): Promise<void>;
  clearBrowsingData(): Promise<void>;
  execute(ownerId, browserId, command, args): Promise<unknown>;
  viewportApplied(ownerId, browserId, requestId, error?): Promise<void>;
  isHostedBy(ownerId, browserId, window): boolean;
  close(ownerId, browserId): Promise<void>;
  closeHostedBy(window, ownerId?): Promise<void>;
  closeAll(): Promise<void>;
}
```

```ts
type BrowserPaneOptions = {
  partitionFor(scopeId: string, visualization: boolean): string;
  sharedPartition: string;
  preservedOrigins?: string[];
  annotationEditor?: { preload: string; load(window: BrowserWindow, query: Record<string, string>): Promise<void> };
  onGuestReady?(ownerId, browserId, contents: WebContents, window: BrowserWindow): Promise<void>;
  onGuestSelected?(ownerId, browserId): void;
  onAnnotation(annotation: BrowserAnnotation): void;
  onViewportRequest?(request: BrowserViewportRequest, window: BrowserWindow): void;
};
```

`open` and `openVisualization` verify that the guest is a `webview` of the given window, owned by the partition `partitionFor` returns, before accepting it. Visualizations are read from disk, limited to 1 MiB and loaded without navigation.

`execute` commands: `dom`, `click`, `type`, `scroll`, `screenshot`, `console` and `viewport`. See [Driving the browser from an agent](/guide/browser#driving-the-browser-from-an-agent).
