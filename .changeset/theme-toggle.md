---
'pixel-perfect': minor
---

Add `ThemeToggle` (6.2): a square button that flips the page between light
and dark through `ThemeProvider`. Both faces — a sun named "Switch to dark
theme", a moon named "Switch to light theme" — are rendered and the
stylesheet displays one from `<html>`'s theme or the system's preference,
so it is right before hydration and never disagrees with the page. Labels
and icons are props; Button's variants, tones and sizes apply.
