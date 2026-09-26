# 4.2 `Popover`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `spec`, approved — Gate C passed 2026-09-26 **by delegation** (D-061): written after the delegation was given, every recommendation adopted as written, and the decisions listed in the closing report for the user to revert before merge |
| **Sizing contract** | `hug`, with the overlay exception: `max-inline-size` from the measure scale (RULES §1 as amended by D-061 §3) |
| **RSC** | `client` — Radix state, a portal, positioning |
| **Depends on** | 4.1 Overlay foundation (built with it, in this PR); 3.1 `Button` (the usual trigger, by `asChild`) |
| **APG pattern** | None exactly. The content is a non-modal `dialog` (Radix's `role="dialog"`), so the [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) pattern's naming and focus rules apply to it, minus modality (§6). The [Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) pattern governs the trigger: `aria-expanded`, `aria-controls` |

The first Tier 4 component, and the one that exercises every piece of 4.1: the
dependency policy, the theme across the portal, the logical `side`, the z-index
token, the open/close motion. It is the component the roadmap named as the
"sizing contract exception — documented in spec", and §3 documents it.

## Purpose

A small panel of **interactive** content anchored to the control that opened
it: a date picker's calendar, a colour picker, a filter form, a "share" box, a
confirmation with two buttons. It is not modal by default — the page behind
it still works — and it dismisses on Escape, on an outside press, and when
focus leaves.

It deliberately does **not**: show on hover (that is `Tooltip`, 4.3, whose
content is not interactive); hold a menu of commands (`DropdownMenu`, 4.7,
whose keyboard model is different); trap focus or dim the page by default
(`Dialog`, 4.4, and `modal` here for the rare popover that must); draw an
arrow (§8, open question); or size itself to its trigger (§3).

---

## Decisions this spec asks you to approve

### 1. Compound, with Radix's parts and our names

```tsx
<Popover>
  <Popover.Trigger asChild><Button>Filters</Button></Popover.Trigger>
  <Popover.Content side="bottom" align="start">
    <Popover.Title>Filters</Popover.Title>
    <Popover.Description>Narrow the list.</Popover.Description>
    …
    <Popover.Close asChild><Button variant="ghost">Done</Button></Popover.Close>
  </Popover.Content>
</Popover>
```

RULES §5.6, and Radix's own shape, which every consumer of a headless library
already knows. Six parts: `Popover` (the root, holds state), `Trigger`,
`Content`, `Title`, `Description`, `Close`. No `Portal` part of ours — the
content is always portalled (4.1 §3), and the one thing a consumer controls
about that is `container` on `Content`. No `Anchor` part: anchoring a popover
to something other than its trigger is 4.11 `Combobox`'s need, and it is added
when that spec asks for it.

`Trigger` and `Close` render a `<button>` by default and take `asChild` to
become the `Button` the caller passes, which is the way almost every trigger
will be written. `asChild` is RULES §5.7's mechanism and the trigger's
`aria-expanded`, `aria-controls` and `data-state` merge onto the `Button`
through it.

### 2. The content is a named `dialog`, and `Title` names it

Radix renders the content as `role="dialog"`. A dialog without an accessible
name fails axe (`aria-dialog-name`) and fails the user, so the name is a
requirement, not a courtesy. Three ways to supply it, in order:

1. `<Popover.Title>` — renders a `<div>` with an id the content's
   `aria-labelledby` points at. A `<div>`, not a heading, for Alert.md §6's
   reason: the right level is the page's to know. Pass a `Heading` as the
   child when it really is a section.
2. `aria-labelledby` on `Content`, for a name that already exists elsewhere.
3. `aria-label` on `Content`, for a name with no visible text.

**The wiring is unconditional, and the gap is warned about.** `Content` sets
`aria-labelledby` to the title's id whenever the caller passed neither
`aria-label` nor `aria-labelledby`. If no `Title` rendered, that reference
dangles — assistive tech ignores it and the dialog is nameless — so in
development an effect looks the id up and warns once when nothing is there.
This is Radix `Dialog`'s own approach, and it is preferred to a registration
context (D-036: an effect, a state update, a first render in which the
attribute is wrong).

`Description` is the same shape for `aria-describedby`, without the warning: a
description is optional.

### 3. `hug`, and the ceiling is a measure — the roadmap's promised exception

A popover hugs its content: a two-button confirmation is two buttons wide. But
a popover holding a `Field` — every control in this library fills — would
grow to whatever its container allows, and its container is the viewport. It
therefore declares `max-inline-size`, which RULES §1 reserves for `Container`.

**The exception, stated for the whole tier (D-061 §3):** an overlay panel has
no parent in flow. RULES §1's rule is that the *parent* sizes the child, and
this child's parent is `<body>`. So it takes its ceiling from the measure
scale, the vocabulary for "how wide may content run", which gains
`--pp-measure-xs: 20rem` for exactly this class of box. The ceiling is
`min(--pp-popover-max-inline-size, the space floating-ui reports as
available)`, so a popover near a viewport edge shrinks rather than clips, and
`max-block-size` is the available height, so a tall one scrolls inside itself
rather than off the screen. Both are logical properties.

No `width` anywhere, no `min-inline-size`. A consumer who wants a fixed-width
panel sets `--pp-popover-max-inline-size` and puts a `fill` child inside.

### 4. `side` is logical, `sideOffset` and `collisionPadding` are steps of the space scale

The 4.1 §5 vocabulary: `side` is `top | bottom | start | end`, default
`bottom`; `align` is `start | center | end`, default `center`. `start`/`end`
resolve to physical `left`/`right` from the trigger's `direction` at open
time; `data-side` on the content reports the placed, physical side (4.1 §5 as
amended).

**Offsets are not bare numbers.** Radix's `sideOffset` and `collisionPadding`
are pixel numbers. RULES §3 says every value comes from a token, and a `8`
in a component's JavaScript is the same hardcoded pixel as an `8px` in its
CSS, one file over. So both are typed as `Space` — the D-020 index every layout
primitive's `gap` already takes — and resolved to pixels on the trigger
element at open time by 4.1's `resolveSpace`, which reads the token's computed
value and converts its unit. Defaults: `sideOffset="2"` (0.5rem), the gap a
`Stack` would leave; `collisionPadding="2"`.

### 5. `data-state` on trigger and content, the motion is one keyframe pair, exit stays mounted

Radix writes `data-state="open|closed"` on both the trigger and the content.
The content animates in with a fade and a scale from Radix's transform origin
(`--pp-duration-fast`, `--pp-easing-decelerate`) and out with the reverse
(`--pp-easing-accelerate`); Radix keeps the closing element mounted until the
exit animation ends. Under `prefers-reduced-motion` the reset crushes both,
so a reduced-motion user gets an instant open and close — asserted in the
browser, because it is the reset's rule and not this file's.

The trigger's visual open state is not styled here: a `Button` inside a
`Trigger` keeps its own states, and a consumer who wants a pressed look on an
open trigger styles `[data-state="open"]`.

### 6. Non-modal by default, `modal` for the popover that must

`modal={false}`: the page behind remains interactive and scrollable, an
outside press dismisses *and* reaches what was pressed, focus is not
trapped. `modal={true}` is Radix's modal popover: outside pointer events are
disabled, scroll is locked, the rest of the page is `aria-hidden`, focus is
trapped. It exists for a popover a flow cannot proceed past — a required
choice — and the docs page says that a popover that needs `modal` is usually
a `Dialog`.

Focus moves into the content on open (the first tabbable element, else the
content itself) and returns to the trigger on close — Radix's defaults, which
are APG's.

### 7. Controlled and uncontrolled, and nothing about *why* it closed

`open` / `defaultOpen` / `onOpenChange(open: boolean)` — RULES §5.5. Radix
does not report the dismissal reason on `onOpenChange`, and this spec does
not add one: a consumer who must veto Escape or an outside press does it with
the `onEscapeKeyDown` / `onInteractOutside` handlers Radix puts on the
content, which are passed through as-is and documented as Radix's.

### 8. What is left to 4.3 and later

- **An arrow.** Radix provides `Popover.Arrow` (an SVG). It is left out here:
  a popover with a border and a shadow reads as anchored without one, the
  arrow's colour has to match a border *and* a fill, and `Tooltip` is where
  an arrow earns its place. Open question 1.
- **`Anchor`**, for 4.11.
- **A `size`.** No `size` prop: the panel's padding is `--pp-space-4` and its
  type is the page's. `--pp-popover-padding` is the escape.

---

## Sizing contract justification

`hug`: an inline-level panel that sizes to its content, positioned by
floating-ui with `position: fixed`. The exception it needs — `max-inline-size`
and `max-block-size`, logical, from the measure scale and from the available
space — is §3, recorded as D-061 §3 and added to `.stylelintrc.json` as an
override for this file, the way D-019's `inline-size` exemption is.

## Anatomy

```
<button class="pp-popover__trigger" aria-expanded aria-controls data-state>   (or the asChild element)

body / container
  └── <div>                                            Radix's positioned wrapper (unstyled; z-index read from the root)
        └── <div class="pp-popover" role="dialog" id data-state data-side data-align data-pp-theme
                 aria-labelledby aria-describedby tabindex="-1">
              ├── <div class="pp-popover__title" id>          (optional)
              ├── <p class="pp-popover__description" id>      (optional)
              ├── {children}
              └── <button class="pp-popover__close">          (optional; or the asChild element)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Trigger | `pp-popover__trigger` | `<button>` or `asChild` | Radix's `aria-expanded`, `aria-controls`, `data-state`. `ref` → the element |
| Content | `pp-popover` | `<div role="dialog">` | The panel. `ref`, `className`, `style` and the rest land here. `data-pp-theme` is 4.1 §3's copy |
| Title | `pp-popover__title` | `<div>` | §2 |
| Description | `pp-popover__description` | `<p>` | §2 |
| Close | `pp-popover__close` | `<button>` or `asChild` | Closes on activation |

Radix's wrapper `<div>` is the one element in the tree that is not ours. It
carries only the position and the z-index it reads from `.pp-popover`.

## Props

**`Popover`** (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open: boolean) => void` | — / `false` / — | §7 |
| `modal` | `boolean` | `false` | §6 |
| `children` | `ReactNode` | — | The parts |

**`Popover.Trigger`**, **`Popover.Close`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Renders the child instead of a `<button>` |
| …rest | `ComponentPropsWithoutRef<'button'>` | — | |

**`Popover.Content`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` | §4 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `sideOffset` | `Space` | `'2'` | §4 |
| `collisionPadding` | `Space` | `'2'` | §4 |
| `container` | `Element \| null` | `document.body` | 4.1 §3 |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onOpenAutoFocus`, `onCloseAutoFocus` | Radix's | — | Passed through; each can `preventDefault()` |
| `aria-label` / `aria-labelledby` | `string` | — | §2; either suppresses the `Title` wiring |
| `className` / `style` | | — | Root |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | |

**`Popover.Title`**, **`Popover.Description`**: `ComponentPropsWithoutRef<'div'>` / `<'p'>`.

Exported types: `PopoverProps`, `PopoverTriggerProps`, `PopoverContentProps`,
`PopoverTitleProps`, `PopoverDescriptionProps`, `PopoverCloseProps`,
`PopoverSide`, `PopoverAlign`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on trigger and content | Content animates in / out (§5) |
| Placed side / align | `data-side`, `data-align` on content (physical) | Transform origin follows |
| Theme | `data-pp-theme` on content | Every token resolves in the trigger's theme |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-popover-bg` | `--pp-color-bg-raised` | Panel fill — the elevated surface, which differs from the page in dark |
| `--pp-popover-border-color` | `--pp-color-border-subtle` | Panel edge. Decoration: the shadow carries the elevation, the edge is not a control boundary (RULES §3) |
| `--pp-popover-radius` | `--pp-radius-3` | Corners |
| `--pp-popover-padding` | `--pp-space-4` | Inside |
| `--pp-popover-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-popover-max-inline-size` | `--pp-measure-xs` | The ceiling (§3) |

Text is `--pp-color-text`, declared on the panel because the portal leaves
whatever the app set on a wrapper.

**Contrast, computed at the gate (D-048 §1).** `--pp-color-text` on
`--pp-color-bg-raised` is neutral step 12 on step 1 (light) and step 3 (dark),
both asserted by `lint:contrast` as text on a component background. The edge
is `border-subtle`, which carries no obligation by design (D-050). The focus
ring on a control inside the panel is 0.11's cross-hue set against steps 1–3,
and `bg-raised` is step 1 or 3. Nothing new is asserted and nothing missing is
leaned on.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Enter / Space on the trigger | Toggles. Native button activation; Radix listens to click |
| Escape (content or anything inside it) | Closes; focus returns to the trigger. Only the topmost layer (4.1 §8) |
| Tab / Shift+Tab | Moves through the content's tabbables. Non-modal: leaving the content closes it (`onFocusOutside`). Modal: loops |
| Enter / Space on `Close` | Closes |

Every row is Radix's. The component installs no key handler.

## Accessibility notes

- Trigger: `aria-expanded`, `aria-controls` → the content's id, `aria-haspopup="dialog"`.
- Content: `role="dialog"`, named per §2, `tabindex="-1"` so it can receive
  focus when nothing inside is tabbable.
- Focus enters on open, returns to the trigger on close.
- **Manual walkthrough:** Tab to the trigger, Enter, confirm focus is inside
  the panel and the name is announced; Tab through the controls; Escape,
  confirm focus is on the trigger; open with the pointer and click outside,
  confirm it closes and the outside click landed; open a popover in a dark
  region of a light page and confirm the panel is dark; repeat with
  `dir="rtl"` and `side="start"`, confirm the panel is on the right.

## Container behavior

None of its own — it is positioned against the viewport. Its *ceiling* is
the lesser of the measure and the available width, so it never overflows the
viewport at any container width.

## Usage

```tsx
<Popover>
  <Popover.Trigger asChild>
    <Button variant="outline">Filters</Button>
  </Popover.Trigger>
  <Popover.Content align="start">
    <Popover.Title>Filters</Popover.Title>
    <Stack gap="3">
      <Field label="Status"><Select>…</Select></Field>
      <Cluster justify="end">
        <Popover.Close asChild><Button variant="ghost">Cancel</Button></Popover.Close>
        <Button onClick={apply}>Apply</Button>
      </Cluster>
    </Stack>
  </Popover.Content>
</Popover>
```

## Don't

```tsx
// ✗ No name. The dialog role requires one; Title, aria-labelledby or aria-label.
<Popover.Content>…</Popover.Content>

// ✗ Hover content. A popover is interactive; a hover panel is a Tooltip.
<Popover.Trigger asChild><Button onMouseEnter={open}>…</Button></Popover.Trigger>

// ✗ A physical side. `start` and `end` reverse with the layout.
<Popover.Content side="left" />

// ✗ A pixel offset. Offsets are steps of the space scale.
<Popover.Content sideOffset={8} />

// ✗ modal for a "you must choose". That is a Dialog.
<Popover modal>…</Popover>
```

## Testing notes

- **Unit (jsdom):** open/close by click, Escape, outside pointerdown;
  controlled and uncontrolled; `aria-expanded` / `aria-controls` / `role`;
  `Title` and `Description` wiring, the dev warning when no name exists;
  `asChild` onto `Button`; `data-state` on both; the theme copy from a
  `renderWithTheme` dark scope; `resolveSide` and `resolveSpace` as pure
  functions with injected direction and token values; axe with the popover
  open.
- **Browser:** the panel's `z-index` is `--pp-z-popover` and Radix's wrapper
  carries the same number; `side="start"` places the panel to the left in
  LTR and to the right in `dir="rtl"`; `sideOffset="2"` is 8px between
  trigger and panel; the panel is dark inside a dark region of a light page
  (`data-pp-theme` and the resolved background); focus enters on open and
  returns on Escape; an outside click closes a non-modal popover and its
  target receives the click; reduced motion opens instantly.
- **Break checks (D-035 §3):** swap `resolveSide`'s direction read for a
  constant (RTL test); drop `data-pp-theme` from the content (theme test);
  pass Radix a bare `8` instead of `resolveSpace` (offset test still
  passes — record that this break is *not* observable, the token and the
  number agree, and the guard is the type); drop `z-index` from the CSS
  (stacking test); drop the `aria-labelledby` wiring (name test).
- **Screenshot:** the playground opens one popover per Matrix cell with
  `defaultOpen`. Whether a `position: fixed` panel anchored far down the page
  captures correctly in a full-page screenshot is **unverified before the
  build** and is the first thing it checks.

## Open questions

Resolve before Gate C.

1. **§8 — no arrow.** Recommendation: none, and revisit at `Tooltip`.
2. **§4 — `Space`-typed offsets.** Recommendation: yes; a bare pixel number
   in a prop is the same hardcoded value RULES §3 bans in CSS.
3. **§2 — warn, rather than require a name at the type level.** A required
   `label` would make `Title` unusable as the name. Recommendation: warn.
