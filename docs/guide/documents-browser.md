# Documents and browser panels

Import `MarkdownPanel`, `SourcePreviewPanel`, `DiffPreviewPanel`, `AnnotationPopup` and `CodeSelectionAnnotation` from the root. Element Plus is required by panels using its controls. File classification and diff-overview contracts are available from `/documents`.

Document panels support selection and annotation while applications own file loading, navigation and authorization. `DiffPreviewPanel` can use `overview` and the `#overview="{ files, select }"` slot for a host-owned summary. Selecting a path emits `select`; the host switches out of overview mode. Loading and error states remain SDK-owned.

Import browser controls from `/browser-ui`, safe contracts/bookmark/partition/viewport helpers from `/browser`, and the Electron browser manager from `/electron/browser`. Keep the Electron manager outside the renderer dependency graph.

Browser panes use `ownerId` for host identity. Hosts supply navigation, permissions, bookmarks, annotation dispatch and persistence through `BrowserUiApi`/`BrowserUiHost`. Owner IDs are application identities, not provider sessions. Keep wire identity mapping in your adapter.

Browser content and inline HTML are untrusted. Use isolated host boundaries and enforce navigation, filesystem and network policy in the trusted process. SVG sanitization and preview isolation complement that boundary; they do not grant access to arbitrary content or privileged APIs.
