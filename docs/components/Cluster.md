# Cluster

A horizontal row that wraps. Spec:
[`tier-2-layout.md` §2.2](../specs/tier-2-layout.md#22-cluster).

```tsx
import { Cluster } from 'pixel-perfect';
```

It is called `Cluster` and not `Row` because wrapping is the default. A
horizontal flex row that cannot wrap is an overflow bug waiting for a narrow
container, and under [RULES §1](../RULES.md) the component never gets to know
how narrow that container is.

## Usage

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

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `gap` | `'0' \| '1' \| … \| '9'` | `'0'` | A step of `--pp-space-*`. Mirrored as `data-pp-gap` |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'center'` | Cross (block) axis. Mirrored as `data-align` |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | `'start'` | Mirrored as `data-justify` |
| `wrap` | `boolean` | `true` | `false` exposes `data-wrap="false"` and sets `flex-wrap: nowrap` |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<div>` |

Plus every `<div>` attribute. `ref` goes to the root; `className` and `style`
are merged, never replaced.

`align` defaults to `center` where `Stack`'s defaults to `stretch`. A row of
mixed-height things — a badge, a line of text, an avatar — reads correctly
centred, and that is nearly every row. A column of mixed-width things does not
want to be centred; it wants to fill.

`between` / `around` / `evenly` drop CSS's `space-` prefix. `between` is the
only value in the set that would carry it, and the enum reads better uniform.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-cluster-gap` | per `gap` | Gap between children |

## Container behavior

Wrapping *is* the container behavior, and it needs no `@container` rule: flex
resolves it continuously against the space actually available, which is strictly
better than a breakpoint. The same `Cluster` behaves correctly in a 240px
sidebar and a 960px page without being told which it is in.

Below the wrap point, `justify` applies per line. That is flex behaving
correctly, not a bug — but it is worth seeing before you ship
`justify="between"` into a narrow container.

## Don't

```tsx
// ✗ wrap={false} in a container you do not control is an overflow bug.
//   The playground flags it in red, which is the point.
<Cluster wrap={false}>{tags.map(…)}</Cluster>

// ✗ A row of controls with a name is a toolbar, and toolbars have keyboard
//   rules Cluster does not implement. That is Toolbar (6.6).
<Cluster role="toolbar">…</Cluster>

// ✗ Cluster has no background, border or padding, and is not getting any.
//   A bordered row of things is a Card (5.1) containing a Cluster.
<Cluster style={{ padding: 16, border: '1px solid' }}>…</Cluster>

// ✗ A `fill` component with no intrinsic content, as a direct child.
//   It renders ZERO WIDE: no width declaration (that is the contract), no
//   content to size it, and nothing telling it to grow. The failure is
//   silent — a zero-width box looks like nothing, not like an error.
<Cluster gap="3"><Progress value={60} /></Cluster>
```

Cluster distributes; it does not grow a child for you. When one child should
take the remaining space, say so:

```tsx
<Grid columns="minmax(0, 1fr) auto" gap="3">…</Grid>   {/* or */}
<Split gap="3">…</Split>                               {/* or, at the call site */}
<Cluster gap="3"><div style={{ inlineSize: '12rem' }}><Progress /></div></Cluster>
```

The last one is not a rules violation. [RULES §1](../RULES.md) binds this
library, not its consumers — sizing belongs to the parent, and in an app the
parent is the app. Found in
[launchpad](https://github.com/mod-0-dev/launchpad), where a readiness meter had
been an invisible hairline since its first commit.
