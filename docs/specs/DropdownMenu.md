# 4.7 `DropdownMenu`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-072. Its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `hug`, with the overlay exception: `max-inline-size` from the measure scale and `max-block-size` from the available space (D-061 §3), as `Popover` |
| **RSC** | `client` — Radix state, a portal, roving focus, typeahead, positioning |
| **Depends on** | 4.2 `Popover` (`done`): the same foundation pieces, the same panel surface, the same offsets; 3.1 `Button` / 3.2 `IconButton` (the usual trigger, by `asChild`); 1.8 `Kbd` is *not* a dependency (§7) |
| **APG pattern** | [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) for the trigger and [Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) for the list: `role="menu"`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, arrow keys, Home/End, typeahead, submenus on the arrow key that points into them |

The roadmap row promised "typeahead, submenus". Both are Radix's menu
primitive's, and this spec's work is what `Popover` did for a dialog: the
foundation's three additions — the theme across the portal, the logical
side, offsets as steps — plus the visual vocabulary of a *list of commands*,
which no earlier component drew: an item row, its highlighted state, a
checked indicator, a group label, a separator, a submenu chevron and a
shortcut hint.

## Purpose

A list of **commands** anchored to the button that opened it: the actions
on a row, the "⋯" of a card, an account menu, a sort order, a set of
toggles. The user opens it, picks one thing, and it closes. Items can be
plain, checkable (`CheckboxItem`), one-of-many (`RadioItem` in a
`RadioGroup`), grouped under a `Label`, separated, or a `Sub` that opens a
further list beside its trigger.

It deliberately does **not**: hold a form (that is `Popover`, whose content
is arbitrary and whose keyboard model is Tab, not arrows); open on a
right-click or a long press at the pointer (`ContextMenu`, 4.8, which
shares this stylesheet, §2); filter its items as the user types
(`Combobox`, 4.11); or draw an arrow (Popover §8's ruling, and a menu is
flush with its trigger anyway).

---

## Decisions this spec asks you to approve

### 1. Compound, with Radix's parts and our names — fifteen of them

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild><IconButton label="More" variant="ghost"><Dots /></IconButton></DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem onSelect={rename}>Rename<DropdownMenuShortcut>⌘R</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>View</DropdownMenuLabel>
      <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
        <DropdownMenuItemIndicator />Grid
      </DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger" onSelect={remove}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

RULES §5.6, named exports (D-062 §1). The parts are Radix's, minus `Portal`
(always portalled, 4.1 §3; `container` on `Content` and `SubContent`) and
`Arrow` (Popover §8), plus one of ours, `Shortcut` (§7): `DropdownMenu`,
`Trigger`, `Content`, `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`,
`ItemIndicator`, `Group`, `Label`, `Separator`, `Sub`, `SubTrigger`,
`SubContent`, `Shortcut`. Fifteen is many, and it is the shape of the
thing: a menu's vocabulary *is* its parts, each one a role in the APG
pattern, and folding them into props (`items={[…]}`) is the configuration
RULES §5.6 declines — an item with an icon, a shortcut and a submenu does
not fit in an object.

`Trigger` renders a `<button>` or its child by `asChild`, and carries
Radix's `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` and
`data-state`. The rest render `<div>`s with Radix's roles.

### 2. Built on `@radix-ui/react-dropdown-menu`; the stylesheet is shared with `ContextMenu`

The package per 4.1 §2 (it brings `@radix-ui/react-menu`, the primitive
both it and 4.8 `ContextMenu` compose). The list is the same list whether it
opened from a button or from a right-click, so the classes are
`pp-dropdown-menu`, `pp-dropdown-menu__item` and so on, and 4.8 will carry
them first and its own second (`pp-dropdown-menu pp-context-menu`), the
two-class contract of D-070 §1 — one stylesheet for two components, and
nothing that must be kept in agreement by hand. Named here so 4.8 does not
re-decide it.

### 3. `hug` with Popover's ceiling; the item row is a control's height, and there is no `size`

