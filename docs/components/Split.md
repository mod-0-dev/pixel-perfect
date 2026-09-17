# Split

A fixed pane beside a flexible one, which stacks when the container gets narrow.
Spec: [`tier-2-layout.md` §2.6](../specs/tier-2-layout.md#26-split).

```tsx
import { Split } from 'pixel-perfect';
```

This is the component that makes [RULES §1](../RULES.md)'s container-query claim
real: the same `Split` collapses inside a 480px modal that it would at a 480px
viewport, and it has never heard of the viewport.

## Usage

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

## Props

`Split`:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `sidebarInlineSize` | `string` | `'16rem'` | The sidebar's `flex-basis`. Any CSS length |
| `collapseBelow` | `'sm' \| 'md' \| 'lg' \| 'never'` | `'md'` | `30rem` / `45rem` / `60rem`. Mirrored as `data-collapse-below` |
| `gap` | `'0' \| '1' \| … \| '9'` | `'0'` | Between the panes, in both layouts |

`Split.Sidebar` and `Split.Main` each take `asChild` plus every `<div>`
attribute, and forward `ref`.

## Why the breakpoints are named, not free-form

**A container query condition cannot read a custom property.**
`@container (max-inline-size: var(--x))` is not valid CSS and cannot be made so,
so `collapseBelow="42rem"` is unimplementable rather than merely awkward. Three
named thresholds compile to three static `@container` blocks. See
[D-022 §2](../DECISIONS.md).

Anything else is `--pp-split-sidebar-inline-size` for the basis, or a `Grid`.

## There is no `side` prop

A right-hand sidebar is `Split.Main` written first. The alternative is `order`,
which desynchronises reading order from visual order — a screen reader and a
keyboard walk the DOM, a sighted user walks the screen — and a prop whose only
function is to create that divergence is not worth the two lines it saves. The
collapse rule changes `flex-basis` only, never `order`, so reading order is DOM
order in both layouts. See [D-022 §3](../DECISIONS.md).

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-split-sidebar-inline-size` | `16rem` | Sidebar `flex-basis` |
| `--pp-split-gap` | per `gap` | Gap between panes |

## Accessibility

No role on the root. `Split.Sidebar` is frequently a landmark — `asChild` with
`<aside>` or `<nav aria-label="Main">` — and `Split.Main` is frequently
`<main>`. `Split` does not guess at either, because a `Split` inside a page that
already has a `<main>` would then emit two.

## Don't

```tsx
// ✗ There is no side prop. Put Split.Main first for a right-hand sidebar.
<Split side="end">…</Split>

// ✗ Three panes is not a Split. It is a Grid.
<Split><Split.Sidebar/><Split.Main/><Split.Sidebar/></Split>

// ✗ A viewport media query to collapse it. The whole point is that Split
//   cannot see one, and this is the regression the test suite watches for.
@media (max-width: 52rem) { .pp-split { … } }

// ✗ A draggable splitter. That is the APG window-splitter pattern with its
//   own keyboard contract, and it is a different component.
<Split resizable />
```
