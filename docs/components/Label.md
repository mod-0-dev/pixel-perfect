# Label

The visible name of a form control. Spec: [`Label.md`](../specs/Label.md).

```tsx
import { Label } from 'pixel-perfect';
```

Almost nobody renders this directly. Every input in Tier 3C reaches it through
[`Field`](Field.md) (3.7), which owns the `useId()` call and passes `size`,
`required` and `invalid` down. Reach for `Label` on its own when you are
labelling a control the library does not have yet.

## Usage

```tsx
<Stack gap="1">
  <Label htmlFor="email" required>Email address</Label>
  <Input id="email" type="email" required />
</Stack>
```

The `htmlFor` / `id` pair is the whole component: it is what makes clicking the
label focus the field, and what gives the field its accessible name.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | **Required.** A label with no content names nothing |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | From `--pp-control-font-size-*` — see below |
| `required` | `boolean` | `false` | Renders the indicator. Presentational only |
| `disabled` | `boolean` | `false` | Dims the text. The control carries the real state |
| `invalid` | `boolean` | `false` | Sets `data-invalid`. No visual change by default |
| `htmlFor` | `string` | — | Native. Associates the label with its control |

Plus every `<label>` attribute. `ref` goes to the root `<label>`. Exported as
`LabelProps`.

There is no `tone`, no `variant`, no `weight` and no `asChild`.

## `sm` and `md` are the same size, on purpose

`size` resolves `--pp-control-font-size-*`, the same token the control beside it
reads, so a label and its field agree by construction rather than by vigilance
([D-034](../DECISIONS.md)). Those tokens are deliberately equal at `sm` and `md`:
a control gets small by losing height and padding, and a 12px label is not a
smaller label, it is a worse one. `lg` is the only step that moves the type.

## Required marks the control, not just the label

```tsx
<Label htmlFor="email" required>Email address</Label>
```

renders an `aria-hidden` `*` after the text. The glyph is visual reinforcement
only — assistive tech hears "required" from the control's own `required`
attribute, which is why the asterisk is hidden from it rather than read out as
"star" or duplicated as "(required)".

`Label` cannot set that attribute for you; it has no control to set it on. If
you are using `Label` standalone, set `required` on both. `Field` sets both from
one prop, which is the main reason to use `Field`.

## State

| State | Attribute | Treatment |
| --- | --- | --- |
| Required | `data-required` | `*` after the text |
| Disabled | `data-disabled` | `--pp-color-text-disabled` |
| Invalid | `data-invalid` | None — see below |

## Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-label-color` | `--pp-color-text` | Text colour |
| `--pp-label-font-size` | `--pp-control-font-size-<size>` | Type size |
| `--pp-label-font-weight` | `--pp-font-weight-medium` | Weight |
| `--pp-label-line-height` | `--pp-line-height-normal` | Leading |
| `--pp-label-gap` | `--pp-space-1` | Space before the required indicator |
| `--pp-label-required-color` | `currentcolor` | The indicator glyph |
| `--pp-label-cursor` | `inherit` | Cursor |

`--pp-label-cursor` exists for controls that make a whole row clickable.
`Checkbox`, `Radio` and `Switch` set it on their own root and it inherits down,
so you never need a selector that reaches across two components:

```css
.pp-checkbox { --pp-label-cursor: pointer; }
```

## Don't

```tsx
// ✗ a typed asterisk is not aria-hidden: screen readers read "Email address star".
<Label htmlFor="email">Email address *</Label>
// ✓
<Label htmlFor="email" required>Email address</Label>

// ✗ required on the label and nothing on the control. The asterisk is then a
//   claim the form does not enforce and assistive tech never hears.
<Label htmlFor="email" required>Email address</Label>
<Input id="email" />
// ✓ one prop, both places
<Field label="Email address" required><Input type="email" /></Field>

// ✗ a label that names nothing. If it is not naming a control, it is Text.
<Label>Shipping details</Label>
// ✓
<Heading level={2} size="sm">Shipping details</Heading>

// ✗ not a prop, and not a good idea. A red label is the fourth red thing in a
//   field that already has a red border, a red message and aria-invalid — and
//   the only one signalling by colour alone.
<Label tone="danger">Email address</Label>
// ✓ if your design language insists, say it once, in your own stylesheet
.pp-label[data-invalid] { --pp-label-color: var(--pp-tone-text); }

// ✗ fill means fill. There is no width prop and no fullWidth.
<Label style={{ maxWidth: '20ch' }}>Email address</Label>
// ✓ the parent constrains
<Container size="sm"><Label htmlFor="email">Email address</Label></Container>
```

## Accessibility

- Role: none. A `<label>` is not a widget and takes no tab stop; `Tab` skips it.
- The accessible name of the **control** comes from this element. That is a
  stronger association than `aria-label`, which is invisible, untranslatable by
  some tooling, and not a click target.
- `disabled` sets no `aria-disabled`: the label is not interactive, and because
  a disabled control cannot take focus, clicking its label already does nothing.
- `invalid` sets no `aria-invalid`. That belongs on the control, with
  `aria-describedby` pointing at the message. `Field` wires both.
