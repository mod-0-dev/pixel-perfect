---
'pixel-perfect': minor
---

Add `Toolbar` (6.6): a named row of controls with one tab stop. It finds
the controls in its own subtree — no wrapper part — keeps the last
focused one as the stop, walks them with the arrow keys in the writing
direction (Up and Down when vertical), jumps with Home and End, wraps
at the ends unless `loop={false}`, and leaves the keys alone inside a
text field. A wrapping row with a `gap`, or a column.
