# Tier 3C — Native Inputs

| | |
| --- | --- |
| **Tier** | 3C |
| **Status** | **approved** 2026-09-18 — Gate C passed, five open questions resolved (see §13) |
| **Components** | 3.8 `Input` · 3.9 `Textarea` · 3.10 `Checkbox` · 3.11 `Radio`/`RadioGroup` · 3.12 `Switch` · 3.13 `Select` |
| **Depends on** | 3.7 `Field` (`done`), 3.6 `Label` (`done`), Tier 3A (`done`), Tiers 0–2 (`done`) |
| **Approval** | One gate for the group ([D-027](../DECISIONS.md#d-027)) |
| **APG patterns** | [Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (consulted for `Select`, deliberately not adopted — §5, §9) |

### Progress

| Component | Status | Component | Status |
| --- | --- | --- | --- |
| 3.8 `Input` | **`done`** | 3.11 `Radio`/`RadioGroup` | `spec` |
| 3.9 `Textarea` | **`done`** | 3.12 `Switch` | `spec` |
| 3.10 `Checkbox` | **`done`** | 3.13 `Select` | `spec` |

---

`Field` (3.7) already owns the hard part. It generates the ids, associates the
label, computes `aria-describedby` from what actually rendered, and publishes
`size`, `required`, `disabled` and the invalid state through `useField()`. These
six components are what plugs into it.

That makes this group narrower than it looks. The question is not "how do we
build a checkbox" — it is **"what does a control owe the field it sits in, and
what does it owe the caller who used it standalone?"** Every one of these six
has to work both ways: inside a `Field`, taking its wiring from context, and on
its own in a table cell or a toolbar with no field anywhere above it.

They are specified together because the answers have to be identical across all
six. A `Checkbox` that reads `field.size` and a `Select` that ignores it is the
exact failure D-014 says group review exists to catch, and there is no version
of that bug a consuming app notices before it ships.

**Three of the six are also the library's first custom-painted controls.** A
checkbox, a radio and a switch have no native appearance worth keeping, and
repainting them is where component libraries usually reach for a hidden input
and a `<div role="checkbox">`. §6 says why this one does not.

---

## Decisions this batch asks you to approve

Sections 1–12 are rulings or open choices. Everything from §3.8 onward is the
per-component template.

### 1. No shared control-surface class. Three stylesheets read one token set.

`Input`, `Textarea` and `Select` all paint the same thing: a bordered box with
`--pp-control-height-*`, `--pp-control-padding-inline-*`, `--pp-control-radius`,
a `--pp-color-border` edge and a `--pp-color-bg-surface` fill. The obvious move
is one `.pp-control` class in `_shared/`, inherited by all three.

**Proposal: don't. Each component declares its own surface, reading the same
`--pp-control-*` tokens.**

The agreement is already structural. D-028 built `--pp-control-*` precisely so
that "a Button, an Input and a Select must be the SAME height at `size="md"` or
every form in every consuming app is a pixel crooked" — and it made that true by
putting the number in one place. A shared class would put the *declarations* in
one place too, which is a second mechanism doing a job the first one already
does, and it buys the thing tokens already bought.

It also would not survive contact. The three surfaces are not actually the same:
`Textarea` has no `block-size` at all (it grows), `Select` reserves
`padding-inline-end` for its indicator and `Input` reserves nothing. A shared
class ends up as a base plus three override blocks, which is more CSS than three
independent blocks and harder to read, because understanding `Select` now
requires reading two files.

And the class name has nowhere to live. RULES §3 fixes class names at
`pp-<component>__<part>`; `.pp-control` is neither. `_shared/layout.css` is not
a precedent for this — D-020 put the `gap` scale there because it maps an
**attribute** (`[data-pp-gap="4"]`) to a value, which is a lookup table, not a
component's appearance.

**Rejected alternative:** a `pp-control` base class. Revisit only if a fourth
and fifth text-surface control appear and the blocks are still identical, which
`NumberInput` (3.14) will test within the tier.

### 2. Text controls pass state straight to the DOM. Checkable controls use `useControllableState`.

RULES §5.5 is absolute: "Stateful components support **controlled and
uncontrolled** use: `value` / `defaultValue` / `onValueChange` … Both, always.
No exceptions." Read naively, all six get `useControllableState` (D-032).

**Proposal: `Input`, `Textarea` and `Select` pass `value`, `defaultValue` and
`onChange` straight through to the DOM element and use no hook at all.**

This is not an exception to §5.5 — it is the fullest possible compliance with
it. React's own DOM inputs already implement exactly the contract D-032 wrote
down: `value !== undefined` is controlled, `defaultValue` seeds uncontrolled,
and the change event fires either way. Interposing our hook would reimplement
React's implementation of React's behaviour, and it would do it worse in one
visible way: `useControllableState`'s callback takes a *value* (`(v: T) => void`)
while a text input's `onChange` takes an *event*. A library whose `Input` calls
back with a bare string cannot be handed to `react-hook-form`'s `register()`,
cannot read `event.target.validity`, and surprises every developer who has ever
used an input.

So `Input`'s `onChange` is `React.ChangeEventHandler<HTMLInputElement>` — the
native one, unwrapped, inherited from `ComponentPropsWithoutRef<'input'>`.

**The checkable three are different and do use the hook.** `Checkbox`, `Switch`
and `RadioGroup` need the current state *during render*, because RULES §4
requires it on the DOM as `data-state` and because the indicator is painted from
it. A native checkbox's checkedness is not available to the render that has to
describe it. So:

| Component | Controlled | Uncontrolled | Callback |
| --- | --- | --- | --- |
| `Checkbox` | `checked` | `defaultChecked` | `onCheckedChange(checked: boolean \| 'indeterminate')` |
| `Switch` | `checked` | `defaultChecked` | `onCheckedChange(checked: boolean)` |
| `RadioGroup` | `value` | `defaultValue` | `onValueChange(value: string)` |

`checked` / `defaultChecked` / `onCheckedChange` follows `Toggle`'s
`pressed` / `defaultPressed` / `onPressedChange` exactly (D-032), and the
`checked` wording tracks `aria-checked` the way D-030 §5 requires — which is the
line that keeps `Toggle` and `Switch` distinguishable in the DOM.

**The native `onChange` still fires too**, on all three, because they are still
native inputs and a caller may legitimately want the event. `onCheckedChange` is
additional, not a replacement.

### 3. The controls take an `invalid` prop. `Field` still does not.

[D-036](../DECISIONS.md#d-036) ruled that `Field` has **no** `invalid` prop:
`error` is the invalid state, and a second prop could only contradict it.

That reasoning does not reach the controls, because a control has no `error`.
`<Input invalid />` in a table cell, with no `Field` and no message anywhere, is
a real and common thing, and without the prop there is no way to express it.
`Label` already settled this shape in 3B — it takes `invalid`, and `Field` sets
it.

So every control in 3C takes `invalid?: boolean`, resolved by the group's one
precedence rule:

```ts
const invalid = invalidProp ?? field?.invalid ?? false;
```

**The rule is the same for all four shared values, and it is stated once:**

```ts
const size     = sizeProp     ?? field?.size     ?? 'md';
const required = requiredProp ?? field?.required ?? false;
const disabled = disabledProp ?? field?.disabled ?? false;
const invalid  = invalidProp  ?? field?.invalid  ?? false;
```

Explicit prop, then the field, then the default — including `disabled={false}`
inside a disabled `Field`, which does enable that control. `Field`'s own
documentation already promises this: "explicit wins" is a rule you can hold in
your head; "explicit wins except for disabled" is one you have to look up.

### 4. Invalid is a tone context, not a colour — and it is `--pp-tone-focus`'s reserved job

An invalid control sets `data-pp-tone="danger"` on its root and reads
`--pp-tone-border` for the edge. It declares no red anywhere. This is D-007's
mechanism, and it is what `Field`'s error `<p>` already does.

The consequence worth approving explicitly: **this is the first planned use of
`--pp-tone-focus`.** [D-029](../DECISIONS.md#d-029) ruled the focus *ring* is one
colour library-wide, `--pp-color-focus-ring`, and then reserved the tone token
for exactly this:

> `--pp-tone-focus` keeps a job — the tone-shifted **border** on a focused form
> control in 3B/3C, which is inside the control where the ring is outside it.

So a focused control draws two things: the ring, in the one library colour,
outside the box; and its own border shifts to `--pp-tone-focus`, inside it. On a
valid control the tone is `neutral` and the shift is subtle; on an invalid one
the tone is `danger` and the border stays red while focused, instead of the
error state disappearing the moment the user goes to fix it.

**This does not weaken D-029.** The ring is still one colour and still the only
pairing `lint:contrast` asserts. The border is a border, it is not the focus
affordance, and `check-contrast.mjs` gains no assertion — the same reasoning
D-023 gave for `--pp-color-shadow-edge` carrying no contrast obligation.

### 5. `RadioGroup` does **not** implement roving tabindex. The browser already did.

`ROADMAP.md` has said "Roving tabindex" in 3.11's Notes column since Tier 0.
**Proposal: overturn it.**

A set of `<input type="radio">` elements sharing a `name` attribute already
implements the APG Radio Group pattern, in every browser, with no JavaScript:
Tab enters the group at the checked radio and leaves it entirely, arrow keys
move *and* select, and the group is one tab stop. That is the pattern, complete,
including the parts people forget (Home/End, wrapping, and arrow keys skipping
disabled members).

Writing our own roving tabindex means taking that away — every radio gets
`tabIndex={-1}` except one, and a keydown handler re-implements selection — and
then reimplementing it. It is RULES §8's argument ("a year of a11y bugs that
were fixed upstream") arriving a tier before Tier 4 and pointing at the browser
rather than at Radix.

**This is also the D-030 §7 ruling a second time.** `ButtonGroup` consulted the
Toolbar pattern's roving tabindex and declined it, because roving is right for a
dense toolbar and wrong for three attached controls. Here roving is not merely
wrong, it is already present and we would be replacing it with a copy.

**Two consequences, both load-bearing:**

1. **`RadioGroup` generates a `name` when it is not given one**, from `useId()`.
   Grouping *is* the `name` attribute — two `RadioGroup`s on one page with no
   name are one radio group, and selecting in one clears the other. Silent, and
   exactly the kind of thing that ships. A unit test asserts two groups are
   independent by default.
2. **`Radio` may be used outside a `RadioGroup`**, but then the caller owns
   `name`. Documented as the "don't" on `Radio`'s page.

**One mismatch to know about before someone "fixes" it.** APG specifies
Left/Right for a horizontal radio group and Up/Down for a vertical one. Native
radios respond to **all four** arrows regardless of visual orientation, which is
a superset of the pattern rather than a deviation from it — so
`orientation="horizontal"` ships no keyboard code and no divergence note. The
next person to read the APG page will notice the difference; this paragraph is
why it stays.

`RadioGroup` renders `role="radiogroup"` and `Field`'s `group` prop wires
`aria-labelledby` to the label — the path `Field` shipped for precisely this
component.

### 6. The native input **is** the painted control. No hidden input, no `role="checkbox"`.

The standard way to style a checkbox is to hide the real input and paint a
`<span>` beside it, or to abandon the input entirely for a
`<div role="checkbox" tabindex="0">` with a keydown handler.

**Proposal: neither. `appearance: none` on the real input, and style it.**

The input stays in the DOM, stays focusable, stays in the form, stays keyboard
operable, keeps `:checked`, `:indeterminate` and `:disabled`, keeps
label-click-to-toggle, keeps Space, keeps form reset, keeps autofill, and keeps
the accessibility tree correct without a single ARIA attribute. Every one of
those is something the `role="checkbox"` version has to rebuild and will rebuild
incompletely.

**The indicator is a sibling, not a pseudo-element.** `<input>` is a void
element, so `::before` / `::after` on it are unreliable across engines — and the
mark has to be painted in a *different colour* from the box it sits in, which a
single element cannot do:

```
<span class="pp-checkbox">            ← root, hug, the grid
  ├── <input class="pp-checkbox__input" type="checkbox">   ← the box, focusable
  └── <span class="pp-checkbox__indicator" aria-hidden>    ← the mark, on top
```

Both children occupy the same grid cell. The indicator is `aria-hidden` and
`pointer-events: none`, so it is invisible to assistive technology and
transparent to the pointer: every click lands on the real input underneath.
`Radio` and `Switch` are the same three nodes with different geometry.

### 7. The mark is an inline `Icon`, not a CSS asset

The indicator needs a checkmark, a dash, a dot and a chevron. **The indicator is
a `<span>`, so it takes children** — only the `<input>` is void — which means the
mark is simply an SVG in the markup:

```tsx
<Icon className="pp-checkbox__indicator" decorative>
  <path d="…" />
</Icon>
```

`Icon` (1.3) already ships `1em` sizing, `currentColor`, and the
`label` / `decorative` discriminant that makes a nameless icon a type error.
The colour comes from `color: var(--pp-tone-on-solid)` on the indicator — a
token, so the mark inverts per theme and per tone with no further work.

**Three CSS-side approaches were considered and all three lose to it:**

| Approach | Why not |
| --- | --- |
| `background-image` with an SVG data URI | The stroke colour is baked into the URI: a hardcoded colour in component CSS (RULES §3) that no theme can reach |
| `mask-image` with a colourless data URI | Works, and costs a new lint rule that parses inside a data URI for `fill=`, `stroke=` and `#`, plus the exemption to go with it. A URL-encoded `%3Csvg…` blob also cannot be read in a diff |
| CSS-drawn (rotated box, two borders) | No asset, but the checkmark needs a width, a height, a rotation and two border widths tuned by eye — more magic numbers than the thing it avoids, and it looks mediocre at 16px |

The only thing any of them buys is about sixty bytes of markup per control. That
does not pay for a lint rule, an exemption, and an unreadable stylesheet — and
the SVG path is the mechanism every other icon in this library already uses.

`Radio`'s dot and `Switch`'s thumb need no SVG at all: they are filled boxes at
`border-radius: var(--pp-radius-full)`.

### 8. The checkable controls are 16 / 20 / 24, and the spacing exception is why

A checkbox is not 40px tall. `--pp-control-height-*` is the wrong token here,
and the checkable three take their own square from the size scale:

| `size` | Box | Token |
| --- | --- | --- |
| `sm` | 16px | `--pp-size-4` |
| `md` | 20px | `--pp-size-5` |
| `lg` | 24px | `--pp-size-6` |

`Switch` is a `2:1` track at the same block sizes, so a `md` switch is 40×20 and
lines up with a `md` checkbox beside it.

**Two of the three are smaller than WCAG 2.2 SC 2.5.8's 24×24 minimum, and they
pass on the spacing exception** — undersized targets are conforming if a 24px
diameter circle centred on each does not intersect the circle of another. Against
the real tokens, at `RadioGroup`'s default `gap="3"` (`--pp-space-3`, 12px):

| `size` | Box | Centre to centre | 24px circles |
| --- | --- | --- | --- |
| `sm` | 16px | 28px | clear |
| `md` | 20px | 32px | clear |
| `lg` | 24px | 36px | meets the minimum outright |

**This is why `RadioGroup`'s `gap` defaults to `"3"` and not `"2"`.** At `"2"`
(8px) a column of `sm` radios puts centres exactly 24px apart — tangent circles,
which touch at a point, which is an argument with an auditor rather than a pass.
`"3"` is the floor that makes the exception hold, and it is asserted in a test
rather than eyeballed.

The associated label enlarges the real target further, because a `<label for>`
accepts the pointer action for its control in every browser — but that is now a
second line of defence rather than the argument. A bare, unlabelled `<Checkbox />`
in a dense custom layout is still the caller's 2.5.8 problem, and that is the
"don't" on the component's page.

**Rejected:** inflating the box to 24px at every size, which makes `sm`
meaningless and puts a comically large checkbox next to `sm` text.

### 9. `Select` is the native element, indicator and all

Per the roadmap: native `<select>`, with the custom listbox deferred to
`Combobox` (4.11). `appearance: none` for the surface, one wrapper for the
chevron (§6's structure, with `pp-select__indicator`), and
`padding-inline-end` reserved so a long option never runs under the chevron.

The native popup is kept, which means it is the platform's on every platform —
a wheel on iOS, a listbox on desktop — and it is correct on all of them in a way
no Tier 3 component could be. `multiple` is **not supported**: a multi-select
list is a different control with a different keyboard model, and it is 4.11's.
Passing `multiple` is a type error.

`Select` takes its options as `children` (`<option>`, `<optgroup>`), not an
`options={[…]}` prop. RULES §5.6, and it is the only form that lets a caller
render an `<optgroup>` or a disabled option without us inventing a schema.

### 10. `Textarea`'s auto-resize is JavaScript, and `rows` is its floor

`autoResize` is opt-in (roadmap). Implemented by measuring `scrollHeight` on
input and writing `block-size`, floored at the `rows` attribute so the field
never collapses below its declared size.

**CSS `field-sizing: content` is deliberately not used**, even where it is
supported. Shipping both means two different resize behaviours depending on the
browser, and the one that is easier to test is the one that is not running for
the user. One mechanism, one behaviour, revisit when support is ubiquitous and
the JS can be deleted outright rather than kept as a fallback.

Writing `block-size` from JS is a component sizing itself on the block axis,
which RULES §1 governs on the *inline* axis only — a `fill` component has no
opinion about its height, and `Skeleton` already sets `block-size` from `lines`
(D-025). No exemption needed; noted so it is not read as one.

### 11. `ref` goes to the control. `className` goes to the root.

RULES §5.1 says forward `ref` to the root element and §5.3 says spread the
remaining props onto it. For the three components with a wrapper — `Checkbox`,
`Radio`, `Switch`, and `Select` — the root is a decorative `<span>`, and a
literal reading gives the caller a ref to a span and spreads `placeholder` onto
it.

**The principle: the root is the box, the control is the element.** Anything
describing appearance goes to the box; anything functional goes to the element.
For `Input` and `Textarea` the two are the same node and this collapses to
RULES §5 unchanged.

**Concretely, for every component in this group:**

- **`ref` → the control element** (`<input>`, `<textarea>`, `<select>`). A ref to
  a form control is used to focus it, read `.value`, call `.setCustomValidity()`
  and hand to `react-hook-form`. A ref to the wrapper does none of those.
- **remaining props → the control element.** They are `placeholder`,
  `autoComplete`, `onBlur`, `name`, `aria-*`. Every one belongs on the input.
- **`className` and `style` → the root**, merged, never replaced. Styling is
  about the box the caller sees, and for `Switch` that box is the wrapper.

**This applies to all six.** `Input` and `Textarea` were specified as
single-element components and are not: a form control does not fill without a
grid root (§3.8, D-040), so every component in this group has a wrapper and every
one of them splits the props the same way. That is the better outcome for
consistency — there is no per-component rule to remember.

The props type stays `ComponentPropsWithoutRef<'input'>`, so the split is
invisible to the caller: they see input props and they get input props. The
divergence is in where the wrapper's `className` lands and nowhere else.

This is a deliberate divergence from RULES §5.1/§5.3 and is recorded as
[D-039](../DECISIONS.md#d-039). The alternative — a `wrapperProps` escape hatch
— was rejected as the beginning of `inputProps`, `labelProps` and
`indicatorProps`, which is the configuration sprawl RULES §5.6 exists to stop.

### 12. Every one of these renders an id, so every playground page splits in two

[D-035 §1](../DECISIONS.md#d-035) found that `Matrix` renders its subtree six
times, so an `id` inside it exists six times and `for` binds to whichever copy
comes first — five of six labels then name a control in another cell.

All six components here render ids, whether directly or through the `Field`
around them. D-035's list names `Field`, `Input`, `Checkbox`, `Radio`, `Switch`
and `Select` — it omits `Textarea`, which is an omission in the list and not an
exemption. **Every playground page in this group demonstrates appearance inside
the `Matrix` and association outside it, once**, and each page's browser
assertion checks a real accessible name on the outside-the-matrix example.

---

## 3.8 `Input`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `client` — `useField()` reads context |
| **Depends on** | 3.7 `Field` |

### Purpose

A single-line text control on the shared control surface, wired to whatever
`Field` is above it. It is one element and it stays one element.

**What it deliberately does not do.** No `prefix` / `suffix` / `addon` slots: an
`<input>` is a void element, so an addon needs a wrapper, and a wrapper needs a
layout, and that is a different component with a different sizing story. No
`type="number"` handling — locale, step buttons and clamping are `NumberInput`
(3.14). No clear button, no character counter, no debounce.

### Sizing contract justification

`fill`, and **it takes two elements to get there** — a finding from building it,
not a preference (D-040).

RULES §1 says "a block element with no width declaration already fills its
parent, and does so correctly in every layout context." That is true of a `<div>`
and **false of a form control**, which carries an intrinsic inline size from the
HTML `size` attribute. Measured inside a 600px parent:

| | `display: block` | grid item | flex item |
| --- | --- | --- | --- |
| `<input>` | **185px** | 600px | 185px |
| `<textarea>` | **182px** | 600px | — |
| `<select>` | **52px** | 600px | — |
| `<p>` (control) | 600px | 600px | — |

So the root is a `<span>` that is `display: grid`, and the control stretches into
its single cell. **No width is declared anywhere** — the rule is satisfied rather
than bent, and the layout does the job RULES §1 assigns to the parent. Flexbox is
not an alternative: a flex item does not stretch on the main axis without
`flex-grow`, and it measured the same 185px.

`min-inline-size: 0` on the control is the other half, so a long value shrinks
the control instead of pushing the container wide.

The HTML `size` attribute is never set, and it is absent from the props type
entirely — the same hazard `FieldContextValue.size` is kept out of the spreadable
control props for.

### Anatomy

```
<span class="pp-input" data-size data-invalid? data-disabled? data-readonly? data-pp-tone?>
  └── <input class="pp-input__control">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-input` | `<span>` | `display: grid`, one cell. Carries the state attributes and the tone context. `className` and `style` land here (§11) |
| Control | `pp-input__control` | `<input>` | The surface. Focusable, the `ref` target, the prop target |

**State is declared on the root, never on a descendant selector.** Written as
`.pp-input[data-invalid] .pp-input__control` the invalid rule is 0-3-0 and
outranks `.pp-input__control:focus-visible` at 0-2-0, so focus would never shift
the border on an invalid control — half of §4 silently undone. Declared on the
root the custom property inherits down, and the control's own `:focus-visible`
declaration wins for that element. Inheritance, not a specificity race (D-040).

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale (D-028/D-034) |
| `invalid` | `boolean` | field, then `false` | Sets `data-pp-tone="danger"` and `aria-invalid` (§3) |
| `disabled` | `boolean` | field, then `false` | Native attribute |
| `required` | `boolean` | field, then `false` | Native attribute |
| `type` | `Exclude<HTMLInputTypeAttribute, 'checkbox' \| 'radio' \| 'button' \| 'submit' \| 'reset' \| 'image' \| 'range' \| 'file' \| 'hidden'>` | `'text'` | Passthrough, not an invented prop (D-030 §3). Every excluded value is another component — `Checkbox`, `Radio`, `Button`, `Slider` (3.15), `FileUpload` (5.10) — or, for `hidden`, no component at all |
| `value` / `defaultValue` / `onChange` | native | — | Straight to the DOM (§2) |
| …rest | `ComponentPropsWithoutRef<'input'>` | — | `placeholder`, `autoComplete`, `name`, `onBlur`, `aria-*` |

`ref` → `HTMLInputElement`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid | `data-invalid`, `data-pp-tone="danger"`, `aria-invalid` | Border → `--pp-tone-border` |
| Disabled | `data-disabled`, `disabled` | Fill → `--pp-color-bg-sunken`, text → `--pp-color-text-disabled`, `cursor: not-allowed` |
| Required | `required` | No visual treatment — the `Label` carries the glyph |
| Focus | `:focus-visible` | Ring outside (`--pp-color-focus-ring`), border → `--pp-tone-focus` inside (§4) |
| Read-only | `data-readonly`, `readonly` | Fill → `--pp-color-bg-sunken`, border unchanged |
| Placeholder shown | `::placeholder` | `--pp-color-text-muted`, which carries a 4.5:1 guarantee |

### Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-input-height` | `--pp-control-height-<size>` | Block size |
| `--pp-input-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding |
| `--pp-input-radius` | `--pp-control-radius` | Corners |
| `--pp-input-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-input-border-color` | `--pp-color-border` | Edge |
| `--pp-input-color` | `--pp-color-text` | Text |

Written per D-024: the stylesheet reads the public property first, falling back
to a private `--_*`, so an ancestor override still wins.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab / Shift+Tab | Moves focus in and out |
| Any character | Native |
| Home / End / arrows | Native caret movement |

No APG pattern applies — a text field's keyboard model is the platform's, and
the component adds no handler. Nothing is intercepted, so IME composition,
autofill and password managers all behave.

### Accessibility notes

The accessible name comes from `Field`'s `<label for>`. Standalone, the caller
supplies `aria-label` or their own label. `aria-describedby` arrives through
`field.control` and points only at elements that rendered (D-036).

`aria-invalid` is set from the resolved `invalid`, not from `error` being a
string, so a standalone invalid input announces correctly with no message.

### Container behavior

No `@container` rules. It fills; the `Field` and the layout primitive above it
decide how much.

### Usage

```tsx
<Field label="Email address" description="We only use this to sign you in.">
  <Input type="email" autoComplete="email" />
</Field>
```

### Don't

```tsx
// ✗ A placeholder is not a label. It disappears on the first keystroke,
//   fails 1.4.3 at most placeholder colours, and leaves the field unnamed.
<Input placeholder="Email address" />

// ✓
<Field label="Email address"><Input placeholder="you@example.com" /></Field>

// ✗ `size` is the prop, never the HTML attribute — that one counts characters
//   and is a control sizing itself (RULES §1).
<Input size={40} />

// ✗ type="number" is allowed, and is still usually the wrong tool. It mutates
//   its value on a scroll wheel over a focused field, rejects a locale decimal
//   comma, and reports value === '' for anything it cannot parse — so `1,5`
//   typed in a German locale is silently lost.
<Input type="number" />

// ✓ until NumberInput (3.14), which will be type="text" for these reasons
<Input inputMode="numeric" pattern="[0-9]*" />
```

---

## 3.9 `Textarea`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `client` — `useField()`, and `autoResize` needs an effect |
| **Depends on** | 3.7 `Field` |

### Purpose

A multi-line text control on the same surface as `Input`, with opt-in
auto-resize. Not a rich-text editor and not a code editor (5.12 is `CodeBlock`,
and it is read-only).

### Sizing contract justification

`fill`, inline axis, exactly as `Input` — **including the grid root**, because a
block `<textarea>` measured 182px inside a 600px parent for the same reason an
`<input>` measured 185px (§3.8, D-040).

`rows` **is** kept and exposed, because the block axis is not what RULES §1
governs (§10). `Skeleton`'s `lines` is the precedent.

### Anatomy

```
<span class="pp-textarea" data-size data-auto-resize? …>
  └── <textarea class="pp-textarea__control">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-textarea` | `<span>` | `display: grid`, as `Input` |
| Control | `pp-textarea__control` | `<textarea>` | The surface, the `ref` and prop target |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | Font size and padding only — no `block-size` |
| `rows` | `number` | `3` | Native. The floor for `autoResize` |
| `autoResize` | `boolean` | `false` | Grows with content, never shrinks below `rows` (§10) |
| `resize` | `'none' \| 'vertical'` | `'vertical'` | Maps to `resize`. No `horizontal`: a user-widened textarea overflows the `Field` grid |
| `invalid` / `disabled` / `required` | `boolean` | field, then `false` | As `Input` |
| …rest | `ComponentPropsWithoutRef<'textarea'>` | — | |

`ref` → `HTMLTextAreaElement`. With `autoResize` the component keeps its own
internal ref and merges.

### State

As `Input`, plus:

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Auto-resizing | `data-auto-resize` | `resize: none` is forced — a manual handle and a JS height fight each other |

### Styling API

`--pp-textarea-padding-block`, `--pp-textarea-padding-inline`,
`--pp-textarea-radius`, `--pp-textarea-bg`, `--pp-textarea-border-color`,
`--pp-textarea-color`, `--pp-textarea-min-block-size`.

No `--pp-textarea-height`: the height is `rows`, content, or the caller's.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | **Moves focus out.** Does not insert a tab character |
| Enter | Newline |
| Everything else | Native |

Tab is called out because a textarea is the one place developers are tempted to
trap it, and trapping Tab strands every keyboard user in the field.

### Accessibility notes

As `Input`. Auto-resize changes the element's height during typing, which is a
visual change and not a content change — no live region, nothing announced.

### Container behavior

None. Auto-resize responds to content, and re-measures on `resize` of the
element via `ResizeObserver` so a container width change reflows correctly.

### Usage

```tsx
<Field label="Release notes" description="Markdown is supported.">
  <Textarea rows={6} autoResize />
</Field>
```

### Don't

```tsx
// ✗ resize: horizontal breaks out of the Field's grid column and takes the
//   layout with it. There is no `horizontal` value for that reason.
<Textarea style={{ resize: 'horizontal' }} />

// ✗ autoResize with rows={1} is a control that jumps a line the moment
//   anyone types. rows is the floor, so give it a real one.
<Textarea autoResize rows={1} />
```

---

## 3.10 `Checkbox`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` — state, and `indeterminate` is a DOM property set in an effect |
| **Depends on** | 3.7 `Field` |
| **APG** | [Checkbox (tri-state)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) |

### Purpose

A binary or tri-state checkbox, painted by us and operated by the browser (§6).
It renders no label of its own — that is `Field`'s job, and a `Checkbox` with a
`label` prop would be a second, worse `Field`.

### Sizing contract justification

`hug`, and square. A checkbox is intrinsically sized like `Icon` and `Spinner`
(D-019) — its inline size is a restatement of its block size, not a decision
about the parent. **This extends the D-019 `inline-size` exemption to three more
files** (`Checkbox`, `Radio`, `Switch`), as D-031 extended it to `IconButton`:
all `hug`, all intrinsically sized, all explicit in `.stylelintrc.json` rather
than routed around with `aspect-ratio`.

`Switch` is the one that is not square, and it is exempted on the same grounds —
a 2:1 track is as intrinsic as a 1:1 box.

### Anatomy

```
<span class="pp-checkbox" data-size data-state data-invalid? data-disabled?>
  ├── <input class="pp-checkbox__input" type="checkbox">     ← the box
  └── <span class="pp-icon pp-checkbox__indicator" aria-hidden>  ← <Icon decorative>
        └── <svg><path/></svg>                                   check or dash
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-checkbox` | `<span>` | Grid, one cell, both children stacked. `className` lands here (§11) |
| Input | `pp-checkbox__input` | `<input type="checkbox">` | `appearance: none`, painted as the box. `ref` and rest props land here (§11) |
| Indicator | `pp-checkbox__indicator` | `<Icon decorative>` | `aria-hidden` via `decorative`, `pointer-events: none`, holds the check or dash path (§7) |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean \| 'indeterminate'` | — | Controlled |
| `defaultChecked` | `boolean \| 'indeterminate'` | `false` | Uncontrolled |
| `onCheckedChange` | `(checked: boolean \| 'indeterminate') => void` | — | Fires in both modes (D-032) |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | 16 / 20 / 24 (§8) |
| `invalid` / `disabled` / `required` | `boolean` | field, then `false` | |
| …rest | `ComponentPropsWithoutRef<'input'>` minus `type`, `checked`, `defaultChecked`, `onChange` conflicts | — | `type` is removed from the type **and** from what is forwarded (D-031) |

`ref` → `HTMLInputElement`.

**Indeterminate never comes from user action.** Clicking an indeterminate
checkbox produces `true`, never `'indeterminate'`; only the caller can set it.
That matches the platform and the "select all" case it exists for.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Checked | `data-state="checked"` | Box fills `--pp-tone-solid`, the indicator draws the check (§7) |
| Unchecked | `data-state="unchecked"` | Box is `--pp-color-bg-surface` with a `--pp-color-border` edge; no indicator is rendered |
| Indeterminate | `data-state="indeterminate"` | Box fills, the indicator draws the dash |
| Disabled | `data-disabled` | `--pp-color-bg-sunken`, `--pp-color-text-disabled`, `cursor: not-allowed` |
| Invalid | `data-invalid`, `data-pp-tone="danger"` | Border → `--pp-tone-border` |
| Focus | `:focus-visible` on the input | Ring on the input, which is the painted box |

`checked` / `unchecked` / `indeterminate` is the RULES §4 vocabulary, tracking
`aria-checked` — the boundary D-030 §5 drew against `Toggle`'s `on` / `off`.

### Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-checkbox-size` | `--pp-size-4/5/6` | The square |
| `--pp-checkbox-radius` | `--pp-radius-1` | Corners — a checkbox is squarer than a control |
| `--pp-checkbox-bg` | `--pp-color-bg-surface` | Unchecked fill |
| `--pp-checkbox-border-color` | `--pp-color-border` | Edge |
| `--pp-checkbox-mark-color` | `--pp-tone-on-solid` | The mark — set as `color`, which the SVG reads as `currentColor` |

The checked fill is `--pp-tone-solid` and has no property of its own: set the
tone, or set `--pp-checkbox-bg` inside a `[data-state="checked"]` scope of your
own. (A `--pp-checkbox-bg-checked` was listed here at the gate and never built;
removed rather than left as a promise the stylesheet does not keep.)

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | Moves focus to the checkbox |
| Space | Toggles |
| Enter | **Nothing** — native, and deliberate: Enter submits the form |

APG's tri-state note says Space cycles through all three states. **We diverge:
Space toggles checked/unchecked only.** Indeterminate is a summary of other
checkboxes, not a value a user picks, and letting a user select it produces a
"select all" control claiming a state its children contradict. Recorded per
RULES §6.

### Accessibility notes

The native input carries the role and `aria-checked` — including `mixed`, which
the browser derives from the `indeterminate` DOM property. That property is set
in an effect against the input ref, because it exists only in the DOM and has no
attribute.

The indicator is `aria-hidden` and `pointer-events: none`, so the accessibility
tree sees one checkbox and the pointer only ever hits the input.

### Container behavior

None. It hugs at every width.

### Usage

```tsx
<Field label="Email me about releases" orientation="horizontal">
  <Checkbox defaultChecked />
</Field>
```

### Don't

```tsx
// ✗ No `label` prop. A checkbox with its own label is a second Field, and a
//   worse one — it owns no description, no error and no aria-describedby.
<Checkbox label="Email me about releases" />

// ✗ Standalone and unlabelled is a 20px target with no accessible name:
//   WCAG 2.5.8 and 4.1.2 in one line. Pass `aria-label`, or use a Field (§8, §13.2).
<Checkbox />
```

---

## 3.11 `Radio` / `RadioGroup`

| | |
| --- | --- |
| **Sizing contract** | `Radio`: `hug` · `RadioGroup`: `fill` |
| **RSC** | `client` — both |
| **Depends on** | 3.7 `Field` |
| **APG** | [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) — provided natively (§5) |

### Purpose

One choice from a visible set. `RadioGroup` owns the `name`, the value and the
grouping semantics; `Radio` is one option, painted like `Checkbox` with a round
box and a dot.

### Sizing contract justification

`Radio` is `hug` and square, on §3.10's exemption. `RadioGroup` is `fill`: it is
a layout of its children and occupies the field's inline space. It composes
`Stack` internally rather than declaring flow of its own (D-021 — layout
primitives size the boxes they create).

### Anatomy

```
<div class="pp-radio-group" role="radiogroup" data-orientation>
  └── (children, laid out by an internal Stack or Cluster)

<span class="pp-radio" data-size data-state …>
  ├── <input class="pp-radio__input" type="radio">
  └── <span class="pp-radio__indicator" aria-hidden />
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Group root | `pp-radio-group` | `<div role="radiogroup">` | Named by `Field`'s label via `aria-labelledby` (`group` prop) |
| Radio root | `pp-radio` | `<span>` | |
| Radio input | `pp-radio__input` | `<input type="radio">` | `appearance: none`, round |
| Radio indicator | `pp-radio__indicator` | `<span>` | The dot — a filled circle at `--pp-radius-full`, no SVG needed (§7) |

### Props — `RadioGroup`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled |
| `defaultValue` | `string` | `undefined` | Uncontrolled — nothing selected |
| `onValueChange` | `(value: string) => void` | — | |
| `name` | `string` | `useId()` | **Generated when omitted** (§5). Grouping *is* the name |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `data-orientation`; horizontal wraps |
| `gap` | `Space` | `'3'` | Passed to the internal layout primitive (D-020). **Not `'2'`** — `'3'` is the floor that keeps `sm` radios clear of WCAG 2.5.8's spacing exception (§8) |
| `size` / `disabled` / `required` / `invalid` | | field, then default | Published to every `Radio` through the group's own context |

### Props — `Radio`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | **required** | The value this option contributes |
| `size` / `disabled` / `invalid` | | group, then field, then default | Three levels, same precedence rule |
| …rest | `ComponentPropsWithoutRef<'input'>` minus `type` | — | |

`ref` → `HTMLInputElement` on `Radio`, `HTMLDivElement` on `RadioGroup` (it has
no single control, so the root is the only meaningful target).

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Checked | `data-state="checked"` | Border → `--pp-tone-solid`, dot visible |
| Unchecked | `data-state="unchecked"` | `--pp-color-border` edge, dot scaled to 0 |
| Disabled | `data-disabled` | As `Checkbox` |
| Invalid | `data-invalid` on the group and every radio | Border → `--pp-tone-border` |

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | Enters the group at the checked radio, or the first if none is checked; **one tab stop** |
| Arrow Down / Right | Next radio, and selects it |
| Arrow Up / Left | Previous radio, and selects it |
| Space | Selects the focused radio |

**All of this is native.** The component adds no keydown handler — §5 is the
whole ruling. The table is what the browser does for inputs sharing a `name`,
and it is recorded here so the DoD's "keyboard walkthrough" box has something to
check against.

Arrow keys also wrap at both ends and skip disabled radios, natively.

### Accessibility notes

`role="radiogroup"` on the root, named by `Field`'s label through
`aria-labelledby` — the exact path `Field`'s `group` prop exists for.

`required` goes on **every** radio in the group, not just the first: HTML's
constraint validation treats the group as satisfied if any radio with that name
is checked, and browsers differ on whether an unmarked radio counts.

### Container behavior

`RadioGroup` at `orientation="horizontal"` wraps via the internal `Cluster`.
No `@container` query — wrapping needs none, which is the same finding Tier 2
recorded for `Cluster`.

### Usage

```tsx
<Field label="Deployment target" group>
  <RadioGroup defaultValue="preview">
    <Field label="Preview" orientation="horizontal">
      <Radio value="preview" />
    </Field>
    <Field label="Production" orientation="horizontal">
      <Radio value="production" />
    </Field>
  </RadioGroup>
</Field>
```

### Don't

```tsx
// ✗ Two groups with no name are ONE group: selecting in either clears the
//   other. RadioGroup generates a name, so this only bites bare Radios.
<Radio value="a" /><Radio value="b" />

// ✗ Don't rebuild the keyboard. Arrow keys already move and select; a
//   handler here fights the browser and loses on the edge cases (§5).
<RadioGroup onKeyDown={rovingTabIndexHandler} />
```

---

## 3.12 `Switch`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` |
| **Depends on** | 3.7 `Field` |
| **APG** | [Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) |

### Purpose

An on/off control whose effect is **immediate**. That is the entire boundary
against `Checkbox`: a checkbox states a value that a submit button applies, a
switch does the thing when you flip it. If there is a Save button, it is a
checkbox.

And it is not `Toggle` (3.5), which is `aria-pressed` — a button that stays
pressed. D-030 §5 drew that line in the DOM: `Toggle` reports
`data-state="on|off"` and `Switch` reports `checked|unchecked`, tracking
`aria-pressed` and `aria-checked` respectively.

### Sizing contract justification

`hug`, on §3.10's exemption, and the one member of the group that is not square:
a 2:1 track at the checkable block sizes, so `md` is 40×20 and aligns with a
`md` checkbox in the same form.

### Anatomy

```
<span class="pp-switch" data-size data-state data-disabled?>
  ├── <input class="pp-switch__input" type="checkbox" role="switch">
  └── <span class="pp-switch__thumb" aria-hidden />
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-switch` | `<span>` | The track's containing block |
| Input | `pp-switch__input` | `<input type="checkbox" role="switch">` | `appearance: none`, painted as the track |
| Thumb | `pp-switch__thumb` | `<span>` | `aria-hidden`, `pointer-events: none`, translated on state |

`role="switch"` on a native checkbox is the APG-recommended construction: the
native semantics and keyboard stay, the announced role becomes "switch".

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` / `defaultChecked` | `boolean` | `false` | No `'indeterminate'` — a switch is binary |
| `onCheckedChange` | `(checked: boolean) => void` | — | |
| `size` / `disabled` / `required` / `invalid` | | field, then default | |
| …rest | `ComponentPropsWithoutRef<'input'>` minus `type`, `role` | — | |

`ref` → `HTMLInputElement`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Checked | `data-state="checked"` | Track → `--pp-tone-solid`, thumb at the end |
| Unchecked | `data-state="unchecked"` | Track → `--pp-color-border-strong`, thumb at the start |
| Disabled | `data-disabled` | `--pp-color-bg-sunken` track, `cursor: not-allowed` |
| Focus | `:focus-visible` | Ring on the input, which is the track |

The unchecked track is `--pp-color-border-strong` and not `--pp-color-bg-sunken`:
an off switch has to read as *off* rather than as *disabled*, and a sunken fill
next to a genuinely disabled switch is indistinguishable from it.

### Styling API

`--pp-switch-track-inline-size`, `--pp-switch-track-block-size`,
`--pp-switch-track-bg`, `--pp-switch-track-bg-checked`, `--pp-switch-thumb-bg`,
`--pp-switch-thumb-inset`.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | Moves focus |
| Space | Toggles |
| Enter | Nothing — native |

APG lists Enter as optional for switches. **Not implemented**, for D-030 §3's
reason: a switch lives in a form, and Enter in a form submits it. Recorded as a
deliberate divergence.

### Motion

The thumb transitions on `translate` over `--pp-duration-fast`, and the whole
transition is dropped under `prefers-reduced-motion: reduce` — declared in
`pp.components`, because the reset's crush sits in `pp.reset` and this file
would otherwise win (the mechanism `Button.css` and `Spinner` both document).

### Accessibility notes

`role="switch"` makes `aria-checked` announce as on/off. No `aria-label` is
generated: the name comes from `Field`, and a switch with no label is as broken
as a checkbox with none.

### Container behavior

None.

### Usage

```tsx
<Field
  label="Ship on merge"
  description="Deploys to production as soon as a PR lands."
  orientation="horizontal"
>
  <Switch onCheckedChange={setShipOnMerge} />
</Field>
```

### Don't

```tsx
// ✗ A switch inside a form with a Save button is a checkbox. The user
//   flips it, nothing happens, and they have no way to know why.
<form>
  <Switch /> <Button type="submit">Save</Button>
</form>

// ✗ Not Toggle. Toggle is aria-pressed — a button that stays down.
//   Switch is aria-checked — a setting that is on.
<Switch>Bold</Switch>
```

---

## 3.13 `Select`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `client` |
| **Depends on** | 3.7 `Field` |

### Purpose

The native `<select>` on the shared control surface, with our chevron. It is the
whole of single-select for this library until `Combobox` (4.11) — which is a
different control with typeahead, async options and a custom listbox, and is
built on the overlay foundation rather than on this.

### Sizing contract justification

`fill`, like `Input`, and the wrapper the chevron needs is the same grid root the
fill contract needs anyway. A native `<select>` intrinsically sizes to its
longest option and is the worst of the three: **52px** as a block element inside
a 600px parent, against 600px as a grid item (§3.8, D-040).

### Anatomy

```
<span class="pp-select" data-size data-invalid? data-disabled?>
  ├── <select class="pp-select__input">…</select>
  └── <span class="pp-icon pp-select__indicator" aria-hidden>  ← <Icon decorative>
        └── <svg><path/></svg>                                   chevron
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-select` | `<span>` | `display: grid`, one cell. `className` lands here |
| Input | `pp-select__input` | `<select>` | `appearance: none`, the surface, the ref and prop target |
| Indicator | `pp-select__indicator` | `<Icon decorative>` | The chevron path, `pointer-events: none` so the click opens the popup |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | |
| `value` / `defaultValue` / `onChange` | native | — | Straight to the DOM (§2) |
| `placeholder` | `string` | — | Renders a disabled, hidden, selected-by-default `<option value="">` |
| `invalid` / `disabled` / `required` | `boolean` | field, then `false` | |
| `multiple` | **`never`** | — | A type error (§9). Multi-select is 4.11 |
| `children` | `ReactNode` | — | `<option>` / `<optgroup>` |

`ref` → `HTMLSelectElement`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid / disabled / focus / required | As `Input` | |
| Placeholder selected | `data-placeholder` | Text → `--pp-color-text-muted`, matching `::placeholder` on `Input` |

There is no `data-state="open"`. The native popup's openness is not observable
from script, and inventing an attribute that is wrong half the time is worse
than not having one.

### Styling API

`--pp-select-height`, `--pp-select-padding-inline`, `--pp-select-radius`,
`--pp-select-bg`, `--pp-select-border-color`, `--pp-select-color`,
`--pp-select-indicator-color`.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | Moves focus |
| Space / Enter / Alt+Down | Opens the platform popup |
| Arrows | Moves through options (in the popup, or in place on some platforms) |
| Typeahead | Native |

Entirely the platform's. The APG Combobox pattern was consulted and **not
adopted**: implementing it means replacing the native popup, which is the one
part of this control that is already correct on a phone, with a screen reader,
and in a right-to-left locale.

### Accessibility notes

Named by `Field`. The chevron is `aria-hidden` and never in the tree. Because
the popup is the platform's, there is nothing for us to get wrong about focus
return, dismissal or option announcement — which is the argument for shipping
this before `Combobox`, not after.

### Container behavior

None. `text-overflow: ellipsis` on the select keeps a long option from pushing
the box wide in a narrow container — the fill contract's `min-inline-size: 0`
does the rest.

### Usage

```tsx
<Field label="Environment">
  <Select defaultValue="preview">
    <option value="preview">Preview</option>
    <option value="production">Production</option>
  </Select>
</Field>
```

### Don't

```tsx
// ✗ No options prop. An array cannot express an optgroup, a disabled
//   option or a data-* attribute without us inventing a schema (RULES §5.6).
<Select options={[{ label: 'Preview', value: 'preview' }]} />

// ✗ multiple is a type error. A multi-select has a different keyboard model
//   and a different visual; it is Combobox (4.11).
<Select multiple />
```

---

## Implementation order

One at a time (Gate A). The order is chosen so each component's hardest new
thing is the only new thing in it:

| # | Component | What it introduces |
| --- | --- | --- |
| 1 | `Input` | The control surface, the four-value precedence rule, the tone-shifted focus border (§4). Everything after it copies this |
| 2 | `Textarea` | Only auto-resize is new |
| 3 | `Checkbox` | The wrapper/input/indicator structure (§6), the `Icon` indicator (§7), the `inline-size` exemption (§8), `useControllableState` |
| 4 | `Radio`/`RadioGroup` | Only the group: `name` generation and the three-level precedence |
| 5 | `Switch` | Checkbox's structure with a thumb and a transition |
| 6 | `Select` | The wrapper again, plus the platform popup |

`Input` first is the load-bearing choice. If the surface is wrong, it is wrong
in one file rather than three.

## RSC

All six are `'use client'`, and all six genuinely need it: `useField()` is a
context read. That is worth stating because `Label` (3.6) is `server` and sits
inches away in the same form — the line is context, not "form thing".

`lint:rules` decides the directive by walking the AST for hook identifiers
(D-035), so `useField` is detected and the directive is enforced rather than
remembered.

## Testing notes

Beyond the Definition of Done's standing requirements:

- **Every claim about what a screen reader perceives is asserted in the
  browser**, not in jsdom. D-030 §2 is the standing reason: a `visibility:
  hidden` label passed `toHaveAccessibleName` in jsdom and was announced as
  nothing in a real browser. The indicator's `aria-hidden` and the input's
  computed role belong in `tests/visual/harness.spec.ts`.
- **Every browser check proves the break reached the served CSS first**
  (D-037 §4). `npm run build` is `build:js && build:css`, so a type error leaves
  `dist/pixel-perfect.css` stale and a break-it check silently verifies nothing.
  `curl` the stylesheet the page links and grep it — and grep the *served* file,
  since Next.js minifies and lightningcss does not.
- **A test is verified by failing on the symptom it names** (D-035 §3). The
  checks worth breaking deliberately here: the precedence rule at every level,
  `RadioGroup`'s generated `name` (break it by hardcoding one and watch two
  groups merge), the indicator's `pointer-events: none` (break it and watch the
  click stop reaching the input), and `Checkbox`'s `indeterminate` DOM property.
- **The `Matrix` id constraint** (§12) is asserted per page by reading a real
  accessible name outside the matrix.

## §13 — The five open questions, resolved

Answered at Gate C on 2026-09-18. Three of the five changed the spec above;
they are recorded here because the reasoning is the part worth keeping.

**1. The mark (§7) — none of the three CSS options. It is an inline `Icon`.**
The original ruling proposed a colourless `mask-image` data URI plus a lint rule
to police it. That was measuring against the wrong constraint: the `<input>` is
void, but the *indicator* is a `<span>` and takes children. The mark is an SVG
path in the markup, coloured by `currentColor` from a token. It deletes a
proposed lint rule, a proposed exemption, and an unreadable URL-encoded blob, and
it costs about sixty bytes of markup per control.

**2. The target size (§8) — 16/20/24 stands; the justification changed.**
The original argument was that the label supplies the rest of the WCAG 2.5.8
target, which leaves a bare `<Checkbox />` indefensible. The real argument is
2.5.8's **spacing exception**, which needs no label: at `gap="3"` the 24px
circles are clear at every size. That moved `RadioGroup`'s default gap from `"2"`
to `"3"`, where `"2"` put `sm` centres exactly 24px apart — tangent, which is an
argument rather than a pass. The label remains a second line of defence.

**3. The ref/prop split (§11) — approved, with the principle stated as
"the root is the box, the control is the element."** Recorded as D-039.

**4. Overturning "roving tabindex" (§5) — approved.** `ROADMAP.md` 3.11's Notes
cell is updated in the same commit. One addition to the spec: native radios
answer all four arrow keys regardless of orientation, which is a superset of
APG rather than a deviation, so `orientation="horizontal"` ships no keyboard code.

**5. `Input`'s `type` (§3.8) — `number` is allowed, and two more are excluded.**
Banning a type the platform supports, to push people toward a component that does
not exist yet, is hostile for the months between 3C and 3.14. `file` and `hidden`
join the exclusion list — the first is `FileUpload` (5.10) and renders as a
button that ignores every token we have, the second needs no component at all.

The more useful finding sits underneath the question: **`NumberInput` (3.14)
should not be `type="number"` either.** That input mutates its value on a scroll
wheel over a focused field, rejects a locale decimal comma, and reports
`value === ''` for anything it cannot parse, so `1,5` typed in a German locale is
silently lost. 3.14 is `type="text"` with `inputMode="numeric"`, and `Input`'s
"don't" says so now rather than surprising someone in 3D.
