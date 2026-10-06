// The palette's contrast, ramp and shipped-ring assertions, re-derived from
// CSS TEXT — never from the solver's own numbers (D-008). Moved here from
// scripts/check-contrast.mjs so the same checks run on three things: the
// library's committed primitives.css (`npm run lint:contrast`), the
// stylesheet the theme CLI writes for a consumer's accent, and the one the
// playground's /theme page builds as you drag (D-103). A consumer's palette
// is held to exactly the bar the library's own is.

import { contrastOklch, parseOklch } from './color.mjs';

/** Pull the declarations belonging to one theme block out of the source. */
function themeBlock(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`token block not found: ${marker}`);
  const from = src.indexOf('{', start) + 1;
  let depth = 1;
  let i = from;
  while (depth > 0 && i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(from, i);
}

function tokensIn(block) {
  const out = {};
  for (const m of block.matchAll(/--pp-palette-([a-z]+)-([a-z0-9-]+):\s*(oklch\([^)]*\))/g)) {
    (out[m[1]] ??= {})[m[2]] = parseOklch(m[3]);
  }
  return out;
}

/**
 * The light and dark palettes in a stylesheet laid out as primitives.css is:
 * light in the first `:root` block, dark in the explicit
 * `[data-pp-theme="dark"]` one (identical to the prefers-color-scheme one).
 *
 * @param {string} src
 */
export function parsePalette(src) {
  return {
    light: tokensIn(themeBlock(src, ':root {')),
    dark: tokensIn(themeBlock(src, '[data-pp-theme="dark"] {')),
  };
}

/*
 * A BORDER IS NEITHER INK NOR FILL, AND FOR THE FIRST NINE COMPONENTS OF TIER 3
 * NOTHING HERE LOOKED AT ONE (D-048 §2, D-050).
 *
 * Every check below this comment used to be ink-on-fill or the focus ring, so
 * `lint:contrast` was green while the resting edge of every control in the
 * library sat at 1.55:1 against the page in the light theme. A missing check
 * class reads exactly like a passing one.
 *
 * `edge` is the step `--pp-color-border` and `--pp-tone-border` resolve to, and
 * a border is adjacent to whatever is on BOTH sides of it: the control's own
 * fill and the surface behind it. Steps 1, 2 and 3 are every neutral surface
 * the semantic layer names — page, surface and sunken/raised across the two
 * themes — so all three are checked rather than the one that happens to be
 * hardest today.
 */
export const CHECKS = [
  { name: 'edge vs page bg', a: 'edge', b: '1', min: 3.0 },
  { name: 'edge vs subtle bg', a: 'edge', b: '2', min: 3.0 },
  { name: 'edge vs component bg', a: 'edge', b: '3', min: 3.0 },
  { name: 'edge-strong vs page bg', a: 'edge-strong', b: '1', min: 4.5 },
  { name: 'edge-strong vs subtle bg', a: 'edge-strong', b: '2', min: 4.5 },
  { name: 'edge-strong vs component bg', a: 'edge-strong', b: '3', min: 4.5 },
  { name: 'solid vs on-solid text', a: '9', b: 'on-solid', min: 4.5 },
  { name: 'solid-hover vs on-solid', a: '10', b: 'on-solid', min: 4.5 },
  { name: 'solid-active vs on-solid', a: 'solid-active', b: 'on-solid', min: 4.5 },
  { name: 'focus ring vs page bg', a: 'focus', b: '1', min: 3.0 },
  /*
   * AND THE TWO SURFACES THE RING WAS NEVER CHECKED AGAINST (0.11, D-053 §2).
   *
   * Until `Alert` there was one pairing here, against step 1, and it read like
   * a solved ring. It is not the ring's only neighbour: `--pp-color-bg-surface`
   * is step 2 and has been shipping since 3A at 2.94 / 2.85, and any toned
   * surface is step 3, where the ring measured 2.74-2.77 light and 2.54-2.57
   * dark. `edge` three lines above has been solved against all three since
   * D-050; the ring simply never was, and the generator's own header said so
   * in a line nobody read as a claim.
   */
  { name: 'focus ring vs subtle bg', a: 'focus', b: '2', min: 3.0 },
  { name: 'focus ring vs component bg', a: 'focus', b: '3', min: 3.0 },
  { name: 'muted text vs subtle bg', a: '11', b: '2', min: 4.5 },
  { name: 'muted text vs page bg', a: '11', b: '1', min: 4.5 },
  { name: 'body text vs subtle bg', a: '12', b: '2', min: 7.0 },
  { name: 'body text vs page bg', a: '12', b: '1', min: 7.0 },
  { name: 'body text vs component bg', a: '12', b: '3', min: 7.0 },
  { name: 'muted text vs component bg', a: '11', b: '3', min: 4.5 },
  /*
   * THE INVERSE SURFACE (D-064 §2): `--pp-color-text-inverse` on
   * `--pp-color-bg-inverse` is step 1 on step 12, the body-text pair reversed.
   * Contrast is symmetric, so the number is the one two lines up — and it is
   * asserted again under this name anyway, because the pair is retuned
   * together or not at all, and a check nobody can find by the token's name
   * is a check nobody re-reads when the token changes.
   */
  { name: 'inverse text vs inverse bg', a: '1', b: '12', min: 7.0 },
];

