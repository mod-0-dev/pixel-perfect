---
'pixel-perfect': minor
---

Add `Checkbox` (3.10) — a binary or tri-state checkbox on the native input,
painted with `appearance: none` and marked by an inline `Icon`.

- 16 / 20 / 24 from the size scale, not the 32 / 40 / 48 control scale. `sm` and
  `md` conform to WCAG 2.5.8 through the spacing exception, which is the same
  geometry behind `RadioGroup`'s `gap` default.
- `checked` / `defaultChecked` / `onCheckedChange` with a third state the caller
  owns: clicking an indeterminate box produces `true`, never `'indeterminate'`.
  The native `onChange` is chained rather than replaced, so `register()` from
  `react-hook-form` still works.
- Reads `size`, `required`, `disabled` and invalid state from `Field`; an
  explicit prop always wins, including `disabled={false}`.
