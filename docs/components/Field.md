# Field

A labelled control with its description, its error, and the ARIA relationships
between them. Spec: [`Field.md`](../specs/Field.md).

```tsx
import { Field } from 'pixel-perfect';
```

This is the component every input composes into. If you are rendering a form
control, you almost certainly want a `Field` around it rather than a `Label`
(3.6) and some `aria-describedby` by hand.

## Usage

```tsx
<Field label="Email address" description="We only use this for receipts.">
  <Input type="email" />
</Field>

<Field label="Email address" required error={errors.email}>
  <Input type="email" />
</Field>
```

`Field` generates the ids, associates the label, points `aria-describedby` at
whichever of the description and the error actually rendered, and passes `size`,
`required`, `disabled` and the invalid state down to both the label and the
control.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | **Required** |
| `children` | `ReactNode \| (control) => ReactNode` | — | **Required.** The control, or a render prop |
| `description` | `ReactNode` | — | Instruction text, above the control |
| `error` | `ReactNode` | — | Non-empty means invalid |
| `required` | `boolean` | `false` | Marks the label **and** the control |
| `disabled` | `boolean` | `false` | Dims the label **and** disables the control |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reaches the label and the control |
| `labelHidden` | `boolean` | `false` | Hides the label; keeps it and its association |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `horizontal` is the checkbox arrangement |
| `group` | `boolean` | `false` | The control is a group, not a labelable element |
| `controlId` | `string` | from `useId()` | When the control's id has to be a known value |

Plus every `<div>` attribute. `ref` goes to the root. Exported as `FieldProps`.

There is no `invalid` prop — `error` is the state — and no `id` prop that
redirects: `id` lands on the root, like it does on every component here.

## The error is the state

```tsx
<Field label="Email address" error={errors.email}><Input /></Field>
```

`null`, `undefined`, `false` and `''` all count as valid, because
`error={errors.email}` hands you an empty string for every valid field in most
form libraries. A non-empty `error` renders the message, sets `aria-invalid` on
the control, `data-invalid` on the root, and marks the `Label`.

`Field` never decides *whether* a field is invalid. Validation is the app's job;
this component renders the answer.

## Controls read their wiring from context

`Field` does not clone its children. It publishes a context, and controls read
it:

```tsx
import { useField } from 'pixel-perfect';

function MyControl({ size: sizeProp, ...props }) {
  const field = useField();          // null outside a Field
  const size = sizeProp ?? field?.size ?? 'md';
  return <input data-size={size} {...field?.control} {...props} />;
}
```

Precedence is the same for `size`, `required` and `disabled`: **an explicit prop
beats the field, which beats the default.** Including `disabled={false}` inside
a disabled field, which does enable that control.

`field.size` is deliberately **not** part of `field.control`: spreading it onto
a native `<input>` would set the HTML `size` attribute, which is a
character-width declaration.

## The render prop, and its one limitation

For a control the library does not own, pass a function:

```tsx
<Field label="Email address">
  {(control) => <input type="email" {...control} />}
</Field>
```

**This requires the calling component to be a Client Component.** A function
cannot cross the server/client boundary, so a Server Component passing a render
prop to `Field` fails the build with *"Functions cannot be passed directly to
Client Components"*. Passing an element instead — the ordinary
`<Field label="…"><Input /></Field>` — works from anywhere, which is exactly
why the library's own controls read context rather than being handed props.

If you need a specific id, use `controlId`, not the render prop. Overriding
`id` on the control leaves the label pointing at the id `Field` generated, and
the control ends up with no accessible name:

```tsx
// ✗ silently unlabelled
<Field label="Email">{(control) => <input {...control} id="email" />}</Field>
// ✓ both sides
<Field label="Email" controlId="email">{(control) => <input {...control} />}</Field>
```

## Groups

A `role="radiogroup"` is not a labelable element, so `for` has nothing to point
at. `group` switches the wiring to `aria-labelledby`:

```tsx
<Field label="Delivery speed" group>
  <RadioGroup>…</RadioGroup>
</Field>
```

## Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-field-gap` | `--pp-space-1` | Space between the parts |
| `--pp-field-gap-inline` | `--pp-space-2` | Control-to-label space when `horizontal` |
| `--pp-field-description-color` | `--pp-color-text-muted` | Description |
| `--pp-field-error-color` | `--pp-tone-text` (danger) | Error |
| `--pp-field-font-size` | `--pp-control-font-size-<size>` | Description and error |

A horizontal field also sets `Label`'s own `--pp-label-cursor` to `pointer` on
its root, so the label beside a checkbox reads as the click target it is. It is
the field that sets it and not the control, because the label is the control's
sibling and a custom property only inherits downward ([D-045](../DECISIONS.md)).
A disabled field leaves it alone.

The description and the error are the **same type size as the label**,
distinguished by colour and weight rather than by shrinking. An error message is
the most important string in a failed form; the smallest type on the page is the
wrong place for it.

## Don't

```tsx
// ✗ two names. The control is named by the Field's label already.
<Field label="Email address"><Input aria-label="Email" /></Field>

// ✗ labelHidden is not "no label" — this has no accessible name at all.
<Field label="" labelHidden><Input /></Field>
// ✓
<Field label="Search orders" labelHidden><Input type="search" /></Field>

// ✗ a placeholder is not a label. It vanishes exactly when it is needed.
<Input placeholder="Email address" />

// ✗ Field does not style its children, and this reaches across two components.
.pp-field[data-invalid] .pp-input { border-color: red; }
// ✓ the control draws its own invalid state from its own data-invalid

// ✗ fill means fill. Constrain the form, not the field.
<Field label="Email" style={{ maxWidth: '32ch' }}><Input /></Field>
// ✓
<Container size="sm"><Stack gap="5"><Field label="Email"><Input /></Field></Stack></Container>
```

## Accessibility

- The name comes from a real `<label>`, associated by `htmlFor` — or by
  `aria-labelledby` for a `group`.
- `aria-describedby` lists only what rendered, description first, error second —
  the same order they appear on screen.
- **No live region.** The error is announced when the control is focused and by
  `Form`'s error summary (3.16) on submit. An error referenced by
  `aria-describedby` *and* placed in a live region is announced twice. The
  trade-off: an error arriving while focus is elsewhere is not announced until
  the user returns to the field.
- `aria-errormessage` is not used; `aria-describedby` is the pattern with
  universal support.
