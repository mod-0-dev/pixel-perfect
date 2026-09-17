# Tier 3A — Action Core

| | |
| --- | --- |
| **Tier** | 3A |
| **Status** | `done` — all five implemented 2026-09-17 (D-027 … D-033) |
| **Components** | 3.1 `Button` · 3.2 `IconButton` · 3.3 `Link` · 3.4 `ButtonGroup` · 3.5 `Toggle` |
| **Depends on** | Tier 0 (`done`), Tier 1 (`done`), Tier 2 (`done`) |
| **Approval** | One gate for the group — see §0 below, which revisits [D-014](../DECISIONS.md#d-014) as that entry instructed |
| **APG patterns** | [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/), [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) (consulted, deliberately not adopted — §8) |

### Progress

| Component | Status | Component | Status |
| --- | --- | --- | --- |
| 3.1 `Button` | `done` | 3.4 `ButtonGroup` | `done` |
| 3.2 `IconButton` | `done` | 3.5 `Toggle` | `done` |
| 3.3 `Link` | `done` | | |

This is the first tier with a keyboard, a focus ring, a disabled state, or a
pointer. Everything Tiers 1 and 2 built was inert: `Badge` has a tone but
nothing happens when you press it, and `Scroller` — Tier 2's lone client
component — is interactive only in the sense that a scrollbar is.

So these five are not just five components. They are where the library decides
what a focus ring looks like, how tall a control is, what `disabled` means on
something that is not a `<button>`, and which of `variant` / `tone` carries
hierarchy. Every one of those answers is inherited by the eleven form components
in 3B and 3C and by every overlay trigger in Tier 4. Getting them wrong here is
not one bad component; it is a library-wide accent.

They are specified together because the questions that matter cut across all
five, and because three of them (`IconButton`, `ButtonGroup`, `Toggle`) are
defined entirely in terms of `Button` — reviewing them apart from it would be
reviewing a diff without its base.

---

## §0 — Revisiting D-014, as D-014 asked

[D-014](../DECISIONS.md#d-014) relaxed Gate C to approve a **group** of specs at
a time, then carved Tier 3 back out:

> This does not extend to Tiers 3 and 4. `Field` and the overlay foundation are
> where API mistakes get expensive, and they are approved individually.
> **Revisit this entry before spec'ing Tier 3.**

Revisited. The carve-out's stated reason names two components — `Field` and the
overlay foundation. Tier 3 has sixteen. Applying the exception to all sixteen
applies it considerably more broadly than the reason it was given for supports,
and costs sixteen round trips to approve things like "a link is underlined".

**Proposal: Tier 3 splits into four approval groups, and D-014's carve-out
narrows to the one component it was actually written about.**

| Group | Components | Gate C |
| --- | --- | --- |
| **3A — Action core** | 3.1 `Button`, 3.2 `IconButton`, 3.3 `Link`, 3.4 `ButtonGroup`, 3.5 `Toggle` | **one gate for the group** — this document |
| **3B — Field foundation** | 3.6 `Label`, 3.7 `Field` | **individually**, `Field` especially. This is what D-014 was protecting |
| **3C — Native inputs** | 3.8 `Input`, 3.9 `Textarea`, 3.10 `Checkbox`, 3.11 `Radio`/`RadioGroup`, 3.12 `Switch`, 3.13 `Select` | one gate for the group, **after 3B is `done`** |
| **3D — Composite inputs** | 3.14 `NumberInput`, 3.15 `Slider`, 3.16 `Form` | one gate for the group |

Tier 4 is untouched: 4.1 the overlay foundation is still approved on its own.

The group argument that applied to Tier 1 applies here with more force, not
less. D-014's own strongest line was that reviewing a group together "is the
only way to catch the inconsistencies between components that matter most — a
`size` that means one thing in `Badge` and another in `Text`." That failure mode
is *more* likely in 3A than it was in Tier 1, because these five share a height
scale, a focus ring, a disabled semantic and a pressed semantic. Approving
`Button` alone and `Toggle` three sessions later is how `Toggle` ends up with
`checked` where `Button` has `pressed`.

Gate A is unaffected: five components may sit in `spec`, exactly one may be in
`build`. Implementation order is §11.

---

## Decisions this batch asks you to approve

Sections 1–10 are rulings or open choices. Everything after §11 is routine
template.

### 1. `--pp-control-*` — the shared control metrics

RULES §3 promised this and named the date:

> Cross-component agreement that genuinely needs a shared definition — how tall
> a medium control is — gets a `--pp-control-*` set **when Tier 3 lands.**

It has landed. A `Button`, an `Input` and a `Select` sitting in one `Cluster` at
`size="md"` must be the same height to the pixel, or every form in every
consuming app is subtly crooked. Today nothing makes that true: `Badge` picked
`--pp-size-6` for `md` and wrote the number into its own stylesheet, which is
fine for a chip that answers to nobody and fatal for a control that has to line
up with four others built in four different sessions.

**Proposal: a new `src/styles/tokens/control.css`, imported into
`@layer pp.tokens`.**

| Token | Value | Computes to |
| --- | --- | --- |
| `--pp-control-height-sm` | `var(--pp-size-8)` | 32px |
| `--pp-control-height-md` | `var(--pp-size-10)` | 40px |
| `--pp-control-height-lg` | `var(--pp-size-12)` | 48px |
| `--pp-control-padding-inline-sm` | `var(--pp-space-2)` | 8px |
| `--pp-control-padding-inline-md` | `var(--pp-space-3)` | 12px |
| `--pp-control-padding-inline-lg` | `var(--pp-space-4)` | 16px |
| `--pp-control-gap-sm` | `var(--pp-space-1)` | 4px |
| `--pp-control-gap-md` | `var(--pp-space-2)` | 8px |
| `--pp-control-gap-lg` | `var(--pp-space-2)` | 8px |
| `--pp-control-font-size-sm` | `var(--pp-font-size-2)` | 14px |
| `--pp-control-font-size-md` | `var(--pp-font-size-2)` | 14px |
| `--pp-control-font-size-lg` | `var(--pp-font-size-3)` | 16px |
| `--pp-control-radius` | `var(--pp-radius-2)` | 6px |

Every value is an alias onto an existing scale. Nothing new is invented; what is
new is that five components now agree by construction instead of by vigilance.

**32 / 40 / 48 and why.** They are `--pp-size-8`, `-10` and `-12` exactly — the
three round steps on the size scale — so the ramp reads as a ramp. All three
clear WCAG 2.2 SC 2.5.8 (24×24 CSS px minimum target) on both axes without a
hit-area hack, and `lg` at 48px is a comfortable primary action on a phone.

**`sm` and `md` share a font size on purpose.** A 12px control label is a
readability problem, not a size step. `sm` gets smaller by losing height and
padding, which is what "small" means for a control; the text stays legible.

**Is this a D-015 violation?** No — it is the carve-out D-015 itself left.
D-015 rejected semantic aliases over dimensional primitives on the grounds that
`--pp-color-spacing-cosy` over `--pp-space-3` "would add a name and change
nothing," because a space step is the same value in every theme and every tone.
That reasoning is about *aliasing for its own sake*. `--pp-control-height-md`
changes something real: it is the single definition five stylesheets read, and
moving it moves all five. RULES §3 anticipated precisely this and said so in the
same paragraph that D-015 amends.

**Where they live, and why not `_shared/`.** D-020 put the `gap` scale in
`src/components/_shared/layout.css` because it maps an *attribute* to a value —
that is component CSS and belongs in `@layer pp.components`. The control metrics
are not attribute-driven; they are theme-invariant named values that a consuming
app will want to retune once, globally, which is what the token layer is for.
They also earn a row in the `/tokens` playground gallery, and that gallery reads
tokens.

**Rejected:** putting them in `primitives.css`. They are aliases onto
primitives, and a primitive that is defined in terms of another primitive is how
a token layer stops being two-tier.

### 2. The focus ring, decided once for the whole library

`--pp-color-focus-ring`, `--pp-focus-ring-width` and `--pp-focus-ring-offset`
have existed since Tier 0.2 and **no component has ever used them**, because no
component before this one could be focused. Whatever 3A does here, forty
components will copy.

**Proposal:**

```css
.pp-button:focus-visible {
  outline: var(--pp-focus-ring-width) solid var(--pp-color-focus-ring);
  outline-offset: var(--pp-focus-ring-offset);
}
```

Three rulings inside that:

**(a) `outline`, not `box-shadow`.** Outline follows `border-radius` in every
browser we target, costs no layout, and survives an ancestor's `overflow:
hidden` — which a `box-shadow` ring does not, and which matters the moment a
button sits inside `Scroller` (2.8) or a Tier 4 popover. The stylelint config
has banned `outline: none` and `outline: 0` since Tier 0.7, which is the same
decision made in advance.

**(b) One ring colour, library-wide: `--pp-color-focus-ring`, not
`--pp-tone-focus`.** A per-tone ring is the tempting choice and it is wrong
twice over.

The checkable reason: `npm run lint:contrast` asserts exactly one thing about
rings — `focus ring vs page bg ≥ 3.0`, against `--pp-color-focus-ring`. The five
`--pp-tone-focus` values are asserted against nothing. Shipping a per-tone ring
would put an unverified colour on the single UI affordance RULES §6 calls out by
name, in a library whose whole contrast story is "solved numerically, not
eyeballed" (D-008).

The design reason: a focus ring answers "where am I", and the answer is easier
to find if it is the same colour every time. An accent ring around a danger
button is *more* legible than a danger ring around a danger button, not less.

`--pp-tone-focus` keeps a job — it is the tone-shifted **border** on a focused
form control in 3B/3C, where the border is inside the control and the ring is
outside it. If a future component wants it as a ring colour, that change ships
with five new assertions in `check-contrast.mjs`, not without them.

**(c) The ring is on the root, never on a child.** `IconButton` and `Toggle`
inherit the rule by being buttons; `ButtonGroup` does not draw a ring of its own
(§8).

**A thing the visual regression will adjudicate, not this document:** on a
`variant="solid" tone="accent"` button the ring is accent-on-accent separated by
a 2px offset of page background. If that reads as a smudge rather than a ring at
review, the fix is to raise `--pp-focus-ring-offset` — a token change, in one
place, affecting everything consistently. It is not a per-component override.

### 3. Button's defaults: `solid` / `neutral`, and `type="button"`

**`variant="solid"`, `tone="neutral"`.** This deliberately diverges from
`Badge`, which defaults to `ghost` on the reasoning that "a page of solid badges
has no hierarchy left". That reasoning does not transfer: a badge is decoration
and may recede, a button is an affordance and must look pressable. A bare
`<Button>Save</Button>` rendering as a ghost is a button nobody clicks.

Hierarchy still comes from `tone`, not from `variant`: the default is a neutral
solid (dark, quiet, obviously a button), and the one primary action per view
opts in with `tone="accent"`. The rule an app should end up following is *one
accent button per view*, which is enforceable by eye precisely because the
default is not accent.

**`type="button"`, diverging from HTML's `type="submit"`.** RULES §5 forbids
inventing a `type` *prop*; passing the native attribute through is not that, and
choosing its default is a real decision. HTML's default submits the nearest
form, which means every non-submit button placed inside a `<form>` — a "add
another row", a "cancel", a disclosure toggle — silently submits it. This is one
of the most common bugs in React applications and the cost of the alternative is
that `Form` (3.16) and every submit button must write `type="submit"` once,
explicitly, which is a thing worth writing explicitly.

### 4. No `iconStart` / `iconEnd`. Children compose

RULES §5.6 is composition over configuration, and a button that takes icons as
props grows `iconStart`, `iconEnd`, `iconSize`, `iconTone` within a year.

```tsx
<Button><Icon decorative><Save /></Icon> Save</Button>
```

The root is `inline-flex` with `gap: var(--pp-control-gap-<size>)`, so an icon
placed in children is spaced correctly with no API at all. `Icon` defaults to
`size="inherit"` (1em), so it tracks the button's font size for free. This is
exactly how `Badge`'s docs already show icons, so it is a convention being
continued rather than started.

`IconButton` (3.2) exists for the icon-only case, because that case needs a
different *type*, not a different prop.

### 5. `loading` sets `aria-disabled`, not `disabled`

A `disabled` button is removed from the tab order, and a browser blurs a focused
element the moment it becomes disabled. So the conventional pattern — click
Save, button disables while the request is in flight — takes focus away from a
keyboard or screen reader user at the exact moment they most need to know what
happened, and drops them at the top of the document.

**Proposal:** `loading` renders `aria-disabled="true"` and `data-loading`, keeps
the button focusable, and the component swallows `click` and the Enter/Space
activation itself.

`disabled` (the prop) remains the real native `disabled` attribute, because a
permanently unavailable control genuinely should not be in the tab order.

**The label stays put, and it stays named.** The spinner renders in an
absolutely-positioned overlay and the content span goes `opacity: 0`. The button
therefore does not change size when it starts loading — a button that shrinks
under the cursor mid-click is how a mis-click happens.

`opacity`, specifically, and not `visibility: hidden`. This shipped as
`visibility: hidden` and was caught by the browser assertion in
`tests/visual/harness.spec.ts`: `visibility: hidden` and `display: none` both
remove the label from the **accessibility tree**, so a button announced as
"Save" becomes a button announced as nothing at the exact moment it starts
working — which is the moment `loading` exists to protect. Only `opacity` hides
it visually and keeps the name. The jsdom test asserting the accessible name
passed against the broken version, because name computation there does not
consult layout.

**Announcement is the app's job, not the button's.** The spinner is
`decorative`; a `role="status"` inside a button is read inconsistently and
fights the button's own accessible name. An app that needs "Saving…" announced
should change the button's label, which is one prop and works everywhere:

```tsx
<Button loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
```

### 6. `data-state="on" | "off"` for `aria-pressed` controls

RULES §4 fixes the state vocabulary at
`open|closed|checked|unchecked|indeterminate`. A toggle button is none of those:
it is `aria-pressed`, not `aria-checked`, and calling it `checked` would tell a
consumer styling `[data-state="checked"]` that they were looking at a form
control with a value — which is `Switch` (3.12), a different component with a
different ARIA role and a different reason to exist.

**Proposal: `on` / `off` joins the RULES §4 vocabulary, scoped to
`aria-pressed` controls.** `checked` / `unchecked` stays scoped to `aria-checked`
controls. The two words then track the two ARIA properties exactly, and the
distinction between `Toggle` and `Switch` is visible in the DOM without reading
our source.

### 7. `Link` takes `underline`, not `variant`

RULES §5 fixes `variant` at `solid | outline | ghost | plain`. None of the four
describes anything a text link does, and redefining the word for one component
is the precise failure D-014 says group review exists to catch.

**Proposal:** `Link` takes no `variant`. It takes `tone`, and a new
`underline?: 'always' | 'hover' | 'none'`. This is not a synonym for a
vocabulary term — it names a thing the vocabulary has no word for, which is the
same ground `gap` was admitted on in D-020.

**Default `'always'`, which is the accessibility answer.** WCAG 1.4.1 (Use of
Color) says colour may not be the only visual means of conveying information,
and a link inside a paragraph that differs from the surrounding text only in
hue fails it for a substantial number of readers. `'hover'` is the deliberate
opt-out for navigation lists and card titles, where position and context already
say "link" — and choosing it is a judgement the app makes explicitly, once, at
the call site.

`Link` gets **no `size`** either: a link is inline text and takes the size of the
text it sits in. `Text` (1.1) is the component that sets a text size.

### 8. `ButtonGroup` is always attached — and the roadmap's Deps cell is wrong

The roadmap lists `ButtonGroup` deps as `3.1, 2.2`, implying it composes
`Cluster`. **It cannot, and it should not.**

It cannot: `Cluster` is `fill` and block-level; `ButtonGroup` is `hug`. Wrapping
one in the other would make the group stretch.

It should not: a `ButtonGroup` that merely puts space between buttons *is*
`<Cluster gap="2">`, and D-004 rejected `Box` for exactly this — a component
that duplicates a layout primitive is how sizing rules die.

**So `ButtonGroup` earns its existence by being the attached case and only the
attached case:** adjacent borders collapsed to one, end radii on the ends and
square corners inside, a single visual unit. There is no `attached` prop,
because `attached={false}` is spelled `<Cluster>`.

**Proposed roadmap correction:** 3.4 Deps `3.1, 2.2` → `3.1`. Surfaced rather
than silently edited, per the skill's tracking discipline.

**`role="group"` with every button tabbable — not the APG Toolbar pattern.** The
APG's Toolbar pattern specifies roving tabindex, so a toolbar is one tab stop.
That is right for a dense, persistent toolbar of twenty controls and wrong for
three attached buttons, where it costs a keyboard user an arrow-key discovery
step to reach something a single Tab would have reached. `Toolbar` (6.6) is the
roving-tabindex component and this is why it is a separate entry. Recorded here
as a deliberate APG divergence, per RULES §6.

A group needs an accessible name, so `label` is **required**, as it is on
`IconButton`.

### 9. `asChild` with `disabled` is best-effort, and documented as such

`Button`, `IconButton`, `Link` and `Toggle` all take `asChild` (RULES §5.7,
D-003) — `Link` needs it for `next/link`, and "a link styled as a button" is the
single most common reason anyone reaches for it.

An `<a>` has no `disabled` attribute. When `asChild` and `disabled` are both
set, the component emits `aria-disabled="true"`, `data-disabled`, `tabIndex={-1}`,
and swallows click and key activation. That is the best the platform allows and
it is genuinely weaker than a native `disabled` — a determined user can still
reach it.

**Rejected:** making the combination a type error. It is expressible, but it
turns a documented soft edge into a hard wall in the one case (`asChild` +
conditionally disabled) that real apps hit constantly, and the workaround people
would reach for is worse than the thing being prevented. The docs page carries
an explicit "don't": a link that should not be followed should not be rendered
as a link.

### 10. `Button` is a client component because of its click handler, and the linter will not tell you that

`npm run lint:rules` decides `'use client'` by scanning for hooks
(`useState`, `useId`, …). `Button` uses none. It is nonetheless a client
component, because §5 requires it to wrap `onClick` with its own function in
order to swallow activation while `loading`, and a Server Component may not pass
a function to a DOM element's event handler.

Recorded here because the gap is real: the linter enforces `'use client'` where
hooks appear, and it would not have caught its absence here. `Link` (3.3) and
`ButtonGroup` (3.4) have no handler of their own and stay `server`.

| Component | RSC | Why |
| --- | --- | --- |
| 3.1 `Button` | `client` | wraps `onClick` to swallow activation while `loading` |
| 3.2 `IconButton` | `client` | renders `Button` |
| 3.3 `Link` | `server` | an anchor and nothing else |
| 3.4 `ButtonGroup` | `server` | a container and nothing else |
| 3.5 `Toggle` | `client` | uncontrolled state (`useState`) |

### 11. Implementation order

One at a time, Gate A unchanged. Each lands its own commit and its own DoD pass.

1. **`--pp-control-*` tokens + the focus-ring pattern** — not a component;
   ships with `Button`.
2. **3.1 `Button`** — everything below depends on it.
3. **3.3 `Link`** — independent of 3.1, and the cheapest of the five. Slots in
   here so the `asChild` plumbing gets a second consumer early.
4. **3.2 `IconButton`**
5. **3.5 `Toggle`**
6. **3.4 `ButtonGroup`** — last, because it styles the other four.

---

## 3.1 `Button`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` (§10) |
| **Depends on** | T2, 1.6 `Spinner` |
| **APG pattern** | [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) |

### Purpose

A control that performs an action when activated. It renders a real `<button>`,
or delegates to a child element via `asChild`.

It does **not** navigate — that is `Link` (3.3), and a button that navigates is
a button a user cannot middle-click, cannot open in a new tab, and cannot see
the destination of. It does **not** own a pressed state (`Toggle`, 3.5), a
checked state (`Switch`, 3.12), or a menu (`DropdownMenu`, 4.7). It does not
validate, submit or serialise anything; `Form` (3.16) does that.

### Sizing contract justification

`hug`. A button is sized by its label. `inline-flex`, no width declaration — so
it sizes to content in every layout context, and a caller who wants a full-bleed
button puts one in a `Stack` with `align="stretch"`, which is the parent making
a layout decision exactly as RULES §1 requires. There is no `fullWidth` prop and
there will not be one.

### Anatomy

```
<button class="pp-button" data-variant data-pp-tone data-size [data-loading] [data-disabled]>
  ├── <span class="pp-button__content">   ← children; opacity:0 while loading
  └── <span class="pp-button__spinner">   ← only while loading; absolutely centred
        └── <Spinner decorative>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-button` | `<button>`, or the `asChild` child | Carries every `data-*`, the focus ring, and the ref |
| Content | `pp-button__content` | `<span>` | `inline-flex` + control gap, so icons in children space themselves (§4) |
| Spinner slot | `pp-button__spinner` | `<span>` | `position: absolute; inset: 0; display: grid; place-items: center`. Rendered only while `loading` |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'solid'` | §3 |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | §3. Hierarchy lives here |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 32 / 40 / 48px tall, from `--pp-control-height-*` |
| `loading` | `boolean` | `false` | `aria-disabled`, focusable, activation swallowed (§5) |
| `disabled` | `boolean` | `false` | Native `disabled`. With `asChild`, degrades per §9 |
| `asChild` | `boolean` | `false` | Renders the single child element instead of a `<button>` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | §3. Not emitted when `asChild` |

Plus every `<button>` attribute. `ref` goes to the root. Exported as
`ButtonProps`.

**Deliberately absent:** `fullWidth`, `iconStart` / `iconEnd` (§4), `href`
(that is `Link`), `pressed` (that is `Toggle`), `loadingText` (§5).

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Hover | `:hover` | `--pp-tone-solid-hover` (solid) / `--pp-tone-bg-hover` (others) |
| Active | `:active` | `--pp-tone-bg-active`; solid keeps `--pp-tone-solid-hover` (§ open question 2) |
| Focused | `:focus-visible` | The library ring (§2) |
| Loading | `data-loading` + `aria-disabled="true"` | Content at `opacity: 0` (§5), spinner centred, cursor `progress` |
| Disabled | `data-disabled` + native `disabled` | `--pp-color-text-disabled`, `cursor: not-allowed`, no hover response |

`pointer-events: none` is **not** used for either disabled state — it kills
`title`, breaks a Tooltip (4.3) wrapping a disabled button, and makes
`cursor: not-allowed` impossible to show. Pointer interaction is suppressed by
the native attribute or by the handler, not by hiding the element from the
pointer.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-button-bg` | per `variant` × tone context | Background |
| `--pp-button-color` | per `variant` | Label colour |
| `--pp-button-border-color` | per `variant` | Border |
| `--pp-button-radius` | `--pp-control-radius` | Corners |
| `--pp-button-height` | `--pp-control-height-<size>` | Block size |
| `--pp-button-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding |
| `--pp-button-gap` | `--pp-control-gap-<size>` | Space between children |

Per D-024 none of these is ever written inline by the component; props drive
`data-*` attributes and the stylesheet reads the public property first.

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves focus to/from the button. A `loading` button stays in the order (§5); a `disabled` one does not |
| `Enter` | Activates. Swallowed while `loading` or `aria-disabled` |
| `Space` | Activates on keyup. Swallowed while `loading` or `aria-disabled` |

Matches the APG Button pattern exactly. Both keys are the browser's native
behaviour on a real `<button>` and are not reimplemented; the only added code is
the suppression path.

**Manual walkthrough recorded at review:** Tab to the button, Space to activate,
Tab past it, Shift+Tab back, then toggle `loading` while focused and confirm
focus does not move and Enter does nothing.

### Accessibility notes

- Role `button`, native. The accessible name is the text content.
- An icon-only `Button` has no accessible name. That is what `IconButton` is for
  and the reason it is a separate type rather than a prop.
- `loading` deliberately does not use `aria-busy`: `aria-busy` describes a region
  whose content is being updated, not a control that is working.
- Contrast is settled at the token layer (D-008); no per-variant check needed
  here beyond the axe run.

### Container behavior

None. A button is `hug` and has no `@container` rule. A long label does not wrap
by default (`white-space: nowrap`), matching `Badge`: a button that becomes four
lines of one word in a narrow sidebar is a layout accident, and a button whose
label needs wrapping needs a shorter label.

### Usage

```tsx
<Button tone="accent" onClick={save}>Save</Button>

<Button variant="outline" onClick={cancel}>Cancel</Button>

<Button tone="danger" loading={deleting} onClick={destroy}>
  {deleting ? 'Deleting…' : 'Delete'}
</Button>

<Button asChild>
  <NextLink href="/settings">Settings</NextLink>
</Button>

<Cluster gap="2" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button tone="accent" type="submit">Save changes</Button>
</Cluster>
```

### Don't

```tsx
// ✗ hug means hug. There is no fullWidth, and there is no width prop.
<Button style={{ width: '100%' }}>Save</Button>
// ✓ the parent decides
<Stack align="stretch"><Button>Save</Button></Stack>

// ✗ a button that navigates loses middle-click, new-tab, and the status bar.
<Button onClick={() => router.push('/settings')}>Settings</Button>
// ✓
<Button asChild><Link href="/settings">Settings</Link></Button>

// ✗ every button is the primary button, so none of them is.
<Button tone="accent">Cancel</Button>
<Button tone="accent">Save</Button>

// ✗ no accessible name.
<Button><Icon decorative><Trash /></Icon></Button>
// ✓
<IconButton label="Delete"><Trash /></IconButton>
```

---

## 3.2 `IconButton`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` (renders `Button`) |
| **Depends on** | 3.1, 1.3 `Icon` |
| **APG pattern** | Button |

### Purpose

A square `Button` whose entire content is one icon, and which **cannot be
constructed without an accessible name**. It exists as a separate component
rather than a `Button` prop because that guarantee is a type, not a runtime
check — RULES §6 requires the type system to make the omission impossible.

### Sizing contract justification

`hug`, inherited from `Button`. Square: `inline-size` equals
`--pp-control-height-<size>`. This is the D-019 exemption — an intrinsically
square control, like `Icon`, `Spinner` and `Avatar` — and the file needs the
same per-file `inline-size` carve-out in `.stylelintrc.json` those three have.
It is not a decision about how much of the parent to occupy.

### Anatomy

```
<button class="pp-button pp-icon-button" aria-label="…" data-size …>
  └── <span class="pp-button__content">
        └── <Icon decorative size={size}>  ← the SVG passed as children
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-button pp-icon-button` | `<button>` | Carries both classes: every `Button` override property still applies |
| Icon | `pp-icon` | `<span>` | `Icon` wraps the child SVG as `decorative`; the name is on the root |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** Becomes `aria-label` on the root |
| `children` | `ReactNode` | — | **Required.** The raw SVG. Wrapped in `<Icon decorative>` |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Diverges from `Button` — see below |
| `tone`, `size`, `loading`, `disabled`, `type` | as `Button` | as `Button` | |

**Refined at build time: no `asChild`.** The table above listed it as inherited.
It cannot be: `Button`'s `asChild` delegates to the element passed as
`children`, and here `children` is the SVG, so there is no slot left for a
delegate. Omitted from the type *and* destructured off before forwarding —
`Omit` removes a prop from a type, not from an object (D-031).

`aria-label` and `children` are `Omit`ted from the inherited `ButtonProps` and
redeclared, so `label` is the only way to name the control and it is not
optional. Exported as `IconButtonProps`.

**`variant` defaults to `'ghost'`, not `'solid'`.** An icon button is
overwhelmingly a secondary affordance — a close, a copy, an overflow menu, a
row action — and a grid of solid squares is visual noise. This is the one place
3A deliberately breaks its own default, and it is called out here so the
inconsistency is a decision rather than a drift.

**`size` maps to `Icon`'s own scale 1:1** — `sm`→16px, `md`→20px, `lg`→24px —
because `Icon`'s steps are already `--pp-size-4/5/6`. No new token.

### State

Identical to `Button`. `data-loading` hides the icon and centres the spinner the
same way; the button does not resize because it is square by height.

### Styling API

Every `--pp-button-*` property, plus:

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-icon-button-size` | `--pp-control-height-<size>` | Both axes |

### Keyboard interaction

Identical to `Button`.

### Accessibility notes

- The name comes from `label` → `aria-label`. The icon is always `aria-hidden`
  via `Icon`'s `decorative`, so the name is never doubled.
- `label` is a required `string`, so `label={undefined}` does not typecheck and
  `label=""` is a lint-visible mistake rather than a silent one.
- When `Tooltip` (4.3) lands, it reads the same `label`. The prop is named
  `label` rather than `aria-label` partly for that reason: it is content, not
  only an ARIA attribute.

### Usage

```tsx
<IconButton label="Close" onClick={close}><X /></IconButton>

<IconButton label="Copy to clipboard" variant="plain" size="sm" onClick={copy}>
  <Clipboard />
</IconButton>

<IconButton label="Delete row" tone="danger" loading={deleting}><Trash /></IconButton>
```

### Don't

```tsx
// ✗ does not typecheck, and that is the entire point of the component.
<IconButton><X /></IconButton>

// ✗ the icon is already hidden; this names it twice.
<IconButton label="Close"><Icon label="Close"><X /></Icon></IconButton>

// ✗ "icon" is not a name. Say what it does.
<IconButton label="Trash icon"><Trash /></IconButton>
// ✓
<IconButton label="Delete row"><Trash /></IconButton>
```

---

## 3.3 `Link`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | 1.1 `Text` |
| **APG pattern** | [Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/) |

### Purpose

Navigation. An `<a>` with the library's tone, underline and focus treatment, or
a delegate around `next/link` via `asChild`.

It does not know about routing, prefetching, or external-link detection. It does
not style itself as a button — `<Button asChild><Link …/></Button>` does that,
and composing it that way means the button styling lives in exactly one place.

### Sizing contract justification

`hug`. A link is inline text; it is sized by its content and flows with the
sentence around it. Never `inline-flex`, which would break it across a line wrap
and is the reason links in several well-known libraries cannot be used
mid-paragraph.

**Refined at build time: it declares no `display` at all**, rather than
declaring `inline`. An `<a>` is already inline, so the declaration would change
nothing on its own — and `asChild` can put two of this library's components on
the same element, where the later import in `@layer pp.components` simply wins.
A `display: inline` here would beat `Button`'s `inline-flex`. Declaring nothing
achieves the same rule and collides with nothing.

That is one collision avoided, not all of them: `Button` and `Link` both set
`color`, so composing them is still a mistake and both docs pages say so.
`<Button asChild>` takes a plain `<a>` or `next/link`.

### Anatomy

```
<a class="pp-link" data-pp-tone data-underline>
  └── children
```

One element. A link has no parts.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'accent'` | A link is the one place accent is the sane default |
| `underline` | `'always' \| 'hover' \| 'none'` | `'always'` | §7 |
| `asChild` | `boolean` | `false` | For `next/link` |

Plus every `<a>` attribute, `href` included. `ref` goes to the root. Exported as
`LinkProps`.

**No `size`** (§7), **no `variant`** (§7), **no `external`** — an app that wants
`target="_blank" rel="noreferrer"` plus an indicator writes those attributes,
which is three tokens of typing and avoids the library guessing what "external"
means behind a proxy.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Hover | `:hover` | `--pp-tone-text-strong`; underline appears if `underline="hover"` |
| Focused | `:focus-visible` | The library ring (§2) |
| Visited | `:visited` | Unstyled, deliberately — see below |

**`:visited` is left alone.** Styling it needs a colour that passes contrast in
both themes and against four tones, and browsers restrict which properties
`:visited` may change (colour is allowed; most else is not). Consumers who want
it have `.pp-link:visited` and a token. Noted so its absence is a decision.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-link-color` | `--pp-tone-text` | Text |
| `--pp-link-color-hover` | `--pp-tone-text-strong` | Text on hover |
| `--pp-link-underline-offset` | `--pp-space-1` | `text-underline-offset` |

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves focus to/from the link |
| `Enter` | Follows the link |

Native. Per the APG Link pattern, `Space` does **not** activate a link — that is
the platform distinction between a link and a button and it is not overridden.
An `<a>` without `href` is not focusable and is not made so; a link with nowhere
to go is a `<span>`.

### Accessibility notes

- `underline="always"` is the default because colour alone fails WCAG 1.4.1 (§7).
- The name is the link text. "Click here" and "read more" are an app-side
  problem the library cannot fix, and the docs page says so.
- `asChild` with `next/link` keeps the anchor semantics, because `next/link`
  renders an `<a>`.

### Container behavior

None. Links wrap with the text around them.

### Usage

```tsx
<Text>See the <Link href="/docs/rules">ground rules</Link> for why.</Text>

<Link asChild><NextLink href="/settings">Settings</NextLink></Link>

<Cluster gap="4">
  <Link href="/about" underline="hover">About</Link>
  <Link href="/pricing" underline="hover">Pricing</Link>
</Cluster>
```

### Don't

```tsx
// ✗ colour alone is not a signal — WCAG 1.4.1. In running text, keep the underline.
<Text>Read the <Link href="/x" underline="none">rules</Link>.</Text>

// ✗ reimplementing Button's styling on a link.
<Link href="/save" className="looks-like-a-button">Save</Link>
// ✓
<Button asChild><Link href="/save">Save</Link></Button>

// ✗ not focusable, not announced, not a link.
<Link onClick={doThing}>Do the thing</Link>
// ✓ an action is a Button
<Button variant="plain" onClick={doThing}>Do the thing</Button>
```

---

## 3.4 `ButtonGroup`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | 3.1 (**not** 2.2 — §8) |
| **APG pattern** | Toolbar, consulted and deliberately not adopted (§8) |

### Purpose

Two or more related buttons rendered as one attached visual unit: shared
borders, end radii on the ends, square corners between. A segmented set of
actions.

It does **not** space buttons out — that is `<Cluster gap="2">` (§8). It does
**not** manage selection; a segmented *control* where exactly one option is
chosen is a `RadioGroup` (3.11) styled as buttons, and one where several may be
is a set of `Toggle`s (3.5).

### Sizing contract justification

`hug`. The group is as wide as its buttons. `inline-flex`, `gap: 0`, no width
declaration. Per D-021 it may size the boxes it creates — here it does not even
do that; it only adjusts their borders and radii.

### Anatomy

```
<div class="pp-button-group" role="group" aria-label="…" data-orientation>
  └── <Button class="pp-button">  × n   ← restyled by descendant selector
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-button-group` | `<div>` | `role="group"`, named by `label` |
| Children | — | `<Button>` | Styled via `.pp-button-group > .pp-button`; the buttons are unmodified |

The group styles its children by selector rather than by cloning them with
props. Cloning would break `asChild`, break a child wrapped in a `Tooltip`
later, and require every child to be a `Button` — the selector approach degrades
gracefully when one of them is not.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** `aria-label` on the root. A group with no name is an unlabelled landmark for a screen reader |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Exposed as `data-orientation` (RULES §4) |

Plus every `<div>` attribute. `ref` goes to the root. Exported as
`ButtonGroupProps`.

**No `size`, `tone` or `variant`.** They would have to be forwarded to children,
which means cloning, which the anatomy note rules out. Set them on the buttons —
they are usually all the same and the repetition is honest.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Orientation | `data-orientation` | Flex direction; which corners get the radius; which border collapses |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-button-group-radius` | `--pp-control-radius` | The two outer corners |

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` | Moves to the next button. **Every button is its own tab stop** (§8) |
| `Enter` / `Space` | Activates the focused button |

A deliberate divergence from the APG Toolbar pattern, argued in §8.

**The focus ring wins the stacking order.** Buttons sit edge to edge, so a
focused button gets `z-index: var(--pp-z-raised)` and its ring is not painted
under the neighbour after it. This is the only reason the group touches
`z-index` and it uses the token, per RULES §3.

**Refined at build time: the seam is one border, not two overlapped.** The
standard `margin-inline-start: -1px` is forbidden by RULES §2 and refused by the
linter, and it turned out not to be needed — every child but the first drops its
leading border *on the group's own axis*, so there was never a doubled edge.
Solid children are the exception, since their border is transparent (D-033).

### Accessibility notes

- `role="group"` + `aria-label`, so a screen reader announces the set before
  the first button.
- Buttons keep their individual names; the group name is not a substitute.

### Container behavior

None. The group does not wrap: an attached set that wraps to two lines has the
wrong corners on four buttons. A set too wide for its container is too many
buttons, or belongs in a `Scroller` (2.8).

### Usage

```tsx
<ButtonGroup label="Text alignment">
  <IconButton label="Align left"><AlignLeft /></IconButton>
  <IconButton label="Align centre"><AlignCenter /></IconButton>
  <IconButton label="Align right"><AlignRight /></IconButton>
</ButtonGroup>

<ButtonGroup label="Export format" orientation="vertical">
  <Button variant="outline">CSV</Button>
  <Button variant="outline">JSON</Button>
</ButtonGroup>
```

### Don't

```tsx
// ✗ if you want space between them, you want a Cluster. (§8)
<ButtonGroup label="Actions" style={{ gap: 8 }}>…</ButtonGroup>
// ✓
<Cluster gap="2"><Button>Cancel</Button><Button>Save</Button></Cluster>

// ✗ unnamed group.
<ButtonGroup>…</ButtonGroup>

// ✗ this is a single-select control, not a group of actions.
<ButtonGroup label="View"><Button>Day</Button><Button>Week</Button></ButtonGroup>
// ✓ a RadioGroup, which announces "1 of 2 selected"
```

---

## 3.5 `Toggle`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` (uncontrolled state) |
| **Depends on** | 3.1 |
| **APG pattern** | [Button (toggle)](https://www.w3.org/WAI/ARIA/apg/patterns/button/) |

### Purpose

A button that stays pressed. Bold in a text editor; a filter chip that is on.

It is **not** `Switch` (3.12). A `Toggle` is `aria-pressed` — a button whose
effect is immediate and which has no value in a form. A `Switch` is
`role="switch"` with `aria-checked`, a form control that carries a value and
submits. If the thing has a label to its left and lives in a settings list, it
is a `Switch`. If it lives in a toolbar and has an icon, it is a `Toggle`.

### Sizing contract justification

`hug`, inherited from `Button`.

### Anatomy

```
<button class="pp-button pp-toggle" aria-pressed="true|false" data-state="on|off" …>
  └── <span class="pp-button__content">
```

Identical to `Button` plus `pp-toggle`, so every `--pp-button-*` override still
applies.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `pressed` | `boolean` | — | Controlled |
| `defaultPressed` | `boolean` | `false` | Uncontrolled |
| `onPressedChange` | `(pressed: boolean) => void` | — | Fires on activation in both modes |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Off is quiet; on fills in |
| `tone`, `size`, `disabled`, `asChild`, `type` | as `Button` | as `Button` | |

No `loading` — a toggle's effect is immediate by definition. Omitted from the
type *and* dropped before forwarding, per D-031. If it needs a
spinner, it is an action and belongs in `Button`. Exported as `ToggleProps`.

**`pressed` / `defaultPressed` / `onPressedChange`** is RULES §5.5's shape with
the noun that matches `aria-pressed`. Implemented on the shared
`useControllableState` hook (D-032), which every stateful component from here on
uses so that `undefined` cannot come to mean ten different things. Both modes are supported, per §5.5's "Both,
always. No exceptions." The controlled/uncontrolled switch is decided once at
mount from whether `pressed` is `undefined`, and a component that changes modes
mid-life warns in development — the React convention, and the thing every
consumer eventually does by accident.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| On | `data-state="on"` + `aria-pressed="true"` | `--pp-tone-bg-active`, `--pp-tone-text-strong`, border `--pp-tone-border` |
| Off | `data-state="off"` + `aria-pressed="false"` | The `variant`'s normal resting treatment |
| Disabled | `data-disabled` + native `disabled` | As `Button` |

§6 admits `on` / `off` to the RULES §4 vocabulary for this.

### Styling API

Every `--pp-button-*` property, plus:

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-toggle-bg-on` | `--pp-tone-bg-active` | Background when pressed |
| `--pp-toggle-color-on` | `--pp-tone-text-strong` | Label when pressed |

### Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves focus to/from the toggle |
| `Enter` | Toggles |
| `Space` | Toggles |

Matches the APG toggle-button pattern.

### Accessibility notes

- `aria-pressed` is **always** present — `"true"` or `"false"`, never absent —
  because a button with no `aria-pressed` is announced as a plain button and the
  user is never told it has two states.
- The accessible name does not change with state. "Bold" stays "Bold"; the
  pressed state is announced separately. A name that flips between "Bold" and
  "Unbold" is announced as a *different control* appearing.
- Icon-only toggles take the `IconButton` route for their name: a `Toggle` whose
  children are one icon needs `aria-label`, and the docs page says so. (A
  `ToggleIconButton` is not a component; three words of `aria-label` is cheaper
  than a fourth type.)

### Usage

```tsx
<Toggle defaultPressed onPressedChange={setBold} aria-label="Bold"><Bold /></Toggle>

<Toggle pressed={showArchived} onPressedChange={setShowArchived}>
  Show archived
</Toggle>
```

### Don't

```tsx
// ✗ a settings row is a Switch — it has a value and it submits.
<Toggle pressed={emails} onPressedChange={setEmails}>Email notifications</Toggle>

// ✗ the name must not change with the state.
<Toggle pressed={bold} aria-label={bold ? 'Unbold' : 'Bold'}><Bold /></Toggle>

// ✗ uncontrolled and controlled at once.
<Toggle pressed={on} defaultPressed onPressedChange={setOn} />
```

---

## Open questions

**Resolved at Gate C on 2026-09-17 — all four approved as recommended.**
Recorded as [D-027](../DECISIONS.md#d-027) … [D-030](../DECISIONS.md#d-030).

1. **`--pp-control-height-lg` at 48px** — generous, and correct for touch. On a
   dense desktop form it may read as oversized next to a 40px `md`. The
   alternative is 44px (`--pp-size-11`), which still clears every target-size
   requirement and tightens the ramp to 32/40/44. Recommendation: **keep 48.**
   `lg` should be visibly, unmistakably large, and the ramp is 32/40/48 —
   +8 each — which is the kind of regularity people notice without being told.

2. **Solid buttons have no `:active` colour.** The tone set ships
   `--pp-tone-bg`, `-bg-hover`, `-bg-active` and `--pp-tone-solid`,
   `-solid-hover` — there is no `--pp-tone-solid-active`. Solid buttons
   therefore cannot darken further on press without one. Options: (a) add
   `--pp-tone-solid-active` to the semantic layer, five tones × two themes, with
   the contrast assertions that implies; (b) have solid hold at `-solid-hover`
   on press and express the press with a 1px translate. Recommendation: **(a)**,
   because a press that produces no colour change on the loudest control in the
   library is the kind of thing that reads as a broken button, and (b) puts
   motion where reduced-motion users get nothing at all.

3. **`ButtonGroup` deps correction.** §8 proposes `3.1, 2.2` → `3.1` in
   `ROADMAP.md`. Flagged rather than applied, per the skill's tracking
   discipline.

4. **Does `Link` belong in 3A at all?** It is not an action, it does not share
   the control metrics, and it could sit in Tier 1 beside `Text`. It is here
   because `<Button asChild><Link/></Button>` is the composition that makes
   "link styled as a button" work, and specifying the two apart is how the two
   halves of that sentence end up disagreeing. Recommendation: **keep it here**,
   leave its roadmap row at 3.3.
