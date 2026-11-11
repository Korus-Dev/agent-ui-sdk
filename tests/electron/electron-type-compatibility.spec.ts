import type { clipboard, dialog, shell } from 'electron';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  NativeClipboard,
  NativeDialog,
  NativeShell,
} from '../../src/electron';

describe('Electron native dependency type compatibility', () => {
  it('accepts Electron modules directly without host adapters', () => {
    expectTypeOf<typeof dialog>().toExtend<NativeDialog>();
    expectTypeOf<typeof clipboard>().toExtend<NativeClipboard>();
    expectTypeOf<typeof shell>().toExtend<NativeShell>();
  });
});
