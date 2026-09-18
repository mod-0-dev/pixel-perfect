---
"pixel-perfect": minor
---

Add `Input` (3.8): a single-line text control on the shared control surface,
and the first of Tier 3C.

It reads `size`, `required`, `disabled` and the invalid state from the `Field`
above it through `useField()`, and works standalone when there is no field. One
precedence rule everywhere: an explicit prop beats the field, which beats the
default — including `disabled={false}` inside a disabled field, which does
enable the control.

`value`, `defaultValue` and `onChange` go straight to the DOM. That is the
fullest compliance with the controlled-and-uncontrolled rule rather than an
exception to it: React's own inputs already implement it, and wrapping them
would hand you an `onChange` taking a bare string, which `react-hook-form`
cannot register and which cannot read `event.target.validity`.

**It renders two elements, because an `<input>` does not fill.** A block element
with no width declaration fills its parent — except a form control, which has an
intrinsic inline size from the HTML `size` attribute and measures 185px inside a
600px parent. The root is a one-cell grid, the control stretches into it, and no
width is declared anywhere. `ref` and every native prop go to the `<input>`;
`className` and `style` go to the root, which is the box you are styling.

Focus draws two different things: the one library-wide ring outside the box, and
a tone-shifted border inside it — so an invalid field stays red while you are
fixing it instead of losing its error state the moment you click into it.

`size` is the control scale and never the HTML attribute, which counts
characters. `type` is an allow-list; `checkbox`, `radio`, `range`, `file` and
the button types are other components, and `color` and `hidden` are not text
fields.