/**
 * Every per-hue pairing, every ramp's monotonicity, and the shipped ring on
 * every hue's surfaces.
 *
 * @param {ReturnType<typeof parsePalette>} THEMES
 * @returns {{ checked: number, failures: string[] }}
 */
export function checkPalette(THEMES) {
  const failures = [];
  const report = (message) => failures.push(message);
  let checked = 0;

  for (const [theme, hues] of Object.entries(THEMES)) {
    if (Object.keys(hues).length === 0) {
      report(`✗ no tokens parsed for theme "${theme}"`);
      continue;
    }
    for (const [hue, steps] of Object.entries(hues)) {
      for (const check of CHECKS) {
        const a = steps[check.a];
        const b = steps[check.b];
        if (!a || !b) {
          report(`✗ ${theme}/${hue}: missing step ${!a ? check.a : check.b}`);
          continue;
        }
        const ratio = contrastOklch(a, b);
        checked++;
        if (ratio < check.min) {
          report(
            `✗ ${theme}/${hue}: ${check.name} is ${ratio.toFixed(2)}:1, below ${check.min}:1`,
          );
        }
      }

      // Lightness across steps 1-8 must move in one direction. A local inversion
      // means hover states go the wrong way.
      const descending = theme === 'light';
      for (let i = 1; i < 8; i++) {
        const a = steps[String(i)];
        const b = steps[String(i + 1)];
        if (!a || !b) continue;
        checked++;
        if (descending ? b[0] >= a[0] : b[0] <= a[0]) {
          report(
            `✗ ${theme}/${hue}: ramp inversion between step ${i} and ${i + 1}`,
          );
        }
      }
    }
  }

  /*
   * THE RING THAT SHIPS IS ONE COLOUR ON FIVE HUES' SURFACES.
   *
   * Everything above is per hue: accent's focus against accent's steps. That is
   * not what a browser draws. `--pp-color-focus-ring` is `accent-focus` for the
   * whole library (D-029), and `Alert` put it on a DANGER surface — so the
   * pairing that decides whether a focused control is visible inside a danger
   * alert is accent's ring against danger's step 3, which no per-hue loop can
   * see. The spread is small and it is not zero: 2.74 on danger against 2.77 on
   * success, which is the difference between failing and failing by more.
   *
   * This is also the check that would have caught the assertion `Alert`'s
   * browser suite got wrong, from the other end: pointed at the accent alert,
   * where the tone ring and the library ring are the same value, nothing is
   * being compared at all (D-053 §5).
   */
  const RING_SURFACES = ['1', '2', '3'];
  for (const [theme, hues] of Object.entries(THEMES)) {
    const ring = hues.accent?.focus;
    if (!ring) {
      report(`✗ ${theme}: no accent focus step to check the shipped ring against`);
      continue;
    }
    for (const [hue, steps] of Object.entries(hues)) {
      for (const step of RING_SURFACES) {
        const against = steps[step];
        if (!against) continue;
        const ratio = contrastOklch(ring, against);
        checked++;
        if (ratio < 3.0) {
          report(
            `✗ ${theme}: the shipped ring (accent focus) vs ${hue} step ${step} is ${ratio.toFixed(2)}:1, below 3:1`,
          );
        }
      }
    }
  }

  return { checked, failures };
}
