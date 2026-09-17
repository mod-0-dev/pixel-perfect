---
"pixel-perfect": minor
---

Add `Container` (2.4) — the only component in the library permitted to set
`max-inline-size`, which is its entire job.

Takes `size` (`40rem` / `64rem` / `80rem`) and `gutter`. The gutter defaults to
a non-zero step where `gap` defaults to zero: a zero gap is a legitimate design,
a zero page gutter is text against the edge of a phone screen.

Adds `--pp-measure-sm/md/lg` to the token layer — a third dimensional scale,
answering how wide content may run rather than how far apart boxes sit or how
big a box is (D-025).

Building it also found that the raw-unit lint never covered `max-inline-size`,
`block-size`, `min-block-size`, `max-block-size` or `flex-basis`. It does now,
with fixtures so the rule is observed firing.
