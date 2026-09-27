# 4.3 `Tooltip`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — built 2026-09-27; every Definition of Done box but the CI-authored screenshot baseline (D-013). Gate C passed 2026-09-27 **by delegation** (D-064); build findings in D-065 |
| **Sizing contract** | `hug`, with the overlay exception: `max-inline-size` from the measure scale (RULES §1 as amended by D-061 §3) |
| **RSC** | `client` — Radix state, timers, a portal, positioning |
| **Depends on** | 4.1 Overlay foundation (`done`). Composes nothing; its usual trigger is 3.2 `IconButton`, by `asChild` |
| **APG pattern** | [Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) — `role="tooltip"`, shown on hover and on keyboard focus, dismissed by Escape, never focused itself. WCAG 2.1 [1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html) governs the three things the pattern leaves open: dismissable, hoverable, persistent (§6) |

The first component to build on 4.1 alone, and the one whose whole job is
the thing `Popover` said it was not: content that shows on hover, that
nothing can interact with, and that the page never depends on.

## Purpose

A short label that appears beside a control when the pointer rests on it or
keyboard focus lands on it: the name of an icon button, a keyboard shortcut,
the full text of something truncated, one line of "what this does". It
**describes** its trigger — it is wired as `aria-describedby`, not as the
name — and it is gone the moment the user does anything else.

It deliberately does **not**: hold anything interactive (a link, a button, a
form control — that is `Popover`, 4.2, and a tooltip with a link in it fails
keyboard users because focus never enters it, §6); serve as a control's only
accessible name (an `IconButton` has one before the tooltip exists, §4);
open on touch (§7); render an arrow (§9); take a `tone` or a `variant`
(§3); or replace the `title` attribute for anything that is not a control.

---

## Decisions this spec asks you to approve

### 1. Compound, the tier's shape, with an optional provider

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <IconButton label="Copy">…</IconButton>
  </TooltipTrigger>
  <TooltipContent>Copy</TooltipContent>