The panel is `Popover`'s box: `max-inline-size: min(--pp-dropdown-menu-max-inline-size
→ --pp-measure-xs, available width)`, `max-block-size` the available height,
`overflow: auto`, so a long menu scrolls inside itself. No `min-inline-size`
from the trigger: a menu is a list of commands, not a `Select`, and its
width is its longest label's, up to the ceiling. `.stylelintrc.json` names
`DropdownMenu.css` in the overlay group (`max-inline-size`).

**The item row is `--pp-control-height-sm` tall** (32px), with
`--pp-control-padding-inline-sm` at its ends — the *small* control metrics
by design: a menu is a dense list read top to bottom, and eight items at
the medium height is a 320px column. The label is
`--pp-control-font-size-sm` (which equals md, by control.css's own
ruling). **No `size` prop.** One density; `--pp-dropdown-menu-item-height`
is the escape for the consumer who wants a taller row on touch.

### 4. `side` and `align` are the tier's; `align` defaults to `start`

The 4.1 §5 vocabulary: `side` logical (`top | bottom | start | end`, default
`bottom`), `sideOffset` and `collisionPadding` as `Space` steps (defaults
`'1'` and `'2'`; a menu sits closer to its trigger than a popover does —
four pixels, the gap between a button and the list that belongs to it).

**`align` defaults to `start`, not `center`.** The tier's table says
`center`, and Popover took it: a dialog panel centred on its trigger reads
as a balloon. A menu is a list, read from its start edge, and a list
centred under a short trigger has its labels beginning somewhere left of
the button and its right edge hanging past it; every native menu hangs
from the trigger's start edge. Recorded as the one component default that
departs from the table, D-072 §1. `SubContent` has no `side` — Radix places
it beside its trigger on the side the direction says (§5) — and its
`align` is `start` too, with an inset so the first sub-item sits on its
trigger's row (§5).

### 5. Direction is read from the trigger at open time and handed to Radix as `dir`

Radix's menu takes `dir` on the root and otherwise assumes `ltr` — no
`DirectionProvider` here, per 4.1 §5 — and `dir` decides more than the side
resolution does for a popover: which arrow key opens a submenu
(`ArrowRight` in LTR, `ArrowLeft` in RTL), which closes it, which side the
submenu appears on, and the roving focus group's own key handling. So the
root holds `dir` as state, and the content — mounted on open, as the
Drawer's surface is (D-071 §3) — reads `directionOf(trigger)` in a layout
effect on mount and sets it, before paint. A right-to-left page opens its
submenus to the left with `ArrowLeft`, with nothing said by the caller.

`SubContent` aligns to its trigger with `alignOffset` of *minus the panel
padding*, resolved by `resolveSpace`, so its first item sits exactly on the
row of the item that opened it — the alignment every native submenu has and
a bare `alignOffset={-4}` would hardcode. Not a prop.

### 6. Modal by default, as Radix: an outside press closes the menu and does not land

`modal` defaults to `true` — Radix's default, and the opposite of
Popover's. While a menu is open, outside pointer events are disabled (a
press outside closes it and reaches nothing under it, as every native menu
does), scroll is locked, the rest of the page is `aria-hidden`, and focus
is trapped in the list. `modal={false}` is the non-modal menu, for the one
the page must stay live behind; the playground's gallery uses it because
three modal menus on one page hide each other (D-062 §2's shape).

The modal lock is the one that rewrites a padded body (D-071 §6). Same
answer: the gutter belongs on a wrapper, and the Dialog docs page says so.

### 7. The vocabulary of a list of commands: highlight, indicator, label, separator, chevron, shortcut

- **The highlighted item.** Radix writes `data-highlighted` on the item the
  pointer is over or the arrow keys reached, and moves DOM focus to it. It
  is styled `--pp-tone-bg-hover` with `--pp-tone-text-strong`, the soft
  Button's hover pair, already asserted for contrast. A keyboard user also
  gets the focus ring, inset, from `:focus-visible` — the browser's
  heuristic keeps it off pointer-driven focus, so a mouse user sees the
  highlight alone. `data-highlighted` is a new attribute in RULES §4's
  list and is added to it (D-072 §2): the highlighted item of a menu is a
  real state that `data-state` cannot carry, because the item's
  `data-state` is `checked | unchecked` for a checkable item.
- **`tone` on `Item`**: `neutral | danger`, default `neutral`. A destructive
  command is red the way a destructive Button is: the item writes
  `data-pp-tone`, and its text and highlight resolve through the tone
  tokens. No other tone: a menu item is not a status.
- **`ItemIndicator`** is the check mark of a `CheckboxItem` and the dot of a
  `RadioItem`, rendered only while checked (Radix's Presence). With no
  children it draws the library's mark — the Checkbox's path, or a filled
  circle — sized `--pp-size-4`; children replace it. It sits in a gutter at
  the item's start, absolutely, and **the gutter exists only in a menu that
  has a checkable item**: `.pp-dropdown-menu:has([role="menuitemcheckbox"],
  [role="menuitemradio"])` insets every item so labels align down the whole
  list, and a menu of plain items keeps its edge. `:has()` is in every
  browserslist target and this library uses it already (`Select`, `Radio`).
- **`Label`** is a group heading: muted, `--pp-font-size-1`, the item's
  inline padding, a shorter row. **`Group`** is `role="group"`, which is
  what makes a `Label` describe its items.
- **`Separator`** is `role="separator"`: a hairline of `--pp-color-border-subtle`
  with `--pp-space-1` above and below, drawn as a content-box background so
  nothing here is a margin (RULES §2).
- **`SubTrigger`** is an item with a chevron at its end, an inline SVG that
  points into the submenu — physically, by `data-side` of the submenu, so
  it points left in RTL. The chevron and the **`Shortcut`** — a muted span
  for the hint a command carries (`⌘R`), *text, not `Kbd`*: a shortcut in
  a menu is a label, not a key cap, and macOS, Windows and every design
  system draw it as muted text — are pushed to the item's end by
  `margin-inline-start: auto`, which `.stylelintrc.json` allows this file
  as it allows Container (D-072 §3). `Shortcut` is `aria-hidden`: the
  command's name is the item's text, and "Rename command R" is noise.

### 8. Controlled and uncontrolled everywhere RULES §5.5 says so

`open` / `defaultOpen` / `onOpenChange` on the root and on `Sub`;
`checked` / `defaultChecked` / `onCheckedChange` on `CheckboxItem`; `value`
/ `defaultValue` / `onValueChange` on `RadioGroup`. Radix's `CheckboxItem`
and `RadioGroup` are controlled-only; this component adds the uncontrolled
half with `useControllableState`, the way every Tier 3 control did.
`onSelect(event)` on every item is Radix's: it fires on activation, the
menu closes after it, and `event.preventDefault()` keeps it open — the
toggle that stays open is written that way in the docs.

---

## Sizing contract justification

`hug`: an inline-level list sized by its longest item up to the ceiling, the
D-061 §3 exception in Popover's exact form. The item rows are `fill` inside
it (`display: flex` on a block child), which is what makes a highlight span
the row.

## Anatomy

```
<button class="pp-dropdown-menu__trigger" aria-haspopup="menu" aria-expanded aria-controls data-state>

