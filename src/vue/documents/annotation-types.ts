export type CodeRange = { path: string; startLine: number; endLine: number; side?: 'old' | 'new' };
export type CodeAnnotationInput = CodeRange & {
  /** The selected code, one source line per line; diff lines carry their +/- marker. */
  text: string;
  comment: string;
};
export function describeCodeRange(range: CodeRange): string {
  const lines = range.startLine === range.endLine ? `line ${range.startLine}` : `lines ${range.startLine}-${range.endLine}`;
  return `${range.path} ${lines}${range.side === 'old' ? ' (before the change)' : ''}`;
}
export type CodeLocation = { path: string; line: number; endLine?: number; side?: 'old' | 'new' };
