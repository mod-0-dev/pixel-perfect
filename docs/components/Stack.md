# Stack

Vertical flow with a gap. Spec:
[`tier-2-layout.md` §2.1](../specs/tier-2-layout.md#21-stack).

```tsx
import { Stack } from 'pixel-perfect';
```

This is the answer to "how do I put space between two components", and it is the
only answer. Every other component in the library is forbidden from spacing
itself ([RULES §2](../RULES.md)), which is what makes `Stack` load-bearing rather
than convenient.

## Usage

```tsx
<Stack gap="4">
  <Heading level={2}>Launch readiness</Heading>
  <Text tone="muted">12 days out. Five of eighteen tasks complete.</Text>
</Stack>
```

`gap` is an index into the space scale — `gap="4"` resolves to `--pp-space-4`.
It is a string, not a number, because `gap={4}` reads like a length and the
first question is always whether that means 4px or step 4.

A stack of links should still be a `<nav>` around real anchors, so use
`asChild`:

```tsx
<Stack gap="1" asChild>
  <nav aria-label="Main">
    <Link href="/tasks">Task board</Link>
    <Link href="/assets">Asset library</Link>
  </nav>
</Stack>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `gap` | `'0' \| '1' \| … \| '9'` | `'0'` | A step of `--pp-space-*`. Mirrored as `data-pp-gap` |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'stretch'` | Cross (inline) axis. Mirrored as `data-align` |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<div>` |

Plus every `<div>` attribute. `ref` goes to the root; `className` and `style`
are merged, never replaced.

There is no `justify`. Distributing children along the block axis requires a
block size, and a `fill` component does not have one — whoever owns the height
owns the distribution.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-stack-gap` | per `gap` | Gap between children |

`--pp-stack-gap` wins over the `gap` prop and can be set on any ancestor, which
is how you retune a whole subtree without touching call sites.

## Don't

```tsx
// ✗ The gap is the Stack's job. The child does not space itself,
//   and adding a margin here double-spaces against the gap.
<Stack gap="4">
  <Text style={{ marginBottom: 16 }}>…</Text>
</Stack>

// ✗ A Stack of one is a div. Delete it.
<Stack gap="4">
  <Card />
</Stack>

// ✗ gap is a scale index, not a length. The type rejects this.
<Stack gap="16px">…</Stack>

// ✗ Stack is not a Card. It has no background, border or padding,
//   and it is not getting any — that is what Card (5.1) is for.
<Stack style={{ padding: 16, border: '1px solid' }}>…</Stack>
```

## A note on the default

`gap` defaults to `'0'`, so `<Stack>` with no gap really is a plain column.

That default is load-bearing rather than cosmetic. The scale is mapped once onto
an inheriting custom property (`--_pp-gap`) rather than repeated in five
stylesheets, so a nested layout primitive that omitted `data-pp-gap` would
silently take its parent's rhythm. Defaulting to `'0'` means the attribute is
always emitted and the property is always redeclared. See
[D-020](../DECISIONS.md) — and the test that pins it.
