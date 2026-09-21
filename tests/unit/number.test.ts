import { describe, expect, it } from 'vitest';

import {
  canStep,
  decimalsOf,
  numberIO,
  snapToRange,
  stepFrom,
} from '../../src/internal/number';

/**
 * The numeric contract of Tier 3D (spec §1, §3, §4), tested here rather than
 * twice over in NumberInput and Slider — which is the reason it is one module.
 */

describe('decimalsOf', () => {
  it('counts the places a number is written with', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.125)).toBe(3);
    expect(decimalsOf(-2.5)).toBe(1);
  });

  it('handles exponential notation, where the naive count returns zero', () => {
    // String(1e-7) is "1e-7", so "characters after the dot" is 0 for the one
    // case where the precision matters most.
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(1.5e-7)).toBe(8);
  });

  it('is zero for values with no finite decimal form', () => {
    expect(decimalsOf(Number.POSITIVE_INFINITY)).toBe(0);
    expect(decimalsOf(Number.NaN)).toBe(0);
  });
});

describe('snapToRange', () => {
  /*
   * THE CASE THAT FAILS WITHOUT THE ROUNDING (spec §3). It passes trivially
   * with integers, which is why it is named rather than left to a sweep.
   */
  it('does not produce 0.30000000000000004', () => {
    expect(snapToRange(0.3, { step: 0.1 })).toBe(0.3);
    expect(snapToRange(0.7, { step: 0.1 })).toBe(0.7);
    expect(snapToRange(1.1 + 2.2, { step: 0.1 })).toBe(3.3);
  });

  it('takes its stepping base from min, the way HTML does', () => {
    // min=1 step=2 offers 1, 3, 5 — not 0, 2, 4.
    expect(snapToRange(2, { min: 1, step: 2 })).toBe(3);
    expect(snapToRange(1.9, { min: 1, step: 2 })).toBe(1);
    expect(snapToRange(2, { step: 2 })).toBe(2);
  });

  it('walks an out-of-range result back to a grid point inside the bound', () => {
    // 98 snaps to 100, which is over max; the answer is 95, not 97 — in range
    // AND on the grid, which clamping to the bound would not be.
    expect(snapToRange(98, { max: 97, step: 5 })).toBe(95);
    expect(snapToRange(-3, { min: 0, max: 100, step: 7 })).toBe(0);
  });

  it('never returns a value below min, even from a grid point', () => {
    // The grid here is 3, 8, 13 — base is min, so nothing snaps under it.
    expect(snapToRange(1, { min: 3, max: 100, step: 5 })).toBe(3);
    expect(snapToRange(4, { min: 3, max: 100, step: 5 })).toBe(3);
    expect(snapToRange(6, { min: 3, max: 100, step: 5 })).toBe(8);
  });

  it('lets min win when max is below it, the way HTML does', () => {
    // A contradictory configuration. HTML treats a max below min as equal to
    // min; a component that disagrees with the element it replaces is one
    // nobody can predict.
    expect(snapToRange(50, { min: 10, max: 4, step: 1 })).toBe(10);
  });

  it('clamps without a grid when step is absent, zero or negative', () => {
    expect(snapToRange(11, { max: 10 })).toBe(10);
    expect(snapToRange(11, { max: 10, step: 0 })).toBe(10);
    expect(snapToRange(4.7, { step: -1 })).toBe(4.7);
  });
});

describe('stepFrom', () => {
  it('steps, snaps and clamps in one move', () => {
    expect(stepFrom(3, 1, { step: 1 })).toBe(4);
    expect(stepFrom(3, -1, { step: 1 })).toBe(2);
    expect(stepFrom(10, 1, { max: 10, step: 1 })).toBe(10);
    expect(stepFrom(0.1, 1, { step: 0.1 })).toBe(0.2);
  });

  it('starts an empty field at the bound that exists, not at zero', () => {
    expect(stepFrom(null, 1, { min: 5, max: 9, step: 1 })).toBe(5);
    expect(stepFrom(null, -1, { min: 5, max: 9, step: 1 })).toBe(9);
    expect(stepFrom(null, 1, { step: 1 })).toBe(0);
  });

  it('steps by 1 when no step is given', () => {
    expect(stepFrom(3, 1, {})).toBe(4);
  });
});

describe('canStep', () => {
  it('reports whether stepping can still change anything', () => {
    expect(canStep(10, 1, { max: 10, step: 1 })).toBe(false);
    expect(canStep(9, 1, { max: 10, step: 1 })).toBe(true);
    expect(canStep(0, -1, { min: 0, step: 1 })).toBe(false);
    // An empty field can always be stepped — that is what commits the bound.
    expect(canStep(null, 1, { max: 10, step: 1 })).toBe(true);
  });
});

describe('numberIO without a locale', () => {
  const io = numberIO(undefined, undefined);

  it('is not formatted, so the string is the same in every runtime', () => {
    expect(io.formatted).toBe(false);
    expect(io.format(1234.5)).toBe('1234.5');
  });

  it('treats an empty field as empty rather than as zero', () => {
    // Number('') is 0, which would turn a cleared field into a committed zero.
    expect(io.parse('')).toBeNull();
    expect(io.parse('   ')).toBeNull();
  });

  it('rejects text that is not a number rather than guessing', () => {
    expect(io.parse('abc')).toBeNull();
    expect(io.parse('-')).toBeNull();
  });

  it('accepts the minus signs a word processor substitutes', () => {
    expect(io.parse('−2.5')).toBe(-2.5);
    expect(io.parse('-2.5')).toBe(-2.5);
  });
});

describe('numberIO with a locale', () => {
  it('round-trips a German decimal comma', () => {
    const io = numberIO('de-DE', { minimumFractionDigits: 1 });
    expect(io.format(1234.5)).toBe('1.234,5');
    expect(io.parse('1.234,5')).toBe(1234.5);
    // The bug this component exists to escape: `1,5` must not become 15.
    expect(io.parse('1,5')).toBe(1.5);
  });

  it('is strict about which separator is the decimal one', () => {
    const io = numberIO('de-DE', undefined);
    // In de-DE the dot groups. `1.5` is 15, and guessing otherwise is how a
    // tolerant parser loses an order of magnitude.
    expect(io.parse('1.5')).toBe(15);
  });

  it('strips a currency symbol and the space that comes with it', () => {
    const io = numberIO('de-DE', { style: 'currency', currency: 'EUR' });
    expect(io.parse(io.format(12.34))).toBe(12.34);
  });

  it('undoes the percent scale, because format applies it', () => {
    const io = numberIO('en-US', { style: 'percent' });
    expect(io.format(0.5)).toBe('50%');
    expect(io.parse('50%')).toBe(0.5);
  });

  it('reads a numbering system that is not Latin', () => {
    // A parser that only knows 0-9 silently rejects everything such a user
    // types, which is the failure a hardcoded separator list produces too.
    const io = numberIO('ar-EG', undefined);
    const formatted = io.format(42);
    expect(formatted).not.toBe('42');
    expect(io.parse(formatted)).toBe(42);
  });

  it('parses a negative formatted with U+2212', () => {
    const io = numberIO('sv-SE', undefined);
    expect(io.parse(io.format(-7))).toBe(-7);
  });

  it('returns null for an empty or sign-only field', () => {
    const io = numberIO('fr-FR', undefined);
    expect(io.parse('')).toBeNull();
    expect(io.parse('-')).toBeNull();
  });
});
