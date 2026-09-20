---
'pixel-perfect': minor
---

**A control's boundary now meets WCAG 1.4.11.** `--pp-color-border` measured
1.55:1 against the page in the light theme, where `--pp-color-bg-surface` *is*
`--pp-color-bg-page` — so a text field's fill is literally the page and the
border was the only thing identifying the control. Every control in Tiers 3A–3C
shipped below the 3:1 floor.

- Two **off-ramp** solved primitives per hue, joining `-focus`, `-on-solid` and
  `-solid-active`: `--pp-palette-<hue>-edge` (≥3:1 against every neutral
  surface) and `-edge-strong` (≥4.5:1). The 1–8 ramp is untouched, because a
  conforming neutral border lands at L 0.633 — below step 8's fixed L 0.780 —
  so putting it at step 7 inverts the ramp.
- `--pp-color-border` and `--pp-color-border-strong` (and their `--pp-tone-*`
  counterparts, in all five hues) re-point at those steps.
  `--pp-color-border-subtle` deliberately does **not**: a divider is not a user
  interface component, and a 3:1 divider is a black line across the page. RULES
  §3 now states which to reach for.
- `npm run lint:contrast` gains the border-vs-surface pairings it never had —
  170 → 242 assertions — and now also asserts the semantic **mapping** by name,
  so re-pointing a token back at a ramp step fails the build instead of
  silently returning every control to 1.55:1.
- `Spinner`'s track moves to the decorative step — at 3:1 it read as a ring
  rather than an arc. `Skeleton`'s sweep, `Badge`'s outline and `Kbd`'s keycap
  keep the new edge on purpose; the skeleton's dark sweep is wider than its
  light one as a result, which is recorded rather than "fixed", because the
  symmetric version left the dark bars barely visible.
- Every **disabled** control drops to `--pp-color-border-subtle`. WCAG exempts
  inactive components, and leaving them on the live edge erases the difference
  the exemption exists to allow.

**Visually breaking in a minor release:** every bordered control has a darker,
clearly visible edge in both themes. Override `--pp-<component>-border-color`
per component, or re-point `--pp-color-border` in your own layer, if you were
relying on the old hairline.
