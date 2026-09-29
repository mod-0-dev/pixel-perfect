# 4.9 `Tabs`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-074. In `review` for the CI-authored baseline only (D-069 §2) |
| **Sizing contract** | `fill` — the root, the list and the panel fill their container; a tab hugs its label |
| **RSC** | `client` — Radix state, roving focus |
| **Depends on** | Tier 3 (`done`): the control metrics (`--pp-control-*`) and the focus ring; 4.1's direction helper, though nothing here is an overlay |
| **APG pattern** | [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): `tablist`, `tab`, `tabpanel`; arrow keys move between tabs and, by default, select; `Home` / `End`; `Tab` leaves the list for the panel |

The first component of the tier that is not an overlay: nothing is
portalled, nothing floats, and the page's direction is the component's.
What it takes from the tier is Radix's state and roving focus, and from
Tier 3 the metrics that make a tab the height of a `Button`.

## Purpose

One panel of several, chosen by its tab: settings sections, a detail
view's facets, code and preview. The list is a row (or a column) of tabs;
exactly one is selected and its panel is shown; the rest are hidden and,
by default, empty.

It deliberately does **not**: route (a tab is not a link; a consumer who
wants the URL to follow controls `value`); hold closable or reorderable
tabs (a document strip is a different component); animate the panel
change (the selected panel appears, the way it does on every platform);
or draw a second look (§3).

---

## Decisions this spec asks you to approve

### 1. Compound, with Radix's four parts and our names

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="general">…</TabsContent>
  <TabsContent value="members">…</TabsContent>
  <TabsContent value="billing">…</TabsContent>
</Tabs>
```

`Tabs` (the root: `value` / `defaultValue` / `onValueChange`, `orientation`,
`activationMode`), `TabsList` (`role="tablist"`), `TabsTrigger`
(`<button role="tab">`, `value`, `disabled`), `TabsContent`
(`<div role="tabpanel">`, `value`, `keepMounted`). Named exports (D-062 §1).
A tab is a `<button>` and nothing else — no `asChild`: a tab that is a
link is a navigation, which `Link` and the page's router already are.

### 2. `fill`, and the list scrolls at a narrow width instead of wrapping

The root fills its container and lays the list and the panel out with a
gap (`--pp-tabs-gap`, `--pp-space-4`): a column for `horizontal`, a row
with the list first for `vertical`. The panel fills the rest.

A row of tabs wider than its container must not wrap — a wrapped tab
strip is two rows of tabs with no order a user can read — and must not
overflow the page. So the list sits in a strip of the component's own,
a flex row that scrolls on the inline axis (`overflow-x: auto`, a thin
scrollbar where the platform draws one), and the list is a flex item in
it — at least the strip (`flex-grow: 1`) and never narrower than its tabs
(a flex item's automatic minimum size is its min-content, and the tabs do
not wrap) — so its hairline runs under every tab, not just the visible
ones. Focusing a tab scrolls it into view, which is the browser's
own behaviour for focus. Not `Scroller` (2.8): that component is a
labelled, focusable region for content, and a tab strip already has its
own keyboard model and needs no second tab stop.

### 3. One look: a hairline under the list, a two-pixel accent bar under the selected tab, and no `variant` or `size`

The list draws a hairline of `--pp-color-border-subtle` on its far edge
(block-end for a row, inline-end for a column). The selected tab draws a
bar of `--pp-border-width-2` in the accent (`--pp-tone-solid`, the tabs
carrying `data-pp-tone="accent"`) on the same edge, **overlapping the
hairline** — a pseudo-element hung one hairline past the tab's edge, so
the bar sits *on* the line rather than above it. The tab is a `Button`'s
medium metrics (`--pp-control-height-md`, `--pp-control-padding-inline-md`,
`--pp-control-font-size-md`, medium weight), its label muted when not
selected and the text colour when selected or hovered; no fill, no
border. Disabled: `--pp-color-text-disabled`.

No `variant`: the fixed vocabulary (`solid | outline | ghost | plain`) has
no word for "segmented", and a filled-pill tab strip is a `ButtonGroup`
of `Toggle`s, which exists. No `size`: a tab is a medium control;
`--pp-tabs-tab-height` and `--pp-tabs-indicator-color` are the escapes.

### 4. `data-state="active | inactive"` joins RULES §4

Radix writes `active` / `inactive` on the tab and its panel. RULES §4's
list has `open | closed` for what is shown or not and `on | off` for what
is pressed; a selected tab is neither — its panel is shown *because* the
tab is selected, and the tab is not pressed, it is chosen — so the pair is
added to the vocabulary as the selected-of-several state, for tabs now
and for anything else that selects one of a set later. Recorded as D-074
§1 and written into RULES §4.

### 5. The page's direction is the component's: Radix's `dir` attribute is removed, and its value is read at mount

Radix's root writes `dir` on its element — `ltr` unless told otherwise —
which inside a right-to-left page flips the whole tab strip to
left-to-right. So the root is rendered `asChild` onto an element of ours
that sets `dir` to nothing: the tabs inherit the page's direction, on the
server and on the client, and there is no flash. The *value* Radix needs
for its arrow keys (`ArrowLeft` is "next" in RTL) is read from the root
element in a layout effect at mount and handed to Radix as `dir`. A
direction that changes after mount is not tracked (4.1 §3's ruling for
the theme, for the same reason). Recorded as D-074 §2.

### 6. Automatic activation by default, `manual` for a tab whose panel is expensive

APG's default: arrow keys move focus *and* select. `activationMode="manual"`
moves focus only, and `Enter` / `Space` select — for a panel that loads
something on selection. `loop` on the list defaults to `true`, Radix's,
which APG allows.

### 7. An inactive panel is an empty, hidden element, and `keepMounted` keeps its children

Radix renders every panel's element always — empty and `hidden` while
inactive, so `aria-controls` always points at something — and renders the
*children* of the selected one only. Right for a heavy panel, wrong for a
form: switching tabs would lose what was typed. `keepMounted` on a
`TabsContent` keeps its children rendered while inactive, hidden. Radix's
`forceMount` does the first half and undoes the second — it drops `hidden`
and leaves two panels showing, expecting the consumer to hide one — so
the component sets `hidden` itself from a mirror of the selected value
(D-074 §3). The one place 4.1 §6's "`forceMount` is not exposed" is set
aside, because here it is not about animation. The panel carries
`tabindex="0"` (Radix's, APG's: the panel is reachable by `Tab` from the
list) and the focus ring.

---

## Sizing contract justification

`fill`: the root is a block that takes its container's width; the list
and the panel fill it; the panel's height is its content's. A tab hugs its
label, as a `Button` does, which is what makes a tab strip read as a row
of labels and not a grid. The list overflowing at a narrow width is
handled inside the component (§2), so nothing runs out of the container.

## Anatomy

```
<div class="pp-tabs" data-orientation>
  ├── <div class="pp-tabs__strip">                                          the scroll container (horizontal)
  │     └── <div class="pp-tabs__list" role="tablist" aria-orientation data-orientation>
  │           ├── <button class="pp-tabs__tab" role="tab" aria-selected aria-controls id data-state data-orientation data-pp-tone="accent">
  │           └── …
  └── <div class="pp-tabs__panel" role="tabpanel" aria-labelledby id tabindex="0" data-state data-orientation hidden?>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Tabs | `pp-tabs` | `<div>` | The root. `ref`, `className`, `style` here |
