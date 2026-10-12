# InputGroup

An [`Input`](Input.md) with things inside its box: an icon, a unit, a button
that clears it or shows the password. Spec: [`InputGroup.md`](../specs/InputGroup.md).

```tsx
import { InputGroup, InputGroupAddon } from '@mod-0-dev/pixel-perfect';
```

A client component. The group draws the box — edge, fill, radius, height and
focus ring — and the `Input` inside gives its own up, so there is one box and
one ring. Addons sit before or after the `Input` in DOM order, so a
right-to-left page needs no `side`.

## Usage

```tsx
<InputGroup>
  <InputGroupAddon>
    <Icon decorative><Search /></Icon>
  </InputGroupAddon>
  <Input aria-label="Search" placeholder="Search components" />
</InputGroup>
```

In a form, the group goes inside the [`Field`](Field.md), and the `Input`
inside the group. The field's label, description and error still reach the
`Input`, and the group reads the field's `size`, `disabled` and error:

```tsx
<Field label="Price (EUR)" error={errors.price}>
  <InputGroup>
    <Input inputMode="decimal" {...register('price')} />
    <InputGroupAddon>EUR</InputGroupAddon>
  </InputGroup>
</Field>
```

A button goes in an addon at the size one step down, so it sits inside the
box. It keeps its own look, focus ring and cursor:

```tsx
const [shown, setShown] = useState(false);

<InputGroup>
  <Input type={shown ? 'text' : 'password'} autoComplete="current-password" />
  <InputGroupAddon>
    <IconButton label={shown ? 'Hide password' : 'Show password'} size="sm" variant="ghost" onClick={() => setShown((s) => !s)}>
      <Eye />
    </IconButton>
  </InputGroupAddon>
</InputGroup>
```

A press on an icon, a unit or the padding focuses the `Input`, as a press on
a label does. A press on a button in an addon does the button's job.

## Props

### `InputGroup`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale, for the box and the `Input` in it |
| `invalid` | `boolean` | field, then `false` | Draws the box in the danger tone and sets the `Input`'s `aria-invalid` |
| `disabled` | `boolean` | field, then `false` | Disables the `Input`. A button in an addon is yours to disable |
| `className` / `style` | | — | Merged onto the root, which is the box |

Plus every `<div>` attribute. `ref` gives you the root. Exported as
`InputGroupProps`.

### `InputGroupAddon`

A `<span>`: every `<span>` attribute, `ref` to it. Text and icons in it are
muted. Exported as `InputGroupAddonProps`.

## The precedence rule

The group sits between the `Input` and the `Field`: an `Input`'s own `size`,
`invalid` or `disabled` prop wins, then the group's, then the field's, then
the default. The group resolves its own the same way — its prop, then the
field — because it draws the box, and an invalid box is drawn in the danger
tone, which is a context on the box itself (D-007). `readOnly` stays an
`Input` prop; the group reads it from the `Input`.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-input-group-height` | `--pp-control-height-*` | The box's minimum height |
| `--pp-input-group-border-color` | `--pp-color-border` | The edge |
| `--pp-input-group-radius` | `--pp-control-radius` | The corners |
| `--pp-input-group-bg` | `--pp-color-bg-surface` | The fill |

State is on the root: `data-size`, `data-invalid`, `data-disabled`, and
`data-pp-tone="danger"` while invalid.

## Anatomy

```
<div class="pp-input-group" data-size="md">
  ├── <span class="pp-input-group__addon">…</span>
  ├── <span class="pp-input"><input class="pp-input__control"></span>
  └── <span class="pp-input-group__addon">…</span>
</div>
```

## Don't

```tsx
// ✗ a unit only in the addon. A screen reader announces the Input's name,
//   not the text beside it: "Price, edit text" — in what? Say it in the label.
<Field label="Price"><InputGroup><Input /><InputGroupAddon>EUR</InputGroupAddon></InputGroup></Field>
// ✓
<Field label="Price (EUR)"><InputGroup><Input /><InputGroupAddon>EUR</InputGroupAddon></InputGroup></Field>

// ✗ a Textarea, Select or NumberInput inside. The group is for Input: the
//   others draw their own box, and NumberInput already has its steppers.
<InputGroup><Select>…</Select></InputGroup>

// ✗ a button at the group's own size. It is as tall as the box and covers
//   the edge; one step down sits inside it.
<InputGroup size="md"><Input /><InputGroupAddon><Button size="md">Go</Button></InputGroupAddon></InputGroup>

// ✗ an icon that carries meaning with no name. A magnifier beside "Search"
//   is decoration; a lock that says "encrypted" is not, and needs a label.
<InputGroupAddon><Icon><Lock /></Icon></InputGroupAddon>
```
