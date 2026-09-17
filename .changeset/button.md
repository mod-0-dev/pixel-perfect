---
"pixel-perfect": minor
---

Add `Button` (3.1): an action control with `variant`, `tone`, `size`, a
`loading` state and `asChild`. It hugs its label — there is no `fullWidth`
prop; stretch it from the parent.

Two things it brings that outlive it:

- **`--pp-control-*` tokens.** Height, inline padding, gap, font size and
  radius for every control in the library, so a `Button` and an `Input` at
  `size="md"` are the same height by construction. Retune all controls at once
  by setting `--pp-control-height-md` rather than a per-component property.
- **`--pp-tone-solid-active`**, a new semantic token for the pressed state of a
  solid fill, verified at 4.5:1 against its on-solid text in both themes and
  all five tones.

`loading` sets `aria-disabled` rather than `disabled`, so the button keeps its
place in the tab order — a browser blurs a focused element the instant it is
disabled, which loses a keyboard user's place mid-submit. `type` defaults to
`"button"`, not HTML's `"submit"`.
