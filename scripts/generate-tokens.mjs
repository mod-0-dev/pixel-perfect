#!/usr/bin/env node
// Generates src/styles/tokens/primitives.css and semantic.css.
//
// The palette itself is solved by src/theme/palette.mjs — the same code a
// consumer's brand accent goes through (D-103) — and its header says what is
// solved for what. This file decides the library's own hues (palette.mjs's
// HUES), lays the solved palette out in the four theme scopes D-010 needs,
// adds the theme-independent scales, and writes the semantic layer.
//
// Re-run with `npm run tokens`. The output is committed; `npm run lint:contrast`
// verifies the committed file independently of this generator.

import { writeFileSync } from 'node:fs';
import { BASE, THEME_SPECIFIC, TONES, toneMap } from './semantic-tokens.mjs';
import { paletteDeclarations, solvePalette } from '../src/theme/palette.mjs';

const light = solvePalette('light');
const dark = solvePalette('dark');
const lightCss = paletteDeclarations(light.ramps, '    ');
const darkCss = paletteDeclarations(dark.ramps, '    ');
const darkNestedCss = paletteDeclarations(dark.ramps, '      ');

const header = `/*
 * PRIMITIVE TOKENS — GENERATED FILE, DO NOT EDIT BY HAND.
 * Regenerate with \`npm run tokens\`. Source: scripts/generate-tokens.mjs
 *
 * These are raw values with no meaning attached. Components must never
 * reference them directly — see src/styles/tokens/semantic.css. (RULES §3)
 *
 * Ramp step semantics:
 *   1-2   page and subtle backgrounds
 *   3-5   component backgrounds: rest, hover, active
 *   6-7   decorative borders and dividers  (NO contrast obligation)
 *   8     a heavier decorative border       (NO contrast obligation)
 *   9-10  solid fill: rest, hover           (>= 4.5:1 against -on-solid)
 *   11    muted text                        (>= 4.5:1 on step 3)
 *   12    body text                         (fixed lightness, asserted >= 7:1 on step 3)
 *   -focus         focus ring               (>= 3:1 on steps 1, 2 and 3, EVERY hue)
 *   -edge          a control's boundary     (>= 3:1 on steps 1, 2 and 3)
 *   -edge-strong   its strong/hover state   (>= 4.5:1 on steps 1, 2 and 3)
 *
 * The three lines above steps 9-10 were WRONG until D-050. They read
 * "6-7 borders: subtle, interactive" and "8 strong border and focus ring
 * (>= 3:1 on step 1)" — but step 8 is a fixed lightness at 1.97:1 on step 1,
 * and the focus ring had already been moved to its own solved token precisely
 * because step 8 could not carry the requirement. A generated file claimed a
 * guarantee that nothing produced and nothing checked.
 *
 * The -focus line was then ACCURATE and still incomplete until 0.11. It said
 * "on step 1" and meant it; what nobody read it as was a statement that the
 * ring's other two neighbours were unchecked: --pp-color-bg-surface (step 2)
 * since Tier 3A, and any toned surface (step 3) since Alert (5.2). An accurate
 * line in a file nobody re-reads is worth what the wrong one was (D-053 §2).
 *   -solid-active  pressed solid fill    (>= 4.5:1 against -on-solid)
 *   -on-solid      text/icon colour for steps 9-10 and -solid-active
 */
`;

