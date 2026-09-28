---
'pixel-perfect': minor
---

Add `DropdownMenu` (4.7): a list of commands anchored to the button that
opened it, on `@radix-ui/react-dropdown-menu`. Fifteen named parts —
`DropdownMenu`, `Trigger`, `Content`, `Item`, `CheckboxItem`, `RadioGroup`,
`RadioItem`, `ItemIndicator`, `Group`, `Label`, `Separator`, `Sub`,
`SubTrigger`, `SubContent` and `Shortcut`. `side` is logical and offsets are
steps of the space scale, as across Tier 4; the direction is read from the
trigger at open time, so submenus open on the arrow key that points into
them in either direction. `align` defaults to `start`; rows are the small
control height; a menu with a checkable item gains a gutter so its labels
align; `tone="danger"` marks a destructive command; `CheckboxItem` and
`RadioGroup` are controlled or uncontrolled. Modal by default.
