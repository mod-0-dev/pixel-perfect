# DropdownMenu

A list of commands anchored to the button that opened it. Spec:
[`DropdownMenu.md`](../specs/DropdownMenu.md). Foundation: [Overlays](../overlays.md).

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuItemIndicator,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from 'pixel-perfect';
```

Behaviour is [Radix DropdownMenu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)'s
— arrow keys, `Home` / `End`, typeahead, submenus on the arrow key that points
into them, `Escape` — and every row, mark and pixel is ours. The user opens it,
picks one thing, and it closes.

**Not a popover, not a context menu, not a combobox.** A form belongs in a
`Popover` (Tab moves through a form; arrows move through a menu). The same
list opened from a right-click is `ContextMenu`. A list filtered by what the
user types is `Combobox`.

## Usage

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton label="More" variant="ghost"><Dots /></IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={rename}>
      Rename
      <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onSelect={archive}>Archive</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger" onSelect={remove}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

`onSelect` fires when an item is activated, by pointer or by `Enter` / `Space`,
and the menu closes after it. Call `event.preventDefault()` in it to keep the
menu open — the way a toggle is written:

```tsx
<DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned} onSelect={(e) => e.preventDefault()}>
  <DropdownMenuItemIndicator />
  Pinned
</DropdownMenuCheckboxItem>

<DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
  <DropdownMenuRadioItem value="name"><DropdownMenuItemIndicator />Name</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="date"><DropdownMenuItemIndicator />Date</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

Both are also uncontrolled: `defaultChecked`, `defaultValue`.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `DropdownMenu` | nothing | `open` / `defaultOpen` / `onOpenChange`; `modal` (`true`) |
| `DropdownMenuTrigger` | `<button>`, or its child with `asChild` | `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `data-state` |
| `DropdownMenuContent` | `<div role="menu">` | The list, named by the trigger. Portalled to `<body>` (or `container`) |
| `DropdownMenuItem` | `<div role="menuitem">` | `onSelect`, `disabled`, `textValue`, `tone` |
| `DropdownMenuCheckboxItem` | `<div role="menuitemcheckbox">` | `checked` / `defaultChecked` / `onCheckedChange` |
| `DropdownMenuRadioGroup` | `<div role="group">` | `value` / `defaultValue` / `onValueChange` |
| `DropdownMenuRadioItem` | `<div role="menuitemradio">` | `value` |
| `DropdownMenuItemIndicator` | `<span>`, while checked | The check, dash or dot; give it children for another mark |
| `DropdownMenuGroup` | `<div role="group">` | Named by the `Label` inside it |
| `DropdownMenuLabel` | `<div>` | A group heading |
| `DropdownMenuSeparator` | `<div role="separator">` | |
| `DropdownMenuSub` | nothing | `open` / `defaultOpen` / `onOpenChange` |
| `DropdownMenuSubTrigger` | `<div role="menuitem">` | Draws the chevron |
| `DropdownMenuSubContent` | `<div role="menu">` | Beside its trigger, its first item on the trigger's row |
| `DropdownMenuShortcut` | `<span aria-hidden>` | Muted text at the item's end |

## `DropdownMenuContent` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` | Logical: `start`/`end` follow the layout's direction |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | A list hangs from its trigger's start edge |
| `sideOffset` | `Space` | `'1'` | A step of the space scale between trigger and list |
| `collisionPadding` | `Space` | `'2'` | Kept between the list and the viewport's edges |
| `loop` | `boolean` | `false` | Arrow keys wrap at the ends |
| `container` | `Element \| null` | `document.body` | Where the list is portalled |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onCloseAutoFocus` | | — | Radix's; each can `preventDefault()` |
| `className` / `style` | | — | Land on the list |

`ref` goes to the list. `DropdownMenuSubContent` takes `sideOffset`,
`collisionPadding`, `loop` and `container`; its side is the one the layout's
direction says.

## Right-to-left

The component reads the trigger's direction when the menu opens and hands it
to Radix. In a `dir="rtl"` page, `side="start"` is on the right, the submenu
opens to the left on `ArrowLeft` and closes on `ArrowRight`, and the chevron
points left. Nothing to pass.

## Tone

`tone="danger"` on an item is for a destructive command: its text and its
highlight go through the danger tokens. There is no other tone — a menu
item is a command, not a status.

## Sizing

The list hugs its longest row, up to `--pp-dropdown-menu-max-inline-size`
(`--pp-measure-xs`, 20rem) or the space beside its trigger, whichever is
less, and scrolls inside itself when taller than the space below. A row is
`--pp-control-height-sm` tall: a menu is a dense list, and eight rows at the
medium height is a 320px column. There is no `size`; the property below is
the escape.

In a menu with a checkable item every row is inset to leave room for the
mark, so labels align down the whole list. A menu of plain commands has no
gutter.

## Modal

`modal` is `true` by default, as with every native menu: an outside press
closes the menu and reaches nothing under it, scroll is locked, the rest of
the page is hidden from assistive tech, focus stays in the list.
`modal={false}` keeps the page live behind the menu. The scroll lock is the
one that rewrites a padded `<body>` — put the page gutter on a wrapper, see
[`Dialog`](Dialog.md#right-to-left-and-the-scrollbar).

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-dropdown-menu-bg` | `--pp-color-bg-raised` | List fill |
| `--pp-dropdown-menu-border-color` | `--pp-color-border-subtle` | List edge, separators |
| `--pp-dropdown-menu-radius` | `--pp-radius-3` | List corners |
| `--pp-dropdown-menu-padding` | `--pp-space-1` | Around the rows |
| `--pp-dropdown-menu-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-dropdown-menu-max-inline-size` | `--pp-measure-xs` | The ceiling |
| `--pp-dropdown-menu-item-height` | `--pp-control-height-sm` | The row |
| `--pp-dropdown-menu-item-radius` | `--pp-radius-2` | The highlight's corners |

