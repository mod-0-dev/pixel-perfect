# 3.6 `Label`

| | |
| --- | --- |
| **Tier** | 3B — Field foundation |
| **Status** | `spec` |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 1.1 `Text` — typography, not composition (§6) |
| **APG pattern** | None. HTML's [labelable element](https://html.spec.whatwg.org/multipage/forms.html#category-label) association is the contract |

Approved individually, not as a group: `Label` and `Field` are the two
components D-014's carve-out was narrowed to in
[D-027](../DECISIONS.md#d-027--tier-3-is-approved-in-four-groups-d-014s-carve-out-narrows-to-field).

## Purpose

The visible name of a form control, associated with it by `htmlFor`.

It is the smallest component in Tier 3 and the one with the most callers: every
input in 3C reaches it through `Field` (3.7), which is the only component
expected to render it directly. Its job is to look like a label, to sit on the
control scale so a `size="sm"` field's label matches its `size="sm"` input, and
to mark a required field without lying to a screen reader.

It deliberately does **not**: generate IDs (`Field` owns `useId`, §7); render a
description, a hint or an error message (all `Field`); validate anything;
carry a `tone`; or describe non-form text — a caption over a chart is `Text`,
not a `Label`, because a `<label>` pointing at nothing is markup that claims a
relationship the page does not have.

---

## Decisions this spec asks you to approve

### 1. `Label` scales off `--pp-control-font-size-*`, not the `Text` scale

`Text` has four size steps (`xs sm md lg`, D-016 §1); controls have three
(`sm md lg`, D-028). A label sits directly above or beside a control, and the
thing it must agree with is the control, not the prose. So `size` maps to
`--pp-control-font-size-<size>` — the same token the `Input` beneath it will
read.

**The visible consequence: `sm` and `md` labels are the same font size**,
because `--pp-control-font-size-sm` and `-md` are both `--pp-font-size-2` by
design ("a 12px control label is a readability problem, not a size step").
A small field gets smaller by losing height and padding; its label does not
shrink, because a label you have to squint at is not a smaller label, it is a
worse one.

This extends D-028's argument from height to type, and is the first component
to do so. **If approved it wants a DECISIONS entry (D-034)**, because every
component in 3C and 3D will follow it.

### 2. The required indicator is a real element, `aria-hidden`, and the control carries the semantic

```html
<span class="pp-label__required" aria-hidden="true">*</span>
```

Three options were live:

| Option | Rejected because |
| --- | --- |
| `::after { content: "*" }` | Pseudo-element content is announced by some screen readers and not others, and cannot be reliably hidden. A glyph that is sometimes read as "star" is worse than either outcome chosen deliberately |
| `<VisuallyHidden>(required)</VisuallyHidden>` | `Field` sets `required` on the control, so the control already announces "required". This makes it announce twice |
| **A real span, `aria-hidden`** | **Chosen.** The glyph is a visual reinforcement of a state the control already exposes to assistive tech |

The indicator is separated from the text by `padding-inline-start:
var(--pp-label-gap)` on the span, **not by a space character** — deliberately,
for two reasons. Non-zero `margin` is banned (D-018) and padding is the
compliant way to say this; and with no whitespace text node between the label
text and the span there is no break opportunity, so a wrapping label can never
orphan its asterisk onto a line of its own.

### 3. `required` on `Label` is presentational and cannot be otherwise

`Label` has no control to mark. It renders the glyph and sets `data-required`;
the real `required` / `aria-required` belongs on the input, and `Field` sets
both from one prop. A caller using `Label` standalone must set `required` on
their own input — an asterisk over an optional field is a documented "don't"
(below) rather than something the component can prevent.

Rejected: a dev-mode warning when `required` is set and no `htmlFor` is given.
A `<label>` that wraps its control is legitimate HTML and is indistinguishable
from a broken one at render time.

### 4. `invalid` exposes `data-invalid` and ships no visual change

The prop exists because `Field` needs to propagate the state and RULES §4 says
state travels on `data-*` attributes rather than through a private class. What
it does **not** do is turn the label red.

A field in error already has a red border, a red error message and
`aria-invalid` on the control. A red label is the fourth shout, and it is the
one that is pure colour — it fails WCAG 1.4.1 on its own terms, the same
argument that made `underline="always"` the default for `Link` (D-030 §7).
Consumers who want it write `.pp-label[data-invalid] { --pp-label-color: … }`,
which is exactly what the attribute is for.

### 5. `Label` declares no `cursor`; it exposes `--pp-label-cursor`

For a text input, the label is a block above the field and a pointer cursor
over the whole row overstates where the affordance is. For a checkbox, the
label genuinely is a click target and the pointer is correct.

Rather than pick one and be wrong half the time, or reach across component
boundaries with `.pp-checkbox .pp-label`, `Label` declares
`cursor: var(--pp-label-cursor, inherit)` — inert by default, and `Checkbox`,
`Radio` and `Switch` set `--pp-label-cursor: pointer` on their own roots. Custom
properties inherit, so this is the same mechanism as the tone context (D-007),
and it is a cross-component agreement with no cross-component selector.

### 6. `Label` does not compose `Text`, and the 1.1 dependency is typographic

The roadmap lists 1.1 as a dependency. `Link` (3.3) has the same dependency and
also does not import `Text` — the dependency means the typography agrees, not
that one component wraps the other.

Wrapping `Text` here would put two class names and two size vocabularies on one
node (`data-size="md"` meaning `--pp-font-size-3` to `Text` and
`--pp-control-font-size-md` to `Label`), and would inherit
`overflow-wrap: anywhere`, which mid-word-breaks a label the user needs to read.
`Label` is ~25 lines of CSS that owns its own type.

### 7. No `asChild`

Every other Tier 3A component that renders a single element took `asChild`.
`Label` does not. The root must be a `<label>`: the browser's click-to-focus,
the accessible name computation and `htmlFor` are properties of that element and
of no other. `asChild` here is a prop whose only function is to silently delete
the component's reason to exist.

---

## Sizing contract justification

`fill`. Block-level, no width declaration, `min-inline-size: 0`.

A label is a line of text in a vertical stack with a control that also fills; a
`hug` label in a `Stack` would still occupy the column, so `hug` would buy
nothing and would break the one place `fill` is load-bearing — text wrapping. In
a `Cluster` (the checkbox row) a block-level child shrinks to its content under
flex layout, so the contract costs nothing there either.

The consequence worth knowing: a `fill` label spans the row, and clicking
anywhere on that row — including the empty space to the right of the text —
focuses the associated control. That is correct for a field and is why
`Checkbox` will place its label in a row beside the box rather than let it span.

---

## Anatomy

```
<label class="pp-label" for="…" data-size [data-required] [data-disabled] [data-invalid]>
  ├── children                                  ← the label text
  └── <span class="pp-label__required" aria-hidden="true">*</span>   ← only when required
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-label` | `<label>` | Carries `htmlFor`, every `data-*`, and the ref. Always a `<label>` (§7) |
| Required indicator | `pp-label__required` | `<span>` | Rendered only when `required`. `aria-hidden="true"`, glued to the text by padding (§2) |

Two nodes, one of them conditional. There is no `pp-label__text` wrapper:
children are text, and a wrapper would exist only to be styled by someone who
should be styling the root.

---

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | **Required by the type.** A label with no content names nothing |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `--pp-control-font-size-<size>`. `sm` and `md` are the same size on purpose (§1) |
| `required` | `boolean` | `false` | Renders the indicator, sets `data-required`. Presentational (§3) |
| `disabled` | `boolean` | `false` | Sets `data-disabled` and the disabled text colour. No `aria-disabled` |
| `invalid` | `boolean` | `false` | Sets `data-invalid`. No default visual treatment (§4) |
| `htmlFor` | `string` | — | Native React prop, passed through. `Field` supplies it from `useId()` |

Plus every `<label>` attribute. `ref` goes to the root `<label>`. Exported as
`LabelProps`.

**Deliberately absent:** `tone` and `variant` (a label has one colour role;
see the "don't"), `weight` (fixed at `medium` — it is a label, it is not a
heading, and `--pp-label-font-weight` is the override), `align`, `asChild`
(§7), `optional` (mark what is required, not what is not), `hidden` / `srOnly`
(open question 1), `description` / `hint` / `error` (all `Field`).

---

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Required | `data-required` + `pp-label__required` | `*` after the text, `--pp-label-required-color` |
| Disabled | `data-disabled` | `--pp-color-text-disabled` |
| Invalid | `data-invalid` | None by default (§4) |
| Hover / focus | — | None. A `<label>` is not an interactive element and gets no focus ring of its own |

`disabled` is visual only — a `<label>` has no `disabled` attribute and no ARIA
one worth setting. The real state is on the control, and because a disabled
control cannot receive focus, clicking a disabled label already does nothing.

---

## Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-label-color` | `--pp-color-text`, or `--pp-color-text-disabled` when `data-disabled` | Text colour |
| `--pp-label-font-size` | `--pp-control-font-size-<size>` | Type size |
| `--pp-label-font-weight` | `--pp-font-weight-medium` | Weight |
| `--pp-label-line-height` | `--pp-line-height-normal` | Leading |
| `--pp-label-gap` | `--pp-space-1` | Space before the required indicator (§2) |
| `--pp-label-required-color` | `--pp-color-text` | The indicator glyph |
| `--pp-label-cursor` | `inherit` | Cursor, for controls that make the row clickable (§5) |

`--pp-label-required-color` defaults to the text colour rather than to danger.
The asterisk's job is to be noticed, and its shape does that; making it the
error colour spends the error colour on a field that is merely required and
conflates "you must fill this in" with "you filled this in wrong". Teams whose
design language wants a red asterisk set one property, and
`data-pp-tone="danger"` is available on the span if they want it tone-aware.

Per D-024 none of these is written inline by the component: props set `data-*`
attributes, and the stylesheet reads the public property first, so an override
on an ancestor still wins.

---

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Skips the label entirely. A `<label>` is not focusable and never takes a tab stop |

No other keys, and none implemented. Clicking or tapping the label moves focus
to the associated control — user-agent behaviour that we get by rendering a real
`<label>` with a real `for`, and that we would lose by rendering anything else.

The APG has no Label pattern; labels appear inside the form patterns, which
require the accessible name to come from a `<label>` element where one is
possible. That is the whole of the compliance surface here.

**Manual walkthrough to record at review:** Tab through a label/input pair and
confirm exactly one stop; click the label text and confirm focus lands in the
input; click the empty space to the right of the label and confirm the same;
disable the control and confirm clicking the label does nothing.

---

## Accessibility notes

- **The name comes from the element, not from an attribute.** A `<label for>`
  gives the control an accessible name that is also a click target and survives
  translation tooling. `aria-label` does neither.
- **Explicit over implicit.** `Field` always renders `htmlFor` + `id`; it never
  wraps the control in the label. Wrapping works in browsers but breaks the
  moment the control is not a direct child, and it makes `data-*` state
  propagation a tree walk instead of a prop.
- **`required` announces once** (§2): the glyph is `aria-hidden`, the control
  carries `required`.
- **`invalid` announces on the control** — `aria-invalid` plus
  `aria-describedby` pointing at the error message, both `Field`'s wiring. The
  label is not part of that relationship.
- **Contrast.** `--pp-color-text` on page and surface backgrounds is verified at
  the token layer in both themes (D-008); `Label` adds no new pairing. Disabled
  label text uses `--pp-color-text-disabled`, which is exempt from WCAG 1.4.3 as
  an inactive control — noted so the exemption is a decision and not an oversight.
- **axe** runs over a label/input pair, a required label, and a disabled one.

---

## Container behavior

None. No `@container` rule, no truncation, no `nowrap`. A long label wraps to as
many lines as it needs, in a sidebar as on a full-width page.

This is the opposite of `Button`, which sets `white-space: nowrap` because a
button label that needs wrapping needs to be shorter. A form label often cannot
be shorter without becoming wrong, and a label the user cannot read in full is a
field they cannot fill in correctly. Truncation is never applied to a label.

---

## Usage

```tsx
// Standalone: the caller owns the id and the control's own `required`.
<Stack gap="1">
  <Label htmlFor="email" required>Email address</Label>
  <input id="email" type="email" required />
</Stack>

// Through Field (3.7) — the normal case. Field owns useId and passes
// size / required / invalid down to the Label it renders.
<Field label="Email address" required description="We only use this for receipts.">
  <Input type="email" />
</Field>

// A small, dense form: the label rides the control scale, not the text scale.
<Label htmlFor="port" size="sm">Port</Label>

// A checkbox row: the label sits beside the control, and Checkbox sets
// --pp-label-cursor: pointer on its own root.
<Cluster gap="2" align="center">
  <input id="terms" type="checkbox" />
  <Label htmlFor="terms">I accept the terms</Label>
</Cluster>
```

---

## Don't

```tsx
// ✗ the asterisk is the component's job, and a typed one is not aria-hidden —
//   a screen reader reads "Email address star".
<Label htmlFor="email">Email address *</Label>
// ✓
<Label htmlFor="email" required>Email address</Label>

// ✗ required on the label and nothing on the input: the asterisk is then a
//   claim the form does not enforce and assistive tech never hears (§3).
<Label htmlFor="email" required>Email address</Label>
<input id="email" />
// ✓ let Field set both from one prop
<Field label="Email address" required><Input type="email" /></Field>

// ✗ a label is not a tone surface. Error state is the control's border and the
//   error message; a red label is colour-only signalling (§4).
<Label tone="danger">Email address</Label>

// ✗ a label that names nothing. If it is not naming a control, it is Text.
<Label>Shipping details</Label>
// ✓
<Heading level={2} size="sm">Shipping details</Heading>

// ✗ fill means fill. There is no width prop and no fullWidth.
<Label style={{ maxWidth: '20ch' }}>Email address</Label>
// ✓ the parent constrains
<Container size="xs"><Label htmlFor="email">Email address</Label></Container>

// ✗ asChild would delete the <label> and with it click-to-focus and the
//   accessible name (§7). It is not a prop.
<Label asChild><span>Email</span></Label>
```

---

## Open questions

Both are questions **for `Field`'s spec**, raised here because `Label`'s API is
what would have to change if they are answered differently.

1. **Visually hidden labels.** A search input or a table-row control often needs
   a label that is present for assistive tech and absent on screen.
   Recommendation: `Field` gets `labelHidden`, implemented by wrapping the
   `Label` in `VisuallyHidden` (1.4) — **not** a `Label` prop. A label that can
   hide itself is a label that gets hidden by accident, and the hiding is a
   layout decision, which makes it the parent's.

2. **Where `size` lives.** Recommendation: both accept it, `Field` passes it
   down to `Label` and to the control, and a standalone `Label` defaults to
   `md`. The alternative — size only on `Field` — leaves a bare `Label` with no
   way to match a `sm` control beside it.
