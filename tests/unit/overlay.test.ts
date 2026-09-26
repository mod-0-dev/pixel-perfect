import { describe, expect, it } from 'vitest';

import { directionOf, resolveSide } from '../../src/internal/overlay/side';
import { resolveSpace } from '../../src/internal/overlay/space';

/**
 * The overlay foundation's two pure resolutions (overlay-foundation.md §5,
 * §9). The DOM half of each — reading `direction` and a token off a real
 * computed style — is asserted in the browser suite, because jsdom has no
 * cascade to read them from; here the injected values prove the mapping.
 */
describe('resolveSide', () => {
  it('maps start and end to left and right in a left-to-right layout', () => {
    expect(resolveSide('start', 'ltr')).toBe('left');
    expect(resolveSide('end', 'ltr')).toBe('right');
  });

  it('mirrors them in a right-to-left layout', () => {
    expect(resolveSide('start', 'rtl')).toBe('right');
    expect(resolveSide('end', 'rtl')).toBe('left');
  });

  it('leaves the block sides alone in both directions', () => {
    for (const direction of ['ltr', 'rtl'] as const) {
      expect(resolveSide('top', direction)).toBe('top');
      expect(resolveSide('bottom', direction)).toBe('bottom');
    }
  });
});

describe('directionOf', () => {
  it('is left-to-right for no element, the document default', () => {
    expect(directionOf(null)).toBe('ltr');
    expect(directionOf(undefined)).toBe('ltr');
  });

  it('reads a computed rtl direction', () => {
    const el = document.createElement('div');
    el.style.direction = 'rtl';
    document.body.appendChild(el);
    expect(directionOf(el)).toBe('rtl');
    el.remove();
  });
});

describe('resolveSpace', () => {
  /* jsdom resolves inline custom properties through getComputedStyle, which
     is enough to prove the unit conversion; the token's real value is read in
     the browser suite. */
  const withToken = (value: string) => {
    const el = document.createElement('div');
    el.style.setProperty('--pp-space-2', value);
    document.body.appendChild(el);
    return el;
  };

  it('converts rem through the root font size', () => {
    const el = withToken('0.5rem');
    // jsdom reports no root font size, so the browser default of 16px applies.
    expect(resolveSpace(el, '2')).toBe(8);
    el.remove();
  });

  it('passes px through', () => {
    const el = withToken('12px');
    expect(resolveSpace(el, '2')).toBe(12);
    el.remove();
  });

  it('is zero for no element, an unreadable value, or a missing token', () => {
    expect(resolveSpace(null, '2')).toBe(0);
    const el = withToken('nonsense');
    expect(resolveSpace(el, '2')).toBe(0);
    expect(resolveSpace(el, '9')).toBe(0);
    el.remove();
  });
});
