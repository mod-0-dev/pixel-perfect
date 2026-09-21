/**
 * The numeric contract of Tier 3D, in one file.
 *
 * `NumberInput` (3.14) and `Slider` (3.15) share eight props — `min`, `max`,
 * `step`, `locale`, `formatOptions`, `value`, `defaultValue`, `onValueChange` —
 * and spec §1 says the two must agree about what every one of them means. That
 * agreement is structural here rather than vigilant, for the reason D-028 gave
 * when it put control heights in one file: two components that each implement
 * "snap to step" end up with two subtly different ideas of it, and nobody finds
 * out until a user types something.
 *
 * Internal. Not exported from the package.
 *
 * Spec: docs/specs/tier-3d-composite.md §1, §3, §4
 */

/**
 * How many decimal places a number is written with.
 *
 * Needed because snapping is arithmetic and the arithmetic is wrong by default:
 * `0 + Math.round((0.3 - 0) / 0.1) * 0.1` is 0.30000000000000004, which then
 * renders, and then round-trips into the consumer's state. Rounding the snapped
 * result back to the precision of the inputs is what stops it.
 *
 * Exponential notation is handled because `String(1e-7)` is `"1e-7"`, so the
 * naive "characters after the dot" count returns 0 for the one case where the
 * precision matters most.
 */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(Math.abs(value));
  const exponent = text.indexOf('e-');
  if (exponent !== -1) {
    const mantissa = text.slice(0, exponent).split('.')[1];
    return Number(text.slice(exponent + 2)) + (mantissa ? mantissa.length : 0);
  }
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** `Number.prototype.toFixed` caps at 100 digits and throws above it. */
const roundTo = (value: number, places: number): number =>
  Number(value.toFixed(Math.min(places, 100)));

export interface NumericRange {
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
}

/**
 * The stepping base, which is `min` and falls back to `0`.
 *
 * This is HTML's own rule for `<input type="number">` and `type="range"`, so a
 * `min={1} step={2}` control offers 1, 3, 5 here and in the native element a
 * consumer may have used before. Nothing invents its own base (spec §1).
 */
const baseOf = ({ min }: NumericRange): number => min ?? 0;

/**
 * Snap to the step grid, then pull inside the bounds — and the order matters.
 *
 * Clamping after snapping can leave the value out of range; clamping *to a
 * bound* can leave it off the grid. So an out-of-range result is walked back to
 * the nearest in-range grid point rather than to the bound itself, which is the
 * only answer that satisfies both constraints at once.
 *
 * `step <= 0` and a non-finite step mean "no grid", and only the clamp applies.
 */
export function snapToRange(value: number, range: NumericRange): number {
  const { min, max, step } = range;
  const hasGrid = step !== undefined && Number.isFinite(step) && step > 0;

  if (!hasGrid) {
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
  }

  const base = baseOf(range);
  const places = Math.max(decimalsOf(step), decimalsOf(base));
  const grid = (multiple: number) => roundTo(base + multiple * step, places);

  let snapped = grid(Math.round((value - base) / step));

  // Walked back to the nearest grid point INSIDE the bound, not to the bound.
  if (max !== undefined && snapped > max) snapped = grid(Math.floor((max - base) / step));
  if (min !== undefined && snapped < min) snapped = grid(Math.ceil((min - base) / step));

  /*
   * Reachable only when `max < min`, which is a contradictory configuration
   * rather than a narrow range: with `base === min`, grid(0) is `min` and the
   * two corrections above always land inside their own bound.
   *
   * Ordered so that MIN WINS, because HTML's own rule for `<input type=range>`
   * is that a max below min is treated as equal to min. A component that
   * disagrees with the element it is replacing is a component nobody can
   * predict.
   */
  if (max !== undefined && snapped > max) snapped = max;
  if (min !== undefined && snapped < min) snapped = min;
  return snapped;
}

/**
 * The value `count` steps away from `from`, snapped and clamped.
 *
 * `from === null` is the empty field: the first press commits the bound that
 * exists — `min` going up, `max` going down — rather than starting from an
 * invisible zero (spec §6).
 */
export function stepFrom(from: number | null, count: number, range: NumericRange): number {
  const step = range.step !== undefined && Number.isFinite(range.step) && range.step > 0
    ? range.step
    : 1;

  if (from === null) {
    const start = count > 0 ? range.min : range.max;
    return snapToRange(start ?? 0, range);
  }

  const places = Math.max(decimalsOf(step), decimalsOf(from), decimalsOf(baseOf(range)));
  return snapToRange(roundTo(from + count * step, places), range);
}

