# 6.4 `NavSidebar`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `done` — 2026-10-07; written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-099; its CI-authored baselines compared green on runs 205 and 209 (D-013; the sweep is D-108 §5) |
| **Sizing contract** | `fill` — a block that takes the sidebar's width; `min-inline-size: 0`; a long label truncates |
| **RSC** | `client` — a group holds whether it is open. The root, a section and an item have no state, but they share one module with the group |
| **Depends on** | 6.3 `AppShell` (`review`, `done` under the batch, D-073 §2): the slot it is written for; 5.11 `Tree` (`done`): the row it is drawn like — indent by level through one property, the accent surface, the turning chevron — and not the role (§4); 1.11 `Icon`, 1.6 `Badge`: what a row holds |
| **APG pattern** | [Disclosure navigation menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/): a `<nav>` of lists of links, a collapsible group as a button with `aria-expanded` over a list; every link and button its own tab stop; [`aria-current="page"`](https://www.w3.org/TR/wai-aria-1.2/#aria-current) on the current link |

The last component of the roadmap. `AppShell` §8 says the sidebar slot
"takes whatever the app gives it; 6.4 is what most apps will give it",
and §3 sent one decision here — what a sidebar does when the shell is
narrow. §6 answers it.

## Purpose

An app's primary navigation, down the side: sections with a small
heading, links with an icon and sometimes a count, and groups that open
to show more links. The reader sees where they are (the current link is
marked), reaches every link with `Tab`, and opens a group with `Enter`.
It renders on the server as plain lists of plain links, so a crawler and
a reader with no JavaScript get the whole map.

It deliberately does **not**: know the router (the app says which link
is current, §2, and hands it a `next/link` by `asChild`, §7); become a
drawer or a rail (§6); or take a roving tabindex (§4).

---

## Decisions this spec asks you to approve

### 1. Four parts: the `<nav>`, a section, an item, a group

```tsx
<NavSidebar label="Main">
  <NavSidebarSection>
    <NavSidebarItem href="/" icon={<HomeGlyph />} current>Home</NavSidebarItem>
    <NavSidebarItem href="/inbox" icon={<InboxGlyph />} end={<Badge>3</Badge>}>Inbox</NavSidebarItem>
  </NavSidebarSection>
  <NavSidebarSection title="Workspace">
    <NavSidebarGroup label="Projects" icon={<FolderGlyph />}>
      <NavSidebarItem href="/projects/alpha">Alpha</NavSidebarItem>
      <NavSidebarItem href="/projects/beta">Beta</NavSidebarItem>
    </NavSidebarGroup>
    <NavSidebarItem href="/members">Members</NavSidebarItem>
  </NavSidebarSection>
</NavSidebar>
```

Named exports (RULES §5.6). `NavSidebar` is the `<nav>`, named by
`label` (required, as `ButtonGroup`'s and `Toolbar`'s are: an unnamed
navigation landmark is what a screen reader lists as "navigation" three
times). A `NavSidebarSection` is a `<ul>` with an optional `title`
drawn above it and wired to it by `aria-labelledby`, so the landmark's
lists are named lists; items live in sections, and an item outside one
throws (the `Drawer` parts' shape), because a `<li>` loose in a `<nav>`
is not a list. A `NavSidebarItem` is `<li><a>` with an optional leading
`icon` and trailing `end` (a `Badge`, a `Kbd`) around the label. A
`NavSidebarGroup` is `<li><button aria-expanded><ul>`: a disclosure over
a nested list of items and groups, indented one level.

### 2. The app says which link is current; a group that holds it says so too

`current` on an item writes `aria-current="page"` and the accent surface
(§5). The component does not read the URL: a router's idea of "active"
(exact, prefix, query-aware) is the app's, and `usePathname` would make
the whole nav a client component for one comparison the layout can do
in one line. A group whose subtree holds the current item carries
`data-current`, so a closed group still shows where you are, and it is
open by default (§3) — read from the elements at render, no context and
no effect.

### 3. A group is open or closed, controlled or uncontrolled; a closed list is `hidden`, not gone

`open` / `defaultOpen` / `onOpenChange` (RULES §5.5). `defaultOpen`
defaults to whether the group holds the current item (§2). The nested
list is always rendered and carries the `hidden` attribute while closed,
unlike `Tree`, which does not render a collapsed node's children: a
navigation's links are the page's map, and a crawler or a reader with no
JavaScript should get all of it; `hidden` takes the closed list out of
the accessibility tree and the tab order, which is what "closed" means.

### 4. Every link and button is its own tab stop — no roving tabindex

The APG has two navigation shapes: the disclosure navigation menu (this)
and the navigation treeview (`role="tree"` of links, one tab stop,
arrows). The tree is for a very long, deep map — a docs site's — and it
costs what every roving widget costs: `Tab` no longer reaches the next
link, a link is a `treeitem` to a screen reader rather than a link, and
find-in-page and the browser's own link navigation stop matching the
keyboard model. An app sidebar is ten to thirty links. Plain links, one
disclosure button per group, `Tab` through them, nothing to learn. The
dependency on 5.11 is its row (§5), not its role.

### 5. Rows drawn as `Tree`'s: the control scale, indented by level, the current link on the accent surface

Each link and toggle is a row `--pp-nav-sidebar-row-height`
(`--pp-control-height-sm`) tall on the small control font, padded on the
control scale, its start padding grown by `--pp-nav-sidebar-indent`
(`--pp-space-4`) per level through one custom property the `<li>` writes
(`Tree`'s device, D-088), so nesting needs no per-level rule and RTL needs
nothing. The current link is `--pp-tone-bg` in the accent scope with the
page's text, medium weight — the ghost Button's pairing, contrast solved
at the token layer (D-048 §1) — and hover is `--pp-tone-bg-hover`; a
group's toggle turns its chevron a quarter when open, `Accordion`'s and
`Tree`'s device, mirrored under `[dir="rtl"]` the way D-088 §4 found it
must be. A section title is the small muted label with the wide
tracking, `Text`'s vocabulary. The ring is on the link or the button,
which is the element that has focus (RULES §6), inset so the row's own
box holds it.

### 6. Not a drawer, not a rail: composition, by the app

`AppShell` §3 stacks the sidebar above the content when the shell is
narrow and sent "a sidebar that becomes a drawer" here. The answer is
that it does not, as a mode. A drawer mode would render the nav twice
(once in place, once in a `Drawer`, each hidden by a query the other
half's threshold is restated in — D-045's drift) or move it between the
two (a layout effect on a landmark, and a hydration mismatch in waiting),
and the trigger for it belongs in the app's header, which this component
does not own. An app that wants one composes it: a `NavSidebar` inside a
`Drawer` (4.6) whose trigger it shows below its own threshold, with the
same items. A collapsed icon rail is a second `size`'s worth of rules and
a tooltip per link; no consumer has asked, and it is not built.

### 7. `asChild` on the item, for `next/link`

`<NavSidebarItem asChild current><Link href="/">Home</Link></NavSidebarItem>`:
the child element becomes the anchor, taking the class, `aria-current`
and the ref, and its own children become the label — the item builds
the row (icon, label, end) around them. `href` and the like are then the
child's.

---

## Sizing contract justification

`fill`: `display: block`, `min-inline-size: 0`, no inline size; each row
is a block that fills the line, and a long label truncates with an
ellipsis rather than widening the sidebar. In `AppShell` the sidebar's
width is `Split`'s; here it is the parent's.

## Anatomy

```
<nav class="pp-nav-sidebar" aria-label="Main" data-pp-tone="accent">
  └── <div class="pp-nav-sidebar__section">
        ├── <div class="pp-nav-sidebar__title" id=":r1:">Workspace</div>          when `title` is given
        └── <ul class="pp-nav-sidebar__list" aria-labelledby=":r1:"?>
              ├── <li class="pp-nav-sidebar__item" style="--_pp-nav-level: 1">
              │     └── <a class="pp-nav-sidebar__link" href aria-current="page"?>
              │           ├── <span class="pp-nav-sidebar__icon" aria-hidden>?    an <Icon decorative>
              │           ├── <span class="pp-nav-sidebar__label">
              │           └── <span class="pp-nav-sidebar__end">?
              └── <li class="pp-nav-sidebar__group" data-state="open|closed" data-current? style="--_pp-nav-level: 1">
                    ├── <button class="pp-nav-sidebar__link pp-nav-sidebar__toggle" aria-expanded aria-controls=":r2:">
                    │     ├── icon?  label  <span class="pp-nav-sidebar__chevron" aria-hidden>
                    └── <ul class="pp-nav-sidebar__list" id=":r2:" hidden?>      the children, level + 1
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| NavSidebar | `pp-nav-sidebar` | `<nav>` | `aria-label`; the accent tone scope for the current surface |
| NavSidebarSection | `pp-nav-sidebar__section` | `<div>` | Holds the title and the list |
| title | `pp-nav-sidebar__title` | `<div>` | Names the list by `aria-labelledby`; `useId` |
| list | `pp-nav-sidebar__list` | `<ul>` | A section's, or a group's (then `id`, `hidden` when closed) |
| NavSidebarItem | `pp-nav-sidebar__item` | `<li>` | Writes the level |
| link | `pp-nav-sidebar__link` | `<a>` (or the `asChild` child) | The row; `aria-current="page"` when `current` |
| icon | `pp-nav-sidebar__icon` | `Icon` | Optional, decorative |
| label | `pp-nav-sidebar__label` | `<span>` | Truncates |
| end | `pp-nav-sidebar__end` | `<span>` | Optional trailing content |
| NavSidebarGroup | `pp-nav-sidebar__group` | `<li>` | `data-state`, `data-current`; writes the level |
| toggle | `pp-nav-sidebar__link pp-nav-sidebar__toggle` | `<button>` | `aria-expanded`, `aria-controls` |
| chevron | `pp-nav-sidebar__chevron` | `Icon` | Turns when open; mirrored in RTL |

## Props

**`NavSidebar`**: `label: string` (required), …`<'nav'>` less `aria-label`.
**`NavSidebarSection`**: `title?: ReactNode`, …`<'div'>`.
**`NavSidebarItem`**: `current?: boolean`, `icon?: ReactNode`,
`end?: ReactNode`, `asChild?: boolean`, `children` (the label), …`<'a'>`
(`href` and the rest land on the anchor; `className` and `style` on the
`<li>`? No — on the anchor, the row, where a consumer's style belongs;
`ref` to the anchor).
**`NavSidebarGroup`**: `label: ReactNode`, `icon?: ReactNode`, `open?`,
`defaultOpen?`, `onOpenChange?: (open: boolean) => void`, `children`
(items and groups), …`<'li'>` (`ref`, `className`, `style` on the `<li>`).

Exported types: `NavSidebarProps`, `NavSidebarSectionProps`,
`NavSidebarItemProps`, `NavSidebarGroupProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| current | `aria-current="page"` on the link | The accent surface, medium weight |
| holds the current | `data-current` on the group | The toggle's text at full weight |
| open / closed group | `data-state`, `aria-expanded` | The chevron turned; the list shown or `hidden` |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-nav-sidebar-row-height` | `--pp-control-height-sm` | Every row |
| `--pp-nav-sidebar-indent` | `--pp-space-4` | Per level |
| `--pp-nav-sidebar-gap` | `--pp-space-5` | Between sections |
| `--pp-nav-sidebar-current-bg` | `--pp-tone-bg` (accent) | The current link |
| `--pp-nav-sidebar-radius` | `--pp-control-radius` | A row's corners |

**Contrast, computed at the gate (D-048 §1).** A row is the page's text
on the sidebar's surface, on the accent `bg` step when current (the ghost
Button's pairing) and on `bg-hover` on hover; a title is the muted text
at the small size, a text obligation the token layer has solved.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Through every link and every group's button, in order; a closed group's links are skipped |
| `Enter` on a link | Follows it (the browser's) |
| `Enter` / `Space` on a group's button | Opens or closes the group |

The disclosure navigation pattern's optional arrow keys are not added
(§4): a list of links is walked with `Tab`.

## Accessibility notes

- One `navigation` landmark, named; its lists named by their titles.
- `aria-current="page"` on exactly the link the app marks; nothing else
  is `current`.
- A group is a button with `aria-expanded` and `aria-controls` over the
  list it opens; the closed list is `hidden`.
- The icon and the chevron are decorative; the label is the name.
- The ring is on the link or the button, inside the row.

## Container behavior

None of its own. `AppShell`'s `Split` stacks the sidebar above the
content below the shell's threshold; the nav then runs at full width,
every row still a line.

## Usage

```tsx
// app/layout.tsx
<AppShell sidebar={<Nav current={pathname} />}>{children}</AppShell>

// Nav.tsx — a Server Component that compares the pathname it is given
<NavSidebar label="Main">
  <NavSidebarSection>
    <NavSidebarItem asChild current={current === '/'} icon={<HomeGlyph />}>
      <Link href="/">Home</Link>
    </NavSidebarItem>
    <NavSidebarItem asChild current={current.startsWith('/inbox')} end={<Badge tone="accent">3</Badge>}>
      <Link href="/inbox">Inbox</Link>
    </NavSidebarItem>
  </NavSidebarSection>
  <NavSidebarSection title="Workspace">
    <NavSidebarGroup label="Projects" icon={<FolderGlyph />}>
      <NavSidebarItem href="/projects/alpha" current={current === '/projects/alpha'}>Alpha</NavSidebarItem>
    </NavSidebarGroup>
  </NavSidebarSection>
</NavSidebar>
```

## Don't

```tsx
// ✗ Items loose in the nav. A list has a <ul>; a section is one.
<NavSidebar label="Main"><NavSidebarItem href="/">Home</NavSidebarItem></NavSidebar>

// ✗ Reading the router inside. The app says which link is current.
<NavSidebarItem href="/" current={usePathname() === '/'}>   // in a layout: fine; in the library: no

// ✗ A nav of buttons. A link goes somewhere; a button does something. Use Toolbar for actions.
<NavSidebarItem onClick={openSettings}>Settings</NavSidebarItem>

// ✗ Two current links. aria-current is where you are, once.
<NavSidebarItem current>Inbox</NavSidebarItem><NavSidebarItem current>Inbox — unread</NavSidebarItem>
```

## Tests

- **Unit:** the landmark and its name; a section's title names its list
  by `aria-labelledby`, and a section without one has no `aria-labelledby`;
  an item is `<li><a href>` with the icon decorative, the label text, the
  `end` in place; `current` writes `aria-current="page"` and nothing else
  does; a group is a button with `aria-expanded` and `aria-controls` over
  a list that is `hidden` while closed and rendered either way; a click
  and `Enter` toggle it, `onOpenChange` fires, controlled holds; a group
  holding the current item is open by default and carries `data-current`;
  the level written per `<li>` (1, 2 inside a group); `asChild` puts the
  class, `aria-current` and the ref on the child and builds the row
  around its children; an item outside a section throws; refs,
  `className`, `style`, rest on every part; a server render is the full
  map with the closed list `hidden`; axe in both themes.
- **Browser:** every row is the same height on the sidebar; a nested
  item's start edge is one indent in from its group's; the current link
  has the accent surface and its text the page colour; a group's chevron
  is turned when open and its list is not laid out when closed; the ring
  on the link inside the row; in `AppShell` at 960 the nav is 16rem
  beside the main and at 240 above it, each row the full width; under
  `dir="rtl"` the indent is on the right and the chevron mirrored.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **Roving tabindex or plain links?** Plain links (§4).
2. **Render a closed group's links?** Yes, `hidden` (§3).
3. **A drawer mode for narrow shells?** No (§6); compose one.
4. **Who decides `current`?** The app (§2).
5. **Sections required to hold items?** Yes (§1); a `<nav>` holds lists.
