// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { capturePortalTheme } from '../../../src/vue/chat/portal-theme';

describe('capturePortalTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a light empty theme without an element or CSSOM support', () => {
    expect(capturePortalTheme(null)).toStrictEqual({ mode: 'light', style: {} });

    vi.stubGlobal('getComputedStyle', undefined);
    expect(capturePortalTheme(document.createElement('main'))).toStrictEqual({
      mode: 'light',
      style: {},
    });
  });

  it('captures only nonempty inherited tokens and trims their values', () => {
    const element = document.createElement('main');
    const getPropertyValue = vi.fn((token: string) => ({
      '--color-background': '  #111  ',
      '--color-text': '#eee',
      '--color-text-muted': '   ',
    })[token] ?? '');
    const getComputedStyle = vi.fn(() => ({ colorScheme: 'light dark', getPropertyValue }));
    vi.stubGlobal('getComputedStyle', getComputedStyle);

    expect(capturePortalTheme(element)).toStrictEqual({
      mode: 'dark',
      style: {
        '--color-background': '#111',
        '--color-text': '#eee',
      },
    });
    expect(getComputedStyle).toHaveBeenCalledWith(element);
    expect(getPropertyValue).toHaveBeenCalledWith('--font-family-mono');
    expect(getPropertyValue).toHaveBeenCalledWith('--shadow-lg');
  });

  it.each(['light', '', 'normal'])('uses light mode for color scheme %j', (colorScheme) => {
    vi.stubGlobal('getComputedStyle', () => ({
      colorScheme,
      getPropertyValue: () => '',
    }));

    expect(capturePortalTheme(document.createElement('main'))).toStrictEqual({
      mode: 'light',
      style: {},
    });
  });
});
