/** File metadata supplied to a host-owned diff overview. Paths are opaque to the SDK. */
export type DiffOverviewFile = {
  readonly key: string;
  readonly directory: string;
  readonly fullPath: string;
  readonly name: string;
  readonly iconKind: 'javascript' | 'typescript' | 'vue' | 'code';
  readonly openable: boolean;
  readonly addedLines: number;
  readonly removedLines: number;
};

export type DiffOverviewSlot = {
  files: DiffOverviewFile[];
  /** Focus a file and emit select; the host controls whether the overview remains visible. */
  select(path: string): Promise<void>;
};
