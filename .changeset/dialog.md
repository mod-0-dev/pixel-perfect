---
'pixel-perfect': minor
---

Add `Dialog` (4.4), the first modal. Behaviour — the portal, the focus
trap, the dismissable layer, the scroll lock, the `aria-hidden` sweep — is
Radix's (`@radix-ui/react-dialog`, tree-shaken away by any app that never
imports it); every node and pixel is ours.

- **`Dialog`** is compound: `Dialog`, `DialogTrigger`, `DialogContent`,
  `DialogTitle`, `DialogDescription`, `DialogClose`, as named exports.
  `Trigger` and `Close` take `asChild` to become the `Button` or
  `IconButton` you pass. Controlled with `open` / `onOpenChange`,
  uncontrolled with `defaultOpen`.
- **Modal, and only modal.** There is no `modal` prop: beside its trigger a
  panel is a `Popover`; a panel that stays open while the page is used is a
  `Drawer`.
- **The scrim is rendered by `Content` and is the panel's parent.** It dims
  the page, centres the panel with a grid (so RTL needs nothing), and is
  the scroll container: a panel taller than the viewport keeps its height
  and the scrim scrolls, never the page. Styled by `--pp-dialog-scrim`.
- **The panel hugs its content up to `--pp-measure-sm`** (40rem) or the
  viewport less the gutter, whichever is less. No `size`; the ceiling is
  `--pp-dialog-max-inline-size`.
- **Named by `DialogTitle`** (or `aria-label` / `aria-labelledby`);
  development warns when nothing names it. `aria-modal="true"` on the
  panel.
- **Focus** moves to the first tabbable on open, loops inside, and returns
  to the trigger on close — or, for a dialog opened with no trigger, to the
  element that had focus when it opened.
- Closes on Escape, on a press on the scrim, and from any `DialogClose`;
  `onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside` can veto.
  No automatic close button.
- The theme crosses the portal: the scrim carries `data-pp-theme` read from
  the trigger's scope. `prefers-reduced-motion` makes open and close instant.
- Styling: `--pp-dialog-scrim`, `-gutter`, `-bg`, `-border-color`,
  `-radius`, `-padding`, `-shadow`, `-max-inline-size`.
