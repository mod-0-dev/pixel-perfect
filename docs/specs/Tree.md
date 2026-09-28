# 5.11 `Tree`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-088; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — expansion, selection and the focused item |
| **Depends on** | T3 (`done`): the rows are on the control scale |
| **APG pattern** | [Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): `tree`, `treeitem`, `group`; one tab stop; arrows move, expand and collapse; Home and End; Enter selects |

A hierarchy to walk and pick from: folders and files, a document's
sections, an org chart. Nodes expand, and one is selected.

## Purpose

A file browser's sidebar, a settings outline, a category picker. The
reader needs to open a node to see what is in it, close it to get it
out of the way, and pick one; a keyboard user needs to do all of that
from one tab stop with the arrows. This is the ARIA tree view, drawn
with the control tokens, holding nothing but which nodes are open and
which one is picked.

It deliberately does **not**: load children lazily (a node's children
are its React children; an async node is the consumer's node that
renders a `Spinner` child until it has them); select several
(`multiselectable` is a later `mode`); or drag to reorder.

---

## Decisions this spec asks you to approve

### 1. Nested `TreeItem`s; `expanded` and `selected` both controlled and uncontrolled

```tsx
<Tree label="Files" defaultExpanded={['docs']} defaultSelected="readme">
  <TreeItem value="docs" label="docs">
    <TreeItem value="readme" label="README.md" />
    <TreeItem value="spec" label="spec.md" />
  </TreeItem>
  <TreeItem value="src" label="src">…</TreeItem>
</Tree>
```

Two parts, named exports. `TreeItem` takes a `value` (unique in the
tree), a `label`, an optional `icon`, `disabled`, and its children are
its child items — a node with children is a parent, and the component
knows it by counting them. `expanded` / `defaultExpanded` /
`onExpandedChange` (an array of values) and `selected` /
`defaultSelected` / `onSelectedChange` (one value) are each controlled
or uncontrolled (RULES §5.5). A collapsed node's children are not
rendered, so the DOM holds exactly the visible items, which is what the
keyboard walks (§2).

### 2. Focus on the item, one tab stop, the APG keys

Focus lives on the `treeitem` element itself, as the pattern says, and
one item is the tab stop: the focused one, else the selected one, else
the first. Arrow Down and Up move through the visible items; Arrow
Right expands a closed parent, then moves into it; Arrow Left collapses
an open parent, else moves to the parent; Home and End go to the ends;
Enter and Space select (and, on a parent, toggle). In RTL the
horizontal arrows swap, because the tree's hierarchy runs the other
way. A disabled item is in the tree, `aria-disabled`, skipped by the
keys and not selectable. Type-ahead is deferred (D-088 §2).

### 3. A row on the control scale, indented by level; the value is the accent surface

Each item's row is `--pp-control-height-sm` tall, indented
`--pp-tree-indent` (`--pp-space-4`) per level through a custom property
the item writes (`--_pp-tree-level`), so nesting needs no per-level
rule. A parent's chevron turns 90° when open, Accordion's device; the
selected row is `--pp-tone-bg` in the accent scope with the page's text,
medium; hover is `--pp-tone-bg-hover`; the ring is drawn on the row of
the focused item. A pointer press on the row selects it, and on a
parent also toggles it; a press on the chevron alone toggles.

---

## Sizing contract justification

`fill`: the tree is a block that takes its parent's width, each row the
full line, `min-inline-size: 0`; a long label truncates with an ellipsis
rather than widening the tree.

## Anatomy

