# Text

Body copy with a typography scale, a colour role and truncation. Spec:
[`tier-1-atoms.md` §1.1](../specs/tier-1-atoms.md#11-text).

```tsx
import { Text } from 'pixel-perfect';
```

## Usage

```tsx
<Stack gap="2">
  <Text weight="medium">Privacy policy v4.pdf</Text>
  <Text size="sm" tone="muted" truncate={2}>
    Adds the analytics disclosure the store review flagged.
  </Text>
</Stack>
```

Inline, inside a sentence:

```tsx
Owner: <Text asChild weight="semibold"><span>Samuel Okafor</span></Text>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Four steps by design — see D-016 |
| `tone` | `'neutral' \| 'muted' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | `muted` is local to Text and Heading |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | `'regular'` | |
| `align` | `'start' \| 'center' \| 'end'` | — | Logical |
| `truncate` | `boolean \| number` | — | `true` = one line with ellipsis; a number = clamp to that many lines |
| `asChild` | `boolean` | `false` | Render the single child element instead of `<p>` |

Plus every `<p>` attribute. `ref` goes to the root element.

`asChild` keeps the child's own display, so an inline `<span>` stays inline.
Single-line `truncate` needs a block box and will not clip on an inline child;
multi-line clamping works on either.

Every prop is mirrored on the DOM as `data-size`, `data-tone`, `data-weight`,
`data-align`, `data-truncate`, so you can style against state without knowing
the internals. The four context tones also set `data-pp-tone`.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-text-color` | per `tone` | Text colour |
| `--pp-text-size` | per `size` | Font size |
| `--pp-text-weight` | per `weight` | Font weight |
| `--pp-text-line-height` | `--pp-line-height-normal` | Leading |

Set on any ancestor; they win over the prop.

## Don't

```tsx
// ✗ Text does not space itself. The parent owns the gap.
<Text style={{ marginBottom: 16 }}>…</Text>

// ✗ There is no width prop, and there will not be one.
<Text width="50%">…</Text>

// ✗ Colour is not a message. Say what is wrong.
<Text tone="danger">{value}</Text>
```