</Tooltip>
```

Three parts: `Tooltip` (the root, holds state), `TooltipTrigger`,
`TooltipContent`. Named exports, never `Tooltip.Trigger` (D-062 §1: React
forbids dotting into a client module from a Server Component). The same
shape as `Popover`, so a consumer who learned one knows the other, and the
shape `Dialog` and `DropdownMenu` will take.

**The alternative was weighed and is the open question that matters most
(open question 1).** A tooltip is used ten times as often as a popover, and
the single-component form `<Tooltip content="Copy"><IconButton …/></Tooltip>`
is three lines shorter each time. It is not chosen because the trigger's
merge would be implicit — `children` silently becomes an `asChild` slot,
which fails on a string child and on a component that does not forward its
ref — and because the content-side props (`side`, `sideOffset`, `container`,
`className`) would land on a root that renders nothing, so `ref` and `style`
would have to be routed to an element the prop's owner cannot see. The
compound keeps every prop on the element it affects, which is RULES §5.2–3's
whole point. A consumer who wants the short form writes it once, as a
four-line wrapper, in their own code.

**`TooltipProvider` is exported and optional.** Radix's tooltips share one
provider for two things: the open delay, and the *skip* delay — after one
tooltip has shown, moving to a neighbouring trigger within 300ms shows its
tooltip at once, which is how a toolbar feels right. Radix throws when a
`Tooltip` renders outside a provider. Ours does not: `Tooltip` reads a
context of ours, and when none is above it renders Radix's provider itself,
with the defaults, around its own root. A single tooltip works with no setup;
an app that wants the skip-delay behaviour across a toolbar — or a different
delay everywhere — wraps once, in its layout. 4.1 §3 declined an
`OverlayProvider` because most apps would never set its one prop; this one
carries behaviour an app cannot get any other way, and it is not required.

### 2. A description, not a name — and the duplication that follows is accepted

Radix renders the content as `role="tooltip"` and, while it is open, writes
`aria-describedby` on the trigger pointing at it. That is the APG pattern
and it is kept as-is. Two consequences are stated so they are decisions:

- **The trigger must already have a name.** A tooltip that appears on hover
  is not a name for a control that has none: it is absent from the
  accessibility tree until it opens, and it never opens on touch (§7).
  `IconButton` cannot be constructed without a `label` (3A §3.2), and that is
  the name; the tooltip repeats it. A bare `<Button>` holding an SVG and a
  tooltip is the "don't" on the docs page, and it is the same "don't" 3A
  §3.1 already wrote for the button alone.
- **Repeating the name is read twice, and that is the accepted cost.** On an
  `IconButton label="Copy"` with a tooltip reading "Copy", a screen reader
  announces "Copy, button, Copy". The alternative — wiring the tooltip as
  `aria-labelledby` when it matches the name — would make the name depend on
  a transient element, which is the failure above. The docs page shows one
  string used for both, which is what 3A §3.2 named `label` for ("it is
  content, not only an ARIA attribute").

`aria-label` on `TooltipContent` passes through as Radix's: the visible
content loses its role and a visually hidden copy of the label carries it,
for a tooltip whose visible content is a glyph or a shortcut rather than
words.

### 3. Inverse surface, two new semantic tokens, no `tone`, no `variant`

A tooltip is the one surface in this library that is *not* the page's: it
is read against whatever it floats over and it must never be mistaken for a
panel the user can interact with. The convention every major library
follows is the inverse of the page — near-black on light, near-white on
dark — and the convention is right for the reason above, not because it is
common.

The library has no token for it. `--pp-color-bg-raised` is the page's own
surface; `--pp-tone-solid` is neutral step 9, a mid grey, and a mid-grey
box with white text reads as a disabled button. Using `--pp-color-text` as a
*background* would be reaching for a token by its lightness rather than its
meaning, the thing RULES §3 says `Skeleton` gets away with only because it is
not choosing a boundary. So **Tier 0.2 gains two semantic tokens**:

| Token | Light | Dark | Asserted |
| --- | --- | --- | --- |
| `--pp-color-bg-inverse` | `neutral-12` | `neutral-12` | `lint:contrast`: `text-inverse` on `bg-inverse` ≥ 4.5:1, both themes, under its own name |
| `--pp-color-text-inverse` | `neutral-1` | `neutral-1` | (same row) |

The values are the text-on-page pair reversed, so the ratio is the one
already solved for body text — but the assertion is added under the new
names anyway, value *and* mapping, because D-050 §1's lesson is that a
mapping nobody asserts is a mapping somebody retunes. In the dark theme
`neutral-12` is near-white and `neutral-1` near-black, so the inversion
follows the theme with nothing said per theme, which is what makes these
semantic tokens rather than a hardcode.

**No `tone`.** A red tooltip is a warning the user cannot act on and
cannot reach by keyboard. **No `variant`.** There is one way a tooltip looks.
**No `size`.** The text is `--pp-font-size-2` on `--pp-line-height-snug`;
`--pp-tooltip-padding-*` is the escape. The panel carries no
`data-pp-tone`: portalled to `<body>` it resolves nothing tonal, and a
consumer's own `container` inside a tone context is that consumer's to
theme (4.1 §3). The panel *does* carry `data-pp-theme`, 4.1 §3's copy — the
inverse of a dark region is light, and a tooltip opened from a dark
sidebar in a light app must know which page it is the inverse of.

The elevation is `--pp-shadow-2`, one step below `Popover`'s: a label, not
a panel. No border — an inverse surface needs no edge to be seen, and a
border would need a colour that exists in neither pair.

*Amended at the build (D-065 §2):* `--pp-color-text` is **not** redefined
on the panel. Plain text and anything painting from `currentColor` inherit
the inverse ink; `Kbd` keeps its own surface, which is what makes a key read
as a key on it; `Text` paints the page's ink on nothing and is a "don't".
A tooltip's content is plain text.

### 4. Radix's open-state vocabulary is kept: `closed | delayed-open | instant-open`

RULES §4 fixes `data-state="open|closed"`, and Radix's `Tooltip` writes
three values on the trigger and the content: `closed`, `delayed-open` (the
pointer rested and the delay ran) and `instant-open` (keyboard focus, a
controlled `open`, or a neighbour's skip delay). The third is not a
curiosity — it is the one paint-time fact the stylesheet needs: a tooltip
that opened because the pointer swept from the previous trigger must **not**
animate in again, or a toolbar flickers. `.pp-tooltip[data-state="instant-open"]`
skips the entry animation and that is the whole use.

Normalising to `open|closed` by spreading our own `data-state` after
Radix's (which wins, D-061 §4) would erase the fact for no gain. So
**RULES §4's vocabulary is extended, not broken**: a component may add a
value that carries a real state, and the closed half — `closed` — is the
one a consumer's selector is written against. Recorded in DECISIONS at
approval. A consumer testing "is it open" tests `:not([data-state="closed"])`,
and the docs page says so.

### 5. `side` defaults to `top`, the offsets are steps of the space scale, the ceiling is the measure

4.1 §5's vocabulary: `side` is `top | bottom | start | end`, default **`top`**
(a label above the thing, where the pointer is not); `align` `center`.
`start`/`end` resolve against the trigger's direction at open time through
`resolveSide`; `data-side` reports the placed physical side.

`sideOffset` and `collisionPadding` are `Space` (D-061 §5), resolved by
`resolveSpace` on the trigger. Defaults **`sideOffset="1"`** — a quarter
rem; a tooltip is a label and sits closer to its subject than a panel does —
and `collisionPadding="2"`.

The sizing exception is the tier's (D-061 §3), applied with the same
mechanism as `Popover`: `max-inline-size: min(--pp-tooltip-max-inline-size,
available width)` with the default from `--pp-measure-xs`, so a long
tooltip wraps at 20rem and a tooltip near a viewport edge shrinks rather
than clips. `.stylelintrc.json` gains the same per-file override
`Popover.css` has. No `max-block-size`: a tooltip that needs to scroll is
not a tooltip.

### 6. Hoverable, dismissable, persistent — and `disableHoverableContent` is not exposed

WCAG 1.4.13 asks three things of content that appears on hover:

- **Dismissable** without moving the pointer: Escape closes it. Radix's
  dismissable layer, the topmost only (4.1 §8).
- **Hoverable**: the pointer can move from the trigger onto the tooltip
  without it closing. Radix computes a grace polygon between the two on
  pointer-leave and keeps the tooltip open while the pointer is inside it.
  This is Radix's default and **`disableHoverableContent` is not exposed**:
  it is a switch whose only effect is to fail 1.4.13.
- **Persistent**: it stays until hover and focus are both gone. Radix's.

Also Radix's, and kept: **a click on the trigger closes it** (activating the
control dismisses the label so it never covers the result); **scrolling
an ancestor closes it**; **opening another tooltip closes this one** (a
document-level event Radix dispatches on open — a `defaultOpen` tooltip
dispatches none, which is what lets the gallery's three sit open together,
§Testing); and **focus opens it only when the focus did not come from a
pointer press**, so clicking a button does not also show its tooltip.

`forceMount` is not exposed (4.1 §6).

### 7. Touch opens nothing, and the delays are numbers, not tokens

Radix ignores `pointerType === 'touch'` on the trigger: a tap activates
the control and shows no tooltip, and a long press shows nothing either.
This is not overridden. A tooltip is supplementary by construction (§2),
so the touch user loses a repetition of a name they already have; a tooltip
that carried something they *don't* have is the "don't" on the docs page.

**`delayDuration` and `skipDelayDuration` are milliseconds, with Radix's
defaults (700 and 300).** RULES §3 bans a hardcoded `ms` in component
*CSS*, and D-061 §5 extended that to a JavaScript number that a token
already names — `8` is `--pp-space-2` one file over. Neither applies here:
a hover-intent delay is behaviour, not paint, and no token names it. The
motion scale tops out at `--pp-duration-slow: 360ms` and is for how long
a change takes to draw, which this is not. Minting `--pp-delay-tooltip` for
a number no stylesheet would ever read is D-015's "a name that changes
nothing". The defaults are Radix's rather than ours because there is no
measurement behind a different number, and the spec says which they are.

### 8. What is left to the build to verify, named now

Following 4.1's practice of stating a mechanism's dependence before the
build checks it. *All three held at the build (D-065 §6): Chromium fires
`pointermove` on a disabled button and the tooltip opens; three
`defaultOpen` tooltips sit open together; and `instant-open` skips the
entry animation, measured with the reduced-motion pin lifted for that test.*

- **A natively `disabled` trigger.** Whether a disabled `<button>` fires the
  `pointermove` the trigger opens on is the browser's decision, not ours —
  Firefox does not, and Chromium's behaviour changed in 2023. Every control
  in this library keeps the pointer on a disabled control precisely so a
  tooltip *can* wrap one (`Button.css`, `Input.css` and the rest say so in
  their comments); what the browser then does with it is measured in the
  browser suite and recorded, and the docs page states the result as
  best-effort rather than promising it.
- **Three `defaultOpen` tooltips stay open together** in the Matrix, because
  `defaultOpen` dispatches no open event. If the build finds otherwise, the
  gallery takes the same escape hatches the `Popover` gallery took (D-062
  §2), and this section is amended.
- **`instant-open` after a skip** actually skips the entry animation, and
  `delayed-open` after a rest actually plays it — measured, since the
  whole of §4 rests on the attribute changing when Radix says it does.

### 9. No arrow, and this is where `Popover` said the question would be settled

`Popover.md` §8 left out the arrow with "`Tooltip` is where an arrow earns
its place", and open question 1 there said "revisit at `Tooltip`". Revisited:
**none.** The case *for* one is attribution — six icon buttons in a row,
which one is this label for? — and it is answered by the mechanism already
in place: one tooltip open at a time (§6), directly above its trigger with
a quarter-rem gap, in the theme's inverse. The case *against* is the one
`Popover` gave, weaker here because there is no border to match, plus one
that is stronger here: floating-ui shifts an aligned tooltip along its
trigger to avoid a collision, and an arrow then points at the wrong place
unless it is repositioned, which is a second mechanism. If a consumer
finds attribution failing in practice, `TooltipArrow` is one Radix part
away, and adding it is a minor. Open question 3.

---

## Sizing contract justification

`hug`: an inline-level label that sizes to its text, positioned by floating-ui
with `position: fixed`. The exception it needs — `max-inline-size`, logical,
from the measure scale and the available width — is the tier's (D-061 §3),
applied as §5 says, with a `.stylelintrc.json` override for this file. No
`width`, no `min-inline-size`, no `max-block-size`.

## Anatomy

```
<button class="pp-tooltip__trigger" aria-describedby data-state>    (or the asChild element)

