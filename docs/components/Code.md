# Code

Inline code — an identifier, a path, a flag. Block code with highlighting is
`CodeBlock` (5.12). Spec:
[`tier-1-atoms.md` §1.11](../specs/tier-1-atoms.md#111-code).

```tsx
import { Code } from '@mod-0-dev/pixel-perfect';
```

## Usage

```tsx
<Text>
  Regenerate with <Code>npm run tokens</Code> after editing the script.
</Text>

<Text tone="danger">
  <Code tone="danger">launchDate</Code> must be an ISO date.
</Text>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | — | Omitted: `0.9em` of the surrounding text. Set for standalone use |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | |

Plus every `<code>` attribute. `ref` goes to the root. Mirrored as `data-size`
(when set) and `data-pp-tone`.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-code-bg` | tone tint | Background |
| `--pp-code-color` | tone text, strong | Text |
| `--pp-code-radius` | `--pp-radius-1` | Corners |
| `--pp-code-font-size` | `0.9em` | Relative size when `size` is unset |

Wraps with `overflow-wrap: anywhere`, so a long path never forces a horizontal
scrollbar, and keeps its padding and radius on every fragment.

## Inside a link

A `Code` inside a [`Link`](Link.md) takes the link's ink, at rest and on
hover, and keeps its own chip, so the code reads as part of what you click.
`tone` does not change that: inside a link, the link's colour is what says
"link". `--pp-code-color` still wins if you set it. Every link tone's ink on
the chip is asserted at 4.5:1 or better in both themes (D-107 §5).

```tsx
<Link href="/config">the <Code>pixel.config.ts</Code> file</Link>
```

## Don't

```tsx
// ✗ Multi-line code is not this component.
<Code>{`function a() {\n  return 1\n}`}</Code>   // CodeBlock (5.12)

// ✗ A keyboard key is Kbd.
<Code>⌘K</Code>

// ✗ Recolouring a Code inside a link to match it. It already does.
<Link href="/api"><Code style={{ color: 'inherit' }}>useTheme()</Code></Link>
```
