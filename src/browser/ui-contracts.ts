import type { BrowserAnnotation, BrowserBounds, BrowserState, BrowserViewportBounds } from './contracts';
import type { BrowserViewportRequest } from './viewport';
import type { BrowserBookmark } from './bookmarks';

export type BrowserExtensionStatus = { id: string; name: string; version?: string; enabled: boolean; permissions: string[]; error?: string };
export type BrowserUiEvent = { type: 'browser.annotationCreated'; payload: BrowserAnnotation };
export type BrowserTranslator = (key: string, parameters?: Record<string, string | number>) => string;
/** Trusted operations supplied by the containing desktop; no provider or product state. */
export type BrowserUiApi = {
browserExtensions(ownerId: string | null, action: 'list' | 'open', managerId?: string, browserId?: string): Promise<{ extensions: BrowserExtensionStatus[] }>;
browserOpen(ownerId: string, browserId: string, url: string, guestWebContentsId: number): Promise<BrowserState>;
browserOpenDocument(ownerId: string, browserId: string, path: string, title: string, guestWebContentsId: number): Promise<BrowserState>;
browserNavigate(ownerId: string, browserId: string, url: string): Promise<BrowserState>;
browserGoBack(ownerId: string, browserId: string): Promise<BrowserState>;
browserGoForward(ownerId: string, browserId: string): Promise<BrowserState>;
browserOpenDevTools(ownerId: string, browserId: string): Promise<void>;
browserReload(ownerId: string, browserId: string): Promise<BrowserState>;
browserClearBrowsingData(): Promise<void>;
browserGetZoom(ownerId: string, browserId: string): Promise<number>;
browserSetZoom(ownerId: string, browserId: string, percent: number): Promise<number>;
browserCopyScreenshot(ownerId: string, browserId: string, rect?: BrowserBounds): Promise<void>;
browserSetBounds(ownerId: string, browserId: string, bounds: BrowserViewportBounds): Promise<void>;
browserViewportApplied(ownerId: string, browserId: string, requestId: string, error?: string): Promise<void>;
browserSetVisible(ownerId: string, browserId: string, visible: boolean): Promise<void>;
browserSetAnnotationMode(ownerId: string, browserId: string, enabled: boolean): Promise<void>;
browserClearAnnotations(ownerId: string, browserId: string): Promise<void>;
browserClose(ownerId: string, browserId: string): Promise<void>;
};
export type BrowserUiHost = {
  api?: BrowserUiApi;
  platform: 'desktop' | 'web';
  guestPartition(ownerId: string, document: boolean): string;
  bookmarks?: () => readonly BrowserBookmark[];
  saveBookmarks?: (bookmarks: BrowserBookmark[]) => Promise<void>;
  extensionIcon?: (id: string) => string | undefined;
  openExternal?: (url: string) => Promise<void>;
  onEvent?: (listener: (event: BrowserUiEvent) => void) => () => void;
  onViewportRequest?: (listener: (request: BrowserViewportRequest) => void) => () => void;
  translate?: BrowserTranslator;
};
