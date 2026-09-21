# Tier 3D — Composite Inputs

| | |
| --- | --- |
| **Tier** | 3D |
| **Status** | `build` — approved 2026-09-21; amended by D-051. 3.14 `done`, 3.15 in flight |
| **Components** | 3.14 `NumberInput` · 3.15 `Slider` |
| **Depends on** | 3.8 `Input` (`done`), 3.7 `Field` (`done`), Tier 3A (`done`), Tiers 0–2 (`done`) |
| **Approval** | One gate for the group ([D-027](../DECISIONS.md#d-027)), minus `Form` — §0 |
| **APG patterns** | [Spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/), [Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [Slider (Multi-Thumb)](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) (consulted for the range case, deliberately not adopted — §7) |

### Progress

| Component | Status |
| --- | --- |
| 3.14 `NumberInput` | **`done`** 2026-09-21 |
| 3.15 `Slider` | `spec` |
| 3.16 `Form` | `planned` — moved out of this gate, §0 |

---

Tier 3C answered "what does a control owe the `Field` above it?" and the answer
was identical in all six. These two ask a second question that 3C never had to:
**what does a control owe a caller who gave it a `number`?**

A text input round-trips a string. A number control does not: it has to clamp,
snap to a step, survive floating-point arithmetic, decide what an empty field
means, decide what the user's half-typed `1.` means, and — the moment anyone
outside en-US uses it — decide whether `1,5` is one-and-a-half or fifteen
hundred. Get any of those answers different between `NumberInput` and `Slider`
and a form containing both is two components that disagree about what `step`
means. That is the inconsistency D-014 says group review exists to catch, and it
is invisible until a user types something.

---

## 0. What this gate covers, and why `Form` is not in it

`ROADMAP.md` files 3.14–3.16 as one group, "3D — Composite inputs", on one gate
(D-027). **This spec asks you to approve two of the three and move `Form` to a
gate of its own.** Three reasons, in ascending order of how much they cost if
ignored:

**`Form` is not a composite input.** It is a container. It shares no vocabulary
with the two components above — not `min`, not `max`, not `step`, not a value at
all. Everything §1–§10 below rules on is inapplicable to it. D-027's argument
for grouping is that "reviewing a group together is the only way to catch the
inconsistencies between components that matter most"; between `Form` and
`NumberInput` there are none to catch, so the group buys nothing and only makes
the gate larger.

**`Form`'s error summary has an undeclared dependency.** 3.16's Notes cell reads
"Error summary, submission state", and its **Deps** column says `3.7`. An error
summary is a bordered, toned, `role="alert"`-adjacent block with an icon and a
list — which is `Alert` (5.2), and `Alert` is `planned`. So `Form` as specified
either waits for Tier 5, duplicates `Alert`'s markup and tokens, or invents a
third thing. That is a roadmap correction, not a spec detail, and it should be
made before the API is designed rather than discovered halfway through the
build.

**`Form` is in the category D-014 kept out of group review in the first place.**
D-014's carve-out named "`Field` and the overlay foundation … where API mistakes
get expensive," and D-027 narrowed it to `Field` because the reason named two
components and the tier had sixteen. `Form` is the outermost wrapper every
consuming app puts around every field it owns, and the error summary needs to
address each field by the id `Field` generates — which means `Form` may need
`Field` to register with a context it does not currently have. A change to
`Field`'s API is the exact thing 3B was gated individually to protect.

**Proposal:** `Form` moves to its own Gate C, after 5.2 `Alert` is `done`, with
its **Deps** column corrected to `3.7, 5.2`. If you would rather keep the group
intact, say so at the gate and §3.16 gets written into this document before
anything is built.

---

## Decisions this batch asks you to approve

Sections 1–10 are rulings. Everything from §3.14 onward is the per-component
template.

### 1. One numeric contract, eight props, identical in both

`min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue`,
`onValueChange`. Same names, same types, same meaning, same defaults where a
default makes sense. A caller who has learned one has learned the other.

| Prop | Type | `NumberInput` | `Slider` |
| --- | --- | --- | --- |
| `min` | `number` | unbounded | `0` |
| `max` | `number` | unbounded | `100` |
| `step` | `number` | `1` | `1` |
| `locale` | `string` | none — §4 | none — §4 |
| `formatOptions` | `Intl.NumberFormatOptions` | none | none |
| `value` | `number \| null` / `number` | `null` is empty (§2) | no empty state |
| `defaultValue` | same | `null` | midpoint of `min`/`max` |
| `onValueChange` | `(value) => void` | fires on commit (§3) | fires continuously (§3.15) |

The two differences are forced, not stylistic, and both are stated where they
arise: a slider's thumb is always somewhere, so it has no empty state; and a
slider is unusable without bounds, so it takes the platform's.

`step`'s **stepping base is `min`**, falling back to `0` — which is what HTML
does for `<input type="number">` and `type="range"`, so a `min={1} step={2}`
control offers 1, 3, 5 in both of these and in the native element a consumer
might have used before. Nothing invents its own base.

**Rejected: `precision` or `decimalPlaces`.** It is `step` restated in a second
unit, and two props that can contradict each other about the same thing is how
`Field` nearly got an `invalid` prop (D-036). Display precision comes from
`formatOptions.maximumFractionDigits`, where `Intl` already defines it.

### 2. `null` is empty. `undefined` is uncontrolled. They are not the same word.

`NumberInput` can be empty — the user selected the contents and pressed Delete —
and that state has to be expressible in a `value` prop. The obvious spelling,
`value={undefined}`, is already taken: `useControllableState` (D-032) reads
`value !== undefined` as "controlled", so an empty controlled input would
silently become an uncontrolled one, and the component would stop responding to
its owner with no error.

So **the empty value is `null`**, and the type is `number | null`.

This is not a nicety. `value={form.quantity}` where `quantity` is optional is an
ordinary line to write, it produces `undefined` the first time the field is
blank, and it detonates exactly this way — which is the case D-032 built the
development warning for. The warning fires; the type should make it unnecessary.
`number | null` does, because `undefined` is then a type error at the call site
rather than a behaviour change at runtime.

**Consequence for the callback:** `onValueChange(value: number | null)`. A
consumer storing the result straight back into `value` round-trips correctly,
which is the property that makes a controlled component composable.

**The native `onChange` still fires too**, unwrapped, for the same reason it does
on the checkable three (3C §2): it is still a native input and a caller may
legitimately want the event, `event.target.value`, or `register()` from
`react-hook-form`. `onValueChange` is additional, never a replacement.

### 3. Clamp and snap on commit. Never on a keystroke.

The rule that makes a number field usable, stated once for both components:

> **`min`, `max` and `step` are applied when the value is committed — blur, a
> stepper press, an arrow key, Enter — and never while the user is typing.**

Snapping per keystroke is the defect every hand-rolled number field ships with.
With `step={10}`, typing `1` becomes `10` before the `5` arrives, so `15` cannot
be typed at all. With `min={10}`, typing `5` becomes `10` and the caret jumps
past the digit the user is still writing. With `max={100}`, a paste of `1000`
truncates to `100` and the user never sees what they pasted.

`Slider` has no typing, so it snaps always — the same rule, with the antecedent
never false.

**Snapping is arithmetic, and the arithmetic is wrong by default.**
`min + Math.round((v - min) / step) * step` produces `0.30000000000000004` for
`step={0.1}` at the third stop, which then renders, and then round-trips into
the consumer's state. The snap is followed by a rounding to `step`'s own decimal
precision — derived from `step`, not from a prop (§1). This is specified here
rather than left to the build because it is invisible in every manual test that
uses integers, and it needs a unit test that names the number.

**What happens to text that is not a number.** On blur, a field containing
something unparseable reverts to the last committed value rather than clearing
to `null`. A typo should not silently destroy data the user did not ask to
delete; an empty field, which *is* parseable as "nothing", still commits `null`.

### 4. Formatting is opt-in, and it is opt-in because an ambient locale cannot hydrate

`ROADMAP.md` describes 3.14 as "locale-aware". The natural reading —
`new Intl.NumberFormat().format(value)` — is the library's first hydration bug.

`Intl.NumberFormat` with no locale argument resolves the *runtime's* locale. On
the server that is Node's; in the browser it is the user's. `1234.5` renders as
`1,234.5` from a container in `en-US` and as `1.234,5` in a German browser, and
RULES §7's last line — "server and first client render must match" — is broken
by a component that never mentions the viewport.

**So there is no ambient locale. `locale` is a prop, and when it is absent the
component does not format at all:** the displayed text is `String(value)`, which
is `en-US`-shaped but, more importantly, is the same string on both sides of
hydration in every environment.

| `locale` | Display | Parsing |
| --- | --- | --- |
| absent | `String(value)` | `Number(text)` after trimming |
| `"de-DE"` | `Intl.NumberFormat("de-DE", formatOptions)` | that locale's separators |

**Parsing is the mirror of formatting, derived from the same `Intl` instance.**
The separators are discovered with `formatToParts`, not hardcoded: format a
probe number, read the `group` and `decimal` parts, strip the first, replace the
second with `.`, normalise the minus sign (several locales use U+2212, which
`Number()` rejects), then parse. Zero dependencies, and it is correct for
locales nobody on this project has heard of.

**This is the right default rather than a retreat**, because an app that server
-renders already knows its locale — Next.js i18n routing hands it over — and an
app that does not know its locale cannot have a correct one. A provider that
supplies it by context is Tier 6 territory and can be added without changing
this API.

**`Slider` takes both props too, and uses them for `aria-valuetext` only.** It
displays no text. The pair is still the right shape: a slider labelled "Budget"
that announces "50" when it means "€50" is the case APG names `aria-valuetext`
for, and solving it with a `formatValue` callback here while `NumberInput` takes
`locale`/`formatOptions` would be two spellings of one idea inside one gate.

### 5. `NumberInput` is `type="text"` with `role="spinbutton"`

The first half was ruled in advance: 3C §13.5 closed with "**`NumberInput` (3.14)
should not be `type="number"` either**", and `Input`'s docs page already tells
people so. The reasons stand — `type="number"` mutates its value on a scroll
wheel over a focused field, rejects a locale decimal comma, and reports
`value === ''` for anything it cannot parse, so `1,5` in a German locale is
silently lost — and §4 above is the second door onto the same problem: you
cannot format a value into a control that refuses to hold the formatted text.

**`inputMode` is derived, not fixed.** 3C §13.5 said `inputMode="numeric"`;
that is right only for integers. `numeric` gives an iOS keypad with **no decimal
separator and no minus key**, so a `step={0.5}` field would be untypeable on a
phone. The rule:

```
inputMode = (Number.isInteger(step) && min !== undefined && min >= 0)
  ? 'numeric'
  : 'decimal'
```

**Amended by D-051 §2.** This rule first read `min === undefined || min >= 0`,
which makes an *unbounded* integer field `numeric` — and an unbounded field
accepts negatives, so it is exactly the field that needs the minus key the
numeric keypad does not have. The condition was wrong in the direction the
paragraph above it was warning about. `numeric` is claimed only when a `min`
says the value cannot be negative.

**`role="spinbutton"`, with the value attributes.** This is the APG pattern, and
the announcement it buys is the entire point of the component: "Quantity, spin
button, 3, minimum 1, maximum 10" against "Quantity, edit, 3". `aria-valuemin`
and `aria-valuemax` are emitted only when `min` / `max` are given — an unbounded
field must not claim bounds — and `aria-valuetext` carries the formatted string
whenever it differs from `String(value)`.

**`aria-valuenow` is omitted while there is no value**, which covers both the
empty field and mid-typing (`1.` is not a number). The alternative is announcing
a stale number that is not what is in the box, which is worse than announcing
nothing. See Open question 1: ARIA 1.2 relaxed `aria-valuenow` from required to
optional for `spinbutton` and this design depends on that reading, so it is
verified against the published spec before the build, not after.

**The cost, stated rather than discovered.** `role="spinbutton"` replaces the
implicit `textbox` role, and some screen reader / browser pairs announce
character-by-character editing less well in a spinbutton than in a textbox. That
is a real trade and it is taken deliberately: the min/max/now announcement is
present on every focus, the editing difference is browser-dependent and affects
a keystroke. It is listed in the manual walkthrough (§3.14) so it gets looked at
rather than assumed.

### 6. The steppers are plain buttons, they are not `IconButton`s, and they are not tab stops

**Not `IconButton` (3.2).** `IconButton` is square on the control scale — 32 /
40 / 48 (D-028, D-031). Two of them stacked inside a 40px box is 80px of button
in 40px of control. The reuse is arithmetically impossible, not merely
unattractive, and that is worth writing down because "why didn't you use
`IconButton`" is the first question anyone will ask.

They are `<button type="button">` elements styled by `NumberInput.css`, with
`type="button"` **in the markup and in a test**: a `<button>` inside a `<form>`
defaults to `type="submit"`, so an omitted attribute makes the increment button
submit the form. That is a one-word bug with a spectacular symptom and no visual
signal at all.

**`tabIndex={-1}`, so they are not tab stops.** A form with six number fields
would otherwise carry eighteen tab stops instead of six. Nothing becomes
keyboard-inaccessible: ↑ and ↓ on the input do exactly what the buttons do, they
are the APG spinbutton pattern's own keys, and they are what a keyboard user
reaches for. The buttons stay in the accessibility tree with real accessible
names, so a pointer user and a screen reader user in browse mode both keep them.

**They disable at the bounds**, with the native `disabled` attribute plus
`data-disabled`, so the control says when stepping has stopped working instead
of appearing to ignore a press. When the field is empty, the first press commits
the bound that exists — `min` for increment, `max` for decrement — falling back
to `0` when unbounded, rather than starting from an invisible zero.

**No press-and-hold auto-repeat in 3.14.** A native number input repeats while
held; ours will not. It is a pointer-interaction behaviour that can be added
later without an API change, it needs a repeat interval that is a magic number
with no token to come from, and shipping it untested is worse than not shipping
it. Stated so it reads as a decision rather than an omission.

### 7. `Slider` is `<input type="range">`. The two-thumb range slider is not in this gate.

**Single-thumb: the native element is the painted control**, which is 3C §6
applied one tier later rather than a new ruling. What it buys, none of which we
then have to write or test: arrow keys, Home / End, Page Up / Page Down, the
platform's own step-on-drag, pointer capture including the drag-outside-and-back
case, touch, `role="slider"` with `aria-valuenow` / `valuemin` / `valuemax`
maintained by the browser, and RTL direction handling. RULES §8 forbids a runtime
dependency in Tier 3; a hand-built slider is the pointer maths we would have
written instead.

**The range case is deferred, and the focus ring is why.** A two-thumb slider
built from two overlapping `<input type="range">` elements — the technique that
keeps all of the above — puts two full-width inputs on top of each other. Each
is `:focus-visible` across the whole track, so focusing the minimum thumb draws
a ring around the entire control, including the maximum thumb. The fix is to
move the ring onto `::-webkit-slider-thumb` / `::-moz-range-thumb` and suppress
it on the input, and suppressing it means `outline: none` — which Tier 0.7 bans
outright, deliberately (D-029). There is a way through and it is not obvious,
which makes it its own decision.

Clicking the track is the second unsolved half: with the upper input covering
the lower one, a track click has to be routed to the nearer thumb by hand, and
the `pointer-events` layering that makes both thumbs draggable is what takes the
track click away.

**Proposal:** 3.15 `Slider` ships single-thumb. A two-thumb `RangeSlider` is
added to `ROADMAP.md` as a separate item with these two problems named, and the
3.15 Notes cell drops "Single + range". APG's Multi-Thumb pattern is what it
will be built against when it is built.

### 8. The vendor pseudo-elements are duplicated on purpose, and a lint rule should say so

Styling a range input means `::-webkit-slider-runnable-track`,
`::-webkit-slider-thumb`, `::-moz-range-track`, `::-moz-range-thumb` and
`::-moz-range-progress`. **They cannot be grouped into one selector list.** An
unknown pseudo-element invalidates the *entire* selector list in the engine that
does not know it, so

```css
/* ✗ Firefox drops this rule entirely, including its own half */
.pp-slider__control::-webkit-slider-thumb,
.pp-slider__control::-moz-range-thumb { … }
```

silently unstyles the thumb in Firefox while looking correct in Chrome — a
failure mode with no console warning and no visual signal on the machine of the
person who wrote it. The blocks are therefore written out separately, with
identical bodies, and the file carries a comment saying why. Anyone tidying the
duplication away breaks one engine.

`Slider.css` is the first file in the library with a reason to look like
copy-paste. The Definition of Done's rule-lint box covers whether the values are
tokens; it says nothing about this, so the duplication is guarded by a browser
assertion instead (§Testing notes).

### 9. 3C §1 re-tested: still no shared control surface — by Select's reasoning, not by this section's

3C §1 rejected a shared `.pp-control` base class and closed with: "Revisit only
if a fourth and fifth text-surface control appear and the blocks are still
identical, which **`NumberInput` (3.14) will test within the tier**."

Tested. **The answer is no**, and it is no for the reason 3C actually gave: the
surfaces differ in what each reserves at its inline end. `Textarea` has no
`block-size`, `Select` reserves room for a chevron, `NumberInput` reserves room
for two buttons, and `Input` reserves nothing. A base class would be a base plus
four override blocks.

What *is* shared is what D-028 already made shared: `--pp-control-height-*`,
`--pp-control-padding-inline-*`, `--pp-control-font-size-*` and
`--pp-control-radius`. Four components now read that set and are the same height
in a row — asserted across two playground pages rather than restated (D-045).

**This section originally argued something else, and the something else was
wrong (D-051 §3).** It claimed the surface *inverts*: that the steppers force
the border, the fill and the radius onto the wrapper, leaving the `<input>`
transparent, with the focus ring drawn on the root by `:has()`. Built that way,
the control rendered with **two concentric focus rings** — `reset.css` draws
`:where(:focus-visible)` on every focusable element, so the inner input took one
of its own, and the only way to remove it was `outline-width: 0`, a value-level
dodge around a property-level ban (D-025's shape, third occurrence).

`Select` (3.13) had already solved this: one grid cell, the control in it
carrying the surface with `padding-inline-end` reserving room, and the thing at
the end placed over that room. `NumberInput` is that structure with two buttons
instead of one chevron, and the buttons take `pointer-events: auto` where the
chevron took `none`. The conclusion survived; the mechanism was replaced by one
that already existed.

### 10. Both use `useControllableState`, and 3C §2's rule is what says so

3C §2 drew the line: a control passes state straight to the DOM when React's own
input already implements D-032's contract, and uses the hook when **the value is
needed during render**.

Both of these need it during render, for reasons neither component invented:

- `NumberInput` renders the formatted display text, `aria-valuenow`,
  `aria-valuetext`, and the `disabled` state of two buttons — all from the value.
- `Slider` renders the filled portion of the track as a percentage (§3.15) and
  `aria-valuetext`.

So the rule 3C wrote for six components predicts both of these without being
extended, which is the sign it was the right rule. No new hook, no variant of
the old one.

---

## 3.14 `NumberInput`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `client` — `useField()`, `useControllableState`, event handlers |
| **Depends on** | 3.8 `Input`, 3.7 `Field` |
| **APG pattern** | [Spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) |

### Purpose

A numeric text field with steppers, bounds, a step, and formatting that is
correct outside en-US. It is `type="text"` under the hood and never
`type="number"` (§5).

**What it deliberately does not do.** No currency symbol slot, no unit suffix —
`formatOptions: { style: 'currency', currency: 'EUR' }` is `Intl`'s job and it
already does it in every locale. No press-and-hold repeat (§6). No scroll-wheel
stepping, which is the `type="number"` misfeature this component exists to
escape. No validation messages: `Field`'s `error` renders those and the app
decides what is wrong.

### Sizing contract justification

`fill`, and it is **three elements** rather than `Input`'s two — the root
carries the surface, so it is the grid; the control is one cell; the steppers
are the other.

D-040's finding holds and is the reason the root exists at all: a form control
has an intrinsic inline size from the HTML `size` attribute and does not fill a
block context. Here the root is `display: grid` with
`grid-template-columns: 1fr auto`, the control stretches into the first track,
and the steppers hug the second. **No width is declared anywhere.**
`min-inline-size: 0` on the control, so a long value shrinks it instead of
pushing the container wide.

The HTML `size` attribute is never set and is absent from the props type, for
the reason `Input`'s is (RULES §1: a control sizing itself, in the one place the
rule would not think to look).

### Anatomy

```
<span class="pp-number-input" data-size data-invalid? data-disabled? data-readonly? data-pp-tone?>
  ├── <input class="pp-number-input__control" role="spinbutton" type="text" inputmode>   (grid 1/1)
  └── <span class="pp-number-input__steppers">                                            (grid 1/1, center end)
        ├── <button class="pp-number-input__stepper" data-direction="increment" type="button" tabindex="-1">
        │     └── <svg aria-hidden="true">
        └── <button class="pp-number-input__stepper" data-direction="decrement" type="button" tabindex="-1">
              └── <svg aria-hidden="true">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-number-input` | `<span>` | `display: grid`, one cell. State attributes and the tone context. `className` / `style` land here (D-039 §1) |
| Control | `pp-number-input__control` | `<input>` | **The surface** — border, fill, radius and the focus ring, with `padding-inline-end` reserving room for the steppers. The `ref` target and the prop target |
| Steppers | `pp-number-input__steppers` | `<span>` | Over the reserved room, `place-self: center end`, `pointer-events: none` so a click in the gap between the two reaches the control |
| Stepper | `pp-number-input__stepper` | `<button>` | `data-direction`, `tabindex="-1"`, `type="button"`, an accessible name, `disabled` at the bound (§6). Square at **half the control height** — 16 / 20 / 24, the checkable three's scale reached by construction |

Amended by D-051 §3; the original had the wrapper carrying the surface.

**WCAG 2.2 SC 2.5.8 for the steppers.** Two to a control height is 16 / 20 / 24
on the block axis, which is under 24 at `sm` and `md`. The relief is 2.5.8's
**Equivalent** exception — "the function can be achieved through a different
control on the same page that meets this criterion" — and here that control is
the text field itself, which sets the same value, is a full-size target, and
fills its container. D-039 §8 reached for the *spacing* exception; this one does
not apply, because the two steppers are adjacent targets to each other.

**State is declared on the root, never on a descendant selector** — D-040's
specificity finding, which applies unchanged.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number \| null` | — | Controlled. `null` is empty; `undefined` is uncontrolled (§2) |
| `defaultValue` | `number \| null` | `null` | Uncontrolled seed |
| `onValueChange` | `(value: number \| null) => void` | — | Fires on commit (§3). The native `onChange` fires too |
| `min` | `number` | unbounded | Clamped on commit. Also the stepping base (§1) |
| `max` | `number` | unbounded | Clamped on commit |
| `step` | `number` | `1` | Snapped on commit; sets `inputMode` (§5) |
| `locale` | `string` | none | Absent means no formatting, and that is a hydration ruling (§4) |
| `formatOptions` | `Intl.NumberFormatOptions` | none | Passed to `Intl.NumberFormat(locale, …)` |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale (D-028) |
| `invalid` | `boolean` | field, then `false` | `data-pp-tone="danger"` + `aria-invalid` (3C §3) |
| `disabled` | `boolean` | field, then `false` | Native attribute; steppers disabled |
| `required` | `boolean` | field, then `false` | Native attribute |
| `readOnly` | `boolean` | `false` | Steppers disabled, arrow keys inert, value still submitted |
| `className` / `style` | | — | Land on the root, which is the box |
| …rest | `ComponentPropsWithoutRef<'input'>` minus `type`, `size`, `value`, `defaultValue`, `onChange` conflicts | — | `name`, `placeholder`, `autoComplete`, `onBlur`, `aria-*` |

`ref` → `HTMLInputElement`.

**Prop count, against RULES §5.6.** Eleven named props plus `className` / `style`
is past the "~10 props, it is probably two components" line, so it is checked
rather than waved at. There is no seam: `min` / `max` / `step` are one
irreducible triple, `locale` / `formatOptions` are the two arguments of one
`Intl` constructor, and `value` / `defaultValue` / `onValueChange` are RULES
§5.5's mandatory trio. The remaining five are the same five every control in 3C
takes. Splitting this would produce two components neither of which is usable
alone, which is the failure §5.6 is warning about, arrived at from the other
side.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid | `data-invalid`, `data-pp-tone="danger"`, `aria-invalid` | Root border → `--pp-tone-border` |
| Disabled | `data-disabled`, `disabled` on input and both buttons | Fill → `--pp-color-bg-sunken`, text → `--pp-color-text-disabled`, border → `--pp-color-border-subtle` (D-050), `cursor: not-allowed` |
| Read-only | `data-readonly`, `readonly`, buttons `disabled` | Fill → `--pp-color-bg-sunken`, border unchanged |
| Required | `required` | None — the `Label` carries the glyph |
| Focus | `:focus-visible` on the control | One ring outside the box (`--pp-color-focus-ring`), border → `--pp-tone-focus` inside it (D-039 §4). The steppers sit inside the ring |
| At a bound | `disabled` + `data-disabled` on one stepper | That stepper → `--pp-color-text-disabled` |
| Empty | `aria-valuenow` omitted (§5) | `::placeholder` at `--pp-color-text-muted` |

### Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-number-input-height` | `--pp-control-height-<size>` | Block size |
| `--pp-number-input-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding of the control |
| `--pp-number-input-radius` | `--pp-control-radius` | Corners |
| `--pp-number-input-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-number-input-border-color` | `--pp-color-border` | Edge |
| `--pp-number-input-color` | `--pp-color-text` | Text |
| `--pp-number-input-placeholder-color` | `--pp-color-text-muted` | Placeholder |
| `--pp-number-input-stepper-color` | `--pp-color-text-muted` | Stepper glyphs |

Per D-024: the stylesheet reads the public property first and falls back to a
private `--_*`, so an ancestor override still wins.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| ↑ | Increment by `step`, clamped |
| ↓ | Decrement by `step`, clamped |
| Page Up | Increment by `step × 10` |
| Page Down | Decrement by `step × 10` |
| Home | Set to `min`, if `min` is given |
| End | Set to `max`, if `max` is given |
| Enter | Commit the typed text (clamp + snap), without submitting twice |
| Tab / Shift+Tab | Moves focus in and out. **One stop**, not three (§6) |
| Any character | Native typing. Nothing is snapped or clamped (§3) |

Cross-checked against the APG Spinbutton pattern. The pattern lists Page Up /
Page Down as "change the value by a larger step"; the multiplier is fixed at ten
rather than exposed as a prop, because a second step prop can contradict the
first (§1's rejected `precision`, same species).

**Deliberate divergence: no wheel handling.** APG does not ask for it, and it is
the `type="number"` behaviour this component exists to escape.

### Accessibility notes

`role="spinbutton"` with `aria-valuenow` (omitted when empty or mid-edit),
`aria-valuemin` / `aria-valuemax` (only when bounded), and `aria-valuetext` (the
formatted string, when it differs from the raw one). §5 has the reasoning and
the cost.

The accessible name comes from `Field`'s `<label for>`. Standalone, the caller
supplies `aria-label`. `aria-describedby` arrives through `field.control` and
points only at elements that rendered (D-036).

Each stepper has a real accessible name — "Increase" / "Decrease" — and an
`aria-hidden` glyph. They do not take `aria-controls`: it is unsupported by most
screen readers and the buttons are already inside the control they act on.

**Manual walkthrough, recorded here and run at Gate D:** tab in (one stop);
↑↓ step and announce; type `1.` and confirm nothing is announced as a value;
blur and confirm the clamp announces; with `locale="de-DE"` type `1,5` and
confirm it survives blur; reach a bound and confirm the stepper announces as
unavailable. Screen readers: VoiceOver/Safari and NVDA/Firefox, because §5's
stated cost is browser-dependent.

### Container behavior

No `@container` rules. It fills; the `Field` and the layout primitive above it
decide how much. The steppers are a fixed track, so the control absorbs every
width change.

### Usage

```tsx
<Field label="Quantity" description="Up to 10 per order.">
  <NumberInput min={1} max={10} defaultValue={1} />
</Field>

<Field label="Budget">
  <NumberInput
    locale="de-DE"
    formatOptions={{ style: 'currency', currency: 'EUR' }}
    min={0}
    step={0.5}
  />
</Field>
```

### Don't

```tsx
// ✗ `undefined` is uncontrolled, not empty. This switches modes the first time
//   the field is blank and the component stops answering to you (§2).
<NumberInput value={form.quantity} onValueChange={setQuantity} />

// ✓ null is empty
<NumberInput value={form.quantity ?? null} onValueChange={setQuantity} />

// ✗ No locale, so nothing is formatted — `formatOptions` alone does nothing,
//   because an ambient locale cannot survive hydration (§4).
<NumberInput formatOptions={{ style: 'percent' }} />

// ✓
<NumberInput locale="en-GB" formatOptions={{ style: 'percent' }} />

// ✗ It is not a text input with a hint. It parses, clamps, snaps and formats.
<Input type="number" />
```

---

## 3.15 `Slider`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `client` — `useField()`, `useControllableState`, event handlers |
| **Depends on** | 3.7 `Field` |
| **APG pattern** | [Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) — satisfied by the native element (§7) |

### Purpose

A single-thumb range control on the numeric contract of §1, built on
`<input type="range">`. It picks one number between two bounds, and every
keyboard, pointer and ARIA behaviour in the APG pattern comes from the platform.

**What it deliberately does not do.** No two-thumb range — that is a separate
item, and §7 says what is unsolved about it. No visible value readout, no tick
marks, no labels under the track: those are layout, they belong to the caller's
`Cluster` and `Text`, and a component that renders them would have to size them.
No vertical orientation in this gate: `writing-mode: vertical-lr` on a range
input is the modern way and it is young enough to need its own browser
assertions.

### Sizing contract justification

`fill`, two elements, for D-040's reason: a form control carries an intrinsic
inline size and does not fill a block context. `<input type="range">` is the
narrowest of them. The root is `display: grid`, the control stretches into its
single cell, and **no width is declared anywhere**.

The thumb is intrinsically square and takes `inline-size`, which is the D-019
exemption `Checkbox`, `Radio` and `Switch` already hold in `.stylelintrc.json`.
`Slider.css` joins that override list — the exemption is extended, not widened.

### Anatomy

```
<span class="pp-slider" data-size data-invalid? data-disabled? data-pp-tone? style="--_pp-slider-fill: 42%">
  └── <input type="range" class="pp-slider__control">
        ├── ::-webkit-slider-runnable-track / ::-moz-range-track
        ├── ::-moz-range-progress          (Firefox only — the fill)
        └── ::-webkit-slider-thumb / ::-moz-range-thumb
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-slider` | `<span>` | `display: grid`, one cell. State attributes, the tone context, and the fill percentage. `className` / `style` land here |
| Control | `pp-slider__control` | `<input type="range">` | The painted control. `ref` target, prop target |
| Track / thumb / fill | — | vendor pseudo-elements | Not classes and not parts consumers can select. §8 says why the blocks are duplicated |

**The fill percentage is a private custom property written inline** —
`--_pp-slider-fill` — per D-024: private, so D-024's "a component never writes
its own *public* override property inline" is satisfied, and **always written,
never conditionally**, because a custom property inherits and a propless nested
slider would otherwise pick up its ancestor's fill.

Firefox has `::-moz-range-progress` and needs no percentage; Chromium and WebKit
have no equivalent, so the fill there is a `linear-gradient` on the track with
its stop at `var(--_pp-slider-fill)`. That asymmetry is the whole reason the
value has to reach CSS at all, and it is why `Slider` re-renders on every input
event rather than letting the browser own the drag.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | — | Controlled. No empty state (§1) |
| `defaultValue` | `number` | midpoint of `min`/`max` | The platform's own default, so an uncontrolled `<Slider />` sits where a bare `<input type="range">` would |
| `onValueChange` | `(value: number) => void` | — | **Continuous** — every input event during a drag |
| `onValueCommit` | `(value: number) => void` | — | Once, on pointer release, key release or blur |
| `min` | `number` | `0` | |
| `max` | `number` | `100` | |
| `step` | `number` | `1` | Always snapped — there is no typing (§3) |
| `locale` | `string` | none | For `aria-valuetext` only (§4) |
| `formatOptions` | `Intl.NumberFormatOptions` | none | As above |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | Thumb 16 / 20 / 24 |
| `invalid` | `boolean` | field, then `false` | |
| `disabled` | `boolean` | field, then `false` | |
| `className` / `style` | | — | Land on the root |
| …rest | `ComponentPropsWithoutRef<'input'>` | — | `name`, `onBlur`, `aria-*` |

`ref` → `HTMLInputElement`.

**Why `onValueCommit` earns its place** — it is the one prop here that is not in
§1's shared contract. React maps `onChange` on a range input to the *input*
event, so it fires on every pixel of a drag; the native `change` event, which is
the one that means "the user let go", is not separately exposed. Without
`onValueCommit`, the only way to avoid a network request per pixel is for the
consumer to reimplement pointer and key release handling — which is the work
this component exists to absorb. `NumberInput` needs no counterpart because §3
already makes its `onValueChange` a commit.

**No `readOnly`.** `<input type="range">` does not support it — the attribute is
defined only for text-like controls, and the browser ignores it on a range — so
offering the prop would be a promise the platform refuses to keep. This is
D-049 §4's ruling for `Select`, arrived at the same way. A slider that must not
move is `disabled`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid | `data-invalid`, `data-pp-tone="danger"`, `aria-invalid` | Thumb border and fill → the danger tone |
| Disabled | `data-disabled`, `disabled` | Track → `--pp-color-bg-sunken`, fill → `--pp-color-border-subtle`, thumb border → `--pp-color-border-subtle` (D-050), `cursor: not-allowed` |
| Focus | `:focus-visible` on the control | Ring around the control (`--pp-color-focus-ring`), which is the platform's own placement for a single-thumb slider |
| Value | `--_pp-slider-fill`, `aria-valuenow` (native) | Filled portion of the track |

### Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-slider-track-color` | `--pp-color-bg-sunken` | Unfilled track |
| `--pp-slider-fill-color` | `--pp-tone-solid` | Filled portion |
| `--pp-slider-thumb-color` | `--pp-color-bg-surface` | Thumb fill |
| `--pp-slider-thumb-border-color` | `--pp-color-border` | Thumb edge |
| `--pp-slider-thumb-size` | `--pp-size-4 / -5 / -6` | Thumb, by size step |
| `--pp-slider-track-size` | `--pp-space-1`, `--pp-space-2` at `lg` | Track thickness |

**The thumb is a filled circle with a 3:1 edge, not a tone-solid dot.** D-047 §3
measured a tone-9 dot on the surface at 1.87:1 and made `Radio` fill instead;
here the thumb sits on top of the *fill*, which is `--pp-tone-solid`, so a solid
thumb would be tone-on-tone. The surface-filled thumb with a `--pp-color-border`
edge is the pairing D-050 solved to ≥3:1 against both the surface and the sunken
track. **Computed at the gate, not after the build** — D-048 §1's rule, and
these are pairings `check-contrast.mjs` already asserts, so this component adds
no assertion and leans on none that is missing.

**Sizes.** Thumb 16 / 20 / 24 (`--pp-size-4` / `-5` / `-6`), matching the
checkable three. The track is `--pp-space-1` at `sm` and `md` and `--pp-space-2`
at `lg` — two of three share a value, which is the shape `control.css` already
uses for font size, and a track is a line rather than a box so it does not earn
three steps.

**WCAG 2.2 SC 2.5.8 at `sm`.** A 16px thumb is under 24px, and the relief is the
**spacing exception**, as it was in D-039 §8: a single-thumb slider has exactly
one target, so no 24px circle centred on it can intersect another target. The
exception is satisfied trivially rather than by argument. The whole control box
is also the pointer target for a track click, and it is `--pp-control-height-*`
tall at every size.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| → / ↑ | Increase by `step` |
| ← / ↓ | Decrease by `step` |
| Page Up | Increase by a larger step |
| Page Down | Decrease by a larger step |
| Home | `min` |
| End | `max` |

**Every row is the browser's, and the component adds no handler.** That matches
the APG Slider pattern exactly, including the detail an implementation usually
misses: in an RTL context the browser reverses ← and → and leaves ↑ and ↓ alone.

APG's larger-step rows are marked "optional" and the platform's multiplier is
the browser's, not ours. That is a deliberate divergence from `NumberInput`'s
fixed ten (§3.14) and it is the right one: intercepting Page Up to make the two
components agree would mean reimplementing a key the browser already handles,
for symmetry nobody can perceive without pressing it.

### Accessibility notes

`role="slider"`, `aria-valuenow`, `aria-valuemin` and `aria-valuemax` are the
native element's and are maintained by the browser. The component adds
`aria-valuetext` when `locale` is set, and nothing else.

The accessible name comes from `Field`'s `<label for>`; standalone, from
`aria-label`. `aria-describedby` arrives through `field.control`.

`aria-orientation` is not set: the pattern's default is horizontal and the
component ships no vertical mode.

**Manual walkthrough:** tab to the thumb and confirm the ring is visible on the
track; arrow through a bound and confirm it stops; with `locale` set, confirm
the announcement is the formatted string and not the raw number; repeat in an
RTL container and confirm ← increases.

### Container behavior

No `@container` rules. It fills. The track has no minimum useful width the
component can enforce — RULES §1 forbids it from trying — so the "don't" below
says where a slider does not belong.

### Usage

```tsx
<Field label="Volume">
  <Slider min={0} max={11} defaultValue={7} />
</Field>

<Field label="Budget" description="Adjust to filter results.">
  <Slider
    max={500}
    step={25}
    locale="en-GB"
    formatOptions={{ style: 'currency', currency: 'GBP' }}
    onValueCommit={refetch}
  />
</Field>
```

### Don't

```tsx
// ✗ onValueChange fires on every pixel of a drag. This is one request per
//   pointer move.
<Slider onValueChange={refetch} />

// ✓
<Slider onValueChange={setLocal} onValueCommit={refetch} />

// ✗ A slider cannot express a precise number, and the user cannot type one.
//   Anything a person would otherwise read off a receipt is a NumberInput.
<Field label="Invoice total"><Slider min={0} max={100000} /></Field>

// ✗ readOnly is not supported by the platform for a range input and is
//   silently ignored (§3.15). A slider that must not move is disabled.
<Slider readOnly />
```

---

## Implementation order

One at a time (Gate A).

| # | Component | What it introduces |
| --- | --- | --- |
| 1 | `NumberInput` | The numeric contract (§1), `null`-as-empty (§2), commit-time clamp and snap (§3), the `Intl` format/parse pair (§4), the inverted surface (§9) |
| 2 | `Slider` | Only the vendor pseudo-elements (§8) and the inline fill percentage |

`NumberInput` first, because §1–§4 are shared and it is where they get written.
`Slider` then reuses them and adds one new problem, which is the same criterion
3C ordered itself by.

## RSC

Both are `'use client'`, and both genuinely need it: `useField()` is a context
read, `useControllableState` is state, and both carry event handlers. `lint:rules`
decides the directive by walking the AST for hook identifiers (D-035), so it is
enforced rather than remembered.

Neither touches `window`, `document` or `matchMedia` at module scope.
`Intl.NumberFormat` exists in Node and in every browser the package targets, is
constructed during render rather than at module scope, and is given an explicit
locale or not used at all (§4) — so it produces the same string on both sides of
hydration.

## Testing notes

Beyond the Definition of Done's standing requirements:

- **The floating-point snap is asserted with the number that breaks it** (§3).
  `step={0.1}` from `min={0}`, three increments, must be `0.3` and not
  `0.30000000000000004`. It passes trivially with integers, which is why it goes
  in as a named case.
- **The locale round-trip is asserted in both directions.** `locale="de-DE"`,
  `formatOptions={{ minimumFractionDigits: 1 }}`: `1234.5` displays as
  `1.234,5`; typing `1.234,5` and blurring commits `1234.5`. The parser is built
  from `formatToParts`, so the test is what proves it is not `en-US` with extra
  steps.
- **Hydration is asserted, not reasoned about** (§4). A server render and a
  client render of the same `<NumberInput locale="de-DE" value={1234.5} />`
  produce the same markup, and the no-`locale` case produces `String(value)` in
  both. This is the first component in the library where RULES §7's last line
  could fail without anyone noticing.
- **Every claim about what a screen reader perceives is asserted in the
  browser**, not in jsdom (D-030 §2). The computed role of the spinbutton, the
  presence and absence of `aria-valuenow`, and the stepper names belong in
  `tests/visual/harness.spec.ts`.
- **The vendor pseudo-element duplication is guarded by a browser assertion**
  (§8), because no lint rule can see it: the thumb's computed size at `md` is
  read in both Chromium and Firefox projects and must match. Grouping the
  selectors makes the Firefox assertion fail, which is the only way this bug
  ever announces itself.
- **Every browser check proves the break reached the served CSS first**
  (D-037 §4): `curl` the stylesheet the page links and grep the *served* file.
- **A test is verified by failing on the symptom it names** (D-035 §3). The
  checks worth breaking deliberately here: the `type="button"` on the steppers
  (break it inside a `<form>` and watch a submit), the commit-time clamp (break
  it to clamp on keystroke and watch `15` become untypeable at `step={10}`),
  `--_pp-slider-fill` being written unconditionally (break it and watch a nested
  slider inherit its ancestor's fill — D-024's hazard, third occurrence), and
  `aria-valuenow`'s omission while empty.
- **The `Matrix` id constraint** (3C §12) applies to both playground pages.

## Open questions — resolved at Gate C, 2026-09-21

**1. `aria-valuenow` on a `spinbutton` with no value — omission stands.**
ARIA 1.2 did relax it from required to optional. Verified against two local
sources rather than from memory, because `w3.org` and MDN are both unreachable
from this environment: **axe-core 4.13** lists `aria-valuenow` in `spinbutton`'s
`allowedAttrs` and gives the role no `requiredAttrs` at all, and **aria-query
5.3** reports `requiredProps: {}` for it. Both list it as *required* for
`slider`, which is the control that confirms the two roles really are treated
differently rather than the data simply being thin. axe-core is also the gate
the Definition of Done runs, so the check and the standard are the same source.

**2. `role="spinbutton"` at all — kept, with the walkthrough NOT run.** The
spec said the decision should be made from a VoiceOver/NVDA walkthrough rather
than from a paragraph. No screen reader is available in this environment, so
that walkthrough has not happened and this is the one Definition of Done line
that is attested by reasoning rather than by evidence. Recorded as such in
D-051 §5 rather than ticked. What *was* checked in a real browser: the computed
role, the accessible name, and the presence and absence of each value attribute.

**3. `Slider` in this gate — yes, single-thumb.** No change.

**4. lightningcss and the vendor pseudo-elements — passes them through.**
Measured: all five of `::-webkit-slider-runnable-track`,
`::-webkit-slider-thumb`, `::-moz-range-track`, `::-moz-range-progress` and
`::-moz-range-thumb` survive `--bundle --targets 'defaults'` byte for byte. It
also leaves `appearance: none` unprefixed, which is what the existing build
already ships for `Input` and `Select`, so the target set needs no `-webkit-`
companion.

**5. §0 — `Form` moved out of this gate.** Approved.

**A sixth, found rather than asked (D-051 §4): §8's Firefox guard cannot
exist.** The spec said the vendor-pseudo-element duplication would be "read in
both Chromium and Firefox projects". `playwright.config.ts` defines **one**
project, chromium, and the environment ships one browser. A browser assertion
that cannot run is worse than none, because it reads as covered. The guard is a
**source rule** in `lint:rules` instead — no selector list may mix a `-webkit-`
and a `-moz-` pseudo-element — which is a static check of the exact failure
mode, runs everywhere, and gets a fixture in the linter's own self-test (D-009).
