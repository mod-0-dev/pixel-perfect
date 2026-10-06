#!/usr/bin/env node
// Verifies the COMMITTED token file, independently of the generator that wrote
// it. If the generator is wrong, or someone hand-edits primitives.css, this is
// what catches it. Run by `npm run lint:contrast`.

import { readFileSync } from 'node:fs';
import { checkPalette, parsePalette } from '../src/theme/check.mjs';

const src = readFileSync(new URL('../src/styles/tokens/primitives.css', import.meta.url), 'utf8');

// The palette checks — per hue, per ramp, and the shipped ring on every hue's
// surfaces — live in src/theme/check.mjs, so a consumer's generated palette
// meets the same ones (D-103). This file adds the semantic mappings, which
// are the library's alone, and prints.
const palette = checkPalette(parsePalette(src));
for (const message of palette.failures) console.error(message);

let failures = palette.failures.length;
let checked = palette.checked;

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
  // The ring the whole library draws. Re-point this at a ramp step and every
  // value assertion above stays green while every focus ring goes unverified.
  ['--pp-color-focus-ring', '--pp-palette-accent-focus'],
  // The inverse surface is the body-text pair reversed, in BOTH themes: the
  // value check above only means something while these two stay pointed at
  // steps 12 and 1 (D-064 §2).
  ['--pp-color-bg-inverse', '--pp-palette-neutral-12'],
  ['--pp-color-text-inverse', '--pp-palette-neutral-1'],
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
