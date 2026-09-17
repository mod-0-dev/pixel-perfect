---
"pixel-perfect": minor
---

Add `Toggle` (3.5): a button that stays pressed, with
`pressed` / `defaultPressed` / `onPressedChange` — controlled and uncontrolled,
both, always. Switching between the two mid-life now warns in development
rather than going silently inert.

It is `aria-pressed`, not `aria-checked`, and exposes `data-state="on" | "off"`.
That vocabulary is reserved for pressed controls; `checked` / `unchecked` stays
with `Switch` and `Checkbox`, so what a control *is* reads off the DOM.

Takes no `loading`: a toggle's effect is immediate by definition.
