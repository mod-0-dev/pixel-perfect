---
'@mod-0-dev/pixel-perfect': minor
---

`AppShell` takes `collapseTo="drawer"`: below `collapseBelow` the sidebar is hidden and a menu button at the start of the header opens the same content in a `Drawer` from the start edge; following a link closes it. `menuLabel`, `menuOpen`, `defaultMenuOpen` and `onMenuOpenChange` name and control it, and `menuContainer` portals the drawer into a box of your own, for a shell that is not the whole page. The default, `collapseTo="stack"`, is unchanged.
