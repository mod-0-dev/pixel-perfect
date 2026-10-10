---
'@mod-0-dev/pixel-perfect': minor
---

New `InputGroup` and `InputGroupAddon` (3.19): an `Input` with an icon, a unit or a button inside its box. The group draws the box and the focus ring, reads `size`, `invalid` and `disabled` from the `Field` above it, and hands them to the `Input`; a press on an icon or a unit focuses the field. `Input` now reads an enclosing group between its own props and the field's. `useInputGroup` is exported beside `useField`.
