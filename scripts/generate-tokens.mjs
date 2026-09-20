#!/usr/bin/env node
// Generates src/styles/tokens/primitives.css.
//
// Twelve-step ramps per hue, per theme. Steps that carry an accessibility
// obligation are SOLVED for their contrast target rather than eyeballed:
//
//   focus        focus ring              >= 3.0:1 against step 1
//   edge         a control's boundary    >= 3.0:1 against steps 1, 2 AND 3
//   edge-strong  its hover/strong state  >= 4.5:1 against steps 1, 2 AND 3
//   step 9       solid background        >= 4.5:1 against its on-solid text
//   step 11      muted text              >= 4.5:1 against step 3
//   step 12      body text               >= 7.0:1 against step 3
//
// `edge` is OFF-RAMP, for the reason the focus ring is: a conforming border in
// the light theme lands at L 0.633, below step 8's fixed 0.780, so putting it
// at step 7 inverts the ramp and trips assertMonotonic below. Hanging a
// contrast obligation on a ramp step tears a hole in the ramp (D-050).
//
// Steps 1-8 are a fixed, monotonic lightness ramp. Step 9 starts from a
// designed lightness so brand hues stay vivid, and moves only as far as AA
// requires. Monotonicity is asserted, not assumed.
//
// Re-run with `npm run tokens`. The output is committed; `npm run lint:contrast`
// verifies the committed file independently of this generator.

import { writeFileSync } from 'node:fs';
import { BASE, THEME_SPECIFIC, TONES, toneMap } from './semantic-tokens.mjs';
import {
  clampChroma,
  contrastOklch,
  formatOklch,
  oklchToSrgb,
  solveLightness,
} from './color.mjs';

// `solidL` is per hue AND per theme because perceived lightness is not uniform
// across hues: a blue at L 0.55 is a normal blue, an amber at L 0.55 is brown.
// One global solid-fill lightness produces a muddy warning colour every time.
// Chosen so each fill sits at or near its hue's maximum in-gamut chroma while
// still clearing 4.5:1 against its on-solid text.
const HUES = {
  neutral: { hue: 258, peak: 0.008, solidL: { light: 0.5, dark: 0.7 } },
  accent: { hue: 258, peak: 0.17, solidL: { light: 0.55, dark: 0.7 } },
  danger: { hue: 25, peak: 0.19, solidL: { light: 0.57, dark: 0.68 } },
  success: { hue: 150, peak: 0.15, solidL: { light: 0.53, dark: 0.72 } },
  warning: { hue: 80, peak: 0.16, solidL: { light: 0.8, dark: 0.82 } },
};

// Fraction of the hue's peak chroma applied at each step.
const CHROMA_CURVE = [0.03, 0.06, 0.11, 0.16, 0.21, 0.26, 0.33, 0.48, 1.0, 0.97, 0.72, 0.32];

const THEMES = {
  light: {
    fixed: { 1: 0.994, 2: 0.98, 3: 0.958, 4: 0.938, 5: 0.915, 6: 0.888, 7: 0.85, 8: 0.78 },
    step10Delta: -0.045,
    focusSearch: { lo: 0.45, hi: 0.82, direction: 'lightest' },
    text11Search: { lo: 0.32, hi: 0.7, direction: 'lightest' },
    text12L: 0.25,
    onSolidDarkL: 0.22,
    descending: true,
  },
  dark: {
    fixed: { 1: 0.178, 2: 0.213, 3: 0.255, 4: 0.288, 5: 0.32, 6: 0.362, 7: 0.425, 8: 0.51 },
    step10Delta: 0.045,
    focusSearch: { lo: 0.48, hi: 0.88, direction: 'darkest' },
    text11Search: { lo: 0.56, hi: 0.9, direction: 'darkest' },
    text12L: 0.93,
    onSolidDarkL: 0.2,
    descending: false,
  },
};

const WHITE = [1, 0, 0];

// Solve to slightly ABOVE each target. Landing exactly on 4.5 means the value
// rounds to 4.4999 in an independent check and fails its own floor.
const MARGIN = 1.02;

/**
 * Pick the solid fill. Start from the designed lightness so the hue stays
 * vivid, choose whichever on-solid text colour reads better there, then walk
 * lightness only as far as 4.5:1 demands.
 */
