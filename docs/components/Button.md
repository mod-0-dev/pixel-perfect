# Button

A control that performs an action. Spec:
[`tier-3a-action.md` §3.1](../specs/tier-3a-action.md#31-button).

```tsx
import { Button } from 'pixel-perfect';
```

The first focusable component in the library, so it settles two things
everything after it inherits: what a focus ring looks like, and how tall a
control is. Both live in tokens, not here — see [Styling](#styling).

## Usage

```tsx
<Button tone="accent" onClick={save}>Save</Button>

<Button variant="outline" onClick={cancel}>Cancel</Button>

<Cluster gap="2" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button tone="accent" type="submit">Save changes</Button>
</Cluster>
```

Icons compose — there is no `iconStart` prop, because the root is a flex
container with the control gap already applied:

```tsx
<Button tone="accent">
  <Icon decorative><Save /></Icon>
  Save
</Button>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'solid'` | |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | Hierarchy lives here |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 32 / 40 / 48px tall |
| `loading` | `boolean` | `false` | Busy. Stays focusable; activation is swallowed |
| `disabled` | `boolean` | `false` | Native `disabled` |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<button>` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | **Not** HTML's `'submit'` — see below |

Plus every `<button>` attribute. `ref` goes to the root. Mirrored as
`data-variant`, `data-pp-tone`, `data-size`, `data-loading`, `data-disabled`.

| `variant` | Background | Border | Text |
| --- | --- | --- | --- |
| `solid` | tone solid | — | on-solid |
| `outline` | — | tone border | tone text |
| `ghost` | tone tint | tone border, subtle | tone text, strong |
| `plain` | — | — | tone text |

The same four combinations as [`Badge`](Badge.md), deliberately.

## `type` defaults to `"button"`

HTML defaults it to `"submit"`, which means every non-submit button inside a
`<form>` — "add another row", "cancel", a disclosure toggle — silently submits
it. Submitting is opted into:

```tsx
<Button type="submit">Save changes</Button>
```

## `loading` is not `disabled`

A browser blurs a focused element the instant it becomes disabled. So the
conventional pattern — click Save, disable while the request is in flight —
takes focus away from a keyboard or screen reader user at the exact moment they
need to know what happened, and drops them at the top of the document.

`loading` instead sets `aria-disabled`, keeps the button focusable, and swallows
click and Enter/Space. The label stays in the DOM at `opacity: 0`, so the box
never shrinks under the cursor and — because `opacity` is the only way to hide
something visually without removing it from the accessibility tree — the
accessible name does not change either.

Announcing progress is the app's job, and it is one prop:

```tsx
<Button loading={saving} onClick={save}>
  {saving ? 'Saving…' : 'Save'}
</Button>
```

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-button-bg` | per `variant` | Background |
| `--pp-button-color` | per `variant` | Label |
| `--pp-button-border-color` | per `variant` | Border |
| `--pp-button-radius` | `--pp-control-radius` | Corners |
| `--pp-button-height` | `--pp-control-height-<size>` | Block size |
| `--pp-button-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding |
| `--pp-button-gap` | `--pp-control-gap-<size>` | Space between children |

To retune every control in the library at once — Button, and every Tier 3 input
as it lands — set the shared tokens instead of the per-component ones:

```css
:root {
  --pp-control-height-md: 2.25rem;
  --pp-control-radius: var(--pp-radius-4);
}
```

The focus ring is `--pp-color-focus-ring` on every tone, not a per-tone colour.
That is the only ring pairing `npm run lint:contrast` verifies, and one ring
colour is easier to find than five.

## A `Stack` stretches it, because a flex column does

`Stack` defaults to `align="stretch"` — the CSS default for a flex column — so
a button dropped straight into one fills the row:

```tsx
<Stack gap="3">
  <Button>Save</Button>       {/* full width */}
</Stack>

<Stack gap="3" align="start">
  <Button>Save</Button>       {/* its own width */}
</Stack>
```

That is the sizing contract working as written rather than an exception to it:
`Button` declares no width and the parent decides, including when the parent
decides by default.

## Don't

```tsx
// ✗ hug means hug. There is no fullWidth, and there is no width prop.
<Button style={{ width: '100%' }}>Save</Button>
// ✓ the parent decides
<Stack align="stretch"><Button>Save</Button></Stack>

// ✗ a button that navigates loses middle-click, open-in-new-tab, and the
//   status bar preview of where it goes.
<Button onClick={() => router.push('/settings')}>Settings</Button>
// ✓
<Button asChild><Link href="/settings">Settings</Link></Button>

// ✗ every button is the primary button, so none of them is.
<Button tone="accent">Cancel</Button>
<Button tone="accent">Save</Button>

// ✗ no accessible name.
<Button><Icon decorative><Trash /></Icon></Button>
// ✓ IconButton (3.2) makes this a type error rather than a review comment.

// ✗ don't re-disable it yourself; that is the bug `loading` exists to avoid.
<Button loading={saving} disabled={saving}>Save</Button>
```
