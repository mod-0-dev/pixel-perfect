---
"pixel-perfect": minor
---

Add `Split` (2.6): a fixed pane beside a flexible one, collapsing to stacked
when the container — not the viewport — gets narrow.

Compound: `Split.Sidebar` and `Split.Main`, each taking `asChild` so they can be
landmarks. There is no `side` prop; a right-hand sidebar is `Split.Main` written
first, because `order` would desynchronise reading order from visual order.

`collapseBelow` is named (`sm` / `md` / `lg` / `never`) rather than a free
length, because a container query condition cannot read a custom property.
