---
'pixel-perfect': minor
---

Add `Radio` and `RadioGroup` (3.11) — one choice from a visible set, on the
native input, painted with `appearance: none`.

- **No roving tabindex.** Radios sharing a `name` already implement the APG
  Radio Group pattern in every browser, and `RadioGroup` generates that `name`
  from `useId()` so two unnamed groups are not silently one group.
- The group owns the value, because a radio that is deselected by a sibling is
  told nothing — `value` / `defaultValue` / `onValueChange` on the group, no
  `checked` prop on the option.
- 16 / 20 / 24 from the size scale, and `gap` defaults to `"3"` because that is
  the floor at which WCAG 2.5.8's spacing exception holds for `sm`.
- The stylesheet paints from `:checked` rather than from `data-state`, so a
  radio the platform changes behind React's back is still painted correctly.
- Reads `size`, `required`, `disabled` and invalid state from `Field` through
  the group; an explicit prop always wins, including `disabled={false}`.
