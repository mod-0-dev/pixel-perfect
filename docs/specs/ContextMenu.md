# 4.8 `ContextMenu`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-073. In `review` for the CI-authored baseline only (D-069 §2) |
| **Sizing contract** | `hug`, with the overlay exception, exactly as `DropdownMenu` (4.7 §3): the list is the same list |
| **RSC** | `client` — Radix state, a portal, roving focus, typeahead, positioning at a point |
| **Depends on** | 4.7 `DropdownMenu` (`review`, waiting only on its CI-authored baseline — D-073 §2 reads that as Gate B's `done`, by D-069 §2's reasoning): the stylesheet and every part but the root, the trigger and the content are 4.7's |
| **APG pattern** | [Menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/), as 4.7; the trigger is not a menu button but a region, opened by the platform's context-menu gesture: a secondary press, a long press on touch, `Shift+F10` or the Menu key on a focused element |

## Purpose

The commands on a *thing*, opened where the pointer is: a file in a list, a
message, a cell, a canvas. The list is `DropdownMenu`'s — same items,
groups, labels, separators, submenus, marks, shortcuts, the same highlight
and the same keyboard — and what differs is how it opens and where it
appears: from a secondary press on a region, at the pointer.

It deliberately does **not**: replace a visible affordance (a context menu
is discoverable only by gesture, so anything in it must also be reachable
another way — the docs page says so); open on a primary click (that is
`DropdownMenu` with a trigger); or draw anything of its own.

---

## Decisions this spec asks you to approve

### 1. Compound, 4.7's fifteen parts renamed, built once

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <FileCard … />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={rename}>Rename</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
      <ContextMenuSubContent>…</ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem tone="danger" onSelect={remove}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

`ContextMenu`, `Trigger`, `Content`, and the twelve parts a menu is made of
— `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `ItemIndicator`,
`Group`, `Label`, `Separator`, `Sub`, `SubTrigger`, `SubContent`,
`Shortcut` — with the same props, defaults and rulings as 4.7 §7 and §8.
**The twelve are one implementation.** Radix composes `@radix-ui/react-menu`
twice with different scopes, so 4.7's parts cannot be rendered inside a
context menu; but nothing in them is specific to how the menu opened. They
are built by an internal factory (`src/internal/menu/parts.tsx`) that takes
either Radix namespace and returns the library's parts for it — the tone,
the uncontrolled halves, the indicator's marks, the group's name, the
submenu's row alignment — so a fix lands in both, and the two-class
contract below is not the only thing keeping them alike. Recorded as D-073
§1. Types are exported under this component's names
(`ContextMenuItemProps` = 4.7's `DropdownMenuItemProps`).

### 2. Built on `@radix-ui/react-context-menu`, drawn by DropdownMenu.css, with no stylesheet of its own

The package per 4.1 §2. Every part carries 4.7's class first and its own
second — `pp-dropdown-menu pp-context-menu`, `pp-dropdown-menu__item
pp-context-menu__item` — the D-070 §1 contract, named in advance by 4.7
§2. `AlertDialog` changed two rules and had a two-rule stylesheet; this
component changes none, so it ships **no CSS file**: nothing to import,
nothing to lint. The styling API is `--pp-dropdown-menu-*`, unrenamed, for
the reason `AlertDialog`'s is `--pp-dialog-*`: one property, one list.

### 3. The trigger is a region, and it renders a `<div>`

`ContextMenuTrigger` wraps the thing the menu is about. Radix renders a
`<span>`; a region holds block content — a card, a row, a canvas — and an
inline box around block content is not a box a layout can reason about,
so this one renders a **`<div class="pp-context-menu__trigger">`**
(through Radix's `asChild`), or the consumer's own element with `asChild`.
It carries `data-state="open|closed"` and `data-disabled`. It opens on the
`contextmenu` event (a secondary press, or `Shift+F10` / the Menu key on a
focused element, which the browser turns into the same event) and on a
long press of 700ms with touch or pen — Radix's, all of it.

**The region is not made focusable.** A keyboard user opens a context menu
with `Shift+F10` on the focused element, so the thing inside the region
must be focusable — a card that is a link, a row with a button — and most
are. Adding `tabindex` to every region would put a tab stop on a box that
does nothing when focused. The docs page says: make the region, or what
is in it, focusable, and make every command in the menu reachable another
way besides.

### 4. It opens at the pointer, toward the bottom-right, and there is no `side`

Radix anchors a zero-size rectangle at the press point and places the list
to its **right**, aligned to its **top**, flipping at a collision. That is
physical by design — every platform opens a context menu toward the
bottom-right of the pointer, in a right-to-left page too — and it is fixed
inside Radix's content, not exposed. So `Content` has no `side`, `align` or
`sideOffset`; it takes `collisionPadding` (`Space`, `'2'`), `loop`,
`container` and the Radix handlers. Radix's own two-pixel `sideOffset` is
hardcoded in its source and cannot be tokenised from here: the list starts
two pixels right of the pointer, and the spec records it as Radix's number
rather than pretending it is ours.

### 5. Direction goes up as `dir`, read from the region

4.7 §5, with the region as the source: the content reads
`directionOf(trigger)` when it mounts and sets the root's `dir`, so the
submenu opens on `ArrowLeft`, to the left, under `dir="rtl"`, and the
chevron flips by the `dir` Radix writes on the panel.

### 6. Modal by default, and `defaultOpen` exists because the rule says so

`modal` as 4.7 §6. `open` / `defaultOpen` / `onOpenChange`: Radix's root has
no `defaultOpen`, because a context menu has no point to open at until a
press. RULES §5.5 has no exceptions, so the root holds the open state
through `useControllableState` and hands Radix the controlled pair; a
`defaultOpen` menu opens at the document's origin, which the docs page
says is of little use. What the pair is for is *closing* from outside —
`open={false}` when the thing the menu is about is deleted.

### 7. Everything else is DropdownMenu's

The row height, the gutter by `:has()`, the highlight and the ring, the
tone, the marks, the shortcut, the separator, the motion and its
reduced-motion rule, the ceiling and the scrolling list, the theme across
the portal, `data-highlighted` (D-072 §2): 4.7 §3 and §7, unchanged.

---

## Sizing contract justification

4.7's, verbatim: `hug`, the D-061 §3 exception in Popover's form.

## Anatomy

```
<div class="pp-context-menu__trigger" data-state data-disabled?>          (or the asChild element)
  └── {children}                                                           the thing the menu is about

