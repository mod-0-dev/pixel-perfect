---
'pixel-perfect': patch
---

Fix `AvatarGroup` hiding part of every covered face's initials: the overlap
did not count the 2px ring each face draws outside itself, so the next face
hid a fifth of the face plus the ring. The overlap now includes the ring, and
a covered face's initials sit in the middle of the part left visible, so
pairs like "AT", "GH" and "MH" keep both letters (MH at `md` and `lg`).
The group is 2px wider per face.

Fix `Code` inside a `Link` keeping its own grey ink: it takes the link's
colour, at rest and on hover, on its own background. Every link tone on that
background is 4.5:1 or better in both themes, now asserted by
`npm run lint:contrast`.

Fix code blocks, tables and scrollers rendering larger text on iPhone when
their content is wider than the screen: iOS Safari's text autosizing enlarged
text in any box whose lines ran past the screen edge. `CodeBlock`, `Table`
and `Scroller` set `text-size-adjust: 100%`. A responsive app should set it
on `html` too, for its own content.
