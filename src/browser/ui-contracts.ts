import type { BrowserAnnotation, BrowserBounds, BrowserState, BrowserViewportBounds } from './contracts';
import type { BrowserViewportRequest } from './viewport';
import type { BrowserBookmark } from './bookmarks';

export type BrowserExtensionStatus = { id: string; name: string; version?: string; enabled: boolean; permissions: string[]; error?: string };
export type BrowserUiEvent = { type: 'browser.annotationCreated'; payload: BrowserAnnotation };
export type BrowserTranslator = (key: string, parameters?: Record<string, string | number>) => string;
/** Trusted operations supplied by the containing desktop; no provider or product state. */
export type BrowserUiApi = {
browserExtensions(agentId: string | null, action: 'list' | 'open', managerId?: string, browserId?: string): Promise<{ extensions: BrowserExtensionStatus[] }>;
browserOpen(agentId: string, browserId: string, url: string, guestWebContentsId: number): Promise<BrowserState>;
browserOpenDocument(agentId: string, browserId: string, path: string, title: string, guestWebContentsId: number): Promise<BrowserState>;
browserNavigate(agentId: string, browserId: string, url: string): Promise<BrowserState>;
browserGoBack(agentId: string, browserId: string): Promise<BrowserState>;
browserGoForward(agentId: string, browserId: string): Promise<BrowserState>;
browserOpenDevTools(agentId: string, browserId: string): Promise<void>;
browserReload(agentId: string, browserId: string): Promise<BrowserState>;
browserClearBrowsingData(): Promise<void>;
browserGetZoom(agentId: string, browserId: string): Promise<number>;
browserSetZoom(agentId: string, browserId: string, percent: number): Promise<number>;
browserCopyScreenshot(agentId: string, browserId: string, rect?: BrowserBounds): Promise<void>;
browserSetBounds(agentId: string, browserId: string, bounds: BrowserViewportBounds): Promise<void>;
browserViewportApplied(agentId: string, browserId: string, requestId: string, error?: string): Promise<void>;
browserSetVisible(agentId: string, browserId: string, visible: boolean): Promise<void>;
browserSetAnnotationMode(agentId: string, browserId: string, enabled: boolean): Promise<void>;
browserClearAnnotations(agentId: string, browserId: string): Promise<void>;
browserClose(agentId: string, browserId: string): Promise<void>;
};
export type BrowserUiHost = {
  api?: BrowserUiApi;
  platform: 'desktop' | 'web';
  guestPartition(agentId: string, document: boolean): string;
  bookmarks?: () => readonly BrowserBookmark[];
  saveBookmarks?: (bookmarks: BrowserBookmark[]) => Promise<void>;
  extensionIcon?: (id: string) => string | undefined;
  openExternal?: (url: string) => Promise<void>;
  onEvent?: (listener: (event: BrowserUiEvent) => void) => () => void;
  onViewportRequest?: (listener: (request: BrowserViewportRequest) => void) => () => void;
  translate?: BrowserTranslator;
};
