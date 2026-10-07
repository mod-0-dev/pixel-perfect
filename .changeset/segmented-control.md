---
'pixel-perfect': minor
---

Add `SegmentedControl` and `SegmentedControlItem`: exactly one of a few
options, drawn as an attached row of buttons, built on native radios — one
tab stop, arrows that move and select, a value that submits with a form, and
"Light, radio button, checked, 2 of 3" to a screen reader. The checked segment
is the neutral solid fill, 5.90:1 against the page in light and 7.07:1 in
dark. A pressed `Toggle`'s fill is 1.26:1, too faint to tell a choice from its
neighbour. Named by `label`, or by the `Field` around it. Use it where you had
a `ButtonGroup` of `Toggle`s with exactly one pressed.
