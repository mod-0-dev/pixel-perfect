# 6.5 `PageHeader`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `done` — 2026-10-07; written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-097; its CI-authored baselines compared green on runs 205 and 209 (D-013; the sweep is D-108 §5) |
| **Sizing contract** | `fill` — the top of a page's content; block-level, `min-inline-size: 0` |
| **RSC** | `server` — four parts, no state |
| **Depends on** | 2.2 `Cluster` (`done`): the actions; 5.6 `Breadcrumb` (`done`): the trail, as a child; 1.2 `Heading` and 1.1 `Text`: the title and the description |
| **APG pattern** | None. A heading (WCAG 2.4.6) with what belongs beside it |

## Purpose

The top of a page: where you are (a `Breadcrumb`), what the page is (its
`<h1>`), one line about it, and the actions that act on the whole page —
"New release", "Export" — at the end of the title's row, dropping under
the title when the row is too narrow for both. It goes inside the
`AppShell`'s main, at the top of the page's `Container`; it is not the
app's header (that is the shell's `header` slot).

It deliberately does **not**: take a title as a string (the title is a
part, so it can hold a `Badge` or a `Code`); render the breadcrumb (that
is the consumer's `Breadcrumb`, passed as a child and placed); or know a
tab strip (a page with tabs puts `Tabs` under it).

---

## Decisions this spec asks you to approve

### 1. Four named parts, and the `Breadcrumb` is a fifth by being first

```tsx
<PageHeader>
  <Breadcrumb>…</Breadcrumb>
  <PageHeaderTitle>Releases</PageHeaderTitle>
  <PageHeaderDescription>Everything shipped this quarter.</PageHeaderDescription>
  <PageHeaderActions>
    <Button variant="outline">Export</Button>
    <Button tone="accent">New release</Button>
  </PageHeaderActions>
</PageHeader>
```

`PageHeader`, `PageHeaderTitle`, `PageHeaderDescription`,
`PageHeaderActions` as named exports (RULES §5.6, D-079 §1). The
breadcrumb is not a part: `Breadcrumb` already exists, is a landmark of
its own, and needs nothing added; the header places it by its class,
which is the one other component's class this stylesheet names, and the
roadmap's Deps cell says why.

### 2. One flex row that wraps, so nothing is placed by area and no empty row costs a gap

Not a grid of named areas. A grid whose top row is the breadcrumb pays
its `row-gap` for that row whether or not a breadcrumb was given, so a
header without one starts with a hole; and a grid places parts by name,
which lets the DOM order and the visual order disagree. The header is
`display: flex; flex-wrap: wrap` with a `row-gap` and a `column-gap`:

- the breadcrumb and the description take `flex-basis: 100%`, a row each;
- the title takes `flex: 1 1 var(--pp-measure-xs)` and `min-inline-size: 0`,
  so it grows to fill its row and, when its row cannot hold `20rem` of
  title beside the actions, sends the actions to the next line;
- the actions take `flex: 0 0 auto`, their content's size.

A part that is absent is a row that is absent, and `gap` only ever sits
between rows that exist. The one order rule is §3's.

### 3. The description reads after the title and shows after the actions

The DOM order a consumer writes — title, description, actions — is the
reading order a screen reader gets and the tab order (only the actions
and the breadcrumb are focusable, so tab order is breadcrumb, actions
either way). Visually the actions belong on the title's row and the
description under it, so the description carries `order: 1`: DOM title,
description, actions; painted title, actions, description. The one
visual reorder in the library, and it moves a paragraph that takes no
focus, so nothing a keyboard user follows is out of order.

### 4. The title is a `Heading`, level 1 by default

`PageHeaderTitle` is `Heading` with `level` defaulting to `1` — the page's
title is the page's `<h1>` — and `size` defaulting as `Heading` defaults it
from the level; both overridable, because a page inside a `Dialog` or a
settings pane has a different outline. `PageHeaderDescription` is `Text`
with `tone="muted"` by default. `PageHeaderActions` is `Cluster` with
`gap="2"`; it wraps its buttons when it is on its own row and narrow.
Each carries the base component's class and its own (D-070 §1).

### 5. `align-items: flex-start`

The actions align to the top of the title, not its centre: a two-line
title with a centred button looks adrift, and a one-line title with a
top-aligned button is what every page header the user has met does. The
button's box is taller than the heading's line, so `flex-start` leaves it
looking a hair low against a single line; the title's line-height and the
control height differ by design, and a `calc` to split the difference
would be one more thing to keep in step.

---

## Sizing contract justification

`fill`: block-level, no inline size, `min-inline-size: 0`. The title's
`flex-basis` is a wrapping threshold inside the header's own row, not a
size the header claims from its parent.

## Anatomy

```
<header class="pp-page-header">
  ├── <nav class="pp-breadcrumb">                                        the consumer's, optional; its own row
  ├── <h1 class="pp-heading pp-page-header__title">                      grows; sends the actions down when the row is short
  ├── <p class="pp-text pp-page-header__description">                    its own row, painted after the actions (order: 1)
  └── <div class="pp-cluster pp-page-header__actions">                   beside the title, or below it
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-page-header` | `<header>` | Inside `<main>`, so no landmark role: a section's header |
| title | `pp-heading pp-page-header__title` | `Heading` | `level` 1 by default (§4) |
| description | `pp-text pp-page-header__description` | `Text` | `tone="muted"` by default; `order: 1` (§3) |
| actions | `pp-cluster pp-page-header__actions` | `Cluster` | `gap="2"` by default |

## Props

| Component | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `PageHeader` | — | `ComponentPropsWithoutRef<'header'>` | | |
| `PageHeaderTitle` | `level` | `1–6` | `1` | `Heading`'s, made optional |
| | `size`, `tone`, `weight`, `align` | `Heading`'s | `Heading`'s | |
| `PageHeaderDescription` | `tone`, `size`, … | `Text`'s | `tone="muted"` | |
| `PageHeaderActions` | `gap`, `align`, `justify`, `wrap` | `Cluster`'s | `gap="2"` | |

Every part forwards `ref`, merges `className` and `style`, spreads the
rest. `PageHeaderProps`, `PageHeaderTitleProps`,
`PageHeaderDescriptionProps`, `PageHeaderActionsProps` exported.

## State

None. Layout only.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-page-header-row-gap` | `--pp-space-2` | Between rows |
| `--pp-page-header-column-gap` | `--pp-space-4` | Between the title and the actions |
| `--pp-page-header-title-basis` | `--pp-measure-xs` | How much title a row must hold before the actions drop (§2) |
| `--pp-heading-*`, `--pp-text-*`, `--pp-cluster-*` | | The parts, through their base classes |

## Keyboard interaction

None of its own. The breadcrumb's links and the actions' buttons are the
tab stops, in DOM order.

## Accessibility notes

- The title is the page's `<h1>` unless told otherwise (§4); a page has
  one, so a page has one `PageHeader`.
- `<header>` inside `<main>` has no landmark role, which is right: the
  banner is the shell's.
- The description's visual reorder (§3) moves nothing focusable.
- The breadcrumb keeps its own `nav` landmark and name (5.6).

## Container behavior

No container query: the row wraps by its own content (§2). In a 240px or
480px cell the actions sit under the title; at 960px beside it.

## Usage

```tsx
<Container size="lg">
  <Stack gap="6">
    <PageHeader>
      <Breadcrumb>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbPage>Releases</BreadcrumbPage></BreadcrumbItem>
      </Breadcrumb>
      <PageHeaderTitle>Releases</PageHeaderTitle>
      <PageHeaderDescription>Everything shipped this quarter, newest first.</PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="outline">Export</Button>
        <Button tone="accent">New release</Button>
      </PageHeaderActions>
    </PageHeader>
    …
  </Stack>
</Container>
```

## Don't

```tsx
// ✗ A title as a string. The title is a part, so it can hold a Badge.
<PageHeader title="Releases" />

// ✗ Two headers on a page, or one for a section. A section has a Heading.
<PageHeader><PageHeaderTitle level={2}>Details</PageHeaderTitle></PageHeader>

// ✗ Actions that act on one row, not the page. Those go in the row.
<PageHeaderActions><Button>Delete this release</Button></PageHeaderActions>

// ✗ The app's header. That is AppShell's `header` slot.
```

## Tests

- **Unit:** the four parts render with both classes; the title is an
  `<h1>` by default and `level={2}` an `<h2>`; the description is `Text`
  with `tone="muted"`; the actions a `Cluster` with `gap="2"`; a
  `Breadcrumb` child renders in place; refs, `className`, `style` on each;
  server render; axe.
- **Browser:** at 960 the actions are on the title's row at its end and
  the description is below both; at 240 and 480 the actions are below the
  title, above the description; the breadcrumb is above the title in all
  three; with no breadcrumb the title starts at the header's top (no empty
  row); under `dir="rtl"` the actions are at the left.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **Grid areas or a wrapping row?** The row (§2): no empty-row gap, no
   placement by name.
2. **Where does the description paint?** Under the title row, after the
   actions, by `order` (§3).
3. **Is the breadcrumb a part?** No (§1); `Breadcrumb` is placed by class.
4. **Title level default?** 1 (§4).
5. **Centre the actions on the title?** No; `flex-start` (§5).
