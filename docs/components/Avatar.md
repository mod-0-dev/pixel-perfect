# Avatar

A person's picture, with initials until it loads and for good if it fails.
Spec: [`tier-1-atoms.md` §1.9](../specs/tier-1-atoms.md#19-avatar).

```tsx
import { Avatar } from 'pixel-perfect';
```

The only client component in Tier 1: whether an image loaded is runtime
state. The server renders the fallback, the first client render matches it,
and the image swaps in on load — no hydration mismatch.

## Usage

```tsx
<Avatar name="Mara Ellison" src="/people/mara.jpg" />

{/* No image: initials on a tone. */}
<Avatar name="Samuel Okafor" tone="accent" size="sm" />

{/* Unassigned. */}
<Avatar name="Unassigned" fallback={<Icon decorative><User /></Icon>} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` | — | **Required.** The accessible name, and the source of the initials |
| `src` | `string` | — | Omit for a fallback-only avatar |
| `fallback` | `ReactNode` | initials | Overrides the generated initials |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24 / 32 / 40px |
| `tone` | `Tone` | `'neutral'` | Fallback background |
| `onLoadingStatusChange` | `(status) => void` | — | `'loading' \| 'loaded' \| 'error'` |

Plus every `<span>` attribute except `children`, `role` and `aria-label`.
`ref` goes to the root. Mirrored as `data-size`, `data-pp-tone`, and
`data-state="loading | loaded | error"`.

Load status is uncontrolled only — the browser owns it (D-016 §6).

Initials are the first grapheme of the first and last words, uppercased, so
`山田 太郎` gives `山太` and an emoji is never split. Mononyms give one
character. Pass `fallback` for different rules.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-avatar-size` | per `size` | Box size |
| `--pp-avatar-radius` | `--pp-radius-full` | Corners — set `--pp-radius-2` for square |
| `--pp-avatar-bg` | tone solid | Fallback background |
| `--pp-avatar-color` | on-solid | Fallback text |

## Don't

```tsx
// ✗ No name means no accessible name. Type error.
<Avatar src="/people/mara.jpg" />

// ✗ Overlapping stacks are a layout concern — AvatarGroup (5.13).
<Avatar name="Mara Ellison" overlap={-8} />
```
