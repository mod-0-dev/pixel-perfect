import { describe, expect, it } from 'vitest';
import {
  clampChroma,
  contrast,
  contrastOklch,
  oklchToSrgb,
  parseOklch,
  solveLightness,
} from '../../scripts/color.mjs';

describe('contrast', () => {
  it('matches the WCAG reference extremes', () => {
    const white = oklchToSrgb(1, 0, 0).rgb;
    const black = oklchToSrgb(0, 0, 0).rgb;
    expect(contrast(white, black)).toBeCloseTo(21, 2);
    expect(contrast(white, white)).toBeCloseTo(1, 5);
  });

  it('matches the canonical AA boundary grey', () => {
    // #767676 on white is the textbook 4.54:1 — the lightest grey that passes.
    expect(contrast([0.4627, 0.4627, 0.4627], [1, 1, 1])).toBeCloseTo(4.54, 2);
  });

  it('is symmetric', () => {
    const a = oklchToSrgb(0.55, 0.17, 258).rgb;
    const b = oklchToSrgb(0.98, 0.01, 258).rgb;
    expect(contrast(a, b)).toBeCloseTo(contrast(b, a), 10);
  });
});

describe('gamut clamping', () => {
  it('leaves an in-gamut chroma untouched', () => {
    expect(clampChroma(0.55, 0.05, 258)).toBeCloseTo(0.05, 6);
  });

  it('reduces an out-of-gamut chroma into sRGB', () => {
    const clamped = clampChroma(0.9, 0.4, 258);
    expect(clamped).toBeLessThan(0.4);
    expect(oklchToSrgb(0.9, clamped, 258).inGamut).toBe(true);
  });

  it('never returns a negative chroma', () => {
    for (const L of [0.05, 0.3, 0.5, 0.7, 0.99]) {
      for (const H of [0, 80, 150, 258, 340]) {
        expect(clampChroma(L, 0.5, H)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('solveLightness', () => {
  it('finds a lightness meeting the requested contrast', () => {
    const against = [0.98, 0.01, 258] as const;
    const L = solveLightness({
      against,
      target: 4.5,
      hue: 258,
      chroma: 0.12,
      lo: 0.3,
      hi: 0.7,
      direction: 'lightest',
    });
    expect(L).not.toBeNull();
    expect(contrastOklch([L!, clampChroma(L!, 0.12, 258), 258], against)).toBeGreaterThanOrEqual(4.5);
  });

  it('returns null when the target is unreachable in the range', () => {
    const L = solveLightness({
      against: [1, 0, 0],
      target: 21,
      hue: 258,
      chroma: 0.12,
      lo: 0.6,
      hi: 0.9,
      direction: 'lightest',
    });
    expect(L).toBeNull();
  });
});

describe('parseOklch', () => {
  it('round-trips a generated value', () => {
    expect(parseOklch('oklch(55% 0.17 258)')).toEqual([0.55, 0.17, 258]);
  });

  it('returns null for anything else', () => {
    expect(parseOklch('#ff0000')).toBeNull();
  });
});
