---
"pixel-perfect": minor
---

Add `ButtonGroup` (3.4): related buttons rendered as one attached unit, with a
required `label` and `orientation`.

It is the attached case and only the attached case — a group that merely spaces
buttons out *is* `<Cluster gap="2">`, so there is no `attached` prop. It does
not manage selection: one-of-many is a `RadioGroup`, several-of-many is a row of
`Toggle`s.

It styles its children by descendant selector rather than cloning them with
props, so `asChild` children and mixed `Button` / `IconButton` contents work.
Every button keeps its own tab stop, deliberately not the APG toolbar's roving
tabindex — that is `Toolbar` (6.6).