/** Whether stepping in this direction can still change anything. */
export function canStep(from: number | null, count: number, range: NumericRange): boolean {
  if (from === null) return true;
  return stepFrom(from, count, range) !== from;
}

/**
 * A matched formatter and parser.
 *
 * They are one object because they must always be derived from the same
 * `Intl.NumberFormat`: a parser that assumes `.` and `,` is a parser that is
 * wrong in about half the world, and one derived from a *different* formatter
 * than the display is wrong in a way that only shows up after a round trip.
 */
export interface NumberIO {
  format(value: number): string;
  parse(text: string): number | null;
  /** True when a locale was given, so a caller can tell formatted from raw. */
  formatted: boolean;
}

/*
 * The minus signs a human can end up with that `Number()` refuses: U+2212 MINUS
 * SIGN (what several locales format with), the figure dash and the en/em dashes
 * a word processor substitutes, and the fullwidth form. A Set rather than a
 * global RegExp on purpose — `/g/.test()` is stateful, and a stateful predicate
 * called once per character is a bug that only shows up on the second call.
 */
const MINUS_SIGNS = new Set(['-', '\u2212', '\u2012', '\u2013', '\u2014', '\uFF0D']);

const stripMinusSigns = (text: string): string =>
  Array.from(text, (character) => (MINUS_SIGNS.has(character) ? '-' : character)).join('');

/**
 * NO AMBIENT LOCALE, AND THAT IS A HYDRATION RULING RATHER THAN A DEFAULT
 * (spec §4, D-051 §1).
 *
 * `new Intl.NumberFormat()` with no locale resolves the *runtime's* — Node's on
 * the server, the user's in the browser — so `1234.5` renders `1,234.5` from a
 * container in en-US and `1.234,5` in a German browser. RULES §7's last line
 * ("server and first client render must match") is then broken by a component
 * that never mentions the viewport, and nothing in the library would have
 * caught it.
 *
 * So `locale === undefined` means no `Intl` at all: `String(value)` out, a
 * strict `Number()` in. Both are the same string in every environment.
 */
export function numberIO(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined,
): NumberIO {
  if (locale === undefined) {
    return {
      formatted: false,
      format: (value) => String(value),
      parse: (text) => {
        const trimmed = text.trim();
        // `Number('')` is 0, which would turn a cleared field into a committed
        // zero. Empty is empty.
        if (trimmed === '') return null;
        const parsed = Number(stripMinusSigns(trimmed));
        return Number.isFinite(parsed) ? parsed : null;
      },
    };
  }

  const nf = new Intl.NumberFormat(locale, options);

  /*
   * Separators and digits are DISCOVERED from the formatter, never hardcoded.
   * A probe number with a group, a fraction and a sign gives all three, and
   * the digit map handles numbering systems that are not Latin — `ar-EG`
   * formats with ٠١٢, and a parser that only knows 0-9 silently rejects
   * everything such a user types.
   */
  const parts = nf.formatToParts(-11111.1);
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const minus = parts.find((part) => part.type === 'minusSign')?.value ?? '-';

  const digits = new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210);
  const digitMap = new Map<string, string>();
  for (let index = 0; index < digits.length; index += 1) {
    // digits is "9876543210" in the locale's numbering system.
    digitMap.set(digits[index] as string, String(9 - index));
  }

  // `style: 'percent'` formats 0.5 as "50%", so parsing has to undo the scale.
  const percent = options?.style === 'percent';

  return {
    formatted: true,
    format: (value) => nf.format(value),
    parse: (text) => {
      let out = '';
      for (const character of text) {
        const digit = digitMap.get(character);
        if (digit !== undefined) out += digit;
        else if (character >= '0' && character <= '9') out += character;
        else if (character === decimal) out += '.';
        else if (character === minus || MINUS_SIGNS.has(character)) out += '-';
        // Everything else is DROPPED rather than rejected: the group separator,
        // a currency symbol, a percent sign, the non-breaking space fr-FR
        // groups with. Stripping by exclusion rather than against a list is
        // what makes a locale nobody here has heard of work.
      }
      if (out === '' || out === '-') return null;
      const parsed = Number(out);
      if (!Number.isFinite(parsed)) return null;
      return percent ? parsed / 100 : parsed;
    },
  };
}
