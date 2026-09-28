---
'pixel-perfect': minor
---

Add `ContextMenu` (4.8): `DropdownMenu`'s list of commands, opened at the
pointer by a secondary press, a long press, or `Shift+F10` on a focused
element, on `@radix-ui/react-context-menu`. The trigger is a region that
renders a `<div>`; the twelve parts a menu is made of are `DropdownMenu`'s,
built once, and every node carries `DropdownMenu`'s class first so one
stylesheet draws both. The direction is read from the region at open time.
`open` / `defaultOpen` / `onOpenChange`; modal by default.
