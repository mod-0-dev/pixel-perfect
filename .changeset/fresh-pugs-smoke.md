---
"pixel-perfect": minor
---

Add `Label` (3.6): the visible name of a form control, and the first half of the
`Field` foundation.

It rides the control scale rather than the text scale — `size` resolves
`--pp-control-font-size-*`, the same token the input beside it reads — so a
label and its field agree by construction. That makes `sm` and `md` the same
type size deliberately: a control gets small by losing height and padding, and a
12px label is not a smaller label.

`required` renders an `aria-hidden` asterisk rather than visually-hidden text,
because the control already announces the state and two announcements are worse
than one. It is presentational: `Label` has no control to mark, so set
`required` on the input too, or let `Field` set both.

`invalid` exposes `data-invalid` and changes nothing visually. A field in error
already has a red border, a red message and `aria-invalid`; a red label is the
fourth signal and the only one made of colour alone. Restyle it in one selector
if you disagree.