const css = `${header}
@layer pp.tokens {
  :root {
${lightCss}

    /* ---- Dimension, type, motion. Theme-independent. ---- */

    /* Space — 4px base, in rem so it respects user font size. */
    --pp-space-0: 0;
    --pp-space-1: 0.25rem;
    --pp-space-2: 0.5rem;
    --pp-space-3: 0.75rem;
    --pp-space-4: 1rem;
    --pp-space-5: 1.5rem;
    --pp-space-6: 2rem;
    --pp-space-7: 3rem;
    --pp-space-8: 4rem;
    --pp-space-9: 6rem;

    /* Size — for boxes, as space is for the gaps between them. Indexed in
       quarter-rems so the number reads as a length: size-8 is 2rem. Icons,
       avatars, chips and (from Tier 3) controls take their fixed dimensions
       from here. Never for padding or gap — that is the space scale. */
    --pp-size-3: 0.75rem;
    --pp-size-4: 1rem;
    --pp-size-5: 1.25rem;
    --pp-size-6: 1.5rem;
    --pp-size-7: 1.75rem;
    --pp-size-8: 2rem;
    --pp-size-9: 2.25rem;
    --pp-size-10: 2.5rem;
    --pp-size-11: 2.75rem;
    --pp-size-12: 3rem;

    /* Measure — how wide a column of content is allowed to get. A third
       dimensional scale, because it answers a different question from the
       other two: space is the rhythm BETWEEN boxes, size is how big a box is,
       measure is how wide content may run before it stops being readable.
       Expressing 40rem on the size scale would make it --pp-size-160.

       Container consumes them (RULES §1, D-001), and so do the overlays of
       Tier 4, which have no parent in flow to size them (D-061 §3) — xs is
       theirs: a popover, a menu, a toast. They are exported so a consuming
       app can align its own full-bleed sections to the same measures without
       hardcoding them. */
    --pp-measure-xs: 20rem;
    --pp-measure-sm: 40rem;
    --pp-measure-md: 64rem;
    --pp-measure-lg: 80rem;

    /* Radius */
    --pp-radius-0: 0;
    --pp-radius-1: 0.25rem;
    --pp-radius-2: 0.375rem;
    --pp-radius-3: 0.5rem;
    --pp-radius-4: 0.75rem;
    --pp-radius-5: 1rem;
    --pp-radius-full: 9999px;

    /* Border width */
    --pp-border-width-1: 1px;
    --pp-border-width-2: 2px;

    /* Type scale — 1.125 ratio off a 1rem base. */
    --pp-font-family-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
      Roboto, "Helvetica Neue", Arial, sans-serif;
    --pp-font-family-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo,
      Consolas, "Liberation Mono", monospace;

    --pp-font-size-1: 0.75rem;
    --pp-font-size-2: 0.875rem;
    --pp-font-size-3: 1rem;
    --pp-font-size-4: 1.125rem;
    --pp-font-size-5: 1.25rem;
    --pp-font-size-6: 1.5rem;
    --pp-font-size-7: 1.875rem;
    --pp-font-size-8: 2.25rem;
    --pp-font-size-9: 3rem;

    --pp-line-height-tight: 1.2;
    --pp-line-height-snug: 1.4;
    --pp-line-height-normal: 1.6;

    --pp-font-weight-regular: 400;
    --pp-font-weight-medium: 500;
    --pp-font-weight-semibold: 600;
    --pp-font-weight-bold: 700;

    --pp-letter-spacing-tight: -0.02em;
    --pp-letter-spacing-normal: 0em;
    --pp-letter-spacing-wide: 0.04em;

    /* Motion */
    --pp-duration-instant: 80ms;
    --pp-duration-fast: 140ms;
    --pp-duration-normal: 220ms;
    --pp-duration-slow: 360ms;
    --pp-easing-standard: cubic-bezier(0.2, 0, 0, 1);
    --pp-easing-decelerate: cubic-bezier(0, 0, 0, 1);
    --pp-easing-accelerate: cubic-bezier(0.3, 0, 1, 1);

    /* Elevation — tuned per theme below. */
    --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.06), 0 1px 3px oklch(0% 0 0 / 0.08);
    --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.06), 0 4px 12px oklch(0% 0 0 / 0.1);
    --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.08), 0 16px 40px oklch(0% 0 0 / 0.14);

    /* Z-index — the only place layering numbers are allowed to exist. */
    --pp-z-base: 0;
    --pp-z-raised: 10;
    --pp-z-sticky: 100;
    --pp-z-overlay: 1000;
    --pp-z-modal: 1100;
    --pp-z-popover: 1200;
    --pp-z-toast: 1300;
    --pp-z-tooltip: 1400;
  }

  /*
   * Themes bind to [data-pp-theme] on ANY element, not just :root. Custom
   * properties inherit, so the nearest ancestor carrying the attribute wins.
   * That is what makes a dark sidebar inside a light app — or both themes
   * rendered side by side in the playground — possible at all.
   *
   * Light is re-declared explicitly so a light subtree can sit inside a dark
   * one; without it, nesting only works in one direction.
   */
  [data-pp-theme="light"] {
${lightCss}

    --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.06), 0 1px 3px oklch(0% 0 0 / 0.08);
    --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.06), 0 4px 12px oklch(0% 0 0 / 0.1);
    --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.08), 0 16px 40px oklch(0% 0 0 / 0.14);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-pp-theme]) {
${darkNestedCss}

      --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.3), 0 1px 3px oklch(0% 0 0 / 0.4);
      --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.32), 0 4px 12px oklch(0% 0 0 / 0.44);
      --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.36), 0 16px 40px oklch(0% 0 0 / 0.5);
    }
  }

  [data-pp-theme="dark"] {
${darkCss}

    --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.3), 0 1px 3px oklch(0% 0 0 / 0.4);
    --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.32), 0 4px 12px oklch(0% 0 0 / 0.44);
    --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.36), 0 16px 40px oklch(0% 0 0 / 0.5);
  }
}
`;