body / container
  └── <div>                                                    Radix's positioned wrapper
        └── <div class="pp-dropdown-menu" role="menu" aria-labelledby={trigger} aria-orientation="vertical"
                 data-state data-side data-align data-pp-theme>
              ├── <div class="pp-dropdown-menu__item" role="menuitem" data-highlighted? data-disabled? data-pp-tone?>
              │     ├── {children}
              │     └── <span class="pp-dropdown-menu__shortcut" aria-hidden>            (optional)
              ├── <div class="pp-dropdown-menu__item" role="menuitemcheckbox" aria-checked data-state="checked|unchecked|indeterminate">
              │     └── <span class="pp-dropdown-menu__indicator">                        (while checked)
              ├── <div class="pp-dropdown-menu__group" role="group" aria-labelledby>
              │     ├── <div class="pp-dropdown-menu__label" id>
              │     └── …
              ├── <div class="pp-dropdown-menu__radio-group" role="group">
              │     └── <div class="pp-dropdown-menu__item" role="menuitemradio" aria-checked data-state>
              ├── <div class="pp-dropdown-menu__separator" role="separator">
              └── <div class="pp-dropdown-menu__item pp-dropdown-menu__sub-trigger" role="menuitem" aria-haspopup="menu" aria-expanded data-state>
                    └── <svg class="pp-dropdown-menu__chevron">
  └── <div>                                                    the submenu's wrapper, a later portal
        └── <div class="pp-dropdown-menu pp-dropdown-menu__sub" role="menu" data-side data-pp-theme>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Trigger | `pp-dropdown-menu__trigger` | `<button>` or `asChild` | Opens on pointer down, `Enter`, `Space`, `ArrowDown` |
