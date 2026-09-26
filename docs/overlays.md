# Overlays

What every Tier 4 component — `Popover`, and the tooltips, dialogs, menus and
toasts that follow — stands on. Spec:
[`overlay-foundation.md`](specs/overlay-foundation.md); decision: D-061.

## Behaviour is Radix's; everything you can see is ours

Tier 4 is built on [Radix Primitives](https://www.radix-ui.com/primitives).
The portal, the dismissable layer, the focus scope, the ARIA wiring and the
positioning (floating-ui) come from the primitive; every DOM node, class name,
token and pixel is this library's. Each component adds its own
`@radix-ui/react-<name>` as a dependency of `pixel-perfect`. They are
side-effect-free and tree-shakeable: an app that never imports `Popover`
bundles no Radix.

## The theme crosses the portal. The tone does not.

An overlay is portalled to `<body>`, outside the `[data-pp-theme]` subtree
your app set. The component reads the theme from the scope its **trigger**
sits in, once, when it opens, and writes it on its own root — so a popover
opened from a dark sidebar in a light app paints dark. A theme toggled while
an overlay is open is picked up by the next open.

`data-pp-tone` is not copied. A popover opened from a `danger` button is not a
danger-toned popover; it starts neutral, as a portalled subtree naturally
does.

If you pass your own `container`, its theme is yours to set: the copy reads
the trigger's scope, not the container's.

## Sides are logical

Every positioned overlay takes `side: 'top' | 'bottom' | 'start' | 'end'` and
`align: 'start' | 'center' | 'end'`. `start` and `end` resolve against the
trigger's `direction` when the overlay opens, so a `side="start"` panel is on
the left of its trigger in a left-to-right layout and on the right in a
right-to-left one with nothing said by you.

`data-side` and `data-align` on the overlay's root report where it was
**placed**, in physical terms (`left`, `right`), because they are what a
paint rule reads and paint is physical. Style `[data-side="left"]` to style
an outcome; pass `side="start"` to ask for one.

## Offsets are steps of the space scale

`sideOffset` (trigger to panel) and `collisionPadding` (panel to viewport
edge) are `Space` steps — `'0'` to `'9'`, the same index `gap` takes — never
pixel numbers. They are resolved from the token on the trigger element, so an
app that retunes `--pp-space-2` moves every popover with it.

## Stacking

| Layer | Token |
| --- | --- |
| scrim behind a modal | `--pp-z-overlay` |
| modal content | `--pp-z-modal` |
| non-modal floating content (popover, menu) | `--pp-z-popover` |
| toast region | `--pp-z-toast` |
| tooltip | `--pp-z-tooltip` |

Each component's own stylesheet declares its token. A popover opened from
inside a dialog stacks above it; a second dialog opened from that popover
paints in DOM order, which is later.

## Sizing: the one exception

No component in this library declares a `max-width`, except `Container` — and
an overlay panel, which has no parent in flow to size it. A popover hugs its
content up to `--pp-measure-xs` (20rem) or the space floating-ui reports as
available, whichever is less, and scrolls inside itself when it is taller
than the space below its trigger. Override `--pp-<component>-max-inline-size`
for a wider panel.

## Nothing renders on the server

The portal mounts after hydration, so a `defaultOpen` popover is absent from
the server HTML and appears on the first client render — a flash, not a
layout shift, because the panel is positioned and portalled. An overlay that
must exist without JavaScript is not an overlay: a no-JS error summary is an
`Alert`, which is what `Form` composes.

## Dismissal

`Escape` closes the **topmost** dismissable layer and nothing else: an alert
inside a popover inside a page never intercepts it. An outside press closes a
non-modal overlay and still reaches what was pressed; a modal one swallows it.
Focus moves into the overlay on open and returns to the trigger on close.

## Testing in jsdom

Radix runs in jsdom. Positioning lands the panel at the top-left (there is no
layout), which is fine for behaviour tests. The panel is **portalled**, so
query it through `screen`, not through your render container. The library's
existing `ResizeObserver` stub covers floating-ui's observer.
