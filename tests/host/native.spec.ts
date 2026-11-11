import { describe, expect, it } from 'vitest';
import { nativeRendererGlobal } from '../../src/host/contracts';

describe('native host contract', () => {
  it('uses the stable renderer global name', () => {
    expect(nativeRendererGlobal).toBe('agentUiHostCapabilities');
  });
});
