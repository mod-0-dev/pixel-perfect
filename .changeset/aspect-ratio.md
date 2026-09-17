---
"pixel-perfect": minor
---

Add `AspectRatio` (2.7): reserves a box of a given shape before its content
loads, so an image or embed does not shift the page when it arrives.

The root is a grid with the child at `1 / 1`, because a single grid item
stretches on the inline axis by default — so the child fills both axes without
the component ever declaring `inline-size`. `ratio` is required; there is no
ratio that is right when you did not think about it.