| Content | `pp-dropdown-menu` | `<div role="menu">` | The panel; `ref`, `className`, `style` land here |
| Item | `pp-dropdown-menu__item` | `<div role="menuitem">` | `tone`, `disabled`, `textValue`, `onSelect` |
| CheckboxItem | `pp-dropdown-menu__item` | `<div role="menuitemcheckbox">` | `checked` / `defaultChecked` / `onCheckedChange` |
| RadioGroup | `pp-dropdown-menu__radio-group` | `<div role="group">` | `value` / `defaultValue` / `onValueChange` |
| RadioItem | `pp-dropdown-menu__item` | `<div role="menuitemradio">` | `value` |
| ItemIndicator | `pp-dropdown-menu__indicator` | `<span>` | The mark; present while checked |
| Group | `pp-dropdown-menu__group` | `<div role="group">` | |
| Label | `pp-dropdown-menu__label` | `<div>` | Names its group |
| Separator | `pp-dropdown-menu__separator` | `<div role="separator">` | |
| Sub | — | — | State only |
| SubTrigger | `pp-dropdown-menu__item pp-dropdown-menu__sub-trigger` | `<div role="menuitem">` | Draws the chevron |
| SubContent | `pp-dropdown-menu pp-dropdown-menu__sub` | `<div role="menu">` | Beside its trigger |
| Shortcut | `pp-dropdown-menu__shortcut` | `<span aria-hidden>` | Muted text at the item's end |

## Props

**`DropdownMenu`** (root): `open` / `defaultOpen` / `onOpenChange`, `modal`
(`true`), `children`.

**`DropdownMenuTrigger`**: `asChild`, …`ComponentPropsWithoutRef<'button'>`.

**`DropdownMenuContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` | Logical (§4) |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | §4 |
| `sideOffset` / `collisionPadding` | `Space` | `'1'` / `'2'` | Steps of the space scale |
| `loop` | `boolean` | `false` | Arrow keys wrap at the ends. Radix's default; APG calls wrapping optional |
| `container` | `Element \| null` | `document.body` | |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onCloseAutoFocus` | Radix's | — | Passed through |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | |

**`DropdownMenuItem`**: `tone?: 'neutral' \| 'danger'`, `disabled?`,
`textValue?` (for typeahead when the children are not text), `onSelect?(event: Event)`,
…`<'div'>`. **`DropdownMenuCheckboxItem`**: Item's, plus `checked?: boolean | 'indeterminate'`,
`defaultChecked?`, `onCheckedChange?(checked: boolean)`. **`DropdownMenuRadioGroup`**:
`value?`, `defaultValue?`, `onValueChange?(value: string)`. **`DropdownMenuRadioItem`**:
Item's, plus `value: string`. **`DropdownMenuSub`**: `open` / `defaultOpen` /
`onOpenChange`. **`DropdownMenuSubTrigger`**: `disabled?`, `textValue?`.
**`DropdownMenuSubContent`**: `sideOffset?: Space` (`'1'`), `collisionPadding?`
(`'2'`), `loop?`, `container?`, the Radix handlers. **`DropdownMenuItemIndicator`**,
**`Group`**, **`Label`**, **`Separator`**, **`Shortcut`**: `<'span'>` / `<'div'>`.

Exported types: `DropdownMenuProps`, `…TriggerProps`, `…ContentProps`,
`…ItemProps`, `…CheckboxItemProps`, `…RadioGroupProps`, `…RadioItemProps`,
`…ItemIndicatorProps`, `…GroupProps`, `…LabelProps`, `…SeparatorProps`,
`…SubProps`, `…SubTriggerProps`, `…SubContentProps`, `…ShortcutProps`,
`DropdownMenuSide`, `DropdownMenuAlign`, `DropdownMenuItemTone`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on trigger, content, sub trigger, sub content | Fade and scale from the anchor (§Styling) |
| Highlighted item | `data-highlighted` on the item | `--pp-tone-bg-hover` fill, strong text; the ring under `:focus-visible` |
| Checked | `data-state="checked \| unchecked \| indeterminate"` on checkable items | The indicator is present |
| Disabled | `data-disabled` on the item | `--pp-color-text-disabled`, no highlight |
| Tone | `data-pp-tone="danger"` on the item | Text and highlight through the danger tokens |
| Placed side / align | `data-side`, `data-align` on content (physical) | Transform origin; the chevron's direction |
| Theme | `data-pp-theme` on content and sub content | Every token resolves in the trigger's theme |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-dropdown-menu-bg` | `--pp-color-bg-raised` | Panel fill |
| `--pp-dropdown-menu-border-color` | `--pp-color-border-subtle` | Panel edge (decoration; the shadow carries the elevation) |
| `--pp-dropdown-menu-radius` | `--pp-radius-3` | Panel corners |
| `--pp-dropdown-menu-padding` | `--pp-space-1` | Inside the panel, around the items |
| `--pp-dropdown-menu-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-dropdown-menu-max-inline-size` | `--pp-measure-xs` | The ceiling |
| `--pp-dropdown-menu-item-height` | `--pp-control-height-sm` | The row |
| `--pp-dropdown-menu-item-radius` | `--pp-radius-2` | The highlight's corners |