body / container
  └── <div>                                            Radix's positioned wrapper (unstyled; z-index read from the root)
        └── <div class="pp-tooltip" role="tooltip" id data-state data-side data-align data-pp-theme>
              └── {children}
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Provider | — | — | Renders nothing. Optional (§1) |
| Root | — | — | Renders nothing. Holds the state |
| Trigger | `pp-tooltip__trigger` | `<button>` or `asChild` | Radix's `aria-describedby` (while open) and `data-state`. `ref` → the element. Almost always `asChild` |
| Content | `pp-tooltip` | `<div role="tooltip">` | The label. `ref`, `className`, `style` and the rest land here. `data-pp-theme` is 4.1 §3's copy. With `aria-label`: no role, and a visually hidden copy carries it |

Radix's wrapper `<div>` is the one element in the tree that is not ours. It
carries only the position and the z-index it reads from `.pp-tooltip`.

## Props

**`TooltipProvider`** (optional)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `delayDuration` | `number` (ms) | `700` | Pointer rest before opening |
| `skipDelayDuration` | `number` (ms) | `300` | Window after a close in which a neighbour opens at once |
| `children` | `ReactNode` | — | |

**`Tooltip`** (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open: boolean) => void` | — / `false` / — | RULES §5.5 |
| `delayDuration` | `number` (ms) | the provider's | Overrides for this one tooltip |
| `children` | `ReactNode` | — | The parts |

**`TooltipTrigger`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Renders the child instead of a `<button>` |
| …rest | `ComponentPropsWithoutRef<'button'>` | — | |

**`TooltipContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | §5 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `sideOffset` | `Space` | `'1'` | §5 |
| `collisionPadding` | `Space` | `'2'` | |
| `container` | `Element \| null` | `document.body` | 4.1 §3 |
| `aria-label` | `string` | — | §2; the visible content becomes presentational |
| `onEscapeKeyDown`, `onPointerDownOutside` | Radix's | — | Passed through; each can `preventDefault()` |
| `className` / `style` | | — | Root |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | |

