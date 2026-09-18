# IconButton

A square `Button` that cannot be built without an accessible name. Spec:
[`tier-3a-action.md` §3.2](../specs/tier-3a-action.md#32-iconbutton).

```tsx
import { IconButton } from 'pixel-perfect';
```

It is a separate component rather than a `Button` prop because the guarantee has
to be a type, not a code review. `label: string` is non-optional in a way that
`aria-label?: string` never is.

## Usage

```tsx
<IconButton label="Close" onClick={close}><X /></IconButton>

<IconButton label="Copy to clipboard" variant="plain" size="sm" onClick={copy}>
  <Clipboard />
</IconButton>

<IconButton label="Delete row" tone="danger" loading={deleting}><Trash /></IconButton>
```

Pass the raw SVG as children — `IconButton` wraps it in `<Icon decorative>`
itself, so the control is never named twice.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** Becomes `aria-label` |
| `children` | `ReactNode` | — | **Required.** The SVG |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Not Button's `solid` |
| `tone`, `size`, `loading`, `disabled`, `type` | as [`Button`](Button.md) | as `Button` | |

`ref` goes to the root, which carries **both** `pp-button` and `pp-icon-button`
— so every `--pp-button-*` override still applies.

**`variant` defaults to `ghost`.** An icon button is overwhelmingly a secondary
affordance — a close, a copy, an overflow menu, a row action — and a grid of
solid squares is noise. This is one of the two places Tier 3A deliberately
breaks its own default, and it is written down so it stays a decision.

**No `asChild`.** `Button`'s `asChild` delegates to the element passed as
`children`, and here `children` is already the SVG — there is no slot left for a
delegate. An icon-only link wants the same required name, so it is a `Link` with
an `Icon` inside and an `aria-label`.

## `size` is one scale, not two

`sm` / `md` / `lg` sets the box from `--pp-control-height-*` and passes straight
through to `Icon`, whose own steps are 16 / 20 / 24px. So a 32px button holds a
16px icon and a 48px button holds a 24px one, with no mapping table to keep in
step.

## Styling

Every `--pp-button-*` property, plus:

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-icon-button-size` | `--pp-control-height-<size>` | Both axes |

## Don't

```tsx
// ✗ does not typecheck, and that is the entire point of the component.
<IconButton><X /></IconButton>

// ✗ the icon is already hidden; this names the control twice.
<IconButton label="Close"><Icon label="Close"><X /></Icon></IconButton>

// ✗ "icon" is not a name. Name the action, and what it acts on.
<IconButton label="Trash icon"><Trash /></IconButton>
// ✓
<IconButton label="Delete Q3 revenue model"><Trash /></IconButton>

// ✗ a row of these with the same name tells a screen reader user nothing about
//   which row they are on.
{rows.map((r) => <IconButton key={r.id} label="Delete"><Trash /></IconButton>)}
// ✓
{rows.map((r) => <IconButton key={r.id} label={`Delete ${r.name}`}><Trash /></IconButton>)}
```
