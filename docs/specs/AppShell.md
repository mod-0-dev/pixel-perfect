# 6.3 `AppShell`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `done` — 2026-10-07; written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-096; its CI-authored baselines compared green on runs 205 and 209 (D-013; the sweep is D-108 §5) |
| **Sizing contract** | `fill` — the page frame; takes the inline space it is given and, if its parent has a block size, that too (§6) |
| **RSC** | `server` — landmarks and a skip link; `useId()` names the main (D-081 §4). No state, no effects |
| **Depends on** | 2.6 `Split` (`done`): the sidebar beside the main, stacking by the container's width; 1.4 `VisuallyHidden`'s technique for the skip link, by CSS not by the component |
| **APG pattern** | [Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/): `banner`, `main`, `contentinfo`, with `navigation` brought by the sidebar's content (6.4). A [skip link](https://www.w3.org/WAI/WCAG22/Techniques/general/G1) as the first focusable thing |

The roadmap row said only "`fill`, `server`, deps 2.6", and Tier 2's spec
said what it is for: "`Split` — replaces the app shell's viewport media
query, which is the single clearest demonstration of RULES §1 in the
consuming app" (tier-2-layout.md §11), and the launchpad's `.lp-shell`
with "its last viewport media query" is still on the roadmap's open list.
This is that shell: the frame a Next.js layout wraps its pages in.

## Purpose

The frame of an app page: a header across the top, a sidebar beside the
content, the content as the page's `<main>`, a footer under both — and a
skip link to the content as the very first thing a keyboard reaches. It
composes `Split` for the middle row, so the sidebar stacks above the
content when the shell is narrow, by the shell's own width and never the
viewport's.

