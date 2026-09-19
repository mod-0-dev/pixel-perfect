---
"pixel-perfect": patch
---

A `Field` with `orientation="horizontal"` — the checkbox arrangement — now shows
a pointer cursor over its label, so the whole row reads as the click target it
is. It sets `Label`'s `--pp-label-cursor` on its own root; a disabled field does
not, because clicking a disabled control's label does nothing.

`Label`'s documentation said `Checkbox` would set this property on its own root.
It never did, and it could not have reached the label from there: inside a
`Field` the label is the control's sibling, and a custom property only inherits
downward. See D-045.
