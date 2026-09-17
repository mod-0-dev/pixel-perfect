# ButtonGroup

Related buttons rendered as one attached unit. Spec:
[`tier-3a-action.md` §3.4](../specs/tier-3a-action.md#34-buttongroup).

```tsx
import { ButtonGroup } from 'pixel-perfect';
```

## It is the attached case, and only the attached case

A group that merely puts space between buttons *is* `<Cluster gap="2">`, so
there is no `attached` prop — `attached={false}` is spelled `Cluster`. A
component that duplicates a layout primitive is how sizing rules erode
([D-004](../DECISIONS.md#d-004)).

It does not manage selection either:

| You want | Use |
| --- | --- |
| Actions that sit together | `ButtonGroup` |
| Actions with space between them | `Cluster` |
| Exactly one of several chosen | `RadioGroup` (3.11), styled as buttons |
| Several of many chosen | a row of `Toggle`s (3.5) |

## Usage

```tsx
<ButtonGroup label="Text alignment">
  <IconButton label="Align left" variant="outline"><AlignLeft /></IconButton>
  <IconButton label="Align centre" variant="outline"><AlignCenter /></IconButton>
  <IconButton label="Align right" variant="outline"><AlignRight /></IconButton>
</ButtonGroup>

<ButtonGroup label="Export destination" orientation="vertical">
  <Button variant="outline">Download</Button>
  <Button variant="outline">Send to S3</Button>
</ButtonGroup>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** `aria-label` on the `role="group"` root |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Mirrored as `data-orientation` |

Plus every `<div>` attribute except `role`, which the component owns. `ref` goes
to the root.

**No `size`, `tone` or `variant`.** Forwarding them would mean cloning the
children, which breaks `asChild`, breaks a `Tooltip` wrapper later, and would
require every child to be a `Button`. Styling is done by descendant selector, so
mixed children work. Set the props on the buttons — they are usually all the
same and the repetition is honest.

## Keyboard

Every button is its own tab stop — deliberately **not** the
[APG Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) pattern's
roving tabindex. Roving is right for a dense, persistent toolbar of twenty
controls and wrong for three attached buttons, where it costs a keyboard user an
arrow-key discovery step to reach what one Tab would have reached. `Toolbar`
(6.6) is the roving-tabindex component, and this is why it is a separate entry.

A focused button is raised with `--pp-z-raised` so its focus ring is not painted
underneath the neighbour that follows it in source order.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-button-group-radius` | `--pp-control-radius` | The two outer corners |

The seam is drawn once: every button but the first drops its leading border, so
there was never a doubled edge to collapse. The usual
`margin-inline-start: -1px` is forbidden by RULES §2 and refused by the linter.

Solid buttons are the exception — their border is transparent, so dropping it
would merge two adjacent fills into one shape. They keep the border and tint it
with `--pp-tone-solid-active`.

## Don't

```tsx
// ✗ if you want space between them, you want a Cluster.
<ButtonGroup label="Actions" style={{ gap: 8 }}>…</ButtonGroup>
// ✓
<Cluster gap="2"><Button>Cancel</Button><Button>Save</Button></Cluster>

// ✗ an unnamed group.
<ButtonGroup>…</ButtonGroup>

// ✗ this is a single-select control. A group of buttons cannot announce
//   "Week, 2 of 3, selected", and nothing here tracks which one is on.
<ButtonGroup label="View"><Button>Day</Button><Button>Week</Button></ButtonGroup>
// ✓ a RadioGroup (3.11), or Toggles if several may be on at once

// ✗ the group name does not name the buttons inside it.
<ButtonGroup label="Align"><IconButton label="Align"><X /></IconButton></ButtonGroup>
```
