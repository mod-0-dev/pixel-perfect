# Drawer

A modal panel that slides in from an edge of the viewport and stays the
full height (or width) of it. Spec: [`Drawer.md`](../specs/Drawer.md). It is
a [`Dialog`](Dialog.md) with a different placement.

```tsx
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from '@mod-0-dev/pixel-perfect';
```

The page behind it is inert until it closes — scroll locked, hidden from
assistive tech, no pointer — and it closes on `Escape`, on a press on the
scrim, or from any `DrawerClose`. Focus moves in on open, loops, and returns
to the trigger (or, with no trigger, to the element that had it).

**Not a persistent side panel.** A panel that stays open while the page is
used is layout: put it in a `Split` column. A drawer is modal.

## Usage

```tsx
<Drawer>
  <DrawerTrigger asChild><IconButton label="Menu"><Menu /></IconButton></DrawerTrigger>
  <DrawerContent side="start" aria-label="Navigation">
    <Stack gap="2">
      <Link href="/">Home</Link>
      <Link href="/reports">Reports</Link>
    </Stack>
  </DrawerContent>
</Drawer>
```

A bottom sheet:

```tsx
<DrawerContent side="bottom">
  <DrawerTitle>Share</DrawerTitle>
  …
</DrawerContent>
```

## `side`

`'start' | 'end' | 'top' | 'bottom'`, default `end`. Logical: `start` and
`end` follow the layout's direction, so a navigation drawer says `start`
and is on the right in a right-to-left page. `data-side` on the scrim and
the panel reports the physical side it was placed on.

## Sizing

The anchored axis is a token, not the content's: `--pp-drawer-size`,
`--pp-measure-xs` (20rem) for a side drawer and `50%` for a top or bottom
sheet, capped at the viewport. On the other axis the panel is the full
extent of the viewport. A side drawer on a viewport narrower than 20rem is
the full width. The panel scrolls when its content is taller; the page
never does.

The page behind it must not move either, and one thing makes it move:
Radix's scroll lock zeroes the top, left and right padding of `<body>`
while any modal is open. Carry the page gutter on a wrapper inside the
body, never on the body itself — the whole story is on the
[`Dialog`](Dialog.md#right-to-left-and-the-scrollbar) page.

```tsx
<DrawerContent style={{ '--pp-drawer-size': 'var(--pp-measure-sm)' }}>
```

## Parts and props

The six parts are Dialog's, renamed: `Drawer`, `DrawerTrigger`,
`DrawerContent` (with `side` and `container`), `DrawerTitle` (a `<div>`),
`DrawerDescription`, `DrawerClose`. `DrawerContent` takes Dialog's
handlers — `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`,
`onPointerDownOutside`, `onInteractOutside` — each of which can
`preventDefault()`. `ref`, `className` and `style` land on the panel.

## Styling

`--pp-dialog-scrim` for the scrim (it is Dialog's), plus:

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-drawer-size` | `--pp-measure-xs` / `50%` | The anchored axis |
| `--pp-drawer-bg` | `--pp-color-bg-raised` | Panel fill |
| `--pp-drawer-border-color` | `--pp-color-border-subtle` | The edge facing the page |
| `--pp-drawer-radius` | `--pp-radius-4` | The corners away from the edge |
| `--pp-drawer-padding` | `--pp-space-5` | Inside |
| `--pp-drawer-shadow` | `--pp-shadow-3` | Elevation |

The panel slides in from its edge and the scrim fades;
`prefers-reduced-motion` makes both instant.

## Don't

```tsx
// ✗ A persistent side panel. That is Split.
<Drawer open>…</Drawer>

// ✗ A physical side. `start` and `end` reverse with the layout.
<DrawerContent side="left" />

// ✗ Sizing the panel inline. The anchored axis is `--pp-drawer-size`.
<DrawerContent style={{ width: 400 }} />

// ✗ No name. Title, aria-labelledby or aria-label; development warns.
<DrawerContent>…</DrawerContent>
```