Not exposed: `disableHoverableContent` (§6), `forceMount` (4.1 §6),
`alignOffset`, `avoidCollisions`, `sticky`, `hideWhenDetached` (Radix
positioning knobs no spec has asked for; added when one does).

Exported types: `TooltipProviderProps`, `TooltipProps`, `TooltipTriggerProps`,
`TooltipContentProps`, `TooltipSide`, `TooltipAlign`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Closed | `data-state="closed"` on trigger and content | Content animates out (`--pp-duration-instant`, accelerate), stays mounted until it ends |
| Open after the delay | `data-state="delayed-open"` | Content animates in (`--pp-duration-fast`, decelerate) |
| Open at once | `data-state="instant-open"` | Content appears with no entry animation (§4) |
| Placed side / align | `data-side`, `data-align` on content (physical) | Transform origin follows |
| Theme | `data-pp-theme` on content | The inverse of the trigger's theme, not of the body's |

Under `prefers-reduced-motion` every animation is `none`, declared in this
component's own stylesheet (D-062 §5), so Radix's `Presence` unmounts a
closing tooltip at once.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tooltip-bg` | `--pp-color-bg-inverse` | Fill (§3) |
| `--pp-tooltip-color` | `--pp-color-text-inverse` | Text |
| `--pp-tooltip-radius` | `--pp-radius-2` | Corners |
| `--pp-tooltip-padding-block` | `--pp-space-1` | Inside, block |
| `--pp-tooltip-padding-inline` | `--pp-space-2` | Inside, inline |
| `--pp-tooltip-shadow` | `--pp-shadow-2` | Elevation |
| `--pp-tooltip-max-inline-size` | `--pp-measure-xs` | The ceiling (§5) |

Type: `--pp-font-size-2`, `--pp-line-height-snug`, `--pp-font-weight-regular`.
Stacks at `--pp-z-tooltip` (4.1 §4), above everything including a toast.

**Contrast, computed at the gate (D-048 §1).** `--pp-color-text-inverse` on
`--pp-color-bg-inverse` is neutral step 1 on step 12 in both themes, the
body-text pair reversed, and it is asserted under the new names by
`lint:contrast` (§3). Nothing inside a tooltip is focusable, so no ring
pairing is added. Nothing missing is leaned on.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab to the trigger | Opens at once (`instant-open`), if the focus did not come from a pointer press |
| Tab / Shift+Tab away | Closes (blur) |
| Escape | Closes; focus stays on the trigger. Only the topmost layer (4.1 §8) |
| Enter / Space on the trigger | Activates the trigger, which closes the tooltip (click closes, §6) |

Focus never moves into the tooltip: there is nothing in it to focus, and
`role="tooltip"` content is read through `aria-describedby`. Every row is
Radix's; the component installs no key handler. APG's pattern says the same
four things and adds nothing this diverges from.

## Accessibility notes

- Trigger: `aria-describedby` → the content's id, present only while open;
  `data-state`. The trigger **must be focusable** — a tooltip on a `<span>`
  is invisible to keyboard users, and the docs page says to use `asChild`
  on a focusable element or wrap the span in a `tabindex="0"` one that is
  worth focusing.
- Content: `role="tooltip"`, `id`. Not focusable, never receives focus.
- The tooltip is a description. The trigger's name exists without it (§2).
- **Manual walkthrough:** Tab to an `IconButton` with a tooltip, confirm the
  tooltip appears at once and the screen reader reads the name then the
  description; Escape, confirm it closes and focus stays; Tab away, confirm
  it closes. With the pointer: rest on the trigger, confirm it appears
  after the delay; move the pointer onto the tooltip, confirm it stays;
  move to the neighbouring trigger, confirm its tooltip appears at once
  without animating in; click the trigger, confirm the tooltip closes.
  Open one from inside a dark region of a light page and confirm it is
  light. Repeat with `dir="rtl"` and `side="start"`, confirm it is on the
  right. On a touch device: tap, confirm the control activates and no
  tooltip appears.

## Container behavior

None of its own — it is positioned against the viewport. Its ceiling is the
lesser of the measure and the available width, so it never overflows the
viewport at any container width.

## Usage

```tsx
// The usual: an icon button's name, repeated. One string for both.
const label = 'Copy to clipboard';
<Tooltip>
  <TooltipTrigger asChild>
    <IconButton label={label} onClick={copy}><Clipboard /></IconButton>
  </TooltipTrigger>
  <TooltipContent>{label}</TooltipContent>
