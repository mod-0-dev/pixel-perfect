---
'pixel-perfect': minor
---

Add `pixel-perfect/theme` and the `pixel-perfect theme` command: your brand
colour, solved by the library's own generator and proven by its own contrast
checks. `npx pixel-perfect theme --accent "#7c3aed" --out src/brand.css`
writes the complete palette — every hue in both themes, every focus ring
re-solved against every surface — as a stylesheet to import after
`pixel-perfect/styles.css`, reports where each theme's solid fill landed and
whether it had to move to carry its text, and refuses to write a palette that
fails any check the library's own tokens pass. `createTheme({ accent })` is
the same thing as a function, and `--neutral accent` leans the greys toward
your hue. The library's own palette is unchanged: its accent reproduces the
shipped tokens declaration for declaration.
