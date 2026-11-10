export type BrowserBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type BrowserViewportBounds = BrowserBounds & {
  /** Guest viewport pixels hidden above or to the left of the visible bounds. */
  contentOffset?: { x: number; y: number };
};
export const PRIMARY_BROWSER_ID = 'primary';
export type BrowserAnnotation = {
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
export type BrowserState = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
};