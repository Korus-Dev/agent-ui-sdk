# Documents

Document panels preview content your application loads: Markdown, source code and diffs. They support selection and annotation, so a person can comment on a range and send it back to the agent. Applications own file loading, navigation and authorization.

Import the panels from the package root. They need no extra peer dependencies. File classification and diff-overview contracts are available from `/documents`.

| Component | Shows | Key props |
| --- | --- | --- |
| `MarkdownPanel` | Rendered Markdown with an outline | `content`, `state`, `error`, `outlineEnabled` |
| `SourcePreviewPanel` | Highlighted source | `content`, `language`, `path`, `showLineNumbers`, `wordWrap`, `annotatable` |
| `DiffPreviewPanel` | A unified diff, per file | `diff`, `state`, `error`, `overview`, `groupByKind`, `fileKindFilter`, `annotatable`, `omittedFiles`, `wordWrap` |
| `AnnotationPopup` | A comment box anchored to a rectangle | `anchor`, `placement`, `initialValue`, `submitLabel`, `optional` |
| `CodeSelectionAnnotation` | The floating "comment" action for a code selection; the selected text stays highlighted while the comment is written | `selection`, `commenting` |

All panels take `state` of `'idle' | 'loading' | 'error'` and an `error` message. Loading and error states are SDK-owned, so the host only decides what to load. A `translate` prop (`BrowserTranslator`) localizes panel strings.

## Markdown

```vue
<MarkdownPanel :content="markdown" :state="state" :error="error" outline-enabled @open-file="openFile" />
```

Markdown renders through the same pipeline as messages: code highlighting, KaTeX, Mermaid diagrams and links. The optional outline lists headings (`collectMarkdownHeadings` exposes the same data) and follows the reading position. Relative file links emit `openFile(href)` for the host to resolve.

## Source

```vue
<SourcePreviewPanel
  :content="source"
  :path="file.path"
  :language="languageForFilePath(file.path)"
  show-line-numbers
  annotatable
  @annotate="sendAnnotation"
/>
```

With `annotatable` and a `path`, a person can select code text or use a line's plus button to comment. The panel emits `annotate` with a `CodeAnnotationInput`: `path`, `startLine`, `endLine`, optional `side` (`'old'` or `'new'` in diffs), the selected `text` and the `comment`. `describeCodeRange` formats a `CodeRange` for display, and `useCodeSelection` gives you the selection state to build your own annotation UI. `fileKindColor` maps a file kind to a color for badges.

## Diffs

```vue
<DiffPreviewPanel
  :diff="patch"
  :state="state"
  group-by-kind
  exclude-lockfiles
  @open-file="openFile"
  @annotate="sendAnnotation"
/>
```

The panel parses the unified diff, folds each file, and can group files under code, tests, documentation and other headers (`FileKind`). `excludeLockfiles` hides dependency lockfiles, and `fileKindFilter` narrows the view without changing the loaded patch. `expandAllSignal` and `collapseAllSignal` take counters; bump one to expand or collapse every file. The panel emits `allExpandedChange` so your toolbar can track state.

A diff view product (a treemap, a review tool) is application-specific and does not belong in the SDK. The panel gives you the pieces to build one.

### Files too large to show

When a host leaves a very large file's hunks out of the patch, keep its header (`diff --git`, `---`, `+++`) and list it in `omittedFiles` with git's own counts:

```vue
<DiffPreviewPanel
  :diff="patch"
  :omitted-files="[{ path: 'src/generated.ts', addedLines: 7000, removedLines: 652 }]"
/>
```

The file's header shows the real `+7000 -652`, and its body reads "Diff too large to be shown" with no line numbers and nothing to annotate. The message is translatable through the `translate` prop with the key `surface.gitDiffPreviewPanel.diffTooLarge`. A header-only file that is not listed still reads "No textual hunks."

### Host-owned overview

In overview mode, the `#overview` slot replaces the diff body with your own summary, such as a treemap or file list:

```vue
<DiffPreviewPanel :diff="patch" :overview="mode === 'overview'" @select="mode = 'diff'">
  <template #overview="{ files, select }">
    <MyTreemap :files="files" @pick="path => select(path)" />
  </template>
</DiffPreviewPanel>
```

`files` carries metadata for each file after the lockfile and file-kind filters: `key`, `directory`, `fullPath`, `name`, `iconKind`, `openable`, `addedLines` and `removedLines`. `select(path)` focuses that file and emits `select`; your handler sets `overview` to false. The returned promise settles after Vue renders and attempts to scroll to the selection. Returning to overview clears the focused file subset.

`DiffOverviewFile` and `DiffOverviewSlot` types are exported from the root and `/documents`.

## File classification

```ts
import { classifyFile, addFileToKindStats, emptyKindStats } from '@korus-dev/agent-ui-sdk/documents';

classifyFile('src/app.ts');        // 'code'
classifyFile('tests/app.spec.ts'); // 'test'
classifyFile('docs/guide.md');     // 'docs'
classifyFile('package-lock.json'); // 'other'
```

`classifyFile` decides a changed file's kind from its path alone. Lockfiles, generated directories (`node_modules`, `dist`, `coverage`, …), source maps and minified files count as `other`. `emptyKindStats`, `addFileToKindStats` and `mergeKindStats` aggregate added and removed lines per kind, and `isLockfile` identifies dependency lockfiles.

## Annotations

`AnnotationPopup` collects a comment next to an anchor rectangle (`placement` `'above'` or `'below'`, `strategy` `'absolute'` or `'fixed'`). With `commandEnterSubmit`, Cmd/Ctrl+Enter submits through the separate `command-submit` event. When the host supports transcription, the popup shows a microphone. Set `optional` when an empty comment is acceptable, such as a measurement that speaks for itself.

Route annotations into the conversation as a visible prompt, so the person sees what was sent. The host decides the wording.

## Security

SVG visualizations are sanitized with `sanitizeSvg`, and previews are isolated. Sanitization complements, and does not replace, a trusted-process policy: do not use it as permission to render arbitrary content with privileged access. See the [security boundary](/guide/security#untrusted-content).
