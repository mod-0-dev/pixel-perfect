---
"pixel-perfect": minor
---

Add `Grid` (2.3) in three modes: `columns={n}` for a fixed count,
`minItemInlineSize` for an `auto-fit` track that reflows with no query at all,
and `columns="<template>"` for the asymmetric cases neither covers.

`columns` and `minItemInlineSize` are mutually exclusive in the type rather than
by precedence. Every generated track is `minmax(0, 1fr)` — bare `1fr` carries a
`min-content` floor that lets one long string push the grid past its container.

Also exports `gridTracks`, the pure track-list function, and establishes D-024:
a component writes a private custom property and the stylesheet reads the public
one first, so a consumer's override still works from an ancestor.