**Contrast, computed at the gate (D-048 §1).** Item text is
`--pp-tone-text-strong` on `--pp-dropdown-menu-bg` (neutral 12 on neutral 1
/ 3) and, highlighted, on `--pp-tone-bg-hover` (12 on 4) — Button's soft
variant's pairs, asserted by `lint:contrast` in both themes and every hue,
danger included. The label is `--pp-color-text-muted` (11 on 1 / 3),
Text's muted pair. Disabled text carries no obligation. Nothing new is
asserted and nothing missing is leaned on.

The panel opens with the popover's fade-and-scale from its anchor and
closes with the reverse; `prefers-reduced-motion` makes both `none` by the
component's own rule (D-062 §5).

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Enter`, `Space`, `ArrowDown` on the trigger | Opens; focus moves to the first item (`ArrowUp` opens and focuses the last) |
| `ArrowDown` / `ArrowUp` | Next / previous item, skipping disabled ones; wraps with `loop` |
| `Home` / `End` | First / last item |
| A character | Typeahead: focus moves to the next item whose text starts with what was typed |
| `ArrowRight` (LTR) / `ArrowLeft` (RTL), `Enter`, `Space` on a sub trigger | Opens the submenu, focus on its first item |
| `ArrowLeft` (LTR) / `ArrowRight` (RTL) in a submenu | Closes it, focus back on its trigger |
| `Enter`, `Space` on an item | Activates: `onSelect`, then the menu closes (unless prevented) |
| `Escape` | Closes the menu (the topmost layer, 4.1 §8); focus returns to the trigger |
| `Tab` | Nothing: focus stays in the menu (APG) |

Every row is Radix's. The component installs no key handler; it supplies
`dir` (§5), which is what makes the two arrow rows read correctly in RTL.

## Accessibility notes

- Trigger: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.
- Content: `role="menu"`, `aria-labelledby` → the trigger (Radix's wiring;
  no `Title` part, and none needed — the menu is named by what opened it),
  `aria-orientation="vertical"`.
- Items: `menuitem` / `menuitemcheckbox` / `menuitemradio` with `aria-checked`;
  `aria-disabled` when disabled; a sub trigger carries `aria-haspopup` and
  `aria-expanded`. Groups are `role="group"` labelled by their `Label`.
- The `Shortcut` is `aria-hidden` (§7).
- A modal menu hides the rest of the page from assistive tech while open.
- **Manual walkthrough:** Tab to the trigger, `ArrowDown`, confirm the first
  item is highlighted and announced with the menu's name; type the first
  letter of a later item, confirm focus jumps; `ArrowRight` on the sub
  trigger, confirm the submenu opens with its first item focused, `ArrowLeft`
  closes it; `Enter` on an item, confirm it acted, the menu closed and focus
  is on the trigger; `Space` on a checkbox item written to stay open,
  confirm the mark toggles and the menu stays; open with the pointer and
  click outside, confirm it closes and the click did not land; repeat in a
  dark region and under `dir="rtl"` — the submenu on the left, opened by
  `ArrowLeft`.

## Container behavior

None of its own: positioned against the viewport, ceiling the lesser of the
measure and the available width.

## Usage

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={rename}>
      Rename
      <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned} onSelect={(e) => e.preventDefault()}>
      <DropdownMenuItemIndicator />
      Pinned
    </DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger" onSelect={remove}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Don't

```tsx
// ✗ A form in a menu. Arrow keys own a menu; a form is a Popover.
<DropdownMenuContent><Field label="Name"><Input /></Field></DropdownMenuContent>

