---
'pixel-perfect': minor
---

Add `Slider` (3.15) — a single-thumb range control on `<input type="range">`.
Tier 3D's second and last component.

- **The native element is the painted control.** Arrow keys, Home/End,
  Page Up/Down, step-on-drag, pointer capture including drag-outside-and-back,
  touch, `role="slider"` with the value attributes, and right-to-left reversal
  all come from the platform; the component installs no key handler at all. That
  is what keeps Tier 3 at zero runtime dependencies.
- **The track is ours and the thumb is the platform's.** The filled portion is a
  **grid column**, not a `linear-gradient`: a gradient needs `to right`, which
  fills from the wrong end in an RTL layout where the native control reverses,
  and it would have to be written twice because the WebKit and Firefox track
  pseudo-elements cannot share a selector list. Grid columns follow the inline
  axis, so RTL is correct with nothing declared about it.
- **`onValueCommit`, because React does not expose the native `change` event for
  a range input.** `onChange` maps to *input*, so it fires on every pixel of a
  drag; without a commit callback the only way to avoid a request per pixel is
  to reimplement pointer and key release handling. A commit fires only when the
  value actually changed, so tabbing past a slider sends nothing.
- **Single-thumb only.** A two-thumb range is a separate component: two
  overlapping inputs each draw `:focus-visible` across the whole track, and
  moving the ring onto the thumb pseudo-element needs `outline: none`, which
  this library bans outright.
- **No `readOnly`** — the attribute is defined for text-like controls and the
  browser ignores it on a range, so offering it would be a promise the platform
  refuses to keep. No `required` either: a slider always has a value.
- `min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue` and
  `onValueChange` mean exactly what they mean on `NumberInput` — one numeric
  contract, two controls, shared in one internal module rather than implemented
  twice.

The rule lint gains a rule with this component: **no selector list may mix a
`-webkit-` and a `-moz-` pseudo-element.** An unknown pseudo-element invalidates
the entire list in the engine that does not know it, so grouping the two thumb
blocks silently unstyles Firefox while looking correct in Chrome.