function solveSolid(name, themeName, hue, peak, solidL, t) {
  const C = chromaAt(9, peak);
  const dark = [t.onSolidDarkL, clampChroma(t.onSolidDarkL, peak * 0.4, hue), hue];
  const at = (L) => [L, clampChroma(L, C, hue), hue];

  const start = at(solidL);
  const vsWhite = contrastOklch(start, WHITE);
  const vsDark = contrastOklch(start, dark);
  const useWhite = vsWhite >= vsDark;
  const onSolidValue = useWhite ? WHITE : dark;
  // White text needs a darker fill; dark text needs a lighter one.
  const step = useWhite ? -0.005 : 0.005;

  let L = solidL;
  for (let i = 0; i < 200 && contrastOklch(at(L), onSolidValue) < 4.5 * MARGIN; i++) L += step;
  if (contrastOklch(at(L), onSolidValue) < 4.5 * MARGIN) {
    throw new Error(`${name}/${themeName}: step 9 cannot reach 4.5:1 against either text colour`);
  }
  return { step9: at(L), onSolid: useWhite ? 'white' : 'dark', onSolidValue };
}

/**
 * A control's boundary, solved against EVERY neutral surface it can sit on.
 *
 * A border has two sides — the control's own fill and whatever is behind it —
 * and the semantic layer puts three different neutral steps on those sides
 * across the two themes: page (1), surface (1 light / 2 dark) and sunken
 * (3 light / 1 dark), with raised adding 3 in dark. Solving against only the
 * hardest one today would go quietly wrong the first time `bg-surface` is
 * re-pointed, so all three are solved against and the most demanding wins.
 *
 * The surfaces are always NEUTRAL, even for a toned border: a danger-toned
 * input sits on the page, not on a red one.
 *
 * `direction` keeps as much of the original ramp's lightness as the target
 * allows — the least dark border that conforms in light, the least light one
 * in dark — so the edge is as close to the old step 7 as WCAG permits rather
 * than as far from it as the search range allows.
 */
function solveEdge(name, themeName, hue, peak, surfaces, target, t) {
  // Step-8 chroma: this is a border, not a fill. A fill's chroma on a 1px
  // edge reads as a coloured line rather than as a tinted boundary.
  const chroma = chromaAt(8, peak);
  const search = t.descending
    ? { lo: 0.2, hi: 0.85, direction: 'lightest' }
    : { lo: 0.42, hi: 0.98, direction: 'darkest' };

  let pick = null;
  for (const against of surfaces) {
    const L = solveLightness({ against, target: target * MARGIN, hue, chroma, ...search });
    if (L === null) {
      throw new Error(
        `${name}/${themeName}: edge cannot reach ${target}:1 against every surface at this chroma`,
      );
    }
    // "Most demanding" is darker in light and lighter in dark.
    pick = pick === null ? L : t.descending ? Math.min(pick, L) : Math.max(pick, L);
  }
  return [pick, clampChroma(pick, chroma, hue), hue];
}

/** Lightness must move in one direction across steps 1-8. Catches ramp inversions. */
function assertMonotonic(name, themeName, steps, descending) {
  for (let i = 1; i < 8; i++) {
    const a = steps[i][0];
    const b = steps[i + 1][0];
    if (descending ? b >= a : b <= a) {
      throw new Error(
        `${name}/${themeName}: ramp inversion between step ${i} (${a.toFixed(3)}) and ${i + 1} (${b.toFixed(3)})`,
      );
    }
  }
  // Step 9 is deliberately NOT checked against the 1-8 ramp: a vivid amber
  // solid legitimately sits lighter than the border steps, where a vivid blue
  // sits darker. Its guarantee is contrast against its on-solid text, not ramp
  // position.
  const [l11, l12] = [steps[11][0], steps[12][0]];
  if (descending ? l12 >= l11 : l12 <= l11) {
    throw new Error(`${name}/${themeName}: body text (12) has less weight than muted text (11)`);
  }
}
const chromaAt = (step, peak) => peak * CHROMA_CURVE[step - 1];

