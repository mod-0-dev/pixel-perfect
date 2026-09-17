---
"pixel-perfect": minor
---

Add `Center` (2.5): centres its children in the box it was given, on either axis
or both.

It does not constrain a measure — that is `Container` — and it has no height
prop. Block size comes from the parent or from `--pp-center-min-block-size`, the
same answer `Skeleton` gives to the same problem.