It deliberately does **not**: put navigation in the sidebar (that is 6.4
`NavSidebar`, or a `<nav>` of the app's own); give the content a gutter or
a measure (that is `Container`, 2.4, inside `main`); scroll its panes
independently (§7); or set the viewport's height (§6).

---

## Decisions this spec asks you to approve

### 1. Slots for the frame's parts; `children` is the page

```tsx
// app/layout.tsx
<AppShell header={<Brand />} sidebar={<NavSidebar … />} footer={<Legal />}>
  {children}
</AppShell>
```

`header`, `sidebar` and `footer` are element props; `children` renders
inside `<main>`. This is a deliberate step off RULES §5.6's preferred
shape (`<Card><CardHeader/></Card>`), for three reasons that hold together
and nowhere else in the library:

- **The root must own `<main>`.** The skip link needs the main's `id`, the
  main needs `tabIndex={-1}` to receive that focus, and the root is a
  Server Component: there is no context to carry an id from a root to a
  child part (D-081 §4 gives `useId`, not `useContext`). Rendering `<main>`
  in the root is the only way the wiring is the component's and not the
  consumer's.
- **The frame has one arrangement.** Header above, sidebar beside main,
  footer below. Child parts would let a consumer order them, and every
  order but one is a bug the stylesheet would then have to undo. A slot
  cannot be misplaced.
- **A Next layout's `{children}` is the page.** `<AppShell …>{children}</AppShell>`
  is the line a consumer writes; it reads as what it is.

§5.6's objection is to configuration — `headerTitle`, `headerIcon` —
and a slot is composition: it takes an element, and what is inside it is
the consumer's tree. The parts still have `pp-app-shell__*` classes and
component properties, so nothing about the styling contract changes.
Recorded as D-096 §1, reversible.

### 2. The skip link is built in and first

Every app page needs one and almost none has one. The root renders
`<a class="pp-app-shell__skip" href="#<main id>">Skip to content</a>` as
its first child — before the header, so it is the first tab stop on the
page — hidden by the `VisuallyHidden` technique's `clip-path` and shown
at the shell's top-start corner while focused. The label is a prop
(`skipLinkLabel`) for translation. The main carries `tabIndex={-1}` so the
fragment navigation moves focus as well as scroll, and a ring inside its
edge shows where focus went.

### 3. `Split` is the middle row, with its two knobs passed through

`sidebarInlineSize` (`'16rem'`) and `collapseBelow` (`'md'`) are `Split`'s
props with `Split`'s defaults, forwarded as they are; the sidebar is
`SplitSidebar` and the main is `SplitMain` rendered as `<main>`. Below
the threshold the sidebar stacks above the content at full width — the
honest no-JavaScript narrow layout; a sidebar that becomes a drawer is
6.4's decision, made with `Dialog`'s machinery, not a layout's. With no
`sidebar`, there is no `Split`: the main is the middle row alone.

### 4. Surfaces: a hairline under the header, one over the footer, a sunken sidebar

The header and footer sit on the page surface with a
`--pp-color-border-subtle` hairline between them and the content; the
sidebar is `--pp-color-bg-sunken`, so it reads as a different region
without a line whose side would have to change when it stacks. A hairline
on the sidebar's inline end is right beside the content and wrong along
the page's edge once stacked, and fixing that means restating `Split`'s
three thresholds in a second file — the drift D-045 is about. A surface
needs no side. Each is a component property (§Styling API).

### 5. `sticky` keeps the header in view

`sticky` (boolean, `false`) makes the header `position: sticky` at the
shell's block start, at `--pp-z-sticky`, on the page surface so content
scrolls under it. The sidebar does not stick (§7); the footer never does.
One boolean, not a `sticky="header | sidebar"` enum, because only one
part has a sticky behaviour worth shipping.

### 6. The shell fills the block size its parent gives it

`min-block-size: 100%`, so in a full-height parent the footer sits at the
bottom and the sidebar's surface runs the full height; in a parent with
no height the shell is as tall as its content and the declaration is
inert. The shell never reads the viewport: an app that wants a
full-height frame gives `<html>`, `<body>` and its root element a block
size, which is the app's line, once, in its own stylesheet (RULES §1).
`min-block-size` is not on RULES §10's table — the ban is the inline axis
and the physical names — and `Scroller` already declares `max-block-size`
from a token; this is the same axis for the same reason.

### 7. Not an app frame with independently scrolling panes

The other shell — the whole thing exactly the viewport's height, the
sidebar and the main each scrolling inside — needs the viewport's height
(against RULES §1), an `overflow` on `main` that turns it into the scroll
container for the whole page (which breaks `position: sticky` inside it,
scroll restoration, and `Toast`'s fixed region's relationship to the
page), and a header height the sidebar's `max-block-size` must know. It is
a different component, and no consumer has asked for it. This shell is
the document model: the page scrolls, the header may stick.

### 8. No `NavSidebar` inside, no `Container` inside

The sidebar slot takes whatever the app gives it; 6.4 is what most apps
will give it. The main takes the page; the page's first line is usually
`<Container>`. The shell adds neither, because a page that is a
full-bleed canvas — a map, a board — wants no measure, and a shell that
assumed one would be undone on every such page.

---

## Sizing contract justification

`fill`: a block-level grid with `min-inline-size: 0` and no inline size.
The middle row is `Split`, which is `fill` by the same reasoning. The one
block-axis declaration is §6's `min-block-size: 100%`, which defers to
the parent rather than deciding for it.

## Anatomy

```
<div class="pp-app-shell" data-sticky?>
  ├── <a class="pp-app-shell__skip" href="#:r1:">Skip to content</a>
  ├── <header class="pp-app-shell__header">{header}</header>                      when given
  ├── <div class="pp-split pp-app-shell__body" data-collapse-below="md">          when a sidebar is given
  │     ├── <div class="pp-split__sidebar pp-app-shell__sidebar">{sidebar}</div>
  │     └── <main class="pp-split__main pp-app-shell__main" id=":r1:" tabindex="-1">{children}</main>
  │   — or, with no sidebar —
  ├── <main class="pp-app-shell__main" id=":r1:" tabindex="-1">{children}</main>
  └── <footer class="pp-app-shell__footer">{footer}</footer>                      when given
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-app-shell` | `<div>` | A grid of three rows; a query container; `position: relative` for the skip link |
| skip | `pp-app-shell__skip` | `<a>` | First child; clipped until focused (§2) |
| header | `pp-app-shell__header` | `<header>` | `banner`; row 1; sticky by `data-sticky` (§5) |
| body | `pp-split pp-app-shell__body` | `Split` | Row 2, when there is a sidebar (§3) |
| sidebar | `pp-split__sidebar pp-app-shell__sidebar` | `<div>` | No landmark of its own: the content brings `<nav>` (§8) |
| main | `pp-split__main pp-app-shell__main` | `<main>` | Row 2 alone without a sidebar; `id` from `useId`; `tabIndex={-1}` |
| footer | `pp-app-shell__footer` | `<footer>` | `contentinfo`; row 3 |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `header` | `ReactNode` | — | Rendered in `<header>` when given |
| `sidebar` | `ReactNode` | — | Rendered in the `Split` sidebar when given |
| `footer` | `ReactNode` | — | Rendered in `<footer>` when given |
| `children` | `ReactNode` | — | The page, in `<main>` |
| `skipLinkLabel` | `string` | `'Skip to content'` | |
| `sidebarInlineSize` | `string` | `'16rem'` | `Split`'s |
| `collapseBelow` | `'sm' \| 'md' \| 'lg' \| 'never'` | `'md'` | `Split`'s |
| `sticky` | `boolean` | `false` | The header stays in view (§5) |

`ref` to the root; `className` and `style` merged on it; the rest spread
on it. `AppShellProps` exported. No `variant`, `tone` or `size`: one frame.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Sticky header | `data-sticky` on the root | `position: sticky` on the header |
| Stacked | `Split`'s container query (§3) | The sidebar above the main at full width |
| Skip link focused | `:focus-visible` | Shown at the top-start corner |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-app-shell-header-bg` | `--pp-color-bg-page` | The header's surface (opaque, for `sticky`) |
| `--pp-app-shell-header-padding-block` | `--pp-space-3` | |
| `--pp-app-shell-header-padding-inline` | `--pp-space-5` | Matches `Container`'s default gutter |
| `--pp-app-shell-sidebar-bg` | `--pp-color-bg-sunken` | The sidebar's surface (§4) |
| `--pp-app-shell-sidebar-padding` | `--pp-space-4` | |
| `--pp-app-shell-footer-padding-block` | `--pp-space-3` | |
| `--pp-app-shell-footer-padding-inline` | `--pp-space-5` | |
| `--pp-app-shell-hairline` | `--pp-color-border-subtle` | Under the header, over the footer |
| `--pp-split-sidebar-inline-size`, `--pp-split-gap` | `Split`'s | The middle row, through `Split` |

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` (first, on the page) | Focuses the skip link, which appears |
| `Enter` on it | Moves focus and scroll to `<main>` |

Nothing else: the shell is landmarks. A screen reader's landmark
navigation reaches `banner`, `main`, `contentinfo`, and whatever `<nav>`
the sidebar holds.

## Accessibility notes

- `<header>` and `<footer>` are `banner` and `contentinfo` because their
  ancestor is a `<div>`, not sectioning content; `<main>` is the page's
  one `main`. One shell per page, as one `<main>` per page.
- The skip link is the first focusable element and is visible while
  focused (WCAG 2.4.1, 2.4.7); its target takes focus (`tabIndex={-1}`)
  and shows a ring inside its edge, so the move is seen.
- The sidebar wrapper has no role: a navigation sidebar's landmark is the
  `<nav>` inside it, named by the app or by 6.4.
- Contrast: the sunken sidebar and the hairlines are tokens with their
  obligations solved at the token layer (RULES §3).

## Container behavior

The root is a query container, so `@container` rules in the header, the
sidebar and the page resolve against the shell. The middle row is
`Split`'s container: below `collapseBelow` (`md`, 45rem, by default) the
sidebar and the main each take the full width and stack, sidebar first.
No viewport query anywhere; the same shell stacks inside a 480px preview
that would stack at a 480px window.

## Usage

```tsx
// app/layout.tsx — a Server Component
import { AppShell, Container } from '@mod-0-dev/pixel-perfect';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sticky
      header={<Cluster justify="between" align="center"><Brand /><ThemeToggle /></Cluster>}
      sidebar={<NavSidebar label="Main">…</NavSidebar>}
      footer={<Text size="sm" tone="muted">© Acme</Text>}
    >
      <Container size="lg">{children}</Container>
    </AppShell>
  );
}
```

```css
/* The app's own stylesheet, once: the viewport is the app's to give. */
html, body { block-size: 100%; }
```

## Don't

```tsx
// ✗ Two shells, or a shell inside a shell. One <main> per page; one skip link.
<AppShell><AppShell>…</AppShell></AppShell>

// ✗ A gutter on the shell. The page's measure and gutter are Container's,
//   inside main; a full-bleed page wants none.
<AppShell style={{ padding: 24 }}>

// ✗ Making the main scroll to get an "app frame". That makes <main> the
//   page's scroll container and breaks sticky, restoration and the toast
//   region's relationship to the page (§7). Let the page scroll.
<AppShell style={{ blockSize: '100vh', overflow: 'hidden' }}>

// ✗ Wrapping the sidebar's <nav> in another landmark. The slot is a box.
<AppShell sidebar={<aside><nav>…</nav></aside>}>
```

## Tests

- **Unit:** landmarks `banner`, `main`, `contentinfo`; the skip link is the
  first child, its `href` is `#` + the main's `id`, the label is the
  prop's; `main` has `tabIndex={-1}`; DOM order skip, header, sidebar,
  main, footer; with no sidebar there is no `pp-split` and the main is the
  middle row; `sidebarInlineSize` and `collapseBelow` reach `Split`;
  `sticky` writes `data-sticky`; header and footer absent when not given;
  `ref`, `className`, `style`, rest on the root; server render is a
  string with no hook that needs a client; axe.
- **Browser:** in the wide cell the sidebar is beside the main and is
  `sidebarInlineSize` wide; in the narrow and medium cells it is above at
  full width; the skip link is clipped, then on focus visible inside the
  shell's top-start corner, and `Enter` moves focus to the main (its `id`
  matches); the header is sticky when asked (its top stays at the scroll
  container's top after a scroll) and not otherwise; the sidebar's
  surface is the sunken token and the hairlines are the subtle border; in
  a parent with a block size the footer's bottom is the parent's bottom;
  RTL puts the sidebar at the inline start (the right).

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **Slots or child parts?** Slots (§1): the root must own `<main>`, the
   frame has one arrangement, and `{children}` is the page.
2. **Build the skip link in?** Yes (§2); every page needs it.
3. **A hairline on the sidebar?** No; a surface (§4), so nothing changes
   side when it stacks.
4. **`sticky` as a boolean or an enum?** Boolean (§5); only the header.
5. **Fill the viewport's height?** No; fill the parent's (§6). The app
   gives `<html>` and `<body>` a height.
6. **Independently scrolling panes?** No (§7); a different component.
7. **`Container` inside `main` by default?** No (§8).