body / container
  └── <div>                                                                Radix's positioned wrapper, anchored at the press point
        └── <div class="pp-dropdown-menu pp-context-menu" role="menu" data-state data-side data-align data-pp-theme dir>
              └── … 4.7's parts, each `pp-dropdown-menu__<part> pp-context-menu__<part>`
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Trigger | `pp-context-menu__trigger` | `<div>` or `asChild` | The region; `disabled` |
| Content | `pp-dropdown-menu pp-context-menu` | `<div role="menu">` | At the pointer |
| the twelve | `pp-dropdown-menu__<part> pp-context-menu__<part>` | 4.7's | |

## Props

**`ContextMenu`** (root): `open` / `defaultOpen` / `onOpenChange`, `modal`
(`true`), `children`.

**`ContextMenuTrigger`**: `disabled?`, `asChild?`, …`ComponentPropsWithoutRef<'div'>`.

**`ContextMenuContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `collisionPadding` | `Space` | `'2'` | Kept between the list and the viewport's edges |
| `loop` | `boolean` | `false` | |
| `container` | `Element \| null` | `document.body` | |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onCloseAutoFocus` | Radix's | — | |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | |

The twelve parts: 4.7's props, under `ContextMenu*Props` names. Exported
types: `ContextMenuProps`, `ContextMenuTriggerProps`, `ContextMenuContentProps`,
the twelve `ContextMenu<Part>Props`, `ContextMenuItemTone`.

## State

4.7's, plus `data-state` and `data-disabled` on the trigger region.

## Styling API

`--pp-dropdown-menu-*`, 4.7's table. No `--pp-context-menu-*`.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Shift+F10`, the Menu key, on a focused element inside the region | Opens at the element (the browser's `contextmenu` event); focus moves to the list |
| Inside the list | 4.7's rows, verbatim |
| `Escape` | Closes; focus returns to where it was |