function buildRamp(name, { hue, peak, solidL }, themeName, surfaces) {
  const t = THEMES[themeName];
  const steps = {};
  const notes = {};

  for (const [step, L] of Object.entries(t.fixed)) {
    steps[step] = [L, clampChroma(L, chromaAt(Number(step), peak), hue), hue];
  }

  const step1 = steps[1];
  const step2 = steps[2];

  // Focus ring — its own token, not step 8. Hanging the 3:1 UI-contrast
  // requirement on a ramp step tears a hole in the ramp.
  const cFocus = peak * 0.85;
  const LFocus = solveLightness({ against: step1, target: 3.0 * MARGIN, hue, chroma: cFocus, ...t.focusSearch });
  if (LFocus === null) throw new Error(`${name}/${themeName}: focus ring cannot reach 3:1`);
  notes.focus = [LFocus, clampChroma(LFocus, cFocus, hue), hue];

  /*
   * The control boundary and its strong state. Solved here rather than taken
   * from steps 7 and 8, which are fixed lightness and measured 1.55:1 and
   * 1.97:1 against the page in the light theme — the gap D-048 §2 recorded and
   * D-050 closes. Steps 7 and 8 stay exactly where they were; they are still
   * the ramp, and `--pp-color-border-subtle` still reads step 6.
   */
  notes.edge = solveEdge(name, themeName, hue, peak, surfaces, 3.0, t);
  notes.edgeStrong = solveEdge(name, themeName, hue, peak, surfaces, 4.5, t);

  /*
   * The names would otherwise be able to invert. `--pp-color-border-strong`
   * pointed at step 8 while `--pp-color-border` pointed at a conforming edge
   * would make "strong" the WEAKER of the two, and Toggle's hover — which
   * moves from border to border-strong — would lighten on hover instead of
   * darkening. Asserted rather than assumed, because the targets alone do not
   * guarantee it at every hue.
   */
  for (const against of surfaces) {
    const weak = contrastOklch(notes.edge, against);
    const strong = contrastOklch(notes.edgeStrong, against);
    if (strong <= weak) {
      throw new Error(
        `${name}/${themeName}: edge-strong is ${strong.toFixed(2)}:1 where edge is ${weak.toFixed(2)}:1 — "strong" is the weaker of the two`,
      );
    }
  }

  const solid = solveSolid(name, themeName, hue, peak, solidL[themeName], t);
  steps[9] = solid.step9;
  notes.onSolid = solid.onSolid;
  notes.onSolidValue = solid.onSolidValue;
  const L9 = solid.step9[0];

  const L10 = Math.min(0.98, Math.max(0.05, L9 + t.step10Delta));
  steps[10] = [L10, clampChroma(L10, chromaAt(10, peak), hue), hue];

  // The pressed state of a solid fill. A second step in the same direction as
  // hover, so rest -> hover -> pressed reads as one progression rather than two
  // unrelated colours. It is NOT a ramp step: steps 11 and 12 are text, solved
  // against step 3, and reusing one of them as a fill would make the pressed
  // state of a button and the colour of muted text the same value by accident.
  //
  // Its guarantee is the same as step 9's and step 10's: 4.5:1 against the
  // on-solid text sitting on it. Asserted here AND independently in
  // check-contrast.mjs, because a pressed button that loses its label is a
  // failure nobody sees in review — it is visible for 120ms.
  const LActive = Math.min(0.98, Math.max(0.05, L9 + 2 * t.step10Delta));
  notes.solidActive = [LActive, clampChroma(LActive, chromaAt(10, peak), hue), hue];
  const activeContrast = contrastOklch(notes.solidActive, solid.onSolidValue);
  if (activeContrast < 4.5 * MARGIN) {
    throw new Error(
      `${name}/${themeName}: solid-active is ${activeContrast.toFixed(2)}:1 against its on-solid text, below the 4.5:1 floor`,
    );
  }

  // Steps 11 and 12 — text. 4.5:1 and 7:1 against step 2.
  // Muted text is solved against step 3, not step 2. It appears on component
  // backgrounds (inside inputs, on cards, in badges) at least as often as it
  // appears on the subtle page background, and step 3 is the harder target.
  const c11 = chromaAt(11, peak);
  const L11 = solveLightness({ against: steps[3], target: 4.5 * MARGIN, hue, chroma: c11, ...t.text11Search });
  if (L11 === null) throw new Error(`${name}/${themeName}: step 11 cannot reach 4.5:1 on step 3`);
  steps[11] = [L11, clampChroma(L11, c11, hue), hue];

  // Step 12 is body text. Solving it to *exactly* 7:1 produces a mid-grey that
  // technically passes and reads like disabled text. Fix the lightness where
  // body text belongs and assert the floor instead.
  const c12 = chromaAt(12, peak);
  const L12 = t.text12L;
  steps[12] = [L12, clampChroma(L12, c12, hue), hue];
  const bodyContrast = contrastOklch(steps[12], steps[3]);
  if (bodyContrast < 7.0 * MARGIN) {
    throw new Error(
      `${name}/${themeName}: body text (step 12) is ${bodyContrast.toFixed(2)}:1 against step 3, below the 7:1 floor`,
    );
  }

  assertMonotonic(name, themeName, steps, t.descending);

  return { steps, notes };
}

function rampCss(name, ramp, indent) {
  const lines = [];
  for (let step = 1; step <= 12; step++) {
    const [L, C, H] = ramp.steps[step];
    lines.push(`${indent}--pp-palette-${name}-${step}: ${formatOklch(L, C, H)};`);
  }
  const [oL, oC, oH] = ramp.notes.onSolidValue;
  lines.push(`${indent}--pp-palette-${name}-on-solid: ${formatOklch(oL, oC, oH)};`);
  const [aL, aC, aH] = ramp.notes.solidActive;
  lines.push(`${indent}--pp-palette-${name}-solid-active: ${formatOklch(aL, aC, aH)};`);
  const [fL, fC, fH] = ramp.notes.focus;
  lines.push(`${indent}--pp-palette-${name}-focus: ${formatOklch(fL, fC, fH)};`);
  const [eL, eC, eH] = ramp.notes.edge;
  lines.push(`${indent}--pp-palette-${name}-edge: ${formatOklch(eL, eC, eH)};`);
  const [sL2, sC2, sH2] = ramp.notes.edgeStrong;
  lines.push(`${indent}--pp-palette-${name}-edge-strong: ${formatOklch(sL2, sC2, sH2)};`);
  return lines.join('\n');
}

