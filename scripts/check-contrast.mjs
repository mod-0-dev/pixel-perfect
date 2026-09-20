#!/usr/bin/env node
// Verifies the COMMITTED token file, independently of the generator that wrote
// it. If the generator is wrong, or someone hand-edits primitives.css, this is
// what catches it. Run by `npm run lint:contrast`.

import { readFileSync } from 'node:fs';
import { contrastOklch, parseOklch } from './color.mjs';

const src = readFileSync(new URL('../src/styles/tokens/primitives.css', import.meta.url), 'utf8');

/** Pull the declarations belonging to one theme block out of the source. */
function themeBlock(marker) {
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

// The light ramp is the first :root block; the dark ramp is the explicit
// data-pp-theme="dark" block (identical to the prefers-color-scheme one).
const THEMES = {
  light: tokensIn(themeBlock(':root {')),
  dark: tokensIn(themeBlock('[data-pp-theme="dark"] {')),
};

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
const CHECKS = [
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
  { name: 'muted text vs subtle bg', a: '11', b: '2', min: 4.5 },
  { name: 'muted text vs page bg', a: '11', b: '1', min: 4.5 },
  { name: 'body text vs subtle bg', a: '12', b: '2', min: 7.0 },
  { name: 'body text vs page bg', a: '12', b: '1', min: 7.0 },
  { name: 'body text vs component bg', a: '12', b: '3', min: 7.0 },
  { name: 'muted text vs component bg', a: '11', b: '3', min: 4.5 },
];

let failures = 0;
let checked = 0;

for (const [theme, hues] of Object.entries(THEMES)) {
  if (Object.keys(hues).length === 0) {
    console.error(`✗ no tokens parsed for theme "${theme}"`);
    failures++;
    continue;
  }
  for (const [hue, steps] of Object.entries(hues)) {
    for (const check of CHECKS) {
      const a = steps[check.a];
      const b = steps[check.b];
      if (!a || !b) {
        console.error(`✗ ${theme}/${hue}: missing step ${!a ? check.a : check.b}`);
        failures++;
        continue;
      }
      const ratio = contrastOklch(a, b);
      checked++;
      if (ratio < check.min) {
        console.error(
          `✗ ${theme}/${hue}: ${check.name} is ${ratio.toFixed(2)}:1, below ${check.min}:1`,
        );
        failures++;
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
        console.error(
          `✗ ${theme}/${hue}: ramp inversion between step ${i} and ${i + 1}`,
        );
        failures++;
      }
    }
  }
}

/*
 * AND THE OTHER HALF: A CONFORMING VALUE NOBODY READS IS NOT A FIX.
 *
 * Everything above verifies primitives.css. Components never name a primitive
 * (RULES §3) — they read `--pp-color-border` and `--pp-tone-border`, and those
 * are a mapping in semantic.css that this file could not see. Re-point either
 * one back at a ramp step and every assertion above stays green while every
 * control goes back to 1.55:1.
 *
 * So the mapping is asserted too, by name. This is the check that would have
 * caught the gap from the other direction.
 */
const semantic = readFileSync(new URL('../src/styles/tokens/semantic.css', import.meta.url), 'utf8');
const MAPPINGS = [
  ['--pp-color-border', '--pp-palette-neutral-edge'],
  ['--pp-color-border-strong', '--pp-palette-neutral-edge-strong'],
  ['--pp-tone-border', '--pp-palette-<hue>-edge'],
  ['--pp-tone-border-strong', '--pp-palette-<hue>-edge-strong'],
];

for (const [token, expected] of MAPPINGS) {
  // The tone map is emitted once per hue, so `<hue>` stands for each of them.
  const hues = expected.includes('<hue>')
    ? ['neutral', 'accent', 'danger', 'success', 'warning']
    : [null];
  for (const hue of hues) {
    const want = hue ? expected.replace('<hue>', hue) : expected;
    // Match the declaration inside the scope that also declares this hue's tone
    // map, so a neutral-only mapping cannot satisfy the check for five hues.
    const declared = new RegExp(
      `${token.replace(/[-]/g, '\\-')}:\\s*var\\(${want.replace(/[-]/g, '\\-')}\\)`,
    ).test(semantic);
    checked++;
    if (!declared) {
      console.error(`✗ semantic.css: ${token} does not resolve to ${want}`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} contrast/ramp/mapping violation(s) in src/styles/tokens/`);
  process.exit(1);
}
console.log(
  `✓ ${checked} contrast, ramp and mapping assertions passed across 2 themes × 5 hues`,
);
