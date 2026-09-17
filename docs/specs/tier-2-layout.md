# Tier 2 — Layout Primitives

| | |
| --- | --- |
| **Tier** | 2 |
| **Status** | **approved** 2026-09-17 — all rulings accepted as proposed (D-020 … D-023) |
| **Components** | 2.1 `Stack` · 2.2 `Cluster` · 2.3 `Grid` · 2.4 `Container` · 2.5 `Center` · 2.6 `Split` · 2.7 `AspectRatio` · 2.8 `Scroller` |
| **Depends on** | Tier 0 (`done`), Tier 1 (`done`) |
| **Approval** | One gate for the group — see [D-014](../DECISIONS.md). Cleared 2026-09-17 |

### Progress

| Component | Status | Component | Status |
| --- | --- | --- | --- |
| 2.1 `Stack` | `done` | 2.5 `Center` | `spec` |
| 2.2 `Cluster` | `spec` | 2.6 `Split` | `spec` |
| 2.3 `Grid` | `spec` | 2.7 `AspectRatio` | `spec` |
| 2.4 `Container` | `spec` | 2.8 `Scroller` | `spec` |

This is the tier the whole library has been waiting on. RULES §1 took sizing and
spacing away from every component; these eight are what it was given to. Until
they exist, `Text` cannot be spaced from `Text` without the consuming app
hand-rolling a flex column — which is exactly what
[launchpad](https://github.com/mod-0-dev/launchpad) does today, 21 times for
`Stack` and 24 for `Cluster`.

They are specified together because the questions worth arguing about cut across
all eight: what `gap` takes, what `align` and `justify` mean, and what a layout
primitive is allowed to do to its children that no other component may.

---

## Decisions this batch asks you to approve

Everything below is a deliberate ruling or an open choice. The rest of the
document is routine.

### 1. `gap` is a new fixed-vocabulary prop, valued as a space-scale index

RULES §5 fixes the prop vocabulary at `variant` / `tone` / `size` and forbids
synonyms. None of the three is a gap: `size="md"` on a `Stack` would be a
fourth meaning of `size` in a library that already has chip-scale (Tier 1) and
max-width scale (2.4 below). And `spacing` is on the linter's banned list.

**Proposal:** `gap` joins the fixed vocabulary as the fourth term, meaning *the
distance between a layout primitive's children*, and nothing else. It is taken
only by layout primitives and takes a step of the space scale as a string:

```tsx
<Stack gap="4">      {/* var(--pp-space-4) */}
```

`type Space = '0' | '1' | … | '9'`, exported from `src/types.ts` beside `Tone`,
`Size` and `Variant`.

Why a **string** and not a number: `gap={4}` reads like a length, and the first
question anyone asks is whether it is 4px or step 4. `gap="4"` reads like an
index because it is one, and the prop value is spelled identically to the
token (`--pp-space-4`), so the mapping needs no documentation. It is also what
the Tier 1 docs already wrote in every usage example before this component
existed.

Rejected: a t-shirt alias set (`gap="md"`), which adds a second vocabulary over
a scale that already has names; and an arbitrary length (`gap="12px"`), which
puts an untokenised value in the API.

**Default `gap="0"`.** A `Stack` with no rhythm is a legitimate thing — a
semantic column, a list whose items carry their own borders — and CSS's own
default is `0`. Silently inserting space would be the layout equivalent of the
UA margin that D-018 exists to strip.

### 2. `align` and `justify`, fixed across all eight

Stated once here so `align="center"` cannot mean one thing in `Cluster` and
another in `Grid`.

| Prop | Values | Maps to |
| --- | --- | --- |
| `align` | `start \| center \| end \| stretch \| baseline` | `align-items` |
| `justify` | `start \| center \| end \| between \| around \| evenly` | `justify-content` |

`start` and `end` are the logical CSS keywords, so RTL is correct with no extra
work — `flex-start` and `flex-end` never appear in the API or the CSS.
`between` / `around` / `evenly` drop the `space-` prefix: `justify="space-between"`
is the only value in the set that would need it, and the shortened form keeps
the enum uniform.

### 3. A layout primitive sizing its children is RULES §1 working, not bending

RULES §1 says sizing and placement belong to **the parent**. These eight *are*
the parent. So `gap`, `grid-template-columns`, `flex-basis` on `> *`, and
`min-inline-size: 0` on a named slot are this tier doing its job, not eight
exceptions to the rule.

The line, stated precisely: **a layout primitive may size the boxes it creates
for its children; it may not size itself.** All eight are `fill`, none declares
`inline-size`, and 2.4 `Container` is the only one that touches `max-inline-size`
— which is its entire reason to exist and already anticipated by D-018 and the
stylelint config.

No Tier 2 component takes `tone` or `variant`. A layout primitive has no visual
treatment: no background, no border, no colour, no shadow. If you want a bordered
box, that is `Card` (5.1), and it will compose a `Stack` inside itself.

### 4. `Split` collapses at an enumerated breakpoint, because CSS cannot do otherwise

`Split` must stack when it gets narrow, and RULES §1 says that decision comes
from `@container`, never the viewport. But **a container query condition cannot
read a custom property** — `@container (max-inline-size: var(--x))` is not
valid CSS and there is no way to make it so. A free-form `collapseBelow="42rem"`
prop is therefore unimplementable as written.

**Proposal:** `collapseBelow?: 'sm' | 'md' | 'lg' | 'never'`, defaulting to
`'md'`, compiled to three static `@container` blocks selected by
`[data-collapse-below]`.

| Value | Collapses below |
| --- | --- |
| `sm` | `30rem` |
| `md` | `45rem` |
| `lg` | `60rem` |
| `never` | — |

Considered and rejected: the every-layout `flex-basis: 0; flex-grow: 999;
min-inline-size: 50%` sidebar pattern, which *is* continuous and needs no query
at all. It was rejected because its threshold is expressed as a ratio of the
sidebar's width to the container's, so "collapse at 45rem" becomes "set the
sidebar to 16rem and the main pane's minimum to 50% and work out what that
implies". Three named breakpoints say what happens.

### 5. `Split` does not reorder its children — accepted, [D-022 §3](../DECISIONS.md)

The roadmap describes `Split` as "sidebar + main". The obvious prop is
`side="start" | "end"`.

**Proposal: there is no `side` prop.** `Split.Sidebar` and `Split.Main` render in
DOM order, and a right-hand sidebar is expressed by writing `Split.Main` first.

The alternative is `order`, which makes reading order and visual order disagree —
a screen reader and a keyboard walk the DOM, and a sighted user walks the
screen. That divergence is a real accessibility defect, it is the standard
example of one, and adding a prop whose only function is to create it is not a
trade worth making for an ordering the caller can express by swapping two lines.

### 6. `Grid` accepts a raw track template — accepted, [D-022 §4](../DECISIONS.md)

`Grid` needs two modes that are not in dispute:

```tsx
<Grid columns={3} />                      /* repeat(3, minmax(0, 1fr)) */
<Grid minItemInlineSize="16rem" />        /* repeat(auto-fit, minmax(16rem, 1fr)) */
```

The question is the third. The consuming app has two layouts that are neither —
`minmax(0, 1fr) auto` for a row with a trailing badge, and `auto minmax(0, 1fr)`
for an avatar beside text. Both are ordinary asymmetric grids, and neither can
be spelled with a column count.

**Proposal:** `columns?: number | string`. A number means `repeat(n, minmax(0, 1fr))`;
a string is passed to `grid-template-columns` unchanged.

**The case against**, which is not weak: a raw CSS passthrough is an untokenised
value in a public API, and `columns="200px 1fr"` is a hardcoded length that the
linter cannot see because it is a prop, not a stylesheet. It is the crack through
which `Box` comes back.

**The case for:** the alternative is not "callers use tokens", it is "callers
hand-roll a `.lp-row` class with the same `grid-template-columns` in it", which
is what they do today and what this tier exists to stop. A prop we can see
beats a stylesheet we cannot.

**Ruled:** accepted as proposed. The fallback — `columns: number` and
`minItemInlineSize` only, revisited when `Table` (5.4) forces it — was declined.

### 7. `Scroller` requires an accessible name

A scrollable region that a keyboard user can reach is a WCAG 2.1.1 requirement,
and a focusable region without an accessible name is a 4.1.2 failure. RULES §6
says the type system should make an accessible name impossible to omit.

**Proposal:** `label: string` is **required** on `Scroller`. It renders
`role="region"`, `aria-label`, and `tabIndex={0}`. There is no unlabelled form.

### 8. `Container` defaults its gutter to a non-zero value

`gap` defaults to `0` (decision 1), and `Container`'s `gutter` defaults to `"5"`.
That asymmetry is deliberate: a zero gap is a legitimate design, and a zero page
gutter is text against the edge of a phone screen. It is a bug every single
time, so it is not the default.

### 9. `asChild` on five of the eight

`Stack`, `Cluster`, `Grid`, `Container` and `Center` take `asChild`. They are a
single element wrapping children, and the element genuinely varies: a `Stack` of
navigation links should be a `<ul>`, a `Container` around a page should probably
be a `<main>`.

`Split`, `AspectRatio` and `Scroller` do **not**. Each owns internal structure or
behaviour that a substituted root would break — and per the Tier 1 precedent,
`asChild` where composition does not require it is an invitation to misuse.

### 10. `Scroller` needs one new semantic colour token — accepted, [D-023](../DECISIONS.md)

A scroll shadow is a gradient from a translucent dark to transparent, and the
semantic layer has nothing that fits. `--pp-color-bg-scrim` is a modal overlay at
0.55 alpha — far too heavy. `--pp-color-border-strong` is opaque. And RULES §3
plus the stylelint config leave no way to derive one in the stylesheet:
`color-mix()` is on the banned-value list for every colour property, and a raw
`oklch()` is a hardcoded colour.

**Proposal:** add `--pp-color-shadow-edge` to the semantic layer, per theme, in
`scripts/semantic-tokens.mjs`. Light `oklch(15% 0.01 258 / 0.14)`, dark
`oklch(0% 0 0 / 0.5)` — a dark theme needs a heavier edge to read against a
near-black surface.

This is a Tier 0 amendment and the first one since D-015. It is the same shape:
a component reached RULES §3 and found the compliant vocabulary did not contain
the thing it needed. One token, one theme-aware pair, no new mechanism.

It carries no contrast obligation — a decorative gradient is not text and not a
UI boundary — so `check-contrast.mjs` gains no assertion. Worth stating out loud,
because every other colour token in the library has one.

---

## Conventions applied to every component in this tier

Stated once rather than eight times.

- **All eight are `fill`.** Block-level, no `inline-size` declaration,
  `min-inline-size: 0` on the root so they shrink inside a flex or grid parent
  instead of forcing overflow.
- Forwards `ref` to the root element.
- `className` and `style` are merged onto the root, never replaced.
- Remaining props are spread onto the root, so `aria-*`, `data-*`, `id` and
  event handlers pass through.
- `<Name>Props` is exported. No `any`; no unexported type in a public signature.
- CSS lives in `@layer pp.components`, uses logical properties throughout, and
  declares no `inline-size`, `min-inline-size` other than `0`, or non-zero
  `margin`. `Container` is the documented exception (decision 3).
- Every component exposes component-scoped custom properties as its override
  API, listed per component below.
- No `tone`, no `variant`, no colour of any kind (decision 3).
- All are server components. `Scroller` is the only `'use client'` file in the
  tier, and only because scroll position is a browser fact.
- No keyboard interaction and no focus surface anywhere except `Scroller`.

### How `gap` is implemented

One shared block maps the scale, rather than ten rules in each of five files:

```css
@layer pp.components {
  [data-pp-gap="0"] { --_pp-gap: var(--pp-space-0); }
  /* … through 9 */
}
```

and each component reads it through its own override property:

```css
.pp-stack { gap: var(--pp-stack-gap, var(--_pp-gap)); }
```

`--_pp-gap` inherits, so a nested layout primitive would otherwise pick up its
parent's gap. It cannot: `gap` defaults to `'0'`, so **every gap-taking
component always emits `data-pp-gap`** and always redeclares the property on its
own root. The default is load-bearing, not cosmetic, and there is a unit test
saying so.

Lives in `src/components/_shared/layout.css`, imported first among the Tier 2
stylesheets.

---

## 2.1 `Stack`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none (not interactive) |

### Purpose

Vertical flow with a gap. It is the answer to "how do I put space between two
components", and it is the only answer — which is why RULES §2 can forbid
margins at all.

It does **not** wrap (that is `Cluster`), distribute along the block axis (it
has no block size to distribute within), or draw anything.

### Sizing contract justification

`fill`. A column occupies the inline space it is given. `display: flex` with
`flex-direction: column`, no width declaration, `min-inline-size: 0`.

### Anatomy

```
<div class="pp-stack" data-pp-gap="4" data-align="stretch">
  └── (children, each a flex item)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-stack` | `<div>` | `<ul>`, `<section>`, `<nav>` etc. via `asChild` |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `gap` | `Space` | `'0'` | Decision 1 |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'stretch'` | Cross axis, i.e. inline. Decision 2 |
| `asChild` | `boolean` | `false` | Render the single child instead of a `<div>` |

No `justify`: distributing children along the block axis requires a block size,
and a `fill` component does not have one. If you need it, the parent that owns
the height owns the distribution.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| gap | `data-pp-gap` | `gap` |
| alignment | `data-align` | `align-items` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-stack-gap` | per `gap` | Gap between children |

### Keyboard interaction

None. Not focusable.

### Accessibility notes

Renders a `<div>` with no role. It is layout and nothing else, and it must stay
invisible to assistive technology. Where the content is a list, say so:
`asChild` with a `<ul>` and `<li>` children.

### Container behavior

No `@container` rules. A column is correct at every width.

### Usage

```tsx
<Stack gap="4">
  <Heading level={2}>Launch readiness</Heading>
  <Text tone="muted">12 days out. Five of eighteen tasks complete.</Text>
</Stack>

<Stack gap="1" asChild>
  <nav aria-label="Main">
    <a href="/tasks">Task board</a>
    <a href="/assets">Asset library</a>
  </nav>
</Stack>
```

### Don't

```tsx
// ✗ The gap is the Stack's job. The child does not space itself.
<Stack><Text style={{ marginBottom: 16 }}>…</Text></Stack>

// ✗ A Stack of one is a div. Delete it.
<Stack gap="4"><Card /></Stack>

// ✗ gap is an index into the space scale, not a length.
<Stack gap="16px">…</Stack>
```

---

## 2.2 `Cluster`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 2.1 |
| **APG pattern** | none |

### Purpose

A horizontal row of things that wraps when it runs out of room: a toolbar, a row
of badges, a name beside a timestamp. Wrapping is the default and the reason the
component is called `Cluster` and not `Row` — a horizontal flex row that cannot
wrap is an overflow bug waiting for a narrow container.

### Sizing contract justification

`fill`. The row occupies its parent's inline space and wraps within it.
`display: flex`, `flex-wrap: wrap`, no width declaration, `min-inline-size: 0`.

### Anatomy

```
<div class="pp-cluster" data-pp-gap="2" data-align="center" data-justify="start">
  └── (children, each a flex item)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-cluster` | `<div>` | Via `asChild` otherwise |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `gap` | `Space` | `'0'` | |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'center'` | |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | `'start'` | |
| `wrap` | `boolean` | `true` | `false` sets `flex-wrap: nowrap` |
| `asChild` | `boolean` | `false` | |

`align` defaults to `center` where `Stack`'s defaults to `stretch`. A row of
mixed-height things — a badge, a line of text, an avatar — reads correctly
centred, and that is the overwhelming majority of rows. A column of mixed-width
things does not want to be centred; it wants to fill.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| gap | `data-pp-gap` | `gap` |
| alignment | `data-align` | `align-items` |
| distribution | `data-justify` | `justify-content` |
| wrapping | `data-wrap="false"` (only when off) | `flex-wrap` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-cluster-gap` | per `gap` | Gap between children |

### Keyboard interaction

None. Not focusable. A `Cluster` of buttons is not a toolbar — `Toolbar` (6.6)
adds the roving tabindex that `role="toolbar"` obliges.

### Accessibility notes

No role. If the row is a group with a name, that is a `<fieldset>`, a
`role="group"` you add yourself, or `Toolbar` (6.6). `Cluster` will not guess.

### Container behavior

Wrapping *is* the container behavior, and it needs no query: flex wrapping is
already a response to available inline size, resolved continuously rather than
at a breakpoint.

### Usage

```tsx
<Cluster gap="2">
  <Badge tone="danger">Blocked</Badge>
  <Text size="sm" tone="muted">Waiting on legal review</Text>
</Cluster>

<Cluster gap="3" justify="between">
  <Heading level={1} size="xl">Task board</Heading>
  <Text size="sm" tone="muted">18 tasks</Text>
</Cluster>
```

### Don't

```tsx
// ✗ wrap={false} in a container you do not control is an overflow bug.
<Cluster wrap={false}>{tags.map(…)}</Cluster>

// ✗ A row of controls with a name is a toolbar, and toolbars have keyboard rules.
<Cluster role="toolbar">…</Cluster>
```

---

## 2.3 `Grid`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 2.1 |
| **APG pattern** | none |

### Purpose

Two-dimensional layout in two modes: a fixed number of equal columns, and an
`auto-fit` track that reflows without a single query. It does not do spans, areas
or subgrid — see the open question below.

### Sizing contract justification

`fill`. `display: grid`, no width declaration, `min-inline-size: 0`. Every
generated track is `minmax(0, 1fr)` rather than `1fr`, because `1fr` has a
`min-content` floor and a long unbreakable string in one cell will otherwise
blow the whole grid out of its container.

### Anatomy

```
<div class="pp-grid" data-pp-gap="4" data-mode="auto">
  └── (children, each a grid item)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-grid` | `<div>` | Via `asChild` otherwise |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `number \| string` | — | A number is `repeat(n, minmax(0, 1fr))`. A string is passed to `grid-template-columns`. Decision 6 |
| `minItemInlineSize` | `string` | — | `repeat(auto-fit, minmax(<value>, 1fr))` |
| `gap` | `Space` | `'0'` | |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | `align-items` |
| `asChild` | `boolean` | `false` | |

`columns` and `minItemInlineSize` are mutually exclusive, enforced in the type
rather than by precedence — passing both is a mistake, and silently picking a
winner hides it. `GridProps` is a union of the two shapes.

Both are applied through `--pp-grid-template-columns` set in `style`, so the
value travels with the element and the custom property remains overridable.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| mode | `data-mode="fixed" \| "auto" \| "template"` | Which track expression is in play |
| gap | `data-pp-gap` | `gap` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-grid-template-columns` | per props | Track list |
| `--pp-grid-gap` | per `gap` | Gap between items |

### Keyboard interaction

None. Not focusable. This is `display: grid`, not `role="grid"` — the ARIA grid
pattern is a data widget and belongs to `Table` (5.4).

### Accessibility notes

No role. Grid placement can visually reorder content relative to the DOM; do not.
Reading order is DOM order, and the same argument as decision 5 applies here.

### Container behavior

`minItemInlineSize` is the container-native mode: `auto-fit` + `minmax` reflows
continuously against the grid's own inline size with no query and no breakpoint.
`columns={3}` is honest about being fixed — three columns in a 240px sidebar are
three squashed columns, and that is the caller's decision.

### Usage

```tsx
<Grid minItemInlineSize="16rem" gap="4">
  {workstreams.map((w) => <Card key={w.id} title={w.name}>…</Card>)}
</Grid>

<Grid columns="auto minmax(0, 1fr)" gap="3" align="start">
  <Avatar name={entry.actor} size="sm" />
  <Text size="sm">{entry.message}</Text>
</Grid>
```

### Don't

```tsx
// ✗ Fixed columns in a container you do not control.
<Grid columns={4}>{cards}</Grid>          // use minItemInlineSize

// ✗ Both modes at once. The type rejects this.
<Grid columns={3} minItemInlineSize="16rem" />

// ✗ 1fr, not minmax(0, 1fr), in a hand-written template: one long word
//   in one cell and the grid overflows its container.
<Grid columns="1fr 1fr" />
```

### Open question

**Spans.** `<Card />` across two columns is a real need and this spec does not
serve it. The options are a `GridItem` with `colSpan`, or `style={{ gridColumn }}`
at the call site. Deliberately deferred: nothing in the consuming app needs it
yet, and `style` covers it until something does.

---

## 2.4 `Container`

| | |
| --- | --- |
| **Sizing contract** | `fill`, with the library's only `max-inline-size` |
| **RSC** | `server` |
| **Depends on** | 2.1 |
| **APG pattern** | none |

### Purpose

Constrains a measure and centres it, with a gutter so the content never touches
the edge of the screen. **This is the only component in the library permitted to
set `max-inline-size`** — RULES §1, and the reason the rule is liveable.

It does not stack its children (wrap a `Stack`), and it draws nothing.

### Sizing contract justification

The documented exception. `Container` fills the inline space it is given up to
`max-inline-size`, then centres with `margin-inline: auto`. D-018 already carves
`margin: auto` out of the margin ban for this file, and `.stylelintrc.json`
already carries the `src/components/Container/**` override — both written when
Tier 1 anticipated this component.

### Anatomy

```
<div class="pp-container" data-size="lg" data-pp-gutter="5">
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-container` | `<div>` | `<main>`, `<article>` via `asChild` |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | Max measure. `sm` `40rem` · `md` `64rem` · `lg` `80rem` |
| `gutter` | `Space` | `'5'` | `padding-inline`. Decision 8 |
| `asChild` | `boolean` | `false` | |

`sm` is a reading measure — prose, a settings form, a login card. `md` is an
app page. `lg` is a dashboard. Anything else is
`--pp-container-max-inline-size`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| size | `data-size` | `max-inline-size` |
| gutter | `data-pp-gutter` | `padding-inline` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-container-max-inline-size` | per `size` | The measure |
| `--pp-container-gutter` | per `gutter` | Inline padding |

### Keyboard interaction

None.

### Accessibility notes

No role. `asChild` with `<main>` is the common case and is the correct way to
get one landmark rather than a `<div>` inside a `<main>`.

### Container behavior

No `@container` rules. `max-inline-size` plus `margin-inline: auto` is already
continuous — the container is exactly as wide as it is allowed to be, at every
width, with no breakpoint.

Container **does** declare `container-type: inline-size`, so that components
inside it query the page measure rather than the viewport. This is the anchor
point for the whole `@container` strategy: without a query container somewhere
near the top of the tree, a component's `@container` rules resolve against the
nearest ancestor that happens to have one.

### Usage

```tsx
<Container size="lg" asChild>
  <main>
    <Stack gap="6">
      <PageHeader />
      <Grid minItemInlineSize="16rem" gap="4">…</Grid>
    </Stack>
  </main>
</Container>
```

### Don't

```tsx
// ✗ Nesting measures. The inner one wins and the outer one is a lie.
<Container size="lg"><Container size="md">…</Container></Container>

// ✗ Container is not a Stack. It constrains; it does not space.
<Container gap="4">…</Container>

// ✗ Reaching for max-width anywhere else in the library.
<Card style={{ maxWidth: '40rem' }} />   // wrap it in a Container
```

---

## 2.5 `Center`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 2.1 |
| **APG pattern** | none |

### Purpose

Centres its children in the box it was given, on either axis or both. The case
it exists for is the one every app hand-rolls: an empty state, a loading
spinner, a 404 — content that should sit in the middle of whatever space is
available.

It does **not** constrain a measure. Centring a column of text by giving it a
max-width is `Container`'s job, and conflating the two is why "Center" means
three different things across the ecosystem.

### Sizing contract justification

`fill`. It centres *within* the space it is given, so it must take all of it.
`display: flex` with `place-content`, no width declaration,
`min-inline-size: 0`.

Block-axis centring needs a block size, and RULES §1 has nothing to say about
block size — but a `fill` component still should not invent one. So the block
size comes from the parent (a grid row, a flex parent with a height) or from
`--pp-center-min-block-size`, exactly as `Skeleton` handles the same problem
(D-016 §4). There is no `minHeight` prop.

### Anatomy

```
<div class="pp-center" data-axis="both" data-pp-gap="3">
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-center` | `<div>` | Via `asChild` otherwise |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `axis` | `'inline' \| 'block' \| 'both'` | `'both'` | Which axis to centre on |
| `gap` | `Space` | `'0'` | Children stack vertically, so this is the gap between them |
| `asChild` | `boolean` | `false` | |

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| axis | `data-axis` | `justify-content` / `align-items` |
| gap | `data-pp-gap` | `gap` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-center-min-block-size` | `auto` | Minimum height to centre within |
| `--pp-center-gap` | per `gap` | Gap between children |

### Keyboard interaction

None.

### Accessibility notes

No role. Centring is visual; the content says what it means.

### Container behavior

No `@container` rules.

### Usage

```tsx
<Center gap="3" style={{ '--pp-center-min-block-size': 'var(--pp-space-9)' }}>
  <Spinner size="lg" tone="accent" />
  <Text tone="muted">Loading the task board…</Text>
</Center>
```

### Don't

```tsx
// ✗ Center does not constrain a measure. That is Container.
<Center><Text>{longArticleBody}</Text></Center>

// ✗ There is no height prop, and there will not be one.
<Center minHeight="50vh">…</Center>
```

---

## 2.6 `Split`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 2.3 |
| **APG pattern** | none |

### Purpose

A fixed-width pane beside a flexible one, which stacks when the container gets
narrow. An app shell's sidebar, a form beside a preview, a filter rail beside a
list.

It is a **two-slot** layout and nothing more: no resize handle, no collapse
toggle, no persistence. A draggable splitter is the APG *window splitter*
pattern with its own keyboard contract, and if it is ever wanted it is a
separate component.

### Sizing contract justification

`fill`. `Split` takes the inline space it is given and divides it. Setting
`flex-basis` on `Split.Sidebar` and `min-inline-size: 0` on `Split.Main` is the
parent sizing the boxes it created, which is decision 3 exactly.

### Anatomy

```
<div class="pp-split" data-pp-gap="5" data-collapse-below="md">
  ├── <div class="pp-split__sidebar">
  └── <div class="pp-split__main">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-split` | `<div>` | `container-type: inline-size`, `display: flex`, `flex-wrap: wrap` |
| sidebar | `pp-split__sidebar` | `<div>` | `flex: 0 0 var(--pp-split-sidebar-inline-size)`. `<aside>`/`<nav>` via its own `asChild` |
| main | `pp-split__main` | `<div>` | `flex: 1 1 0`, `min-inline-size: 0` |

Compound, per RULES §5.6: `Split.Sidebar` and `Split.Main`. Positional children
would leave "which one is the sidebar" to a tuple type that JSX does not reliably
preserve, and named slots read better at the call site regardless.

### Props

`Split`:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `sidebarInlineSize` | `string` | `'16rem'` | Sets `--pp-split-sidebar-inline-size`, applied as the sidebar's `flex-basis` |
| `collapseBelow` | `'sm' \| 'md' \| 'lg' \| 'never'` | `'md'` | Decision 4 |
| `gap` | `Space` | `'0'` | Between the two panes, in both layouts |

`Split.Sidebar` and `Split.Main`: `asChild` and the standard root props. No
`side` prop anywhere — decision 5.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| collapse threshold | `data-collapse-below` | Selects the `@container` block |
| collapsed | `data-collapsed` on both slots, set by the `@container` rule | Full-width panes |
| gap | `data-pp-gap` | `gap` |

`data-collapsed` cannot be set by CSS. The slots therefore expose the collapse
through the container query itself, and a consumer who needs to know writes the
same `@container` condition. Recorded as a limitation rather than papered over
with a `ResizeObserver` that would make the whole tier a client component.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-split-sidebar-inline-size` | `16rem` | Sidebar `flex-basis` |
| `--pp-split-gap` | per `gap` | Gap between panes |

### Keyboard interaction

None. `Split` is not a window splitter (see Purpose).

### Accessibility notes

No role on the root. `Split.Sidebar` is frequently a landmark — `asChild` with
`<aside>` or `<nav aria-label="Main">` — and `Split.Main` is frequently `<main>`.
`Split` does not guess at either, because a `Split` inside a page that already
has a `<main>` would then emit two.

Reading order is DOM order in both the split and the collapsed layout: the
`@container` rule changes `flex-basis` only, and never `order`.

### Container behavior

The root is a query container (`container-type: inline-size`). Below the
threshold, both slots take `flex-basis: 100%` and wrap onto their own lines.
The rule targets the slots, never the root — an element cannot query its own
container, which is why the collapse is expressed as "make the children full
width" rather than "change my own flex-direction".

```css
@container (max-inline-size: 45rem) {
  .pp-split[data-collapse-below="md"] > * { flex-basis: 100%; }
}
```

This is the component that makes RULES §1's container-query claim real: the same
`Split` collapses inside a modal that it would at a narrow viewport, and it has
never heard of the viewport.

### Usage

```tsx
<Split sidebarInlineSize="15rem" collapseBelow="lg" gap="0">
  <Split.Sidebar asChild>
    <nav aria-label="Main">…</nav>
  </Split.Sidebar>
  <Split.Main asChild>
    <main>…</main>
  </Split.Main>
</Split>
```

### Don't

```tsx
// ✗ There is no side prop. Put Main first for a right-hand sidebar.
<Split side="end">…</Split>

// ✗ Three panes is not a Split. It is a Grid.
<Split><Split.Sidebar/><Split.Main/><Split.Sidebar/></Split>

// ✗ A viewport media query. The whole point is that Split cannot see one.
@media (max-width: 52rem) { .pp-split { … } }
```

---

## 2.7 `AspectRatio`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

Reserves a box of a given ratio before its content loads, so an image, a video
embed or a map does not shift the page when it arrives. It derives block size
from inline size, which is the one dimension a `fill` component is allowed to
compute.

### Sizing contract justification

`fill`. Inline size comes from the parent, exactly as always; block size is
`aspect-ratio` applied to it. That is not the component choosing a size — it is
the component choosing a *shape*, with the size still entirely the parent's.

### Anatomy

```
<div class="pp-aspect-ratio" style="--pp-aspect-ratio: 1.7778">
  └── (single child, stretched to both axes)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-aspect-ratio` | `<div>` | `display: grid`, `aspect-ratio`, `overflow: hidden` |

The root is a grid and the child is placed at `1 / 1` with `block-size: 100%`.
Grid stretches a single item on the inline axis by default, so the child fills
both axes without the component declaring `inline-size` anywhere — which it is
not allowed to do and, unlike `Icon` (D-019), has no case for.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `ratio` | `number` | — | **Required.** `16 / 9`, `1`, `4 / 3`. No default — there is no ratio that is right when you did not think about it |

### State

None.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-aspect-ratio` | per `ratio` | The ratio |
| `--pp-aspect-ratio-radius` | `--pp-radius-0` | Corner rounding of the clipped box |

### Keyboard interaction

None.

### Accessibility notes

No role. The child carries its own semantics — an `<img>` still needs its `alt`,
an `<iframe>` its `title`. Reserving the box does not describe what goes in it.

### Container behavior

No `@container` rules. The ratio holds at every width, which is the point.

### Usage

```tsx
<AspectRatio ratio={16 / 9}>
  <img src={asset.url} alt={asset.description} />
</AspectRatio>
```

### Don't

```tsx
// ✗ Two children. The second is placed on top of the first.
<AspectRatio ratio={1}><img /><Badge /></AspectRatio>

// ✗ A ratio to force a height on arbitrary content. It will be clipped.
<AspectRatio ratio={3}><Text>{body}</Text></AspectRatio>
```

---

## 2.8 `Scroller`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | **`client`** |
| **Depends on** | T0 |
| **APG pattern** | none — but WCAG 2.1.1 and 4.1.2 both apply |

### Purpose

An overflow container that says, visually and in the DOM, that there is more
content past the edge. The affordance is the entire point: an overflowing region
with no shadow and no scrollbar is content users never find.

### Sizing contract justification

`fill`. The scroll region is as wide as its parent allows; its block size comes
from the parent or from `--pp-scroller-max-block-size`.

### Anatomy

```
<div class="pp-scroller" role="region" aria-label="…" tabindex="0"
     data-orientation="vertical" data-overflow="end">
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-scroller` | `<div>` | The scroll port, the focus target and the shadow host |

Shadows are `background-image` gradients on the root, shown and hidden by
`data-overflow`. No extra DOM nodes, and no pseudo-element that would collide
with a consumer's own.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** `aria-label` on the region. Decision 7 |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Which axis scrolls |

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| overflow | `data-overflow="none" \| "start" \| "end" \| "both"` | Which edge shadows are visible |
| orientation | `data-orientation` | `overflow-inline` / `overflow-block` |
| focus | `:focus-visible` | Focus ring, per the token set |

`data-overflow` names the edge that has content *beyond* it, and is logical, so
`start` is the left edge in LTR and the right in RTL.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-scroller-max-block-size` | `none` | Height at which it starts scrolling |
| `--pp-scroller-shadow-size` | `--pp-space-4` | Shadow depth; `0` disables |
| `--pp-scroller-shadow-color` | `--pp-color-shadow-edge` | Shadow colour. New token — decision 10 |

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| <kbd>Tab</kbd> | Focuses the region, because a keyboard user must be able to scroll it (WCAG 2.1.1). Chrome ≥ 127 does this natively for scrollers; `tabIndex={0}` makes it true everywhere |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Native scrolling |
| <kbd>PageUp</kbd> <kbd>PageDown</kbd> <kbd>Home</kbd> <kbd>End</kbd> | Native scrolling |

All native. The component adds a tab stop and a name, and nothing else — there
is no APG pattern here to implement, only two success criteria to satisfy.

### Accessibility notes

`role="region"` + `aria-label` makes it a navigable landmark, which is what a
screen-reader user needs to find and enter a scrollable table.

`tabIndex={0}` is unconditional. A region containing focusable children arguably
does not need its own stop; deciding that at runtime would mean inspecting
children on every render, and the extra stop is harmless where the shadow is
correct and essential where it is not.

Scroll shadows are decorative. They are `background-image`, never content, and
never the only signal — `data-overflow` is in the DOM for anything that needs
it, and the scrollbar itself is not hidden.

### Container behavior

No `@container` rules. Overflow detection is measured, not queried: a
`ResizeObserver` on the port and its content, plus a passive `scroll` listener,
both of which write `data-overflow`. That measurement is why this is the tier's
only client component — and it is the same technique the playground's `Matrix`
harness already uses to flag a component that outgrew its box.

### Usage

```tsx
<Scroller orientation="horizontal" label="Task table">
  <table>…</table>
</Scroller>
```

### Don't

```tsx
// ✗ No label. A focusable region with no accessible name is a 4.1.2 failure,
//   and the type rejects it.
<Scroller>…</Scroller>

// ✗ Hiding the scrollbar because the shadows look nicer.
<Scroller label="…" style={{ scrollbarWidth: 'none' }}>…</Scroller>

// ✗ Scrolling a whole page. Scroller is for a region inside one.
<Scroller label="Page"><Container>…</Container></Scroller>
```

---

## Build order

Dependency order, and the order each becomes useful to the consuming app:

1. **`Stack`** — 21 hand-rolled uses waiting on it, and the shared `gap` block
   lands with it.
2. **`Cluster`** — 24 uses.
3. **`Grid`** — 5 uses, and the decision-6 question is settled by then.
4. **`Container`** — 10 uses; the page shell.
5. **`Center`** — the loading and empty screens.
6. **`Split`** — replaces the app shell's viewport media query, which is the
   single clearest demonstration of RULES §1 in the consuming app.
7. **`AspectRatio`** — the asset thumbnails.
8. **`Scroller`** — nothing needs it until `Table` (5.4), but it is the only
   component in the tier with an a11y surface and should not be rushed at the
   end of Tier 5.

WIP limit 1 on `build` (D-014). Each ships its own commit: component, CSS,
tests, playground entry, docs page, changeset, roadmap transition.

## Rulings

Gate C cleared 2026-09-17. All four open items were accepted as recommended.

| # | Question | Ruling |
| --- | --- | --- |
| 6 | Does `Grid` accept a raw `grid-template-columns` string? | **Yes.** `columns?: number \| string`. [D-022 §4](../DECISIONS.md) |
| — | `Container` measures | **`40rem` / `64rem` / `80rem`.** The app's `72rem` becomes `lg` at `80rem`. [D-022 §5](../DECISIONS.md) |
| 10 | A new `--pp-color-shadow-edge` token | **Added**, light and dark, no contrast assertion. [D-023](../DECISIONS.md) |
| 5 | Does `Split` get a `side` prop? | **No.** Put `Split.Main` first. [D-022 §3](../DECISIONS.md) |

The remaining decisions in this document were accepted as written: `gap` as the
fourth vocabulary term ([D-020](../DECISIONS.md)), layout primitives sizing their
children ([D-021](../DECISIONS.md)), and the rest as
[D-022](../DECISIONS.md) §§1–2, 6–10.

One item is deliberately left unresolved rather than ruled on: **`Grid` spans**
(§2.3, Open question). `style={{ gridColumn }}` covers it until something in the
library needs it. Revisit at `Table` (5.4).
