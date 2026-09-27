---
'pixel-perfect': minor
---

Add `Tooltip` (4.3), the first component built on the overlay foundation
alone. Behaviour — the delays, the grace area between trigger and panel, the
dismissable layer, the positioning — is Radix's (`@radix-ui/react-tooltip`,
tree-shaken away by any app that never imports it); every node, class name
and pixel is ours.

- **`Tooltip`** is compound: `Tooltip`, `TooltipTrigger`, `TooltipContent`,
  as named exports. `Trigger` takes `asChild` to become the `IconButton` or
  `Button` you pass. Controlled with `open` / `onOpenChange`, uncontrolled
  with `defaultOpen`.
- **`TooltipProvider` is optional.** Wrap a toolbar once and moving between
  its buttons opens each tooltip at once, with no delay and no entry
  animation; a lone tooltip needs no provider. `delayDuration` (700ms) and
  `skipDelayDuration` (300ms) are milliseconds.
- **A description, never a name.** The trigger gets `aria-describedby` while
  the tooltip is open; the trigger must already have a name (an
  `IconButton`'s `label`), and the tooltip repeats it.
- **An inverse surface.** Two new semantic tokens, `--pp-color-bg-inverse`
  and `--pp-color-text-inverse` (the body-text pair reversed, in both
  themes), asserted by `lint:contrast`. The panel carries `data-pp-theme`
  read from its trigger's scope, so a tooltip opened from a dark region of a
  light page paints light.
- **`data-state` is `closed | delayed-open | instant-open`** — Radix's three
  values. `instant-open` (keyboard focus, a controlled open, a neighbour's
  skip delay) plays no entry animation. "Is it open" is
  `:not([data-state="closed"])`.
- **`side` is logical** (`top | bottom | start | end`, default `top`), and
  `sideOffset` (`'1'`) and `collisionPadding` (`'2'`) are steps of the space
  scale. Hugs its text up to `--pp-measure-xs` or the space available.
- WCAG 1.4.13: hoverable, dismissable (Escape), persistent.
  `disableHoverableContent` is not exposed. Touch opens nothing; a click on
  the trigger closes it.
- Styling: `--pp-tooltip-bg`, `-color`, `-radius`, `-padding-block`,
  `-padding-inline`, `-shadow`, `-max-inline-size`.
