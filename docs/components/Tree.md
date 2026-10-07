# Tree

A hierarchy to walk and pick from: the ARIA tree view, drawn with the
control tokens. Spec: [`Tree.md`](../specs/Tree.md).

```tsx
import { Tree, TreeItem } from '@mod-0-dev/pixel-perfect';
```

A client component. It holds which nodes are open and which one is
picked; children are your `TreeItem`s, nested.

## Usage

```tsx
<Tree label="Files" defaultExpanded={['docs']} defaultSelected="readme" onSelectedChange={open}>
  <TreeItem value="docs" label="docs" icon={<FolderIcon />}>
    <TreeItem value="readme" label="README.md" icon={<FileIcon />} />
    <TreeItem value="spec" label="spec.md" icon={<FileIcon />} />
  </TreeItem>
  <TreeItem value="src" label="src" icon={<FolderIcon />}>…</TreeItem>
</Tree>
```

`label` names the tree and is required. A node with child items is a
parent: it gets a chevron and `aria-expanded`, and its children render
only while it is open. `expanded` / `onExpandedChange` (an array of
values) and `selected` / `onSelectedChange` (one value) are each
controlled or uncontrolled.

A press on a row picks it, and opens or closes a parent; a press on the
chevron alone opens or closes. A `disabled` item stays in the tree,
muted, skipped by the keys and not pickable.

## Keyboard

One tab stop: the focused item, else the picked one, else the first.
Arrow Down and Up move through what is visible; Arrow Right opens a
closed parent and then moves into it; Arrow Left closes an open one and
otherwise moves to the parent (both swapped in a right-to-left layout);
Home and End go to the ends; Enter and Space pick, and toggle a parent.

## Props

**`Tree`**: `label` (required), `expanded`, `defaultExpanded`,
`onExpandedChange`, `selected`, `defaultSelected`, `onSelectedChange`,
the rest on the `<ul>`.
**`TreeItem`**: `value` (unique), `label`, `icon`, `disabled`, and its
child items as `children`; the rest on the `<li>`.

## Accessibility

`role="tree"` with a name; each `treeitem` carries `aria-level`,
`aria-selected`, and on a parent `aria-expanded`; children sit in a
`role="group"`. Focus is on the item and the ring is drawn on its row.
The chevron and the icon are hidden; the label is the name.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tree-indent` | `--pp-space-4` | Per level |
| `--pp-tree-row-height` | `--pp-control-height-sm` | Every row |
| `--pp-tree-selected-bg` | `--pp-tone-bg` | The picked row |
| `--pp-tree-radius` | `--pp-control-radius` | A row's corners |

## Anatomy

```
<ul class="pp-tree" role="tree" aria-label="Files">
  └── <li class="pp-tree__item" role="none">
        ├── <div class="pp-tree__row" role="treeitem" aria-expanded="true" aria-level="1" aria-owns="…"> toggle · icon · <span class="pp-tree__label">
        └── <ul class="pp-tree__group" role="group"> …
```

## Don't

```tsx
// ✗ A data array. Render items.
<Tree label="Files" items={nodes} />

// ✗ A row as a link. A tree picks; navigate on onSelectedChange.
<TreeItem value="a" label={<a href="/a">A</a>} />

// ✗ No label. The types reject it.
<Tree>…</Tree>
```