function build(themeName, indent = '    ') {
  const out = [];
  const report = [];

  /* Every surface in the semantic layer is a NEUTRAL step — page is 1, surface
     is 1 (light) / 2 (dark), sunken is 3 (light) / 1 (dark), raised is 1 / 3.
     Computed once and handed to every hue, because a danger-toned border still
     sits on a neutral background. */
  const t = THEMES[themeName];
  const surfaces = [1, 2, 3].map((n) => {
    const L = t.fixed[n];
    return [L, clampChroma(L, chromaAt(n, HUES.neutral.peak), HUES.neutral.hue), HUES.neutral.hue];
  });

  for (const [name, spec] of Object.entries(HUES)) {
    const ramp = buildRamp(name, spec, themeName, surfaces);
    out.push(rampCss(name, ramp, indent));
    report.push({
      hue: name,
      theme: themeName,
      onSolid: ramp.notes.onSolid,
      solidVsText: contrastOklch(ramp.steps[9], ramp.notes.onSolidValue),
      activeVsText: contrastOklch(ramp.notes.solidActive, ramp.notes.onSolidValue),
      focusVs1: contrastOklch(ramp.notes.focus, ramp.steps[1]),
      edgeWorst: Math.min(...surfaces.map((s) => contrastOklch(ramp.notes.edge, s))),
      edgeStrongWorst: Math.min(...surfaces.map((s) => contrastOklch(ramp.notes.edgeStrong, s))),
      step11Vs3: contrastOklch(ramp.steps[11], ramp.steps[3]),
      step12Vs3: contrastOklch(ramp.steps[12], ramp.steps[3]),
    });
  }
  return { css: out.join('\n\n'), report };
}

const light = build('light');
const dark = build('dark');
const lightNested = build('light', '    ');
const darkNested = build('dark', '      ');

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
 *   -focus         focus ring               (>= 3:1 on step 1)
 *   -edge          a control's boundary     (>= 3:1 on steps 1, 2 and 3)
 *   -edge-strong   its strong/hover state   (>= 4.5:1 on steps 1, 2 and 3)
 *
 * The three lines above steps 9-10 were WRONG until D-050. They read
 * "6-7 borders: subtle, interactive" and "8 strong border and focus ring
 * (>= 3:1 on step 1)" — but step 8 is a fixed lightness at 1.97:1 on step 1,
 * and the focus ring had already been moved to its own solved token precisely
 * because step 8 could not carry the requirement. A generated file claimed a
 * guarantee that nothing produced and nothing checked.
 *   -solid-active  pressed solid fill    (>= 4.5:1 against -on-solid)
 *   -on-solid      text/icon colour for steps 9-10 and -solid-active
 */
`;

const css = `${header}
@layer pp.tokens {
  :root {
${light.css}

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

       Only Container may consume these (RULES §1, D-001). They are exported
       so a consuming app can align its own full-bleed sections to the same
       measures without hardcoding them. */
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
${lightNested.css}

    --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.06), 0 1px 3px oklch(0% 0 0 / 0.08);
    --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.06), 0 4px 12px oklch(0% 0 0 / 0.1);
    --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.08), 0 16px 40px oklch(0% 0 0 / 0.14);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-pp-theme]) {
${darkNested.css}

      --pp-shadow-1: 0 1px 2px oklch(0% 0 0 / 0.3), 0 1px 3px oklch(0% 0 0 / 0.4);
      --pp-shadow-2: 0 2px 4px oklch(0% 0 0 / 0.32), 0 4px 12px oklch(0% 0 0 / 0.44);
      --pp-shadow-3: 0 8px 16px oklch(0% 0 0 / 0.36), 0 16px 40px oklch(0% 0 0 / 0.5);
    }
  }

  [data-pp-theme="dark"] {
${dark.css}

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
  `${w('hue', 9)}${w('theme', 7)}${w('on-solid', 10)}${w('9/text', 9)}${w('focus/1', 9)}${w('11/3', 8)}12/3`,
);
for (const r of rows) {
  console.log(
    w(r.hue, 9) +
      w(r.theme, 7) +
      w(r.onSolid, 10) +
      w(r.solidVsText.toFixed(2), 9) +
      w(r.focusVs1.toFixed(2), 9) +
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
