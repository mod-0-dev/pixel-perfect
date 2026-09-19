---
"pixel-perfect": minor
---

`Scroller` with `orientation="both"` now measures and shades both axes. It
reports the block axis as `data-overflow`, as before, and the inline axis as a
new `data-overflow-inline` attribute; all four edges draw a shadow when content
lies beyond them. As shipped, `both` measured the block axis only and the inline
edge had no shadow and no attribute. `vertical` and `horizontal` are unchanged
and carry no inline attribute. See D-046.