The highlighted row (`data-highlighted`, the pointer's or the arrow keys')
is filled with `--pp-tone-bg-hover`; a keyboard user also sees the focus
ring. The list opens with a short fade and scale from its anchor;
`prefers-reduced-motion` makes it instant.

## Accessibility

Trigger: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`. List:
`role="menu"`, named by the trigger, `aria-orientation="vertical"`. Items
carry their roles and `aria-checked`; a disabled item is `aria-disabled`; a
sub trigger has `aria-haspopup` and `aria-expanded`; a group is named by its
label. The shortcut is `aria-hidden`: the command's name is the item's text.
`Tab` does nothing inside a menu, as the pattern says; `Escape` closes it and
returns focus to the trigger.

## Anatomy

```
<button class="pp-dropdown-menu__trigger" aria-haspopup="menu" aria-expanded aria-controls data-state>

body
  └── <div>                                        Radix's positioned wrapper
        └── <div class="pp-dropdown-menu" role="menu" data-state data-side data-align data-pp-theme dir>
              ├── <div class="pp-dropdown-menu__item" role="menuitem" data-highlighted? data-pp-tone>
              │     └── <span class="pp-dropdown-menu__shortcut" aria-hidden>
              ├── <div class="pp-dropdown-menu__item" role="menuitemcheckbox" aria-checked data-state>
              │     └── <span class="pp-dropdown-menu__indicator">
              ├── <div class="pp-dropdown-menu__group" role="group" aria-labelledby>
              │     └── <div class="pp-dropdown-menu__label" id>
              ├── <div class="pp-dropdown-menu__separator" role="separator">
              └── <div class="pp-dropdown-menu__item pp-dropdown-menu__sub-trigger" role="menuitem" aria-haspopup aria-expanded>
                    └── <svg class="pp-dropdown-menu__chevron">
```

## Testing in jsdom

The list is portalled: query it through `screen`. A modal menu hides the
rest of the page from assistive tech while open, so the trigger is no longer
found by role — read it by text, or use `modal={false}`. axe's `region`
best-practice rule flags any portalled menu, which lands in `<body>` outside
every landmark; disable that rule for the open-menu check, as this library's
own test does.

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

// ✗ A tone other than danger. A menu item is a command, not a status.
<DropdownMenuItem tone="success">Done</DropdownMenuItem>
```
