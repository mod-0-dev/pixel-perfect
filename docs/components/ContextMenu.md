# ContextMenu

The commands on a thing, opened where the pointer is. Spec:
[`ContextMenu.md`](../specs/ContextMenu.md). The list is
[`DropdownMenu`](DropdownMenu.md)'s.

```tsx
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuShortcut,
  ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuItemIndicator,
  ContextMenuGroup, ContextMenuLabel, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from '@mod-0-dev/pixel-perfect';
```

A secondary press on the region, a long press with touch or pen, or
`Shift+F10` (or the Menu key) on a focused element inside it opens the list
at the pointer, toward the bottom-right, flipping at the viewport's edges.
Inside the list everything is `DropdownMenu`'s: arrows, `Home` / `End`,
typeahead, submenus, `Escape`. Behaviour is
[Radix ContextMenu](https://www.radix-ui.com/primitives/docs/components/context-menu)'s.

**Every command needs another way in.** A context menu is found by
gesture, and not everyone makes the gesture. Whatever is in it must also be
reachable from something visible.

## Usage

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <FileCard tabIndex={0} … />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={open}>Open</ContextMenuItem>
    <ContextMenuItem onSelect={rename}>
      Rename
      <ContextMenuShortcut>⌘R</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem onSelect={archive}>Archive</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem tone="danger" onSelect={remove}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## The region

`ContextMenuTrigger` wraps the thing the menu is about and renders a
`<div>` (a region holds block content), or your own element with
`asChild`. It carries `data-state="open|closed"` and, with `disabled`,
`data-disabled` — a disabled region gives the browser its own menu back.

The region is not focusable by itself. `Shift+F10` opens a context menu at
the focused element, so make the thing inside the region focusable — a
card that is a link, a row with a button — or give the region `tabIndex`
when nothing inside it can be.

## Parts

`ContextMenu` (`open` / `defaultOpen` / `onOpenChange`, `modal`),
`ContextMenuTrigger` (`disabled`, `asChild`), `ContextMenuContent`
(`collisionPadding`, `loop`, `container`, Radix's handlers, `aria-label`),
and the twelve parts of a menu with `DropdownMenu`'s props, defaults and
rules: `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `ItemIndicator`,
`Group`, `Label`, `Separator`, `Sub`, `SubTrigger`, `SubContent`,
`Shortcut`. See [`DropdownMenu`](DropdownMenu.md#parts).

There is no `side`, `align` or `sideOffset`: the list opens at the pointer.

`defaultOpen` exists for the sake of the rule that every stateful component
takes both halves; a list with no press has no point to open at, and it
opens at the document's origin. The controlled pair is for closing from
outside — `open={false}` when the thing the menu is about is deleted.

The list is not named by the region. Pass `aria-label` on
`ContextMenuContent` when a screen reader should announce what the list is
for.

## Styling

`DropdownMenu`'s: every `--pp-dropdown-menu-*` property applies, and there
is no `--pp-context-menu-*`. Every element carries `DropdownMenu`'s class
first and this component's second (`pp-dropdown-menu pp-context-menu`,
`pp-dropdown-menu__item pp-context-menu__item`), so a consumer rule for
the context menu alone has a hook.

## Right-to-left

The direction is read from the region when the list opens: the submenu
opens on `ArrowLeft`, to the left, and its chevron points left. The list
itself still opens toward the bottom-right of the pointer, as native
context menus do in every direction.

## Accessibility

The region carries no role and no name. The list is `role="menu"`; items,
groups and separators are `DropdownMenu`'s. A modal list (the default)
hides the rest of the page from assistive tech while open. `Escape` closes
it and focus returns to where it was.

## Testing in jsdom

Open it with a secondary press: `await user.pointer({ keys: '[MouseRight]',
target: region })`. The list is portalled; query it through `screen`. The
notes on [`DropdownMenu`](DropdownMenu.md#testing-in-jsdom) about a modal
list and axe's `region` rule apply.

## Don't

```tsx
// ✗ The only way to a command. Give every command a visible path too.
<ContextMenuContent><ContextMenuItem onSelect={theOnlyWayToDelete}>Delete</ContextMenuItem></ContextMenuContent>

// ✗ A region nothing in it can focus. Shift+F10 needs a focused element.
<ContextMenuTrigger><div>Some text</div></ContextMenuTrigger>

// ✗ A side. The list opens at the pointer, toward the bottom-right, everywhere.
<ContextMenuContent side="top" />

// ✗ A property by this component's name. The properties are the list's.
<ContextMenuContent style={{ '--pp-context-menu-bg': 'red' }} />
```