## Accessibility notes

- The trigger region carries no role and no name: it is the thing the
  menu is about, unchanged. The list is `role="menu"`; Radix does not name
  it by the region (there is no button to name it by), so a consumer may
  pass `aria-label` on `Content` when the list needs one.
- Every command in a context menu must be reachable another way: a
  gesture-only path is not a path for everyone.
- **Manual walkthrough:** right-click the region, confirm the list opens at
  the pointer and `ArrowDown` reaches its first item; `Escape`; Tab to the
  focusable thing inside the region, `Shift+F10`, confirm the list opens
  and `Escape` returns focus; on a touch device long-press, confirm it
  opens and the native callout does not; in a `dir="rtl"` region, confirm
  the submenu opens on `ArrowLeft`, to the left.

## Container behavior

None of its own. The list's ceiling is the lesser of the measure and the
space available from the press point.

## Usage

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <Card tabIndex={0}>Q3 revenue model.xlsx</Card>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={open}>Open</ContextMenuItem>
    <ContextMenuItem onSelect={rename}>Rename</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem tone="danger" onSelect={remove}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## Don't

```tsx
// ✗ The only way to a command. A context menu is found by gesture; give every command a visible path too.
<ContextMenuContent><ContextMenuItem onSelect={theOnlyWayToDelete}>Delete</ContextMenuItem></ContextMenuContent>

// ✗ A region nothing in it can focus. Shift+F10 needs a focused element.
<ContextMenuTrigger><div>Some text</div></ContextMenuTrigger>

// ✗ A side. The list opens at the pointer, toward the bottom-right, everywhere.
<ContextMenuContent side="top" />

// ✗ A stylesheet override by the context menu's name. The properties are the list's: --pp-dropdown-menu-*.
<ContextMenuContent style={{ '--pp-context-menu-bg': '…' }} />
```

## Testing notes

- **Unit (jsdom):** opens on a secondary press with 4.7's roles, the
  trigger's `data-state`, a `<div>` region; `disabled` does not open;
  `Escape` closes; the shared parts behave (a checkbox item uncontrolled,
  a submenu on `ArrowRight`, `ArrowLeft` under `dir="rtl"`, the tone); the
  theme on the panel; controlled and `defaultOpen`; refs, `className`,
  `style` on region and panel; a part outside the root throws; axe open,
  both themes.
- **Browser:** a right-click opens the list at the pointer (its top-left
  two pixels right of the point, by Radix's offset) with 4.7's row height
  and the z-index token on the wrapper; `Shift+F10` on the focused region
  opens it and `Escape` returns focus; the RTL region's submenu opens on
  `ArrowLeft`, to the left; a disabled region does not open; the theme
  crosses; the gallery holds three, each opened by a dispatched
  `contextmenu` event in its cell.
- **Break checks (D-035 §3):** drop `pp-dropdown-menu` from the content
  (the row-height and z-index test: `auto`); drop the `dir` hand-off (the
  RTL test); drop the region's `asChild` (the trigger is a `<span>`; the
  unit test).
- **Screenshot:** three regions, each with its list opened at a point
  inside it by an effect after mount, non-modal, as 4.7's gallery.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§3 — the region is a `<div>`, not Radix's `<span>`.** Alternative:
   keep the span. **Recommendation: `<div>`.** A region holds block
   content.
2. **§3 — no `tabindex` on the region.** Alternative: `tabIndex={0}` so
   `Shift+F10` always has a target. **Recommendation: none.** A tab stop
   that does nothing is a cost every keyboard user pays; the thing inside
   is what should be focusable.
3. **§1 — a shared factory rather than a second copy of 4.7's parts.**
   Alternative: copy. **Recommendation: the factory.** Two copies drift
   (D-045); the two-class contract keeps the CSS in one place and this
   keeps the behaviour in one place.
4. **§2 — no stylesheet.** Alternative: an empty-but-present file for
   symmetry. **Recommendation: none.** A file that changes nothing is a
   place for drift to start.
