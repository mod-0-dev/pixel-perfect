---
"pixel-perfect": minor
---

Add `IconButton` (3.2): a square `Button` whose accessible name is required by
the type. `label: string` is non-optional, so an unnamed icon button does not
compile — which is why it is a separate component rather than a `Button` prop.

Pass the raw SVG as children; it is wrapped in `<Icon decorative>` so the
control is never named twice. `size` sets the box from `--pp-control-height-*`
and passes through to `Icon`, so a 32px button holds a 16px icon with no second
scale to keep in step.

`variant` defaults to `"ghost"` rather than `Button`'s `"solid"`. It takes no
`asChild`: `children` is already the SVG, so there is no slot for a delegate.
