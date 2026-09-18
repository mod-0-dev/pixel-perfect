# 3.7 `Field`

| | |
| --- | --- |
| **Tier** | 3B — Field foundation |
| **Status** | `done` — 2026-09-18 (D-036, D-037) |
| **Sizing contract** | `fill` |
| **RSC** | `client` (`useId` + context) |
| **Depends on** | 3.6 `Label`, 1.4 `VisuallyHidden` |
| **APG pattern** | None directly. [Form instructions](https://www.w3.org/WAI/tutorials/forms/instructions/) and the labelling rules each input's own pattern inherits |

The last component in Tier 3 approved on its own
([D-027](../DECISIONS.md)) — and the one D-014's carve-out was written about.
Eleven components compose into it: 3.8 `Input`, 3.9 `Textarea`, 3.10 `Checkbox`,
3.11 `Radio` / `RadioGroup`, 3.12 `Switch`, 3.13 `Select`, 3.14 `NumberInput`,
3.15 `Slider`, 3.16 `Form`, plus 4.11 `Combobox` and 4.13 `DatePicker`. Every
API mistake here is made eleven more times.

## Purpose

A labelled control with its description, its error, and the ARIA relationships
between them wired correctly — once, here, instead of eleven times by hand.

It owns four things and nothing else:

1. **Identity.** One `useId()` call, from which the control, label, description
   and error ids are derived.
2. **Association.** `htmlFor` → the control, `aria-describedby` → the
   description and the error, `aria-invalid` → the control.
3. **Propagation.** `size`, `required`, `disabled` and the invalid state reach
   the `Label` and the control without the caller wiring them twice.
4. **Arrangement.** The order of label, description, control and error, which is
   a design decision the library owns rather than a layout the caller improvises.

It deliberately does **not**: validate anything (the app's job — `Field` renders
the error it is handed and forms no opinion about where it came from); submit
anything (`Form`, 3.16); render the control (that is `children`); or manage
value state. `Field` holds no state at all, so RULES §5.5 — controlled *and*
uncontrolled — does not apply to it. Each control owns its own value.

---

## Decisions this spec asks you to approve

### 1. Configuration, not a compound API — and this bends RULES §5.6

RULES §5.6 prefers `<Card><Card.Header/></Card>` over `<Card headerTitle=… />`,
and warns that more than ~10 props probably means two components. `Field` takes
ten and is proposed as configuration anyway:

```tsx
<Field label="Email address" description="We only use this for receipts." error={errors.email}>
  <Input type="email" />
</Field>
```

rather than

```tsx
<Field>
  <Field.Label>Email address</Field.Label>
  <Field.Description>We only use this for receipts.</Field.Description>
  <Input type="email" />
  <Field.Error>{errors.email}</Field.Error>
</Field>
```

Three reasons, in order of weight:

**`aria-describedby` has to be computed, and a compound API makes it a runtime
discovery problem.** With props, `Field` knows at render whether a description
and an error exist and can build the exact token list in one pass. With
subcomponents it must either have children register themselves through context —
which means an effect, a state update and a render where the control's
`aria-describedby` is wrong — or point at ids that may not exist. Dangling
`aria-describedby` tokens are silently ignored by assistive tech, so the failure
is invisible in testing and total in use.

**The anatomy is invariant.** A field is a label, a description, a control and an
error, in that order, always. Composition earns its keep when the structure
varies; here it only buys the caller the ability to put the error above the
label, which is a design regression the library should not offer.

**The 95% case is one line.** The compound form is five lines of ceremony around
one input, repeated for every field in every form.

**This needs a DECISIONS entry (D-036)** because it is a deliberate exception to
RULES §5.6, not an oversight. `Card` (5.1) remains compound — its slots really
are optional and independent.

### 2. Context, not `cloneElement`

`Field` does not clone its children to inject props. It publishes a context, and
controls read it.

D-033 already refused cloning for `ButtonGroup`, and every reason there is
stronger here: cloning requires the control to be the direct child (it breaks
the moment anyone wraps it in a `Tooltip`, a `div`, or their own component),
it silently does nothing when the child is a fragment or an array, and it
overwrites props the caller set deliberately.

```tsx
const field = useField();          // null outside a Field
<input {...field?.control} />
```

**`useField()` is exported.** A consumer writing their own control gets the same
wiring the library's controls get. That is the difference between a component
that composes and one that only composes with itself.

### 3. `children` may be a render prop, and today it must be

```tsx
<Field label="Email address">{(control) => <input {...control} />}</Field>
```

Context requires the control to opt in. A bare `<input>`, or a third-party
control, cannot — so `children` accepts a function that receives the spreadable
props. It is the documented escape hatch for controls the library does not own.

**Corrected during the build: the render prop is client-only** (D-037 §2). A
function cannot cross the server/client boundary, so a Server Component passing
one to `Field` fails the Next.js build with "Functions cannot be passed directly
to Client Components". Passing an *element* works from anywhere, which is one
more reason controls read context rather than being handed props.

It is also the only way `Field` can be used **at all** right now: `Input` is 3.8
and does not exist yet. A `Field` that could not be demonstrated, tested or
shipped until the next component landed would be a `Field` whose API was
approved on faith.

### 4. `error` is the invalid state. There is no `invalid` prop

An `invalid` boolean alongside an `error` node creates a state the component
cannot resolve: `invalid={false} error="Required"`. So the presence of a
non-empty `error` **is** invalid — it drives `aria-invalid` on the control,
`data-invalid` on the root, and `invalid` on the `Label`.

`null`, `undefined`, `false` and `''` all count as absent, because
`error={errors.email}` with an empty string is what every form library hands you
for a valid field.

### 5. No live region. `aria-describedby` and focus carry the error

The error element gets no `role="alert"` and no `aria-live`.

An error that is both referenced by `aria-describedby` and inside a live region
is announced twice by several screen readers when it appears while the field is
focused. The cases are covered without it: focus the field and the error is read
as part of the description; submit an invalid form and `Form` (3.16) moves focus
to the first invalid field, which reads it. Announcing a *set* of errors at once
belongs to `Form`'s error summary, where it can be said once instead of six
times.

The cost is named rather than hidden: an error that appears while focus is
elsewhere — async validation on a field the user has already left — is not
announced until they return to it. If that case matters more than the double
announcement, this is the decision to overturn, and it is cheaper to overturn
now than after eleven components ship against it.

### 6. Label → description → control → error, and the description order matches

Visual order and `aria-describedby` order are the same, so a screen reader user
hears what a sighted user reads, in the same sequence.

The description sits **above** the control because it is the instruction you
need before you type, and the error sits **below** it because that is where the
thing you must fix is, and where the eye returns after a failed submit.

**The considered alternative is GOV.UK's**, which puts the error message above
the control, on evidence that screen-magnifier users miss text below the field
they are zoomed into. It is real research and this spec is deliberately not
following it: the pattern is unfamiliar enough that the error reads as belonging
to the *next* field, and `aria-invalid` plus the describedby wiring covers the
assistive-tech case. Recorded so the next person knows it was weighed.

### 7. The description and the error are the label's type size

Not one step smaller. They are distinguished by colour and weight — muted and
regular, danger and regular, against a label that is `--pp-color-text` and
medium — never by shrinking.

This is D-034 continued: form text comes from the control scale, and the control
scale deliberately has no step below `--pp-font-size-2` because a 12px form
string is a readability problem rather than a size step. An error message is the
single most important string in a failed form; setting it in the smallest type
on the page is exactly backwards.

### 8. `orientation` for the checkbox arrangement

`vertical` (default) is label above control. `horizontal` puts the control
first, on the same line as the label, with the description and error below both
— the `Checkbox` (3.10), `Radio` (3.11) and `Switch` (3.12) arrangement.

`orientation` is not new vocabulary: `ButtonGroup` already takes it and RULES §4
already lists `data-orientation` among the standard state attributes.

Without it, three components in 3C either cannot compose into `Field` — which
the roadmap requires — or `Field`'s API changes at 3.10, which is the thing this
gate exists to prevent.

### 9. `group` for `RadioGroup`, and the label stays a `<label>`

A `role="radiogroup"` is not a labelable element, so `htmlFor` has nothing to
point at. `group` switches the wiring: no `htmlFor`, and the context hands the
control `aria-labelledby` pointing at the label instead.

The label element itself does not change — it is still `<Label>`, still a
`<label>`, just without a `for`. That is valid HTML (`for` is optional) and a
perfectly good `aria-labelledby` target, since the name is computed from its
text content.

**`<fieldset>` / `<legend>` was rejected.** It is the textbook markup and it is
a layout trap: `legend` resists `display`, `flex` and grid placement
inconsistently across browsers, and adopting it would give `Field` two different
DOM shapes and two stylesheets for one component. The ARIA route is equivalent
in the accessibility tree and is one shape.

**Verified at build:** axe raises nothing for a `<label>` with no `for`, in the
group field's own test. The `<span>` fallback was not needed.

### 10. No `id` prop

RULES §5.3 spreads remaining props onto the root, so an `id` passed to `Field`
lands on the root `<div>` like it does on every other component in the library.
It does **not** secretly become the control's id — a prop that lands somewhere
other than where it says is worse than no prop.

`Field` owns the control's id, from `useId()` (RULES §7).

**Corrected during the build (D-037 §1).** This section originally said a caller
needing a specific id should override it through the render prop:

```tsx
// ✗ overrides the id the control receives, but NOT the `for` on the label
//   Field already rendered. The label points at nothing, and the control has no
//   accessible name — silently.
<Field label="Email">{(control) => <input {...control} id="email" />}</Field>
```

That does not work, and a test now asserts the failure exists rather than
pretending it does not. `Field` takes **`controlId`**, which wires both sides:

```tsx
<Field label="Email" controlId="email">{(control) => <input {...control} />}</Field>
```

It is `controlId` and not `id` for the reason this section gives above.

### 11. Explicit prop > field context > default

For `size`, `required` and `disabled`, a control's own prop always wins over the
`Field`'s. One rule, applied identically to all three, in every control in 3C
and 3D:

```tsx
const size = sizeProp ?? field?.size ?? 'md';
```

Including `disabled={false}` inside a disabled `Field`, which does enable that
control. "Explicit wins" is a rule you can hold in your head; "explicit wins
except for disabled" is one you have to look up.

---

## Sizing contract justification

`fill`. Block-level, no width declaration, `min-inline-size: 0`.

A field occupies the column its parent gives it, and its control fills the field
— that chain is what makes a form line up without a single width declaration
anywhere in it. `hug` would size the field to its longest label, which is how
forms end up with inputs of six different widths.

Constraining a form's measure is `Container`'s job, one level up, exactly as
RULES §1 requires.

---

## Anatomy

**Vertical** (default):

```
<div class="pp-field" data-size data-orientation="vertical" [data-invalid] [data-disabled] [data-required]>
  ├── <label class="pp-label pp-field__label" for="…">        ← <Label>, or wrapped in VisuallyHidden
  ├── <p class="pp-field__description" id="…-description">
  ├── <div class="pp-field__control">                          ← children
  └── <p class="pp-field__error" id="…-error" data-pp-tone="danger">
```

**Horizontal** — the control moves first in the DOM, not only in the layout, so
reading order matches visual order:

```
<div class="pp-field" data-orientation="horizontal">
  ├── <div class="pp-field__control">      ← column 1, row 1
  ├── <label class="pp-label pp-field__label">   ← column 2, row 1
  ├── <p class="pp-field__description">    ← column 2, row 2
  └── <p class="pp-field__error">          ← column 2, row 3
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-field` | `<div>` | Grid. Carries every `data-*` and the ref |
| Label | `pp-label pp-field__label` | `<Label>` | Two classes, as `Toggle` carries `pp-button pp-toggle`. `Label` owns the type; `Field` owns the placement |
| Description | `pp-field__description` | `<p>` | Rendered only when `description` is set |
| Control slot | `pp-field__control` | `<div>` | Always rendered. Gives the control one grid cell in both orientations |
| Error | `pp-field__error` | `<p>` | Rendered only when `error` is non-empty. `data-pp-tone="danger"` (D-007) |

The description and the error render their own `<p>` rather than composing
`Text`, for the same reason `Label` does not: `Text`'s four-step scale is not
the control scale (D-034), and two size vocabularies on one node is how a form
stops lining up.

---

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | **Required.** A field with no label is what this component exists to prevent |
| `children` | `ReactNode \| (control: FieldControlProps) => ReactNode` | — | **Required.** The control, or a render prop receiving the wiring (§3) |
| `description` | `ReactNode` | — | Instruction text, above the control |
| `error` | `ReactNode` | — | Non-empty means invalid (§4) |
| `required` | `boolean` | `false` | Marks the `Label` **and** sets `required` on the control |
| `disabled` | `boolean` | `false` | Dims the `Label` **and** disables the control |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reaches the `Label` and the control (§11) |
| `labelHidden` | `boolean` | `false` | Wraps the `Label` in `VisuallyHidden`. Still present, still associated |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `horizontal` is the checkbox arrangement (§8) |
| `group` | `boolean` | `false` | The control is a group, not a labelable element (§9) |
| `controlId` | `string` | from `useId()` | When the control's id must be a known value (§10) |

Plus every `<div>` attribute. `ref` goes to the root. Exported as `FieldProps`.

**Deliberately absent:** `invalid` (§4), `id` (§10), `labelPosition` (a label
beside the control at wide containers is a form-level layout decision, and
belongs to a future `Form` layout prop or to the parent, not to every field),
`hint` (it is `description`), `success` (a field that is merely valid needs no
message), `optional` (mark what is required), `name` / `value` / `onChange`
(the control's, not the field's).

### The control contract

```ts
export interface FieldControlProps {
  id?: string;                     // single control; absent when `group`
  'aria-labelledby'?: string;      // group only
  'aria-describedby'?: string;     // description and/or error, in that order
  'aria-invalid'?: true;
  required?: boolean;
  disabled?: boolean;
}

export interface FieldContextValue {
  /** Spread onto the control element. */
  control: FieldControlProps;
  size: Size;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

export function useField(): FieldContextValue | null;
```

`size` is **not** in `control`, and that is load-bearing: spreading it onto a
native `<input>` would set the HTML `size` attribute, which is a character-width
declaration — a component sizing itself, in the one place RULES §1 would never
think to look. Controls read `field.size` and map it themselves.

`useField()` returns `null` outside a `Field`, so every control works standalone.

---

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid | `data-invalid` on the root, `aria-invalid` on the control | Error message shown; the control draws its own invalid border |
| Disabled | `data-disabled` on the root, `disabled` on the control | `Label` dims; the control draws its own disabled state |
| Required | `data-required` on the root, `required` on the control | `Label` renders its indicator |
| Orientation | `data-orientation` | Grid placement |

`Field` does not restyle its children. The control's invalid and disabled
appearance belongs to the control — `Field` propagates the state and stays out
of the way, because `.pp-field[data-invalid] .pp-input` is precisely the
cross-component selector `--pp-label-cursor` was invented to avoid.

---

## Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-field-gap` | `--pp-space-1` | Space between label, description, control and error |
| `--pp-field-gap-inline` | `--pp-space-2` | Space between control and label when `horizontal` |
| `--pp-field-description-color` | `--pp-color-text-muted` | Description |
| `--pp-field-error-color` | `--pp-tone-text` under `data-pp-tone="danger"` | Error |
| `--pp-field-font-size` | `--pp-control-font-size-<size>` | Description and error (§7) |

---

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves to and from the **control**. `Field` itself is never a tab stop |

`Field` handles no keys and adds no focus behaviour. Clicking the label focuses
the control, which is the `<label>` element doing its job (3.6), not this
component doing anything.

**Manual walkthrough to record at review:** Tab into a field and confirm one
stop, on the control; click the label and confirm focus lands on the control;
with a screen reader, confirm the control announces name, then description, then
error, in that order and once each.

---

## Accessibility notes

- **The name comes from a real `<label>`**, associated by `htmlFor` — or, for a
  `group`, by `aria-labelledby` (§9).
- **`aria-describedby` is built from what actually rendered.** Description then
  error; either, both, or the attribute is absent entirely. A token pointing at
  an element that does not exist is ignored silently, which is why this is
  computed rather than assembled optimistically.
- **`aria-errormessage` is not used.** `aria-describedby` is the pattern with
  universal support; `aria-errormessage` is still inconsistently implemented and
  would move the error out of the description in the readers that do support it,
  splitting one message across two behaviours.
- **`labelHidden` hides, never removes.** It wraps the `Label` in
  `VisuallyHidden` (1.4). The label element, its `for`, and the accessible name
  are all still there — which is the entire difference between a hidden label
  and a missing one.
- **`required` reaches the control**, so assistive tech hears "required" from the
  control while the asterisk stays `aria-hidden` on the label (3.6 §2).
- Contrast: the description is `--pp-color-text-muted` and the error is the
  danger tone's text colour, both verified at the token layer in both themes
  (D-008).
- axe runs over: a plain field, a field with a description, an invalid field, a
  disabled field, a `labelHidden` field and a `group` field.

---

## Container behavior

None. No `@container` rule. A field is a column that fills what it is given, and
its parts wrap as text wraps.

The obvious candidate — moving the label beside the control in a wide container
— is deliberately not here. Whether a form is stacked or two-column is a
decision about the *form*, taken once, not a decision each field should make
independently by measuring itself; fields that each decide for themselves is how
one form ends up with two layouts in it.

---

## Usage

```tsx
// The common case.
<Field label="Email address" description="We only use this for receipts.">
  <Input type="email" />
</Field>

// Required and invalid. One prop marks the label and the control; the error
// node is both the message and the state.
<Field label="Email address" required error={errors.email}>
  <Input type="email" />
</Field>

// Before Input exists, or for a control the library does not own.
<Field label="Email address">
  {(control) => <input type="email" {...control} />}
</Field>

// A checkbox: the control comes first, the description sits under both.
<Field label="Email me about new releases" orientation="horizontal" description="About once a month.">
  <Checkbox />
</Field>

// A group: no htmlFor, aria-labelledby instead.
<Field label="Delivery speed" group>
  <RadioGroup>
    <Radio value="standard">Standard</Radio>
    <Radio value="express">Express</Radio>
  </RadioGroup>
</Field>

// A search field with a visible placeholder and no visible label.
<Field label="Search orders" labelHidden>
  <Input type="search" placeholder="Search orders" />
</Field>

// A form is a Stack of Fields in a Container. Field sizes nothing.
<Container size="sm">
  <Stack gap="5">
    <Field label="Name"><Input /></Field>
    <Field label="Email address" required><Input type="email" /></Field>
  </Stack>
</Container>
```

---

## Don't

```tsx
// ✗ two sources of truth for one state, and the component cannot resolve them.
<Field label="Email" invalid={false} error="Required" />
// ✓ the error IS the state
<Field label="Email" error={submitted ? errors.email : undefined}><Input /></Field>

// ✗ a second label. The control gets its name from the Field's label, and two
//   names is a form-field-multiple-labels violation.
<Field label="Email address"><Input aria-label="Email" /></Field>
// ✓
<Field label="Email address"><Input /></Field>

// ✗ labelHidden is not "no label". This one has no accessible name at all.
<Field label="" labelHidden><Input /></Field>
// ✓ hidden, present, associated
<Field label="Search orders" labelHidden><Input type="search" /></Field>

// ✗ a placeholder is not a label. It disappears exactly when the user needs it.
<Input placeholder="Email address" />
// ✓
<Field label="Email address"><Input type="email" placeholder="you@example.com" /></Field>

// ✗ Field does not style its children, and this is the cross-component
//   selector the whole library is arranged to avoid.
.pp-field[data-invalid] .pp-input { border-color: red; }
// ✓ the control draws its own invalid state from its own data-invalid

// ✗ fill means fill. Constrain the form, not the field.
<Field label="Email" style={{ maxWidth: '32ch' }}><Input /></Field>
// ✓
<Container size="sm"><Field label="Email"><Input /></Field></Container>
```

---

## Open questions

None blocking. Two are deliberately deferred to the components that will answer
them with evidence:

1. **Whether `Form` (3.16) needs `Field` to expose its error id.** An error
   summary that links to each field wants the control's id, which `useField()`
   already provides to anything inside the field — but `Form` is outside it. The
   likely answer is that `Form` collects ids from its own registration rather
   than `Field` publishing them upward, and that is 3.16's decision to make.
2. **Whether `Slider` (3.15) and `NumberInput` (3.14) need `group`.** Both are
   single labelable elements today, but a range `Slider` is two thumbs and may
   want the group wiring. Deferred to 3D; `group` already exists by then.
