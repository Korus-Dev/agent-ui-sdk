# Documents

File classification and diff-overview contracts from `@korus-dev/agent-ui-sdk/documents`, and the document panels from the root. For usage, see the [documents guide](/guide/documents).

## File kinds

```ts
type FileKind = 'code' | 'test' | 'docs' | 'other';
const fileKinds: readonly FileKind[];

type KindStats = { addedLines: number; removedLines: number; changedFiles: number };
type KindBreakdown = Record<FileKind, KindStats>;
```

| Export | Purpose |
| --- | --- |
| `classifyFile(path)` | Decide a changed file's kind from its path alone |
| `isLockfile(path)` | True for dependency lockfiles (npm, Yarn, pnpm, Cargo, Poetry, Go, Composer, Bundler, and others). Application files with a `.lock` extension stay visible |
| `emptyKindStats()` | A zeroed `KindBreakdown` |
| `addFileToKindStats(stats, path, added, removed)` | Add one file to a breakdown |
| `mergeKindStats(...breakdowns)` | Sum breakdowns; `undefined` entries are skipped |

`classifyFile` returns `other` for generated directories (`node_modules`, `vendor`, `dist`, `coverage`, `.git`, …), lockfiles, source maps, minified files and tool configuration; `test` for test files and test directories; `docs` for documentation files and directories; and `code` for recognized source extensions.

## Diff overview

```ts
type DiffOverviewFile = {
  readonly key: string;
  readonly directory: string;
  readonly fullPath: string;
  readonly name: string;
  readonly iconKind: 'javascript' | 'typescript' | 'vue' | 'code';
  readonly openable: boolean;
  readonly addedLines: number;
  readonly removedLines: number;
};

type DiffOverviewSlot = {
  files: DiffOverviewFile[];
  /** Focus a file and emit select; the host controls whether the overview remains visible. */
  select(path: string): Promise<void>;
};
```

Both types are also exported from the root.

## Panels

### DiffPreviewPanel

| Prop | Type | Purpose |
| --- | --- | --- |
| `diff` | `string` | Unified diff text |
| `state`, `error` | `'idle' \| 'loading' \| 'error'`, `string \| null` | Load state |
| `overview` | `boolean` | Replace the body with the `#overview` slot |
| `groupByKind` | `boolean` | Group files under code, tests, documentation and other |
| `fileKindFilter` | `FileKind \| null` | Limit visible files without changing the patch |
| `focusKind`, `focusSequence` | `FileKind \| null`, `number` | With a new sequence, open only this group and fold the others |
| `excludeLockfiles` | `boolean` | Hide dependency lockfiles |
| `expandAllSignal`, `collapseAllSignal` | `number` | Bump to expand or collapse every file |
| `annotatable` | `boolean` | Line plus button and text-selection comments |
| `omittedFiles` | `DiffOmittedFile[]` | Files whose patch was left out for size: `{ path, addedLines, removedLines }`. See [too-large files](/guide/documents#files-too-large-to-show) |
| `openFileEnabled` | `boolean` | Show the open-file action |
| `wordWrap` | `boolean` | Wrap long lines |
| `translate` | `BrowserTranslator` | Localization |

Events: `select(path)`, `allExpandedChange(isAllExpanded)`, `openFile(filePath)`, `annotate(annotation)`. Slot: `overview` with `{ files, select }`. Exposes `showFiles(paths, location?)`.

### SourcePreviewPanel

`content`, `language`, `path`, `showLineNumbers`, `wordWrap`, `annotatable`, `state`, `error`, `translate`. Event: `annotate(annotation)`.

### MarkdownPanel

`content`, `state`, `error`, `outlineEnabled`, `translate`. Event: `openFile(href)`.

### AnnotationPopup

`anchor` (`AnnotationPopupAnchor`), `placement` (`'above' | 'below'`), `strategy` (`'absolute' | 'fixed'`), `width`, `label`, `description`, `placeholder`, `submitLabel`, `initialValue`, `optional`, `commandEnterSubmit`. Events: `submit(comment)`, `command-submit(comment)`, `cancel`.

### CodeSelectionAnnotation

`selection` and `commenting` (both `CodeSelection | null`). Events: `save({ selection, comment })`, `dismiss`.

## Annotation types

```ts
type CodeRange = { path: string; startLine: number; endLine: number; side?: 'old' | 'new' };

type CodeAnnotationInput = CodeRange & {
  text: string;      // the selected code, one source line per line; diff lines carry their +/- marker
  comment: string;
};

type CodeLocation = { path: string; line: number; endLine?: number; side?: 'old' | 'new' };
```

`describeCodeRange(range)` returns text like `src/app.ts lines 4-9`, or `… (before the change)` for the old side.

## Other helpers

| Export | Purpose |
| --- | --- |
| `useCodeSelection(container)` | Takes a ref to an element and tracks the code selection inside it |
| `collectMarkdownHeadings(root, documentId)` | Collect the headings of a rendered element for an outline (`MarkdownHeading[]`) |
| `sanitizeSvg(svg)` | Sanitize SVG before display |
| `fileKindColor` | A `Record<FileKind, string>` of CSS colors for file kind indicators |