</Tooltip>

// A shortcut, beside a control that already has a text label.
<Tooltip>
  <TooltipTrigger asChild><Button>Save</Button></TooltipTrigger>
  <TooltipContent side="bottom">
    Save <Kbd>⌘S</Kbd>
  </TooltipContent>
</Tooltip>

// A toolbar: one provider, so moving between buttons does not wait.
<TooltipProvider>
  <Cluster gap="1">
    <Tooltip>…</Tooltip>
    <Tooltip>…</Tooltip>
  </Cluster>
</TooltipProvider>
```

## Don't

```tsx
// ✗ The tooltip as the only name. It is a description, absent until hover,
//   and never shown on touch. IconButton's label is the name.
<Tooltip>
  <TooltipTrigger asChild><Button><Icon decorative><Trash /></Icon></Button></TooltipTrigger>
  <TooltipContent>Delete</TooltipContent>
</Tooltip>

// ✗ Interactive content. Focus never enters a tooltip; a link in one is
//   unreachable by keyboard. That is a Popover.
<TooltipContent>See the <Link href="/docs">docs</Link></TooltipContent>

// ✗ A trigger nothing can focus. Keyboard users never see it.
<TooltipTrigger asChild><span>Est. 3 days</span></TooltipTrigger>

// ✗ Information only the tooltip carries. Touch users never see it.
<TooltipContent>Your session expires in 5 minutes</TooltipContent>

