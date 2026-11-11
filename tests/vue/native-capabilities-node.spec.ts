// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  getGlobalHostCapabilities,
  getNativeRendererApi,
} from '../../src/vue/native-capabilities';

describe('native renderer capabilities outside a browser', () => {
  it('reports no global host capabilities during server-side rendering', () => {
    expect(getGlobalHostCapabilities()).toBeUndefined();
    expect(getNativeRendererApi()).toBeUndefined();
  });
});
