# Container

Constrains a measure and centres it. Spec:
[`tier-2-layout.md` §2.4](../specs/tier-2-layout.md#24-container).

```tsx
import { Container } from 'pixel-perfect';
```

**This is the only component in the library permitted to set `max-inline-size`.**
That is its entire job, and it is what makes [RULES §1](../RULES.md) liveable:
when you want to constrain something, you wrap it.

## Usage

```tsx
<Container size="md" asChild>
  <main>
    <Stack gap="6">
      <PageHeader />
      <Grid minItemInlineSize="16rem" gap="4">…</Grid>
    </Stack>
  </main>
</Container>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | `--pp-measure-sm` `40rem` · `-md` `64rem` · `-lg` `80rem`. Mirrored as `data-size` |
| `gutter` | `'0' \| '1' \| … \| '9'` | `'5'` | `padding-inline`, as a step of `--pp-space-*`. Mirrored as `data-pp-gutter` |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<div>` — usually a `<main>` |

Plus every `<div>` attribute. `ref` goes to the root; `className` and `style`
are merged, never replaced.

`sm` is a reading measure — prose, a settings form, a login card. `md` is an app
page. `lg` is a dashboard. Anything else is `--pp-container-max-inline-size`;
three steps is a scale, seven is a lookup table.

There is **no `gap`**. A Container constrains; it does not space. Put a `Stack`
inside it.

## The gutter default is not a mistake

`gap` defaults to `'0'` and `gutter` defaults to `'5'`. A zero gap is a
legitimate design — a semantic column, a list whose items carry their own
borders. A zero page gutter is text against the edge of a phone screen, which is
a bug every single time. See [D-022 §6](../DECISIONS.md).

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-container-max-inline-size` | per `size` | The measure |
| `--pp-container-gutter` | per `gutter` | Inline padding |

Both beat their props and work from an ancestor ([D-024](../DECISIONS.md)).

## Container behavior

`Container` declares `container-type: inline-size`, and that is not incidental.
It is the anchor for the whole `@container` strategy: without a query container
near the top of the tree, a component's `@container` rules resolve against
whatever ancestor happens to have one — which in a page with none is the
viewport, quietly reintroducing the thing RULES §1 removed. `Split` (2.6) is the
first component to depend on it.

No `@container` rules of its own. `max-inline-size` plus `margin-inline: auto`
is already continuous: the container is exactly as wide as it is allowed to be,
at every width, with no breakpoint.

## Don't

```tsx
// ✗ Nesting measures. The inner one wins and the outer one is a lie.
<Container size="lg"><Container size="md">…</Container></Container>

// ✗ Container is not a Stack. It constrains; it does not space.
//   The type rejects this.
<Container gap="4">…</Container>

// ✗ Reaching for max-width anywhere else in the library. There is exactly
//   one component allowed to do this, and you are looking at it.
<Card style={{ maxWidth: '40rem' }} />   // wrap it in a Container

// ✗ A <div> inside a <main> when asChild would have given you the landmark.
<main><Container>…</Container></main>
```
