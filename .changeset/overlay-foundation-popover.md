---
'pixel-perfect': minor
---

Add the overlay foundation (4.1) and `Popover` (4.2), the first Tier 4
component. Tier 4 is built on **Radix Primitives**: behaviour — the portal,
the dismissable layer, the focus scope, the positioning — is Radix's, and
every DOM node, class name and pixel is ours. `@radix-ui/react-popover` is the
package's first runtime dependency; it is tree-shaken away by any app that
never imports `Popover`.

- **`Popover`** is compound: `Popover`, `.Trigger`, `.Content`, `.Title`,
  `.Description`, `.Close`. `Trigger` and `Close` take `asChild` to become the
  `Button` you pass. Controlled with `open` / `onOpenChange`, uncontrolled
  with `defaultOpen`. Non-modal by default; `modal` traps focus, locks scroll
  and hides the page.
- **The content is a named `dialog`.** `PopoverTitle` names it, or pass
  `aria-label` / `aria-labelledby`; development warns when nothing does.
- **The theme crosses the portal.** The panel carries `data-pp-theme` read
  from its trigger's scope, so a popover opened from a dark region of a light
  page paints dark. The tone does not cross.
- **`side` is logical**: `top | bottom | start | end`, with `start` and `end`
  following the layout's direction. `data-side` on the panel reports the
  physical side it was placed on.
- **Offsets are steps of the space scale.** `sideOffset` and
  `collisionPadding` are `Space` indexes, resolved to pixels from the token.
- **The panel hugs its content up to `--pp-measure-xs`** (a new 20rem step
  of the measure scale) or the space available, whichever is less — the
  overlay exception to the no-`max-width` rule, because an overlay has no
  parent in flow to size it.
- Styling: `--pp-popover-bg`, `-border-color`, `-radius`, `-padding`,
  `-shadow`, `-max-inline-size`.
