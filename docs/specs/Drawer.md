# 4.6 `Drawer`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-071. Its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `hug`, with the overlay exception in its edge-anchored form: the panel takes its size on the anchored axis from the measure scale (§3, D-071 §1), and the scrim is Dialog's viewport box (D-067 §2) |
| **RSC** | `client` — Radix state, a portal, a focus trap, a scroll lock |
| **Depends on** | 4.4 `Dialog` (`done`): built on the same primitive, drawn by Dialog's scrim, sharing its focus restore |
| **APG pattern** | [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — a drawer is a modal dialog anchored to an edge; nothing in the pattern changes |

## Purpose

A modal panel that slides in from an edge of the viewport and stays the
full height (or width) of it: a navigation menu on a narrow screen, a
filter rail, a settings sheet, a detail view for a row. The page behind it
is inert until it closes, exactly as behind a `Dialog`; what differs is
where the panel is and how it arrives.

It deliberately does **not**: stay open while the page is used (a
persistent side panel is layout — `Split`, 2.6 — not an overlay; the Dialog
spec §2 named this as Drawer's question, and the answer is that a
non-modal drawer is a `Split` column); anchor to a trigger (`Popover`);
render a handle or support drag-to-dismiss (a sheet that is dragged is a
gesture surface with its own physics, not this component); or take a
`size` prop (§3).

---

## Decisions

### 1. Compound, the tier's shape, with `side` on `Content`

```tsx
<Drawer>
  <DrawerTrigger asChild><IconButton label="Menu"><Menu /></IconButton></DrawerTrigger>
  <DrawerContent side="start">
    <DrawerTitle>Navigation</DrawerTitle>
    …
    <DrawerClose asChild><Button variant="ghost">Close</Button></DrawerClose>
  </DrawerContent>
</Drawer>
```

`Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerTitle`, `DrawerDescription`,
`DrawerClose` — Dialog's six parts, named exports (D-062 §1). `side` is
4.1 §5's logical vocabulary — `start | end | top | bottom` — default
**`end`**, the side a detail or settings panel lives on; a navigation
drawer says `start`. `start` and `end` resolve to `left` / `right` from the
trigger's direction at open time through `resolveSide`, and **`data-side`
on the scrim reports the physical side**, as 4.1 §5 fixed for the tier.

### 2. Built on `@radix-ui/react-dialog`, drawn by Dialog's scrim

Radix has no drawer. A drawer *is* a modal dialog with a different
placement, so this component is built on the package `Dialog` already
brought in — the first Tier 4 component that adds no package, recorded in
D-071 §2 as the reading of 4.1 §2 ("one package per component") for a
primitive Radix does not have. The scrim carries `pp-dialog__scrim
pp-drawer__scrim`, so Dialog.css gives it the viewport box, the layer, the
fill, the fade and the reduced-motion rule; Drawer.css changes its
placement per side and removes the gutter. The panel is `pp-drawer`, its
own class: nothing about a centred, content-sized box applies to a sheet.

### 3. The panel is sized by a token on its anchored axis, and it scrolls

A `Dialog` hugs: its width is its content's. A drawer cannot — a navigation
list is a `Stack` of `fill` items, and a hug panel around it would be as
wide as its longest label. An edge-anchored sheet has one dimension the
viewport gives it (the full height for a side drawer) and one that must
be *chosen*, and nothing in flow chooses it. So the panel declares
`inline-size: min(var(--pp-drawer-size, var(--pp-measure-xs)), 100%)` for
`start` / `end`, and `block-size: min(var(--pp-drawer-size, 50%), 100%)`
for `top` / `bottom` — a length on the anchored axis from the measure
scale, logical, capped at the scrim. This is D-061 §3's exception in its
edge-anchored form and is recorded as D-071 §1; `.stylelintrc.json` gains
a `Drawer.css` entry allowing `inline-size` and `block-size`, the D-019
shape. **No `size` prop**: the same argument as Dialog §3, and the
property is the escape.

On the other axis the panel is stretched by the grid to the scrim's full
extent. **The panel scrolls, not the scrim**: a sheet is the height of the
viewport by construction, so there is nothing for the scrim to scroll
to. `overflow: auto` on the panel, which Radix's scroll lock permits (it
shards the content).

### 4. Placement is the scrim's grid, per physical side

Dialog's scrim is `display: grid; place-items: center`. Drawer's overrides
per `data-side`:

| `data-side` | `justify-items` | `align-items` | Panel |
| --- | --- | --- | --- |
| `left` | `left` | `stretch` | full height, at the left edge |
| `right` | `right` | `stretch` | full height, at the right edge |
| `top` | `stretch` | `start` | full width, at the top |
| `bottom` | `stretch` | `end` | full width, at the bottom |

`justify-items: left | right` are the physical keywords the grid alignment
properties accept, and physical is right here because `data-side` is
physical (§1); `start` and `end` were resolved before paint. The gutter is
`0`: a sheet is flush with its edge. The corners away from the edge take
`--pp-drawer-radius`; the corners on the edge are square.

### 5. Motion: the panel slides, the scrim fades

The panel translates in from its edge (`100%` on the anchored axis to `0`)
over `--pp-duration-normal` with `--pp-easing-decelerate`, and out with
`-accelerate`; a sheet travels further than a dialog's 4% scale and reads
wrong at `fast`. The scrim's fade is Dialog's (`fast`); Radix's Presence
keeps both mounted until the panel's exit ends, which is the longer one.
Under reduced motion every animation is `none`, in this stylesheet.

