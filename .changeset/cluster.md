---
"pixel-perfect": minor
---

Add `Cluster` (2.2): a horizontal row that wraps, with `gap`, `align`,
`justify` and `wrap`.

Wrapping is the default and needs no container query — flex resolves it
continuously against the space available, so the same `Cluster` is correct in a
240px sidebar and a 960px page without being told which it is in.

`align` defaults to `center` rather than `Stack`'s `stretch`: a row of
mixed-height things reads correctly centred, and that is nearly every row.
