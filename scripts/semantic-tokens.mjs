// The semantic token map — the hand-edited source of truth for what every
// token MEANS. scripts/generate-tokens.mjs turns it into CSS.
//
// It is generated rather than hand-written CSS because each theme scope needs
// the COMPLETE set, not just its differences. `var()` is substituted where the
// declaration sits, so `--pp-color-text: var(--pp-palette-neutral-12)` declared
// once on :root computes to a concrete light colour there and inherits into
// dark subtrees as that light colour. Re-declaring the palette per theme does
// nothing unless the semantic layer is re-declared alongside it.

/** Identical in both themes — emitted into every theme scope. */
export const BASE = {
  'Surfaces': {
    '--pp-color-bg-page': 'var(--pp-palette-neutral-1)',
  },
  'Text': {
    '--pp-color-text': 'var(--pp-palette-neutral-12)',
    '--pp-color-text-muted': 'var(--pp-palette-neutral-11)',
    '--pp-color-text-disabled': 'var(--pp-palette-neutral-8)',
    '--pp-color-text-on-solid': 'var(--pp-palette-neutral-on-solid)',
  },
  /*
   * TWO OF THESE THREE CARRY A CONTRAST GUARANTEE AND ONE DOES NOT, AND THAT IS
   * THE WHOLE DISTINCTION (D-050).
   *
   * `--pp-color-border` is what a CONTROL's boundary reads — an Input, a
   * Checkbox, an outline Button — and WCAG 1.4.11 asks 3:1 of it, because in
   * the light theme `bg-surface` IS `bg-page` and the edge is the only thing
   * identifying the control. It resolves to the solved `-edge` step, not to
   * ramp step 7, which measured 1.55:1.
   *
   * `--pp-color-border-subtle` is DECORATION — a Separator, a Skeleton, the
   * seam inside a card. A divider is not a user interface component, 1.4.11
   * does not reach it, and a 3:1 divider is a black line across the page. It
   * stays on ramp step 6 deliberately.
   *
   * Which one a new component reaches for is therefore not a matter of taste:
   * if the line is what tells you a control is there, it is `border`.
   */
  'Borders': {
    '--pp-color-border-subtle': 'var(--pp-palette-neutral-6)',
    '--pp-color-border': 'var(--pp-palette-neutral-edge)',
    '--pp-color-border-strong': 'var(--pp-palette-neutral-edge-strong)',
  },
  'Focus': {
    '--pp-color-focus-ring': 'var(--pp-palette-accent-focus)',
    '--pp-focus-ring-width': 'var(--pp-border-width-2)',
    '--pp-focus-ring-offset': 'var(--pp-border-width-2)',
  },
  'Selection': {
    '--pp-color-selection-bg': 'var(--pp-palette-accent-5)',
    '--pp-color-selection-text': 'var(--pp-palette-accent-12)',
  },
  'Default tone (neutral)': toneMap('neutral'),
};

/**
 * Elevation is the one thing that genuinely inverts between themes: a light UI
 * raises a surface by making it whiter and adding a shadow, a dark UI by making
 * it lighter, because shadows are invisible on dark backgrounds.
 */
export const THEME_SPECIFIC = {
  light: {
    '--pp-color-bg-surface': 'var(--pp-palette-neutral-1)',
    '--pp-color-bg-raised': 'var(--pp-palette-neutral-1)',
    '--pp-color-bg-sunken': 'var(--pp-palette-neutral-3)',
    '--pp-color-bg-scrim': 'oklch(15% 0.01 258 / 0.55)',
    // The soft edge a scroll shadow fades from (D-023). Translucent, so it
    // works over any surface; far lighter than the scrim, which is a modal
    // overlay. Dark needs roughly 3.5x the alpha to read at all against a
    // near-black surface — the same asymmetry --pp-shadow-* already has.
    '--pp-color-shadow-edge': 'oklch(15% 0.01 258 / 0.14)',
  },
  dark: {
    '--pp-color-bg-surface': 'var(--pp-palette-neutral-2)',
    '--pp-color-bg-raised': 'var(--pp-palette-neutral-3)',
    '--pp-color-bg-sunken': 'var(--pp-palette-neutral-1)',
    '--pp-color-bg-scrim': 'oklch(8% 0.01 258 / 0.7)',
    '--pp-color-shadow-edge': 'oklch(0% 0 0 / 0.5)',
  },
};

export const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'];

/** Every tone exposes the same shape, so components never branch on tone. */
export function toneMap(hue) {
  return {
    '--pp-tone-surface': `var(--pp-palette-${hue}-2)`,
    '--pp-tone-bg': `var(--pp-palette-${hue}-3)`,
    '--pp-tone-bg-hover': `var(--pp-palette-${hue}-4)`,
    '--pp-tone-bg-active': `var(--pp-palette-${hue}-5)`,
    // The same split as the neutral trio above: subtle is decoration on the
    // ramp, the other two are solved control boundaries (D-050).
    '--pp-tone-border-subtle': `var(--pp-palette-${hue}-6)`,
    '--pp-tone-border': `var(--pp-palette-${hue}-edge)`,
    '--pp-tone-border-strong': `var(--pp-palette-${hue}-edge-strong)`,
    '--pp-tone-solid': `var(--pp-palette-${hue}-9)`,
    '--pp-tone-solid-hover': `var(--pp-palette-${hue}-10)`,
    '--pp-tone-solid-active': `var(--pp-palette-${hue}-solid-active)`,
    '--pp-tone-on-solid': `var(--pp-palette-${hue}-on-solid)`,
    '--pp-tone-text': `var(--pp-palette-${hue}-11)`,
    '--pp-tone-text-strong': `var(--pp-palette-${hue}-12)`,
    '--pp-tone-focus': `var(--pp-palette-${hue}-focus)`,
  };
}
