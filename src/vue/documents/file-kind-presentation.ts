import type { FileKind } from '../../documents/files';
import { documentTranslation as translate } from './document-messages';

export function fileKindLabel(kind: FileKind): string {
  return translate(`surface.fileKind.${kind}`);
}

export function fileKindCount(count: number): string {
  return translate('surface.fileKind.fileCount', { count });
}

/** One steady color per kind, shared by the header menu, review panel and treemap. */
export const fileKindColor: Record<FileKind, string> = {
  code: 'var(--color-primary)',
  test: 'var(--color-success)',
  docs: 'var(--color-warning)',
  other: 'var(--color-text-muted)',
};
