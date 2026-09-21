---
'pixel-perfect': minor
---

Add `NumberInput` (3.14) — a numeric text field with steppers, bounds, a step,
and formatting that is correct outside en-US. The first component of Tier 3D.

- **`type="text"` with `role="spinbutton"`, never `type="number"`.** That input
  mutates its value on a scroll wheel over a focused field, rejects a locale
  decimal comma, and reports `value === ''` for anything it cannot parse, so
  `1,5` in a German locale is silently lost. It also cannot hold `1.234,5`,
  which rules it out a second time the moment formatting exists.
- **`null` is empty; `undefined` is uncontrolled.** `value={undefined}` already
  means "uncontrolled" to the shared state hook, so an empty *controlled* field
  spelled that way switches modes silently and stops answering to its owner.
  `number | null` makes it a type error at the call site instead.
- **`min`, `max` and `step` are applied on commit — blur, a stepper, an arrow
  key, Enter — and never while you are typing.** At `step={10}`, snapping per
  keystroke turns `1` into `10` before the `5` arrives, so `15` cannot be typed
  at all. The snap is rounded to `step`'s own precision, so a `step={0.1}` field
  produces `0.3` rather than `0.30000000000000004`. Text that is not a number
  reverts rather than clearing: a typo should not destroy data nobody asked to
  delete.
- **Formatting is opt-in, and that is a hydration ruling.** `Intl.NumberFormat`
  with no locale resolves the runtime's — Node's on the server, the user's in
  the browser — so an ambient locale breaks server/client agreement in a
  component that never mentions the viewport. Without `locale` the display is
  `String(value)`. With one, parsing is derived from the *same* formatter via
  `formatToParts`, so separators and non-Latin digits round-trip without a
  hardcoded list.
- **The steppers are plain buttons and are not tab stops.** `IconButton` is
  square on the control scale, so two stacked is 80px of button in a 40px
  control — the reuse is arithmetically impossible. `type="button"` is set and
  tested, because a `<button>` in a `<form>` defaults to `submit`. They disable
  at the bound they reach, and on an empty field the first press commits the
  bound that exists rather than starting from an invisible zero.
- **The control is the surface and the steppers overlay it**, which is `Select`'s
  structure with two buttons instead of one chevron. The first build put the
  surface on the wrapper and drew the ring with `:has()`, which rendered two
  concentric focus rings — the reset draws one on the inner input too. Four
  components now read `--pp-control-*` and are the same height in a row.

`Intl.NumberFormat` is constructed during render with an explicit locale or not
at all, so the markup is identical on the server and the client.
