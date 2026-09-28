---
'pixel-perfect': minor
---

Add `Drawer` (4.6): a modal panel that slides in from an edge of the
viewport and stays the full height (or width) of it. `Dialog` with a
different placement — same parts, renamed (`Drawer`, `DrawerTrigger`,
`DrawerContent`, `DrawerTitle`, `DrawerDescription`, `DrawerClose`), same
rules — plus `side: 'start' | 'end' | 'top' | 'bottom'` (logical, default
`end`). The anchored axis is `--pp-drawer-size` (20rem for a side drawer,
half the viewport for a sheet), capped at the viewport; the panel scrolls,
never the page. Built on `@radix-ui/react-dialog`, already a dependency.
