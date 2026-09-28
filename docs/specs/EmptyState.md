# 5.8 `EmptyState`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-085; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler |
| **Depends on** | 5.1 `Card` (`review`, counted `done` under the batch, D-073 §2): the `outline` form is Card's surface with a dashed edge, by the two-class contract |
| **APG pattern** | None. Static content: a heading, a paragraph, the consumer's buttons |

Nothing here yet, and what to do about it: a place where a list, a
table or a search result would be, saying why it is empty and offering
the one thing that would fill it.

## Purpose

The first screen of an app has no projects; a filter matched nothing; an
inbox is clear. Each is a moment the page is empty by design, and the
empty page must say so — with a glyph so it is not mistaken for a
failure to load, a title that names the situation, a line that says
what to do, and the action that does it. Tier 2's `Center` was written
for "the loading and empty screens"; this is the empty one, composed
of `Heading`, `Text` and the consumer's `Button`s, centred, held to a
readable measure.

It deliberately does **not**: take `title` / `description` / `action`
props (composition over configuration, RULES §5.6 — parts, so a
description can hold a `Link`); render an illustration (an `Icon` slot,
in a tile; a picture is the consumer's child); or announce itself (it is
the page's content, not a status message).

---

## Decisions this spec asks you to approve

### 1. Five parts, named exports; the title's level is the consumer's

```tsx
<EmptyState>
  <EmptyStateIcon><InboxIcon /></EmptyStateIcon>
  <EmptyStateTitle level={2}>No projects yet</EmptyStateTitle>
  <EmptyStateDescription>Create your first project to start tracking work.</EmptyStateDescription>
  <EmptyStateActions>
    <Button tone="accent">New project</Button>
    <Button variant="ghost">Import</Button>
  </EmptyStateActions>
</EmptyState>
```

`EmptyState`, `EmptyStateIcon` (an `Icon` — `decorative`, `lg` — in a
round tile on the sunken surface), `EmptyStateTitle` (a `Heading`,
`size="md"` by default; `level` **required**, as Heading's is, because
the outline of the page is the consumer's), `EmptyStateDescription`
(a `Text`, muted, centred) and `EmptyStateActions` (a `Cluster`,
centred, `gap="2"`). Every part is the Tier 1–2 primitive with the empty
state's class added, so the props are the primitives' (D-085 §1).

### 2. Centred and held to a measure by a grid, not by a width

The root is a grid with one column, `minmax(0, --pp-measure-xs)`
(20rem), centred, its items stretched to it and `text-align: center`
inside. That caps the description at a readable line on a wide page and
lets it be the whole cell at 240px, with no `max-inline-size` on any
child: the parent sizing the box it created is D-021 exactly, and it is
the same device Table's region uses to stretch its table (D-081 §3).
Vertical rhythm is the grid's one `row-gap` (`--pp-space-3`); the
actions stand a little further off by their own `padding-block-start`
(`--pp-space-2`), because a margin is RULES §2's (D-085 §2).

### 3. `plain` by default; `outline` is Card's surface with a dashed edge

`variant="plain"` is the parts on the page, padded `--pp-space-7` on
the block axis. `variant="outline"` adds `pp-card` before
`pp-empty-state`, so Card.css draws the raised surface, the radius and
the hairline, and this file makes the hairline dashed — the "drop zone"
form for a region that will hold things. The two-class contract (D-070
§1): one stylesheet draws the frame, the other changes one thing. Not
`solid`, not `ghost`: an empty state has nothing to fill, and a tinted
one reads as an `Alert`.

---

## Sizing contract justification

`fill`: a block that takes its parent's width, `min-inline-size: 0`,
and centres a bounded column in it (§2). Its height is its content's.

## Anatomy

```
<div class="pp-empty-state" data-variant="plain|outline">        (+ pp-card when outline)
  ├── <span class="pp-icon pp-empty-state__icon" aria-hidden="true">   (Icon, decorative, lg)
  ├── <h2 class="pp-heading pp-empty-state__title">
  ├── <p class="pp-text pp-empty-state__description">
  └── <div class="pp-cluster pp-empty-state__actions">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| EmptyState | `pp-empty-state` | `<div>` | The grid; `data-variant` |
| EmptyStateIcon | `pp-icon pp-empty-state__icon` | `Icon` | A round tile on the sunken surface |
| EmptyStateTitle | `pp-heading pp-empty-state__title` | `Heading` | `level` required |
| EmptyStateDescription | `pp-text pp-empty-state__description` | `Text` | Muted |
| EmptyStateActions | `pp-cluster pp-empty-state__actions` | `Cluster` | Centred |

## Props

**`EmptyState`**: `variant?: 'plain' | 'outline'` (`plain`), …`<'div'>`.
**`EmptyStateIcon`**: `children` (the SVG), …`IconProps` less `label`,
`decorative` and `size`. **`EmptyStateTitle`**: …`HeadingProps`
(`level` required, `size` defaults `md`). **`EmptyStateDescription`**:
…`TextProps` less `align`. **`EmptyStateActions`**: …`ClusterProps` less
`justify`.

Exported types: `EmptyStateProps`, `EmptyStateVariant`,
`EmptyStateIconProps`, `EmptyStateTitleProps`,
`EmptyStateDescriptionProps`, `EmptyStateActionsProps`.

## State

None.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-empty-state-measure` | `--pp-measure-xs` | The column's ceiling |
| `--pp-empty-state-padding-block` | `--pp-space-7` | Above and below |
| `--pp-empty-state-padding-inline` | `--pp-space-5` | Each side |
| `--pp-empty-state-icon-bg` | `--pp-color-bg-sunken` | The icon's tile |
| `--pp-empty-state-icon-color` | `--pp-color-text-muted` | The glyph |

**Contrast, computed at the gate (D-048 §1).** The title is the page's
text; the description muted text on the page (or on `bg-raised` when
outlined, an asserted pairing); the glyph is muted on `bg-sunken`,
neutral 11 / 3, asserted (Table's header pairing).

## Keyboard interaction

None of its own; the actions are the consumer's buttons.

## Accessibility notes

- The title is a real heading at the consumer's level; the icon is
  `aria-hidden`.
- No live region: an empty page is content. A search that returns
  nothing may put `role="status"` on the root through props if the
  result replaces a list in place.
- **Manual walkthrough:** a screen reader reads the heading, the
  paragraph and the buttons, and never the glyph.

## Container behavior

`fill`; the column is the cell up to 20rem and centred beyond it.

## Usage

```tsx
<EmptyState>
  <EmptyStateIcon><InboxIcon /></EmptyStateIcon>
  <EmptyStateTitle level={2}>Inbox zero</EmptyStateTitle>
  <EmptyStateDescription>Nothing needs your attention.</EmptyStateDescription>
</EmptyState>

<EmptyState variant="outline">
  <EmptyStateTitle level={3}>No files</EmptyStateTitle>
  <EmptyStateDescription>Drop files here or <Link href="#">browse</Link>.</EmptyStateDescription>
</EmptyState>
```

## Don't

- Don't pass `title` or `description` props; render the parts.
- Don't put it in a `Center`; it centres itself.
- Don't use it for an error; that is an `Alert`.
- Don't tint it; `outline` is the only frame.

## Testing notes

- **Unit:** the parts and their classes on the primitives (an `Icon`
  hidden and `lg`, a `Heading` at the given level, a `Text` muted, a
  `Cluster`); `variant` on the root and `pp-card` only when outlined;
  refs, `className` and `style` on every part; axe both themes, both
  variants.
- **Browser:** the column is the cell at 240px and 20rem at 960px,
  centred; the parts stacked and centred; the description's text
  centred and muted; the icon tile round, sunken and `--pp-size-12`;
  `outline` has Card's surface and a dashed hairline; the block
  padding.
- **Break checks (D-035 §3):** drop the column's ceiling (the 20rem);
  drop the dashed edge; drop `text-align: center`; drop the tile's
  surface.
- **Screenshot:** the full empty state per cell, plus outline in a
  Card and a title-only one outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A `compact` size for a table cell or a menu?** Not now; the
   padding is a property. Recommend a property, no `size`.
2. **An illustration slot?** The icon tile holds an SVG; a picture is a
   plain child before the title. Recommend no part.
