// The palette solver: twelve-step OKLCH ramps per hue, per theme, with every
// step that carries an accessibility obligation SOLVED for its target rather
// than eyeballed. Moved here from scripts/generate-tokens.mjs, unchanged but
// for two things (D-103): the hues are a parameter, so a consumer's accent
// is solved by the same code as the library's own, and the solid fill's walk
// waits for its pressed state as well as itself.
//
//   focus        focus ring              >= 3.0:1 against steps 1, 2 and 3,
//                                        of EVERY hue (0.11, D-053 §2)
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
// Pure: no I/O, no globals, so it runs in Node for `npm run tokens` and the
// CLI, and in a browser for the playground's /theme page. What it produces
// is never trusted on its own word — check.mjs re-derives every ratio from
// the CSS text (D-008).

import { clampChroma, contrastOklch, formatOklch, solveLightness } from './color.mjs';

// `solidL` is per hue AND per theme because perceived lightness is not uniform
// across hues: a blue at L 0.55 is a normal blue, an amber at L 0.55 is brown.
// One global solid-fill lightness produces a muddy warning colour every time.
// Chosen so each fill sits at or near its hue's maximum in-gamut chroma while
// still clearing 4.5:1 against its on-solid text.
export const HUES = {
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

  // The pressed state is two hover steps on from the fill (see buildRamp) and
  // carries the same 4.5:1, so the walk stops only where BOTH read. Walking
  // toward more contrast with the text helps both, in either theme, with
  // either text. For the library's own hues the fill already passes at the
  // first lightness where the pressed state does, so their output is
  // unchanged; a consumer's hue (D-103) is where the pressed state can be
  // the harder of the two — a mid-light fill with dark text.
  const activeAt = (L) => {
    const La = Math.min(0.98, Math.max(0.05, L + 2 * t.step10Delta));
    return [La, clampChroma(La, chromaAt(10, peak), hue), hue];
  };
  const reads = (L) =>
    contrastOklch(at(L), onSolidValue) >= 4.5 * MARGIN && contrastOklch(activeAt(L), onSolidValue) >= 4.5 * MARGIN;

  let L = solidL;
  for (let i = 0; i < 200 && !reads(L); i++) L += step;
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
function solveAgainstAll({ label, surfaces, target, hue, chroma, search, descending }) {
  let pick = null;
  for (const against of surfaces) {
    const L = solveLightness({ against, target: target * MARGIN, hue, chroma, ...search });
    if (L === null) {
      throw new Error(`${label} cannot reach ${target}:1 against every surface at this chroma`);
    }
    // "Most demanding" is darker in light and lighter in dark.
    pick = pick === null ? L : descending ? Math.min(pick, L) : Math.max(pick, L);
  }
  return [pick, clampChroma(pick, chroma, hue), hue];
}

function solveEdge(name, themeName, hue, peak, surfaces, target, t) {
  // Step-8 chroma: this is a border, not a fill. A fill's chroma on a 1px
  // edge reads as a coloured line rather than as a tinted boundary.
  return solveAgainstAll({
    label: `${name}/${themeName}: edge`,
    surfaces,
    target,
    hue,
    chroma: chromaAt(8, peak),
    search: t.descending
      ? { lo: 0.2, hi: 0.85, direction: 'lightest' }
      : { lo: 0.42, hi: 0.98, direction: 'darkest' },
    descending: t.descending,
  });
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

function buildRamp(name, { hue, peak, solidL }, themeName, surfaces, ringSurfaces) {
  const t = THEMES[themeName];
  const steps = {};
  const notes = {};

  for (const [step, L] of Object.entries(t.fixed)) {
    steps[step] = [L, clampChroma(L, chromaAt(Number(step), peak), hue), hue];
  }

  /*
   * Focus ring — its own token, not step 8. Hanging the 3:1 UI-contrast
   * requirement on a ramp step tears a hole in the ramp.
   *
   * SOLVED AGAINST EVERY SURFACE, NOT AGAINST STEP 1 (0.11, D-053 §2).
   * It used to take `step1` alone, and the line at the top of this file said
   * so — three lines above `edge`, which has been solved against steps 1, 2
   * AND 3 since D-050. The ring's other neighbours were real the whole time:
   * `--pp-color-bg-surface` is step 2 and shipped at 2.94 / 2.85 from Tier 3A,
   * and `Alert` (5.2) put a focusable control on a TONED step 3 at 2.74-2.77
   * light and 2.54-2.57 dark. The accurate header of a file nobody re-reads is
   * worth exactly as much as the wrong one D-050 §6 found.
   *
   * `ringSurfaces` is every hue's steps 1-3, not just the neutral ones
   * `solveEdge` takes. Its comment — "a danger-toned input sits on the page,
   * not on a red one" — is true of a border and false of a ring: a ring is
   * drawn on whatever the component is sitting on, and since 5.2 that can be
   * a red one.
   */
  const cFocus = peak * 0.85;
  notes.focus = solveAgainstAll({
    label: `${name}/${themeName}: focus ring`,
    surfaces: ringSurfaces,
    target: 3.0,
    hue,
    chroma: cFocus,
    search: t.focusSearch,
    descending: t.descending,
  });

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

/**
 * One theme's palette for a set of hues: every ramp, and a report row per hue.
 *
 * @param {'light' | 'dark'} themeName
 * @param {Record<string, { hue: number, peak: number, solidL: { light: number, dark: number } }>} [hues]
 */
export function solvePalette(themeName, hues = HUES) {
  const ramps = {};
  const report = [];

  /* Every surface in the semantic layer is a NEUTRAL step — page is 1, surface
     is 1 (light) / 2 (dark), sunken is 3 (light) / 1 (dark), raised is 1 / 3.
     Computed once and handed to every hue, because a danger-toned border still
     sits on a neutral background. */
  const t = THEMES[themeName];
  const surfaces = [1, 2, 3].map((n) => {
    const L = t.fixed[n];
    return [L, clampChroma(L, chromaAt(n, hues.neutral.peak), hues.neutral.hue), hues.neutral.hue];
  });

  /*
   * THE RING'S SURFACES ARE EVERY HUE'S, NOT ONLY NEUTRAL (0.11, D-053 §2).
   *
   * A border sits between a control and the page, and the page is neutral —
   * which is why `surfaces` above is neutral-only and right to be. A focus
   * ring is drawn on whatever the focused thing is sitting on, and since
   * `Alert` (5.2) that is a toned step 3: the ring on a DANGER alert is
   * accent's ring on danger's surface, a pairing no per-hue solve can see.
   *
   * Computable before any ramp is built, because steps 1-3 are fixed
   * lightness; only the chroma differs by hue, and that is the 0.03 between
   * 2.74 and 2.77 — small, and the difference between failing and failing by
   * more.
   */
  const ringSurfaces = Object.values(hues).flatMap(({ hue, peak }) =>
    [1, 2, 3].map((n) => {
      const L = t.fixed[n];
      return [L, clampChroma(L, chromaAt(n, peak), hue), hue];
    }),
  );

  for (const [name, spec] of Object.entries(hues)) {
    const ramp = buildRamp(name, spec, themeName, surfaces, ringSurfaces);
    ramps[name] = ramp;
    report.push({
      hue: name,
      theme: themeName,
      onSolid: ramp.notes.onSolid,
      solidVsText: contrastOklch(ramp.steps[9], ramp.notes.onSolidValue),
      activeVsText: contrastOklch(ramp.notes.solidActive, ramp.notes.onSolidValue),
      focusWorst: Math.min(...ringSurfaces.map((s) => contrastOklch(ramp.notes.focus, s))),
      edgeWorst: Math.min(...surfaces.map((s) => contrastOklch(ramp.notes.edge, s))),
      edgeStrongWorst: Math.min(...surfaces.map((s) => contrastOklch(ramp.notes.edgeStrong, s))),
      step11Vs3: contrastOklch(ramp.steps[11], ramp.steps[3]),
      step12Vs3: contrastOklch(ramp.steps[12], ramp.steps[3]),
    });
  }
  return { ramps, report };
}

/**
 * A palette's declarations — seventeen per hue, the hues a blank line apart —
 * at `indent`, exactly as primitives.css carries them.
 */
export function paletteDeclarations(ramps, indent = '    ') {
  return Object.entries(ramps)
    .map(([name, ramp]) => rampCss(name, ramp, indent))
    .join('\n\n');
}
