// pixel-perfect/theme — a brand accent, solved and proven (D-103).
//
// The library's palette is five hues run through palette.mjs. This module
// runs a consumer's accent through the same solver, lays the result out in
// the four theme scopes primitives.css uses (D-010), and checks the TEXT it
// wrote with the checks `npm run lint:contrast` holds the library's own
// tokens to (check.mjs, D-008). Other libraries hand you a palette; this one
// hands you a palette and the proof.
//
// Pure: no I/O, no globals. The CLI (cli.mjs) and the playground's /theme
// page are its two callers, one in Node and one in a browser.

import { contrastOklch, formatOklch, parseColor } from './color.mjs';
import { checkPalette, parsePalette } from './check.mjs';
import { HUES, paletteDeclarations, solvePalette } from './palette.mjs';

export { parseColor } from './color.mjs';

/**
 * @typedef {{ hue: number, peak: number, solidL: { light: number, dark: number } }} HueSpec
 *   A hue as the solver takes it: the hue angle, the peak chroma every step's
 *   chroma is a fraction of, and where the solid fill starts in each theme.
 * @typedef {{ fill: string, text: 'white' | 'dark', ratio: number, started: number, landed: number }} AccentSummary
 *   Where the accent's solid fill landed in one theme: its value, the text it
 *   carries, their contrast, and the lightness it started from and ended at.
 * @typedef {{
 *   css: string,
 *   checks: { checked: number, failures: string[] },
 *   hues: Record<'neutral' | 'accent' | 'danger' | 'success' | 'warning', HueSpec>,
 *   accent: { light: AccentSummary, dark: AccentSummary },
 * }} Theme
 */

/** The library's own accent, as an input `createTheme` reproduces exactly. */
export const LIBRARY_ACCENT = 'oklch(55% 0.17 258)';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/*
 * WHERE A COLOUR'S FILL STARTS, PER THEME.
 *
 * The solver takes a designed lightness for the solid fill in each theme and
 * walks it only as far as 4.5:1 demands (palette.mjs). Light starts at your
 * colour's own lightness — so in the light theme the button IS your colour
 * whenever your colour can carry text. Dark starts lighter, as every
 * library hue does, by an amount that shrinks as the colour gets lighter:
 * +0.15 at L 0.55 and below, which is the library accent's 0.55 -> 0.70, and
 * +0.02 at L 0.80 and above, which is the library warning's 0.80 -> 0.82, in
 * a straight line between. The walk does the rest.
 */
function darkStart(L) {
  const t = clamp((L - 0.55) / 0.25, 0, 1);
  return L + 0.15 * (1 - t) + 0.02 * t;
}

/**
 * The hue spec a colour describes: the accent's hue, its chroma as the peak
 * every step's chroma is a fraction of, and the fill's starting lightness in
 * each theme. A bare hue keeps the library accent's chroma and lightness.
 *
 * @param {string | number} input
 * @returns {HueSpec}
 */
export function accentFrom(input) {
  const color = parseColor(input);
  if (!color) {
    throw new TypeError(
      `Not a colour: ${JSON.stringify(input)}. Use a hex value (#7c3aed), oklch(55% 0.2 293), or a hue angle (293).`,
    );
  }
  const hue = Math.round(color.H * 10) / 10;
  if (color.L === undefined || color.C === undefined) {
    return { hue, peak: HUES.accent.peak, solidL: { ...HUES.accent.solidL } };
  }
  const light = clamp(color.L, 0.25, 0.92);
  return {
    hue,
    peak: clamp(color.C, 0, 0.37),
    solidL: { light: Math.round(light * 1000) / 1000, dark: Math.round(clamp(darkStart(light), 0.3, 0.92) * 1000) / 1000 },
  };
}

/**
 * The complete palette — every hue, both themes — solved around an accent,
 * as a stylesheet, with the result of checking that stylesheet.
 *
 * Every hue is written, not only the accent: each hue's focus ring is solved
 * against every hue's surfaces (0.11), so a new accent moves them all.
 *
 * @param {{ accent: string | number, neutral?: 'accent' | number, command?: string }} options
 *   `neutral` tints the greys: `'accent'` leans them toward the accent's hue,
 *   a number toward that hue. `command` is quoted in the header, so the file
 *   says how to make it again.
 * @throws {TypeError} when `accent` is not a colour
 * @throws {Error} when the solver cannot meet a target at this hue and chroma
 * @returns {Theme}
 */
export function createTheme({ accent, neutral, command }) {
  const spec = accentFrom(accent);
  const hues = { ...HUES, accent: spec };
  if (neutral !== undefined) {
    const neutralHue = neutral === 'accent' ? spec.hue : parseColor(neutral)?.H;
    if (neutralHue === undefined) throw new TypeError(`Not a hue: ${JSON.stringify(neutral)}. Use "accent" or a number.`);
    hues.neutral = { ...HUES.neutral, hue: Math.round(neutralHue * 10) / 10 };
  }

  let light;
  let dark;
  try {
    light = solvePalette('light', hues);
    dark = solvePalette('dark', hues);
  } catch (error) {
    throw new Error(`This accent cannot be solved: ${error instanceof Error ? error.message : String(error)}`);
  }

  const body = `@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides;

@layer pp.overrides {
  :root {
${paletteDeclarations(light.ramps, '    ')}
  }

  [data-pp-theme="light"] {
${paletteDeclarations(light.ramps, '    ')}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-pp-theme]) {
${paletteDeclarations(dark.ramps, '      ')}
    }
  }

  [data-pp-theme="dark"] {
${paletteDeclarations(dark.ramps, '    ')}
  }
}
`;

  // Checked from the text, never from the solver's numbers (D-008).
  const checks = checkPalette(parsePalette(body));

  /**
   * @param {'light' | 'dark'} themeName
   * @param {{ ramps: Record<string, any> }} solved
   * @returns {AccentSummary}
   */
  const summary = (themeName, solved) => {
    const ramp = solved.ramps.accent;
    const fill = ramp.steps[9];
    return {
      fill: formatOklch(...fill),
      text: ramp.notes.onSolid,
      ratio: Math.round(contrastOklch(fill, ramp.notes.onSolidValue) * 100) / 100,
      started: spec.solidL[themeName],
      landed: Math.round(fill[0] * 1000) / 1000,
    };
  };

  const input = typeof accent === 'number' ? String(accent) : accent;
  const header = `/*
 * PIXEL PERFECT THEME — GENERATED FILE, DO NOT EDIT BY HAND.
 * Accent: ${input} (hue ${spec.hue}, chroma ${spec.peak.toFixed(3)})${
   hues.neutral.hue !== HUES.neutral.hue ? `\n * Neutral: hue ${hues.neutral.hue}` : ''
 }${command ? `\n * Regenerate: ${command}` : ''}
 *
 * The library's complete palette, every hue in both themes, solved around
 * this accent by the library's own generator and checked by its own contrast
 * checks: ${checks.checked} assertions, ${checks.failures.length === 0 ? 'all passing' : `${checks.failures.length} FAILING`}.
 * Import it after pixel-perfect/styles.css. It sits in the pp.overrides
 * layer, so it wins over the library's tokens whichever is imported first,
 * and it carries all four theme scopes, so light, dark, system and nested
 * themes all follow it. Regenerate after upgrading pixel-perfect.
 */
`;

  return {
    css: header + body,
    checks,
    hues,
    accent: { light: summary('light', light), dark: summary('dark', dark) },
  };
}