```
<ul class="pp-tree" role="tree" aria-label="Files" data-size="sm">
  └── <li class="pp-tree__item" role="none" style="--_pp-tree-level: 1">
        ├── <div class="pp-tree__row" role="treeitem" tabindex="0|-1" aria-expanded? aria-owns=(the group)? aria-selected aria-level data-state="open|closed"?>
        │     ├── <span class="pp-tree__toggle" aria-hidden="true">  (the chevron; empty on a leaf)
        │     ├── <span class="pp-tree__icon" aria-hidden="true">?
        │     └── <span class="pp-tree__label">
        └── <ul class="pp-tree__group" role="group" id>   (when open, owned by the row)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Tree | `pp-tree` | `<ul role="tree">` | Named by `label` |
| TreeItem | `pp-tree__item` | `<li role="none">` | The level; presentational |
| row | `pp-tree__row` | `<div role="treeitem">` | Focus, the states, the ring; owns the group |
| toggle | `pp-tree__toggle` | `<span>` | The chevron; a press toggles |
| icon | `pp-tree__icon` | `<span>` | Optional |
| label | `pp-tree__label` | `<span>` | Truncates |
| group | `pp-tree__group` | `<ul role="group">` | The children, when open |

## Props

**`Tree`**: `label: string` (required — a tree without a name is an
unnamed widget), `expanded?`, `defaultExpanded?`, `onExpandedChange?`,
`selected?`, `defaultSelected?`, `onSelectedChange?`, …`<'ul'>` less
`aria-label`. **`TreeItem`**: `value: string`, `label: ReactNode`,
`icon?: ReactNode`, `disabled?`, `children?` (items), …`<'li'>` less
`children`? No — `children` are the items.

Exported types: `TreeProps`, `TreeItemProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| open / closed parent | `aria-expanded`, `data-state` | The chevron turned; the group rendered |
| selected | `aria-selected="true"`, `data-selected` | The accent surface |
| disabled | `aria-disabled` | Muted |
| focused | `tabindex="0"` | The ring on the row |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tree-indent` | `--pp-space-4` | Per level |
| `--pp-tree-row-height` | `--pp-control-height-sm` | Every row |
| `--pp-tree-selected-bg` | `--pp-tone-bg` (accent) | The selected row |
| `--pp-tree-radius` | `--pp-control-radius` | A row's corners |

**Contrast, computed at the gate (D-048 §1).** A row is the page's text
on the page, on the accent `bg` step when selected (the ghost Button's
pairing) and on `bg-hover` on hover; a disabled row is the disabled
text colour, exempt.

## Keyboard interaction

| Key | Does |
| --- | --- |
| Tab | Into the tree (one stop) and out |
| Arrow Down / Up | The next / previous visible item |
| Arrow Right | Expands a closed parent; moves into an open one (swapped in RTL) |
| Arrow Left | Collapses an open parent; moves to the parent otherwise (swapped in RTL) |
| Home / End | The first / last visible item |
| Enter / Space | Selects; on a parent, also toggles |

## Accessibility notes

- `role="tree"` with a name; `treeitem`s with `aria-level`,
  `aria-expanded` on parents, `aria-selected` on the selected one;
  children in a `role="group"`.
- Focus on the item; the ring on its row so it is seen.
- The chevron and the icon are `aria-hidden`; the label is the name.
- **Manual walkthrough:** Tab to "README.md, selected, level 2"; Arrow
  Left to "docs, expanded"; Arrow Left again collapses it; Arrow Right
  opens it; End to the last item.

## Container behavior

`fill`; labels truncate below their width.

## Usage

```tsx
const [selected, setSelected] = useState<string | undefined>('readme');
<Tree label="Files" defaultExpanded={['docs']} selected={selected} onSelectedChange={setSelected}>
  <TreeItem value="docs" label="docs" icon={<FolderIcon />}>
    <TreeItem value="readme" label="README.md" icon={<FileIcon />} />
  </TreeItem>
</Tree>
```

## Don't

- Don't pass a data array; render items.
- Don't nest a `Tree` in a `TreeItem`; nest items.
- Don't make a row a link; a tree picks, and the consumer navigates
  on `onSelectedChange`.

## Testing notes

- **Unit:** the roles, levels, names, `aria-expanded` and the group
  rendered only when open; the tab stop on the selected, else the
  first; Down, Up, Right (expand then enter), Left (collapse then
  parent), Home, End; Enter and Space selecting and toggling; a press
  on the row and on the chevron; a disabled item skipped and not
  selectable; controlled and uncontrolled for both states; `label`
  required at the type level; refs, `className`, `style`; axe both
  themes.
- **Browser:** the indent per level; the row height; the selected
  surface; hover; the ring on the focused row; the chevron turned when
  open; the tree its cell's width and a long label truncating; RTL:
  indent from the right and Arrow Left expanding.
- **Break checks (D-035 §3):** drop the indent; drop the selected
  surface; drop the chevron's turn; drop the row height.
- **Screenshot:** a three-level tree per cell, plus a disabled item
  and RTL outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **Type-ahead?** Deferred: the APG lists it as optional and it needs
   a timer. Recommend later.
2. **Multiple selection?** Deferred; a `mode` when a roadmap item needs
   it.
3. **`keepMounted` for collapsed children?** No: the DOM holding only
   the visible items is what makes the keyboard simple and correct.