// ✗ Two tooltips on the platform's dime. `title` is the native one, and
//   it does not know the theme, the delay or the keyboard.
<IconButton label="Copy" title="Copy" />

// ✗ A physical side; a pixel offset.
<TooltipContent side="left" sideOffset={4} />
```

## Testing notes

- **Unit (jsdom, fake timers — `shouldAdvanceTime: true`, and every
  advance inside `act`; D-065 §1 says why both):** pointer rest opens after
  `delayDuration` and not before; a second trigger within `skipDelayDuration` of a close
  opens at once and carries `instant-open`; focus opens at once, blur
  closes; a pointer press then focus does not open; click closes; Escape
  closes; controlled and uncontrolled; `aria-describedby` present only while
  open and pointing at the `role="tooltip"` element; `aria-label` moves the
  role to a hidden copy; `Tooltip` with no provider renders and opens (the
  fallback provider); `asChild` onto `IconButton` keeps the label; the theme
  copy from a dark scope; axe with the tooltip open, on an `IconButton`
  whose label the tooltip repeats.
- **Browser:** the panel's `z-index` is `--pp-z-tooltip` and Radix's wrapper
  carries the same number; `side="start"` places it to the left in LTR and
  to the right in `dir="rtl"`; `sideOffset="1"` is 4px between trigger and
  panel; hoverable — the pointer moves from trigger to panel and the panel
  stays; the panel is light inside a dark region of a light page
  (`data-pp-theme` and the resolved background); a click on the trigger
  closes it; `instant-open` skips the entry animation and `delayed-open`
  plays it (§8); a disabled trigger's behaviour, recorded (§8); reduced
  motion opens and closes instantly; three `defaultOpen` tooltips coexist in
  the Matrix (§8).
- **Break checks (D-035 §3):** pin `directionOf` to `ltr` (the RTL test);
  drop `data-pp-theme` from the panel (theme test); drop `z-index` (stacking
  test); drop the reduced-motion rule (that test); drop the fallback
  provider (the no-provider test, which must then throw Radix's error);
  drop the `instant-open` animation rule (the skip test); swap
  `resolveSpace` for a bare `4` — recorded in advance as *not observable*,
  as D-061 §5 says.
- **Screenshot:** the Matrix renders one `defaultOpen` tooltip per cell on an
  `IconButton`, `side="end"` so three stacked cells do not cover each other
  (D-062 §2's reason). A `position: fixed` panel captures correctly (D-062
  §6).
- **Tree-shaking (4.1 §2):** the Button page's payload does not reference
  the chunk holding `@radix-ui/react-tooltip`.

## Open questions

Resolve before Gate C.

1. **§1 — compound, not `<Tooltip content="…">`.** The single-component
   form is the ergonomic one and most design systems ship it.
   **Recommendation: compound.** One shape for the tier, every prop on the
   element it affects, and the short form is a four-line wrapper in the
   consumer's code rather than a second API in ours.
2. **§3 — two new semantic tokens, `--pp-color-bg-inverse` and
   `--pp-color-text-inverse`.** The alternative is `--pp-tone-solid` /
   `--pp-tone-on-solid`, which exist and are asserted, and give a mid-grey
   tooltip that matches a solid neutral `Button`.
   **Recommendation: the tokens.** An inverse surface is a real semantic —
   `Toast` (4.12) is the next component likely to want it — and a mid-grey
   label reads as a disabled control.
3. **§9 — no arrow.** **Recommendation: none**, for the shift-on-collision
   reason; `TooltipArrow` is one part away if attribution fails in practice.
4. **§4 — keep Radix's three `data-state` values.** The alternative
   normalises to `open|closed` and loses the instant/delayed fact the
   stylesheet needs. **Recommendation: keep**, recorded as an extension of
   RULES §4's vocabulary.
5. **§1 — `TooltipProvider` optional, with a fallback.** The alternative is
   Radix's: required, throw without it. **Recommendation: optional.** A
   single tooltip should not need setup, and the fallback is one context
   read.
6. **§7 — delays in milliseconds, Radix's defaults, no token.**
   **Recommendation: as written.**