| TabsList | `pp-tabs__list` | `<div role="tablist">` | Inside a strip of its own; `ref`, `className`, `style` land on the list, the element with the role |
| TabsTrigger | `pp-tabs__tab` | `<button role="tab">` | `value`, `disabled` |
| TabsContent | `pp-tabs__panel` | `<div role="tabpanel">` | `value`, `keepMounted` |

The strip is the one element that takes no props: it is the scroll
container, and it exists so the list can grow past it (§2).

## Props

**`Tabs`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | `string` / `string` / `(value: string) => void` | — | RULES §5.5 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout and arrow keys |
| `activationMode` | `'automatic' \| 'manual'` | `'automatic'` | §6 |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | Root |

**`TabsList`**: `loop?: boolean` (`true`), …`<'div'>`. **`TabsTrigger`**:
`value: string`, `disabled?`, …`<'button'>`. **`TabsContent`**: `value:
string`, `keepMounted?: boolean`, …`<'div'>`.

Exported types: `TabsProps`, `TabsListProps`, `TabsTriggerProps`,
`TabsContentProps`, `TabsOrientation`, `TabsActivationMode`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Selected | `data-state="active \| inactive"` on tab and panel | The bar; the label in the text colour |
| Disabled | `disabled`, `data-disabled` on the tab | Disabled text, no hover |
| Orientation | `data-orientation` on root, list, tab, panel | Row or column; the edge the bar and the hairline sit on |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tabs-gap` | `--pp-space-4` | Between the list and the panel |
| `--pp-tabs-tab-height` | `--pp-control-height-md` | The tab |
| `--pp-tabs-tab-padding-inline` | `--pp-control-padding-inline-md` | The tab |
| `--pp-tabs-indicator-color` | `--pp-tone-solid` (accent) | The bar |
| `--pp-tabs-line-color` | `--pp-color-border-subtle` | The hairline |

**Contrast, computed at the gate (D-048 §1).** A selected or hovered tab's
label is `--pp-color-text` on the page (12 on 1 / 3, asserted); an
unselected one is `--pp-color-text-muted` (11 on 1 / 3, Text's muted
pair); the bar is accent 9 against the page, a non-text UI element that
`lint:contrast` asserts at 3:1 for the solid ramp; the hairline is
`border-subtle`, no obligation by design (D-050). Nothing new is asserted
and nothing missing is leaned on. The label's colour change transitions
over `--pp-duration-fast`; reduced motion removes it.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` | Into the list, onto the selected tab; again, out of the list onto the panel |
| `ArrowRight` / `ArrowLeft` (horizontal), `ArrowDown` / `ArrowUp` (vertical) | Next / previous tab, skipping disabled ones, wrapping; selects it (`automatic`) or only focuses it (`manual`). `ArrowLeft` is "next" in a right-to-left page |
| `Home` / `End` | First / last tab |
| `Enter` / `Space` | Selects the focused tab (`manual`; a no-op in `automatic`) |

