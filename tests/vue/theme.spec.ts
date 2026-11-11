// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { applyTheme } from '../../src/vue/theme';

describe('applyTheme', () => {
  it('applies an optional theme contract without taking ownership of the app shell', () => {
    const shell = document.createElement('main');
    shell.setAttribute('data-theme', 'light');
    shell.style.setProperty('--agent-ui-text-color', '#111');

    const restore = applyTheme(shell, {
      mode: 'dark',
      tokens: {
        textColor: '#eee',
        '--agent-ui-surface-color': '#151515',
      },
    });

    expect(shell.getAttribute('data-theme')).toBe('dark');
    expect(shell.style.getPropertyValue('--agent-ui-text-color')).toBe('#eee');
    expect(shell.style.getPropertyValue('--agent-ui-surface-color')).toBe('#151515');

    restore();
    expect(shell.getAttribute('data-theme')).toBe('light');
    expect(shell.style.getPropertyValue('--agent-ui-text-color')).toBe('#111');
    expect(shell.style.getPropertyValue('--agent-ui-surface-color')).toBe('');
  });

  it('defaults to system mode and rejects empty token names', () => {
    const element = document.createElement('div');
    const restore = applyTheme(element);
    expect(element.getAttribute('data-theme')).toBe('system');
    restore();
    expect(element.hasAttribute('data-theme')).toBe(false);
    expect(() => applyTheme(element, { tokens: { '---': '#fff' } })).toThrow(
      'Agent UI theme token names cannot be empty',
    );
  });

  it('removes every empty token value and restores its previous value', () => {
    const element = document.createElement('div');
    for (const name of ['null-value', 'undefined-value', 'empty-value', 'blank-value']) {
      element.style.setProperty(`--agent-ui-${name}`, name);
    }

    const setProperty = vi.spyOn(element.style, 'setProperty');
    const removeProperty = vi.spyOn(element.style, 'removeProperty');
    const restore = applyTheme(element, {
      tokens: {
        nullValue: null,
        undefinedValue: undefined,
        emptyValue: '',
        blankValue: '   ',
      },
    });

    expect(element.getAttribute('style')).toBe('');
    expect(removeProperty).toHaveBeenCalledWith('--agent-ui-blank-value');
    expect(setProperty).not.toHaveBeenCalledWith('--agent-ui-blank-value', expect.anything());
    restore();
    expect(element.style.getPropertyValue('--agent-ui-null-value')).toBe('null-value');
    expect(element.style.getPropertyValue('--agent-ui-undefined-value')).toBe('undefined-value');
    expect(element.style.getPropertyValue('--agent-ui-empty-value')).toBe('empty-value');
    expect(element.style.getPropertyValue('--agent-ui-blank-value')).toBe('blank-value');
  });

  it('normalizes semantic token names without rewriting direct Agent UI tokens', () => {
    const element = document.createElement('div');
    applyTheme(element, {
      tokens: {
        '  accentColor  ': 'red',
        'token--name': 'blue',
        level2Color: 'green',
        'foo  // bar': 'yellow',
        '-----edge---': 'pink',
        '  --agent-ui-direct  ': 'purple',
      },
    });

    expect(element.style.getPropertyValue('--agent-ui-accent-color')).toBe('red');
    expect(element.style.getPropertyValue('--agent-ui-token--name')).toBe('blue');
    expect(element.style.getPropertyValue('--agent-ui-level2-color')).toBe('green');
    expect(element.style.getPropertyValue('--agent-ui-foo-bar')).toBe('yellow');
    expect(element.style.getPropertyValue('--agent-ui-edge')).toBe('pink');
    expect(element.style.getPropertyValue('--agent-ui-direct')).toBe('purple');
  });

  it('restores the original token when accepted aliases normalize to the same name', () => {
    const element = document.createElement('div');
    element.style.setProperty('--agent-ui-text-color', 'original');

    const restore = applyTheme(element, {
      tokens: {
        textColor: 'first',
        'text-color': 'second',
      },
    });

    expect(element.style.getPropertyValue('--agent-ui-text-color')).toBe('second');
    restore();
    expect(element.style.getPropertyValue('--agent-ui-text-color')).toBe('original');
  });
});
