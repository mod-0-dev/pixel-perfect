---
'@mod-0-dev/pixel-perfect': minor
---

Fixes from converting a full app to the library:

- `Grid`'s `minItemInlineSize` is clamped to the grid. In a box narrower than the minimum, the grid is one column as wide as the box. Before, it was one column wider than the box.
- An `Avatar`'s initials no longer break onto two lines inside a `Card`, `Dialog` or `Alert`. This showed up mostly in `AvatarGroup`.
- `KeyHints` takes `open`, `defaultOpen` and `onOpenChange` for its shortcut sheet, so a menu item can open it.
- New `useFormatKeys(keys)`: keycaps for render that hydrate without a mismatch on a Mac. `formatKeys(keys, { apple })` now accepts the platform as an option.
- `KeyHints` warns in development when a shortcut uses a combination the browser keeps for itself and never passes to the page, such as Ctrl+Shift+N or Ctrl+T.
