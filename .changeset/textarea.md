---
"pixel-perfect": minor
---

Add `Textarea` (3.9): a multi-line text control on the same surface as `Input`,
with opt-in auto-resize.

It reads `size`, `required`, `disabled` and the invalid state from the `Field`
above it through `useField()`, works standalone when there is no field, and
follows the same precedence rule as every control in this tier: an explicit prop
beats the field, which beats the default — including `disabled={false}` inside a
disabled field, which does enable the control. `value`, `defaultValue` and
`onChange` go straight to the DOM, as they do for `Input`.

`autoResize` grows the control with its content and never below `rows`. The
measurement resets `block-size` to `auto` before reading `scrollHeight`, which
is both halves of the mechanism: `scrollHeight` is max(content, client), so
measuring against a height the component wrote itself could only ratchet upward
and never shrink — and the reset is also where the `rows` floor comes from, with
no second source of truth to drift from. It re-measures on width changes only;
writing `block-size` is itself a resize, so watching height would re-enter
forever. CSS `field-sizing: content` is deliberately not used: shipping both
means two resize behaviours depending on the browser, and the one that is easy
to test is the one that is not running for your users.

`resize` is `'vertical'` or `'none'`. There is no `'horizontal'` — a
user-widened textarea overflows the `Field`'s grid column and takes the layout
with it, which is the one thing the sizing contract exists to prevent.

The vertical padding is derived from `--pp-control-*` rather than picked off the
space scale, because the scale cannot express the 10.2px `lg` needs. The payoff
is that a one-row `Textarea` is exactly an `Input`'s height at every size, by
construction rather than by anyone checking.
