---
"pixel-perfect": minor
---

Add `Stack` (2.1), the first Tier 2 layout primitive, and the shared `gap` scale
the rest of the tier is built on.

`Stack` is a flex column with a gap and a cross-axis `align`. `gap` is a new
fixed-vocabulary prop taking a step of the space scale as a string —
`gap="4"` resolves to `--pp-space-4` (D-020). It defaults to `"0"`, which is
load-bearing: the scale is mapped onto an inheriting custom property, so the
attribute must always be emitted or a nested layout silently inherits its
parent's rhythm.

Also exports the `Space`, `Align` and `Justify` vocabulary types, and adds a
`--pp-color-shadow-edge` semantic token for the fading gradients `Scroller`
(2.8) will need (D-023).