writeFileSync(new URL('../src/styles/tokens/primitives.css', import.meta.url), css);

const rows = [...light.report, ...dark.report];
const w = (s, n) => String(s).padEnd(n);
console.log('Generated src/styles/tokens/primitives.css\n');
console.log(
  `${w('hue', 9)}${w('theme', 7)}${w('on-solid', 10)}${w('9/text', 9)}${w('focus/w', 9)}${w('11/3', 8)}12/3`,
);
for (const r of rows) {
  console.log(
    w(r.hue, 9) +
      w(r.theme, 7) +
      w(r.onSolid, 10) +
      w(r.solidVsText.toFixed(2), 9) +
      w(r.focusWorst.toFixed(2), 9) +
      w(r.step11Vs3.toFixed(2), 8) +
      r.step12Vs3.toFixed(2),
  );
}

// ---------------------------------------------------------------------------
// Semantic layer
// ---------------------------------------------------------------------------

function decls(map, indent) {
  return Object.entries(map)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join('\n');
}

function semanticBlock(theme, indent) {
  const parts = [];
  for (const [group, map] of Object.entries(BASE)) {
    parts.push(`${indent}/* ${group} */\n${decls(map, indent)}`);
  }
  parts.push(`${indent}/* Elevation — inverts between themes */\n${decls(THEME_SPECIFIC[theme], indent)}`);
  return parts.join('\n\n');
}

const semanticCss = `/*
 * SEMANTIC TOKENS — GENERATED FILE, DO NOT EDIT BY HAND.
 * Regenerate with \`npm run tokens\`. Source: scripts/semantic-tokens.mjs
 *
 * This is the styling API. Components reference these and nothing else; a
 * component that names a --pp-palette-* token has hardcoded a colour decision,
 * and \`npm run lint:rules\` rejects it. (RULES §3)
 *
 * The complete set is repeated in every theme scope on purpose. \`var()\` is
 * substituted where the declaration sits, so a semantic token declared only on
 * :root computes to a light value there and inherits into dark subtrees AS
 * THAT LIGHT VALUE. Repetition here is what makes a dark sidebar inside a
 * light page work.
 */

@layer pp.tokens {
  :root {
${semanticBlock('light', '    ')}
  }

  [data-pp-theme="light"] {
${semanticBlock('light', '    ')}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-pp-theme]) {
${semanticBlock('dark', '      ')}
    }
  }

  [data-pp-theme="dark"] {
${semanticBlock('dark', '    ')}
  }

${TONES.map(
  (tone) => `  [data-pp-tone="${tone}"] {\n${decls(toneMap(tone), '    ')}\n  }`,
).join('\n\n')}
}
`;

writeFileSync(new URL('../src/styles/tokens/semantic.css', import.meta.url), semanticCss);
console.log('Generated src/styles/tokens/semantic.css');