// ✗ A physical side. `start` and `end` reverse with the layout.
<DropdownMenuContent side="left" />

// ✗ A pixel offset. Offsets are steps of the space scale.
<DropdownMenuContent sideOffset={4} />

// ✗ A Kbd for a shortcut. The hint is muted text, and DropdownMenuShortcut is it.
<DropdownMenuItem>Rename <Kbd>⌘R</Kbd></DropdownMenuItem>

// ✗ Filtering items by what the user types. That is Combobox (4.11).
<DropdownMenuContent>{items.filter(matches).map(…)}</DropdownMenuContent>

// ✗ A tone other than danger. A menu item is a command, not a status.
<DropdownMenuItem tone="success">Done</DropdownMenuItem>
```

## Testing notes

- **Unit (jsdom):** opens on click and on `ArrowDown`, roles and the
  trigger's `aria-haspopup="menu"` / `aria-controls`; the content is named
  by the trigger; `Escape` closes and returns focus; `onSelect` fires and
  the menu closes, `preventDefault` keeps it open; a disabled item does not
  select; `CheckboxItem` and `RadioGroup` controlled and uncontrolled, with
  `data-state` and `aria-checked`; the indicator's default marks; `Label`
  names its `Group`; `Separator`'s role; `Sub` opens from its trigger and
  the trigger carries `aria-haspopup`; `dir="rtl"` on an ancestor reaches
  Radix (the submenu opens on `ArrowLeft`); `tone="danger"` writes
  `data-pp-tone`; the theme on content and sub content; refs, `className`,
  `style`; a part outside the root throws; axe with the menu open, both
  themes.
- **Browser:** the z-index token reaches Radix's wrapper; the item row is
  `--pp-control-height-sm`; in a menu with a checkable item every label
  starts at the same x, and in a menu without one the first label sits at
  the item's inline padding; `align="start"` puts the panel's start edge on
  the trigger's; `ArrowRight` opens the submenu to the right in LTR and
  `ArrowLeft` opens it to the left under `dir="rtl"`, its first item on the
  sub trigger's row; typeahead; the highlighted item's fill is the hover
  token, resolved; an outside press on a modal menu closes it and does not
  land; the theme crosses; reduced motion is `none`; the gallery holds
  three.
- **Break checks (D-035 §3):** drop the `dir` hand-off (the RTL submenu
  test); drop the `:has()` inset (the alignment test); drop
  `max-inline-size` (a long-label test); drop the reduced-motion rule;
  drop `data-pp-tone` from the item (the tone test).
- **Screenshot:** the playground opens one non-modal menu per Matrix cell
  with `defaultOpen`, beside its trigger (`side="end"`), as Popover's
  gallery does (D-062 §2).

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§4 — `align` defaults to `start`.** Alternative: `center`, the table's.
   **Recommendation: `start`.** A list hangs from an edge.
2. **§3 — the small control height for the row, and no `size`.**
   Alternative: md, or a `size` prop. **Recommendation: sm, one density.**
   A menu is dense by nature; the property is the escape.
3. **§7 — `Shortcut` as muted text, not `Kbd`.** Alternative: compose `Kbd`.
   **Recommendation: text.** A key cap in every row is a menu of buttons.
4. **§7 — the indicator gutter only when a checkable item exists.**
   Alternative: always reserve it, as macOS does. **Recommendation:
   `:has()`.** A plain menu should not carry an empty column.
5. **§6 — modal by default.** Alternative: non-modal, as Popover.
   **Recommendation: modal.** An outside press that lands is how a user
   deletes a row while closing a menu.
