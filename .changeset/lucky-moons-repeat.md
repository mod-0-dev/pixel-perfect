---
"pixel-perfect": minor
---

Add `Field` (3.7): a labelled control with its description, its error, and the
ARIA relationships between them — wired once instead of at every call site.

`Field` owns the ids, associates the label, points `aria-describedby` at
whichever of the description and the error actually rendered, and passes `size`,
`required`, `disabled` and the invalid state to both the label and the control.
`error` is the invalid state; there is no `invalid` prop to contradict it, and an
empty string is a valid field rather than an empty message.

Controls read their wiring from the exported `useField()` hook rather than being
cloned, so a control still works standalone, keeps working when you wrap it in
something, and can be one of your own. Precedence is the same everywhere:
an explicit prop beats the field, which beats the default.

For a control the library does not own, `children` may be a render prop —
`{(control) => <input {...control} />}`. Note that a function cannot cross the
server/client boundary, so that form requires the calling component to be a
Client Component; passing an element works from anywhere.

Also adds `orientation="horizontal"` for the checkbox arrangement, `group` for
controls that are not labelable, `labelHidden`, and `controlId` for when the
control's id has to be a known value.