### 6. Everything else is Dialog's

Focus in on open, the loop, back to the trigger or — with no trigger — to
what had it (the shared `useFocusRestore`); Escape and a scrim press close,
`onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside` veto;
`DrawerTitle` names (a `<div>`), development warns when nothing does;
`aria-modal="true"`; the theme on the scrim; the scroll lock and its RTL
scrollbar gap; the `aria-hidden` sweep; the no-JS gap; modal only.

---

## Anatomy

```
<button class="pp-drawer__trigger" …>

body / container
  └── <div class="pp-dialog__scrim pp-drawer__scrim" data-state data-side data-pp-theme>
        └── <div class="pp-drawer" role="dialog" aria-modal="true" data-state data-side …>
              ├── <div class="pp-drawer__title">
              ├── <p class="pp-drawer__description">
              └── {children} / <button class="pp-drawer__close">
```

## Props

**`Drawer`**: `open` / `defaultOpen` / `onOpenChange`, `children`.
**`DrawerTrigger`**, **`DrawerClose`**: `asChild`, …button props.

**`DrawerContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'start' \| 'end' \| 'top' \| 'bottom'` | `'end'` | Logical (§1) |
| `container` | `Element \| null` | `document.body` | |
| `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` | Radix's | — | Each can `preventDefault()` |
| `aria-label` / `aria-labelledby` / `aria-describedby` | `string` | — | |
| `className` / `style`, …rest | | — | The panel |

Exported types: `DrawerProps`, `DrawerTriggerProps`, `DrawerContentProps`,
`DrawerTitleProps`, `DrawerDescriptionProps`, `DrawerCloseProps`, `DrawerSide`.

## State

`data-state` on trigger, scrim and panel; `data-side` (physical) on scrim
and panel; `data-pp-theme` on the scrim.

## Styling API

`--pp-dialog-scrim` (the scrim is Dialog's), plus:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-drawer-size` | `--pp-measure-xs` (side), `50%` (top / bottom) | The anchored axis (§3) |
| `--pp-drawer-bg` | `--pp-color-bg-raised` | Panel fill |
| `--pp-drawer-border-color` | `--pp-color-border-subtle` | The edge facing the page |
| `--pp-drawer-radius` | `--pp-radius-4` | The corners away from the edge |
| `--pp-drawer-padding` | `--pp-space-5` | Inside |
| `--pp-drawer-shadow` | `--pp-shadow-3` | Elevation |

Contrast: Dialog's pairs; nothing new.

## Keyboard interaction

Dialog's: Enter / Space on the trigger opens; Tab loops; Escape closes and
returns focus; Enter / Space on `Close` closes.

## Accessibility notes

Dialog's. **Manual walkthrough:** open a `start` drawer under `dir="rtl"`
and confirm it is on the right; open a `bottom` drawer and confirm it is
half the viewport tall; put more in it than fits and confirm the panel
scrolls and the page does not.

## Container behavior

The viewport is the container. On a viewport narrower than the token the
side panel is the full width (`min(…, 100%)`).

## Usage

```tsx
<Drawer>
  <DrawerTrigger asChild><IconButton label="Menu"><Menu /></IconButton></DrawerTrigger>
  <DrawerContent side="start" aria-label="Navigation">
    <Stack gap="2">…links…</Stack>
  </DrawerContent>
</Drawer>
```

## Don't

```tsx
// ✗ A persistent side panel. That is Split.
<Drawer open>…</Drawer>

// ✗ A physical side.
<DrawerContent side="left" />

// ✗ Sizing the panel inline. The anchored axis is `--pp-drawer-size`.
<DrawerContent style={{ width: 400 }} />
```

## Testing notes

- **Unit:** open / close, Escape, scrim press, `Close`; `side` resolved to a
  physical `data-side` (`end` → `right` in LTR); the name, the warning,
  `aria-modal`; focus in and back; no-trigger restore; theme on the scrim;
  refs, `className`, `style`; axe.
- **Browser:** `end` is flush with the right edge and full height; `start`
  under `dir="rtl"` is on the right; `bottom` is half the viewport tall and
  full width; the panel's width is 20rem at a wide viewport and 100% at
  320px; a panel taller than its content scrolls itself and the page
  offset is unchanged; the panel's `animation-name` is `none` under reduced
  motion; the gallery holds three, contained.
- **Break checks:** drop `justify-items: right` (the end test); pin
  `resolveSide` (the RTL test); drop `inline-size` (the width test); drop
  the reduced-motion rule.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§3 — `inline-size` from a token, not `hug`.** Alternative: hug with a
   ceiling, as Dialog. **Recommendation: the token.** A sheet around a
   `fill` list would be as wide as its longest label.
2. **§2 — no new package.** Alternative: a third-party drawer (vaul) with
   drag physics. **Recommendation: none.** Drag-to-dismiss is a gesture
   surface, and Radix's dialog already is the drawer minus placement.
3. **§1 — `end` as the default side.** Alternative: `start`. **Recommendation:
   `end`.** Detail and settings panels outnumber navigation drawers, and a
   navigation drawer says `start` in one word.
