---
'pixel-perfect': minor
---

Add `Select` (3.13) — the native `<select>` on the shared control surface, with
our chevron. Tier 3C is complete.

- **The platform popup is kept.** `appearance: none` repaints the closed box and
  nothing else, so the open list stays the operating system's: a wheel on iOS, a
  listbox on desktop, correct with a screen reader and in a right-to-left locale
  with no code of ours involved. The custom listbox — typeahead, async options,
  multi-select — is `Combobox` (4.11). `multiple` is a type error, and is
  stripped at runtime for the caller who ignores the type.
- **`placeholder` seeds `defaultValue=""` rather than relying on `selected`.**
  The HTML *ask for a reset* algorithm picks the first option **that is not
  disabled**, so a disabled placeholder is skipped and the browser silently
  selects option two. Seeding routes through the `value` setter, which has no
  such exclusion. Give `value` or `defaultValue` and yours wins.
- **The placeholder is painted from `:has(option[data-pp-placeholder]:checked)`,
  not from an attribute.** This control holds no state, so an uncontrolled
  select's selection changes without React being told — as do `form.reset()` and
  a write through the ref. `data-placeholder` is on the root for consumers to
  style off, and only when the select is controlled; it is omitted rather than
  guessed otherwise.
- The chevron is `--pp-color-text-muted`: 5.10:1 on the light surface, 5.12:1 on
  the dark one, against the 3:1 WCAG 1.4.11 asks of the graphic that identifies
  a control — which it is, now that the platform's own arrow is gone. Measured
  before the component was written; both pairings are ones the token layer
  already verifies.
- Options are `children`, so `<optgroup>` and disabled options are just markup.
  `--pp-select-padding-inline` moves both edges and the chevron's reserved room
  together, so a long value truncates before it reaches the glyph.
- No `readOnly`: HTML has none for `<select>`, a `pointer-events` fake leaves the
  control operable from the keyboard, and `disabled` alone drops the value from
  the form.
