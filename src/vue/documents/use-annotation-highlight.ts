import { onBeforeUnmount } from 'vue';

/** The CSS highlight that keeps the passage being commented on visible once the comment box takes focus. */
export const annotationHighlightName = 'code-annotation-focus';

type HighlightRegistry = { get(name: string): unknown; set(name: string, value: unknown): unknown; delete(name: string): unknown };

const registry = (): HighlightRegistry | null => (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS?.highlights ?? null;
const highlightClass = (): (new (...ranges: Range[]) => unknown) | null => (globalThis as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight ?? null;

/**
 * Paints a range through the CSS Custom Highlight API while a comment is written, since focusing the
 * comment field clears the native selection. Does nothing where the host lacks that API.
 */
export function useAnnotationHighlight() {
  let held: unknown = null;

  function release(): void {
    if (held && registry()?.get(annotationHighlightName) === held) registry()?.delete(annotationHighlightName);
    held = null;
  }

  function hold(range: Range | null): void {
    release();
    const highlights = registry();
    const Highlight = highlightClass();
    if (!range || !highlights || !Highlight) return;
    held = new Highlight(range);
    highlights.set(annotationHighlightName, held);
  }

  onBeforeUnmount(release);
  return { hold, release };
}

/** A copy of the native selection, or null when nothing is selected. */
export function currentSelectionRange(): Range | null {
  const selection = window.getSelection?.();
  return selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed ? selection.getRangeAt(0).cloneRange() : null;
}
