# Link

Navigation. Spec:
[`tier-3a-action.md` §3.3](../specs/tier-3a-action.md#33-link).

```tsx
import { Link } from 'pixel-perfect';
```

It knows nothing about routing, prefetching or external-link detection, and it
does not style itself as a button.

## Usage

```tsx
<Text>See the <Link href="/docs/rules">ground rules</Link> for why.</Text>

<Link asChild><NextLink href="/settings">Settings</NextLink></Link>

<Cluster gap="4">
  <Link href="/about" tone="neutral" underline="hover">About</Link>
  <Link href="/pricing" tone="neutral" underline="hover">Pricing</Link>
</Cluster>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'accent'` | |
| `underline` | `'always' \| 'hover' \| 'none'` | `'always'` | |
| `asChild` | `boolean` | `false` | For `next/link` |

Plus every `<a>` attribute, `href` included. `ref` goes to the root. Mirrored as
`data-pp-tone` and `data-underline`.

**No `variant`, no `size`.** Neither `solid | outline | ghost | plain` nor
`sm | md | lg` describes anything a text link does, and redefining a vocabulary
word for one component is how a vocabulary stops meaning anything. A link is
inline text and takes the size of the text around it; `Text` (1.1) is what sets
a text size.

**No `external`.** An app that wants `target="_blank" rel="noreferrer"` writes
those attributes, which is shorter than the prop would be and avoids the library
guessing what "external" means behind a proxy.

## `underline` defaults to `always`

WCAG 1.4.1 (Use of Color) says colour may not be the only visual means of
conveying information. A link inside a paragraph that differs from the
surrounding text only in hue is not a link for a substantial number of readers.

`underline="hover"` is the deliberate opt-out for navigation lists and card
titles, where position and context already say "link" — a judgement the app
makes explicitly, at the call site.

## It wraps, because it declares no `display`

An `<a>` is already `display: inline`, so `Link` declares nothing and a long
link breaks across lines mid-sentence like any other text. An `inline-flex`
link cannot, which is why links in several well-known libraries are unusable
mid-paragraph.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-link-color` | `--pp-tone-text` | Text |
| `--pp-link-color-hover` | `--pp-tone-text-strong` | Text on hover |
| `--pp-link-underline-offset` | `--pp-space-1` | `text-underline-offset` |

`:visited` is deliberately unstyled — it needs a colour that passes contrast in
both themes against five tones, and browsers restrict which properties
`:visited` may change. `.pp-link:visited` and the token set are yours.

## Don't

```tsx
// ✗ colour alone is not a signal — WCAG 1.4.1. In running text, keep the underline.
<Text>Read the <Link href="/x" underline="none">rules</Link>.</Text>

// ✗ two styled components fighting over one element. Both set `color`, both
//   live in @layer pp.components, and whichever stylesheet imports last wins.
<Button asChild><Link href="/save">Save</Link></Button>
// ✓ delegate to a plain anchor or next/link — Button supplies all the styling
<Button asChild><a href="/save">Save</a></Button>
<Button asChild><NextLink href="/save">Save</NextLink></Button>

// ✗ not focusable, not announced, not a link.
<Link onClick={doThing}>Do the thing</Link>
// ✓ an action is a Button
<Button variant="plain" onClick={doThing}>Do the thing</Button>

// ✗ the link text is the accessible name. "Here" names nothing.
<Text>For pricing, click <Link href="/pricing">here</Link>.</Text>
```