Every row is Radix's; the component supplies the direction (§5).

## Accessibility notes

- List: `role="tablist"`, `aria-orientation`. Tab: `role="tab"`,
  `aria-selected`, `aria-controls` → its panel, `tabindex` roving (only the
  selected tab is in the tab sequence). Panel: `role="tabpanel"`,
  `aria-labelledby` → its tab, `tabindex="0"`.
- A disabled tab is `disabled` on the button and skipped by the arrows.
- **Manual walkthrough:** Tab to the list, confirm the selected tab has
  focus; `ArrowRight`, confirm the next tab is selected and its panel
  shown; `End`, `Home`; `Tab`, confirm focus is on the panel; in a manual
  strip confirm `ArrowRight` moves focus without changing the panel and
  `Enter` changes it; in a `dir="rtl"` strip confirm the tabs read right to
  left and `ArrowLeft` moves to the next; at 240px confirm the strip
  scrolls and the selected tab's bar is still on the hairline.

## Container behavior

`fill` at every width; below the width of its tabs the list scrolls
inside the strip (§2). Nothing runs out of the container.

## Usage

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
  </TabsList>
  <TabsContent value="general"><GeneralSettings /></TabsContent>
  <TabsContent value="members" keepMounted><MembersForm /></TabsContent>
</Tabs>
```

## Don't

```tsx
// ✗ Tabs as navigation. A tab shows a panel; a link goes somewhere.
<TabsTrigger value="docs" onClick={() => router.push('/docs')}>Docs</TabsTrigger>

// ✗ A panel without its tab, or a tab without its panel. Every value appears in both.
<TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>

// ✗ A form in a panel that unmounts. keepMounted, or the form loses what was typed.
<TabsContent value="profile"><ProfileForm /></TabsContent>

// ✗ Wrapping the list at a narrow width. The strip scrolls; two rows of tabs have no order.
<TabsList style={{ flexWrap: 'wrap' }} />
```

## Testing notes

- **Unit (jsdom):** the roles and the wiring (`aria-selected`,
  `aria-controls` / `aria-labelledby`, `data-state`, `data-orientation`);
  controlled and uncontrolled; `ArrowRight` selects in `automatic` and
  only focuses in `manual`, `Enter` selects; a disabled tab is skipped;
  `Home` / `End`; `keepMounted` keeps the panel with `hidden`; the root
  carries no `dir` and `ArrowLeft` is "next" under `dir="rtl"`; refs,
  `className`, `style` on every part; a part outside the root throws;
  axe, both themes.
- **Browser:** the tab is `--pp-control-height-md` tall and the bar is two
  pixels of accent whose bottom edge is the hairline's bottom edge; a
  selected label is the text colour and an unselected one muted, resolved;
  at 240px the strip scrolls and the page does not; a vertical strip is
  beside its panel with the bar on its inline-end edge; `Tab` from the
  list reaches the panel; reduced motion removes the label transition;
  the RTL strip reads right to left with no `dir` attribute of its own.
- **Break checks (D-035 §3):** drop the pseudo-element's overhang (the
  bar's edge test); make the strip a block (the narrow test: the hairline
  stops short of the last tab); drop the list's `flex-grow` (the hairline
  stops at the last tab of a short strip); drop the `dir` hand-off (the
  RTL key test); drop the reduced-motion rule.
- **Screenshot:** the gallery renders one strip per cell with five tabs,
  so the 240px cell shows the strip scrolled to its start with tabs cut
  at its edge.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§3 — one look, no `variant`.** Alternative: `solid` for a segmented
   strip. **Recommendation: one look.** A segmented control is a
   `ButtonGroup` of `Toggle`s.
2. **§2 — scroll, not wrap.** Alternative: wrap. **Recommendation:
   scroll.** Two rows of tabs have no order.
3. **§7 — `keepMounted`, exposing Radix's `forceMount` under a name that
   says what it is for.** Alternative: keep every panel mounted always.
   **Recommendation: opt in.** A heavy panel should not render unseen.
4. **§5 — remove Radix's `dir` attribute.** Alternative: pass the page's
   direction through a prop. **Recommendation: remove it.** The page's
   direction is the component's, and a prop is a thing to forget.
