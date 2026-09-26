---
'pixel-perfect': minor
---

Add `RangeSlider` (3.17): a two-thumb range control on the same numeric
contract as `Slider` and `NumberInput`, for a price band, a day window, an
acceptable range. The two-thumb case was deferred from `Slider` with two
blockers named, and this component exists to solve those two and nothing else.

- **Two native `<input type="range">` elements, stacked, each spanning the full
  `min`–`max`.** The drag on a thumb, pointer capture, touch, every keyboard
  row, `role="slider"` with its value attributes, and right-to-left reversal
  are all the platform's.
- **The inputs are transparent and the thumbs you see are ours.** So the focus
  ring is drawn on the focused thumb alone, by a sibling selector, with nothing
  suppressed — no `outline: none` anywhere. It is also the first slider thumb
  in the library a test can measure.
- **A press on bare track moves the nearer thumb and keeps dragging it.** The
  `pointer-events` layering that makes both thumbs draggable takes the track
  press away from the inputs, so the root handles it: maps the pointer to a
  value, RTL-aware, picks the nearer thumb, focuses its input and captures the
  pointer until release.
- **The thumbs cannot cross, and the clamp is on the value.** Each input keeps
  the full range so its travel stays aligned with our thumb; a change that
  would cross is clamped to the other thumb's value. When the two meet, the
  input on top is the one that can move toward the open side
  (`data-thumb-top`), so a pair pushed to `max` can be pulled apart.
- **The value is a tuple**, `[start, end]`, always ordered, defaulting to
  `[min, max]`. No minimum gap: a zero-width range is a meaningful selection.
- **`thumbLabels`** (default `['Minimum', 'Maximum']`) names each thumb; the
  group is named by `<Field group>`. `name` goes on both inputs, so
  `FormData.getAll(name)` is `[start, end]`.
- `onValueChange` fires continuously and `onValueCommit` once, as on `Slider`.
  `size`, `invalid` and `disabled` read from the field; `--pp-range-slider-*`
  mirror `--pp-slider-*`.
