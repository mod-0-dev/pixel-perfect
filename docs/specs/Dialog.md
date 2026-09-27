# 4.4 `Dialog`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — built 2026-09-27; every Definition of Done box but the CI-authored screenshot baseline (D-013). Gate C passed 2026-09-27 **by delegation** (D-067); build findings in D-068 |
| **Sizing contract** | `hug`, with the overlay exception: `max-inline-size` from the measure scale (RULES §1 as amended by D-061 §3), and the scrim's box is the viewport (§4) |
| **RSC** | `client` — Radix state, a portal, a focus trap, a scroll lock |
| **Depends on** | 4.1 Overlay foundation (`done`). Composes nothing; its usual trigger and its close buttons are 3.1 `Button` and 3.2 `IconButton`, by `asChild` |
| **APG pattern** | [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — `role="dialog"`, `aria-modal="true"`, named, focus moved in on open and restored on close, Tab loops, Escape closes |

The first modal, and the one 4.5 `AlertDialog`, 4.6 `Drawer` and 4.14
`CommandPalette` gate on. `Popover` was Tier 4's anchored, non-modal panel;
this is the tier's un-anchored, modal one — and the first component that
takes the page away from the user: it locks scroll, hides the rest of the
page from assistive tech and traps focus, so every one of those is decided
here rather than inherited.

## Purpose

A window over the page that the user must deal with before continuing: rename
a file, edit a record in place, fill a short form, confirm a choice with more
than two buttons. The page behind it is inert — no pointer, no scroll, no
focus, nothing read — until it closes, and it closes on Escape, on a press
on the scrim, or on any `DialogClose` inside it.

It deliberately does **not**: anchor to its trigger (`Popover`, 4.2); guard a
destructive confirmation with the extra rules that needs — no close on a
scrim press, focus on the safe button (`AlertDialog`, 4.5, which is this
component with those two rules); slide in from an edge (`Drawer`, 4.6); offer
a non-modal mode (§2); render its own close button (§5); take a `size`
(§3), a `tone` or a `variant`; scroll inside itself (§4); or exist without
JavaScript (4.1 §7).

---

## Decisions this spec asks you to approve

### 1. Compound, the tier's shape; six parts, and the scrim is not one of them

```tsx
<Dialog>
  <DialogTrigger asChild><Button variant="outline">Rename</Button></DialogTrigger>
  <DialogContent>
    <DialogTitle>Rename file</DialogTitle>
    <DialogDescription>The new name is applied everywhere it is linked.</DialogDescription>
    …
    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
  </DialogContent>
</Dialog>
```

`Dialog` (the root, holds state), `DialogTrigger`, `DialogContent`,
`DialogTitle`, `DialogDescription`, `DialogClose`. Named exports (D-062 §1),
the shape `Popover` and `Tooltip` have, so a consumer who learned one knows
the other.

**`DialogContent` renders the scrim as well as the panel.** Radix exposes
`Overlay` as a part the consumer places; ours is not exposed. There is one
way a modal looks — dimmed page, centred panel — and a part a consumer can
forget, reorder or style apart from the panel is a way to get a modal with
no scrim, which is a panel floating over a live-looking page that does not
respond. The scrim is styled through `--pp-dialog-scrim` (§Styling API) and
is the panel's *parent* (§4). `ref`, `className`, `style` and the rest land
on the panel, which is the root RULES §5 means.

No `Portal` part (4.1 §3: always portalled, `container` on `Content` is the
one knob). No `Header` / `Body` / `Footer`: the title and the buttons are
laid out with `Stack` and `Cluster`, as `Popover`'s are, and a corner close
button is the end of a `Cluster` row rather than an absolutely positioned
thing (§5). Those parts are `Card`'s (5.1), for a box in flow.

### 2. Modal, and only modal — no `modal` prop

Radix's root takes `modal={false}`: no scrim, no scroll lock, no `aria-hidden`,
no focus trap, and an outside press still closes. It is not exposed, for
three reasons:

- **A non-modal dialog is a different pattern.** APG splits it out: it must
  be possible to move focus out of it, it needs a visible close, it must not
  obscure what it refers to. Nothing in this spec — the scrim, the trap, the
  lock — applies to it, so a `modal={false}` would be a switch that turns
  off most of the component.
- **The scrim is the positioner (§4).** Radix renders no `Overlay` for a
  non-modal dialog, so the panel would have nothing to be centred in, and a
  second positioning rule would exist for a mode no roadmap row asks for.
- **The un-anchored non-modal surfaces on the roadmap have names.** A
  persistent side panel is 4.6 `Drawer`'s question; a passing message is 4.12
  `Toast`. A floating "find" box that stays open while the page is used is
  the one case this leaves out, and it is a `Dialog` gaining the prop when
  the spec that needs it says why.

`Popover` has the prop the other way round (`false` by default, `true` for
the popover a flow cannot proceed past). The asymmetry is deliberate: a
popover is anchored and mostly non-modal, and its modality is an option; a
dialog *is* its modality.

### 3. `hug`, the ceiling is `--pp-measure-sm`, and there is no `size`

The panel hugs: a three-button confirmation is three buttons wide. A dialog
holding a `Field` — every control in this library fills — would grow to the
viewport, so it declares the tier's ceiling (D-061 §3), logical, from the
measure scale:

```
max-inline-size: min(var(--pp-dialog-max-inline-size, var(--pp-measure-sm)), 100%)
```

`100%` is the scrim's content box — the viewport less the gutter (§4) — so
on a narrow viewport the panel shrinks to the space and the gutter is kept.
`min-inline-size: 0` on the panel, because a grid item's minimum is its
content's, and one unbreakable string in a dialog would otherwise push the
panel past its ceiling instead of wrapping inside it. *Amended at the build
(D-068 §2): that is two properties, not one — `min-inline-size: 0` lets the
panel shrink, and `overflow-wrap: anywhere` is what makes the string wrap
inside it rather than run out of it; the panel declares both.*

*Also at the build (D-068 §1): a hug panel is as wide as its content asks,
up to the ceiling — not as wide as the ceiling. A short form asks for about
26rem; a paragraph reaches 40rem. The gallery's wide cell shows the ceiling
because its description is a sentence long enough to want it.*

**`--pp-measure-sm` (40rem), not `--pp-measure-xs` (20rem).** `xs` is
`Popover`'s: a panel beside its trigger, holding a filter or two. A dialog
holds a form or a paragraph, and 20rem is 16rem of content after padding —
too narrow for two fields side by side or a sentence that reads as one. At
40rem the content runs 37rem, roughly 70 characters at body size: the top
of the readable measure, which is where a dialog that *may* hold prose
should stop. A dialog is not `Container`; it never asks for `md`.

**No `size`.** `sm | md | lg` mapping to three measures is a common dialog
API, and it is the `fullWidth` shape RULES §1 removes: a prop on the child
saying how wide the parent should let it be. The width of a dialog is its
content's, up to the ceiling, and the ceiling is a custom property — the
`Popover` precedent — so an app that wants two widths writes two class
names. `AlertDialog` (4.5) will set its own default ceiling, probably `xs`,
because a confirmation is a sentence and two buttons; that is a different
default for a different component, not a size on this one.

### 4. The scrim is the positioner, the panel is its child, and the scrim scrolls

Radix's docs put `Overlay` and `Content` side by side and centre the panel
with `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`.
That is physical twice over, and the logical spelling does not work:
`inset-inline-start: 50%` puts the panel's *end* edge at the centre in RTL,
and a `translate: -50%` then moves it the wrong way, so the panel lands a
full width off centre unless a second rule flips the sign by direction.

The nested form needs no such rule, and it is Radix's own scrollable
recipe — its source says the sibling case is the one that needs extra
handling ("Make sure `Content` is scrollable even when it doesn't live
inside `RemoveScroll` ie. when `Overlay` and `Content` are siblings"):

```
.pp-dialog__scrim   position: fixed; inset: 0; display: grid; place-items: center;
                    overflow: auto; padding: var(--pp-dialog-gutter); z-index: var(--pp-z-overlay)
.pp-dialog          a grid item: hugs, centred, capped (§3); z-index: var(--pp-z-modal)
```

- **Centred by the grid, in every direction.** `place-items: center` on the
  scrim centres the panel with no `margin: auto` (RULES §2 — a root with a
  margin) and no transform. With one implicit `auto` row, `align-content`'s
  default stretches it to the scrim's height and the panel is centred in it;
  when the panel is taller than the viewport the row is the panel's height,
  the overflow is at the *end*, and the scrim scrolls to it. A centred item
  in a scroll container is the classic trap — the top half becomes
  unreachable — and it is avoided by the row, not by the `safe` keyword,
  which Chrome 109 in the `defaults` set does not know.
- **The scrim scrolls; the panel never does.** A dialog taller than the
  viewport keeps its full height and the gutter above and below it, and the
  scrim is the scroll container, which is the one Radix's scroll lock
  (`react-remove-scroll`, on the `Overlay`) permits scrolling inside. The
  alternative — a panel capped at the viewport that scrolls inside itself,
  with the title and the buttons held still — is composition, not a mode:
  a `Scroller` (2.8) around the body does it, bounded by the consumer. The
  docs page shows it. A consumer who wants the whole panel capped sets
  `max-block-size` on it and accepts that the title scrolls.
- **`inset: 0` is the exception's other half.** D-061 §3 let an overlay
  declare a ceiling because it has no parent in flow to size it. The scrim
  is the box the viewport gives a modal, and `position: fixed; inset: 0` —
  logical, one property — is how a box is that box. Recorded in DECISIONS at
  approval as an extension of D-061 §3; nothing in flow ever qualifies, and
  `.stylelintrc.json` gains a `Dialog.css` entry in the overlay override the
  way `Tooltip.css` did (D-064 §4).
- **The gutter** is `--pp-space-4`, the least space between the panel and the
  viewport's edge at any width; `--pp-dialog-gutter` is the escape.
- **Stacking, and the test 4.1 §4 said 4.4 would run.** The scrim is a
  positioned element with a `z-index`, so it is a stacking context; the
  panel's `--pp-z-modal` orders it only among the scrim's descendants, which
  is fine and is declared anyway because the table says every root names
  its layer. What the table promised is asserted: a `Popover` opened from
  inside the dialog is a later sibling of the scrim at `--pp-z-popover` and
  paints above it; a `Tooltip` likewise; and a second `Dialog` opened from
  the first is a later sibling at the *same* `--pp-z-overlay` and paints
  above by DOM order — its scrim over the first panel, its panel over that,
  and Escape closes only it (4.1 §8). The one case not covered: a `modal`
  popover held open inside dialog one while dialog two opens sits above
  dialog two's scrim. A non-modal popover closes when focus leaves it, so
  the case needs `Popover`'s exception *and* a nested dialog; named, not
  solved.

### 5. Closing: Escape, a scrim press, `DialogClose` — and the corner button is composed, not rendered

- **Escape** closes the topmost dismissable layer (4.1 §8). Focus returns to
  the trigger (§7).
- **A press on the scrim closes it**, as 4.1 §8 said 4.4 would and 4.5 will
  not. Radix ignores a right-click and a Ctrl-click there. The press does
  not reach what is under the scrim — nothing is under it but the scrim.
- **`onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`** pass
  through as Radix's, and each can `preventDefault()` — that is how a dialog
  with unsaved changes vetoes a close. Veto, do not confirm: a
  `window.confirm` inside `onOpenChange` is the "don't". `onFocusOutside`
  is *not* exposed: a modal dialog never closes on focus leaving it, Radix
  prevents that event itself, and a handler a consumer can attach to it
  would suggest otherwise.
- **No automatic ×.** Some libraries render a close button in the corner
  of every dialog. This one does not: a dialog's footer nearly always
  carries a Cancel that closes it, a second control that does the same
  thing is a design choice per app, and a corner button needs an absolute
  position on the panel, which is a *placement* — the parent's job, RULES
  §1. The pattern the docs page shows is a `Cluster` row with the title at
  the start and `<DialogClose asChild><IconButton label="Close" …/></DialogClose>`
  at the end: no positioning, and the button is in tab order where it is on
  screen.

### 6. The name: `DialogTitle` names it, development warns when nothing does, and `aria-modal` is ours

Radix wires `aria-labelledby` to its `Title`'s id **only while a `Title` is
mounted** (a count in context, registered in a layout effect) and
`aria-describedby` to its `Description` the same way — so unlike `Popover`
(§2 there) nothing dangles and there is nothing to wire ourselves.
`DialogTitle` is Radix's `Title` rendered `asChild` onto a `<div>`;
`DialogDescription` is Radix's `Description` onto a `<p>`. A `<div>`, not
Radix's default `<h2>`, for Alert.md §6's and Popover §2's reason: the right
level is the page's to know, and a `Heading` passed as the child is the
outline's when the dialog is a section of it. Open question 4 says why this
one is worth a second look.

The **warning is ours**, and reads the DOM rather than an id: in
development, after mount, `DialogContent` warns once when the panel has
neither `aria-labelledby` nor `aria-label`. `aria-label` on `Content` names
a dialog with no visible title; `aria-labelledby` names it from elsewhere.
Radix 1.1.23 ships no warning of its own (its `WarningProvider` is a no-op),
so there is one message, in this library's words, and it is the same message
`Popover` gives.

**`aria-modal="true"` on the panel.** Radix does not write it; it hides the
rest of the page with `aria-hidden` instead (the `aria-hidden` dependency,
4.1 §8), which is the older technique and the one that works where
`aria-modal` once did not. APG asks for the attribute, current libraries
write both, and the two do not conflict: `aria-hidden` removes the page
from the tree, `aria-modal` tells the reader the dialog is the whole tree.
Ours, on the panel, asserted.

### 7. Focus: in on open, back on close — and back to *something* when there was no trigger

On open, Radix focuses the first tabbable element in the panel, else the
panel itself (`tabindex="-1"`). On close, Radix's handler prevents the focus
scope's own restore and focuses `triggerRef.current` — which, for a dialog
opened without a `DialogTrigger` (a table row's menu, a keyboard shortcut,
a controlled `open` set from anywhere), is `undefined?.focus()`: focus drops
to `<body>` and the next Tab starts at the top of the page. Read in the
1.1.23 source, not assumed, and it is the one place this spec changes what
Radix does:

- `DialogContent` records `document.activeElement` when the open-autofocus
  event fires — before the focus scope moves it — and on close, **when there
  is no trigger**, prevents Radix's handler and focuses that element if it
  is still in the document. With a trigger, nothing changes.
- `onOpenAutoFocus` and `onCloseAutoFocus` pass through and either can
  `preventDefault()`. A dialog whose first tabbable is the destructive
  button — APG's exception, "focus the least destructive" — moves focus
  through `onOpenAutoFocus`; that rule is `AlertDialog`'s to fix by default
  in 4.5, not a prop here.

A trigger that the dialog's own action removes from the page (delete the
row the dialog was opened from) is the same shape as Alert.md's "focus
after the caller unmounts the alert": the caller's, and a "don't".

### 8. Motion: two fades, one duration, and the exit is kept mounted twice

The scrim fades in and out; the panel fades and scales from `0.96`
(`Popover`'s), from its own centre — no popper, so no vendor origin.
`--pp-duration-fast`, `--pp-easing-decelerate` in and `-accelerate` out,
keyed on `data-state` (4.1 §6). Radix's `Presence` keeps a closing element
mounted until its exit animation ends — and here that applies **twice**:
the portal's `Presence` on the scrim, and the panel's own. Because the panel
is the scrim's child, the scrim's exit ending unmounts the panel with it, so
**the two exits are one token**, and neither duration is exposed as a custom
property. Under `prefers-reduced-motion` all four animations are `none`,
declared in this stylesheet (D-062 §5), and `Presence` unmounts at once.

### 9. Scroll lock, and the scrollbar in RTL (4.1 §8 named it)

Radix's `Overlay` wraps itself in `react-remove-scroll`, which sets
`overflow: hidden` on `<body>` while the dialog is open and pads the body by
the scrollbar's width so the page does not shift when the bar disappears.
4.1 §8 left the RTL case of that padding to this spec: Chromium puts the
viewport's scrollbar on the *left* when `<html dir="rtl">`, and a
compensation applied on the right would move the page the wrong way by the
bar's width. It is **measured at the build**, in the browser suite, with
`dir="rtl"` on the root and a scrollbar present, and the result goes on the
docs page. Radix passes the lock no options, so if it is wrong there is no
switch to flip; the answer would be a documented gap for RTL apps on a
platform with a classic scrollbar (overlay scrollbars — macOS, every phone —
are zero width and unaffected), not a workaround in this component.

The screenshot suite's Chromium hides scrollbars, so the compensation there
is zero and the gallery (§10) is unaffected. Stated so it is checked.

### 10. The gallery: a cell is a viewport

The Matrix renders a subtree at three container widths. A modal has no
container but the viewport, and three modal dialogs open at once over one
page would stack in the same place. But `contain: layout` makes an element
the containing block for its `position: fixed` descendants, so **the gallery
portals a `defaultOpen` dialog into a `contain: layout` box of fixed height
in each cell** (`container`), and the three widths become three viewports:
at 240 the panel is narrower than its ceiling and every control in it
fills; at 480 likewise; at 960 it sits at its 40rem ceiling with scrim on
either side. That is what "three container widths" means for this
component, and it is the shrink behaviour a real narrow viewport gets,
which the browser suite also asserts at 320px on the page proper.

Three modal dialogs open together is a gallery, not a use (D-062 §2). Their
side effects are real and stacked: the page's scroll is locked three times
over, each dialog's `aria-hidden` sweep hides the other two, the body takes
no pointer events, and focus is trapped in the last. The gallery prevents
each one's open-autofocus so three mounts do not fight over focus, marks
its panels `data-gallery`, and the page says "press Escape three times".
The screenshot suite sets the theme by storage before the page loads
(D-063), so the switcher being unreachable under the gallery costs it
nothing; the interactive tests close the gallery first. **Two assumptions
are named for the build (§11):** that a full-page capture of a page whose
body scroll is locked is still the full page, and that the containment
holds Radix's fixed scrim to the cell.

### 11. What is left to the build to verify, named now

Following 4.1's practice. Each is checked *first*; one that fails is a stop
and a return to this document, not a workaround (D-057).

- **A full-page screenshot of a page with `overflow: hidden` on `<body>`** is
  the whole page. Playwright resizes the viewport to the document's content
  size; whether a locked body reports that size is the question.
- **`contain: layout` on the gallery box holds the scrim** — a fixed
  `inset: 0` descendant portalled into it is the box's size, and the panel
  is centred in the box, in both themes.
- **Radix's modal close handler is as read**: without a trigger, focus lands
  on `<body>` before our restore exists (the test that pins §7 must fail
  with the restore removed).
- **The RTL scrollbar compensation** (§9), measured and recorded either way.
  *At the build (D-068 §5): headless Chromium hides scrollbars, so the gap
  measured 0 and nothing was compensated; the source of
  `react-remove-scroll-bar` writes `padding-right` and `margin-right`
  unconditionally, so on a classic scrollbar in RTL the page shifts by the
  bar's width. Recorded on the docs page as a gap, as §9 said it would be.*
- **`aria-hidden`'s sweep and a portal from inside the dialog**: a `Popover`
  or `Tooltip` opened from within an open dialog is appended to `<body>`
  after the sweep and is not hidden by it. Radix's own docs say so; asserted.
- **axe on an open dialog** passes with no rule disabled — D-065 §6 found
  that axe's `region` rule exempts a dialog, and this is the first
  `role="dialog"` with `aria-modal` to check it against.

---

## Sizing contract justification

`hug`: the panel is a grid item that shrinks to fit its content, centred in
the box the scrim gives it. The exceptions it needs are the tier's, one
already recorded and one asked for here: `max-inline-size`, logical, from
the measure scale (D-061 §3); and the scrim's `position: fixed; inset: 0`,
which is the viewport-sized box a modal is given and the one place a
component of this library says where it is (§4, to be recorded at
approval). No `width`, no `inline-size`, no `max-block-size`, no margin.
`.stylelintrc.json` gains `Dialog.css` in the overlay override.

## Anatomy

```
<button class="pp-dialog__trigger" aria-haspopup="dialog" aria-expanded aria-controls data-state>   (or the asChild element)

body / container
  └── <div class="pp-dialog__scrim" data-state data-pp-theme>               Radix's Overlay: scrim and positioner, scrolls
        └── <div class="pp-dialog" role="dialog" aria-modal="true" id data-state
                 aria-labelledby aria-describedby tabindex="-1">           Radix's Content
              ├── <div class="pp-dialog__title" id>          (optional; Radix's Title, asChild)
              ├── <p class="pp-dialog__description" id>      (optional; Radix's Description, asChild)
              ├── {children}
              └── <button class="pp-dialog__close">          (optional, anywhere inside; or the asChild element)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | — | — | Renders nothing. Holds the state |
| Trigger | `pp-dialog__trigger` | `<button>` or `asChild` | Radix's `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` (while open), `data-state`. `ref` → the element |
| Scrim | `pp-dialog__scrim` | `<div>` | Radix's `Overlay`: covers the viewport, dims it, centres the panel, scrolls (§4). Carries `data-state` and `data-pp-theme` (4.1 §3's copy, on the outermost element of ours). Not a part; styled by `--pp-dialog-scrim` |
| Panel | `pp-dialog` | `<div role="dialog">` | Radix's `Content`. `ref`, `className`, `style` and the rest land here. `aria-modal="true"` is ours (§6) |
| Title | `pp-dialog__title` | `<div>` | §6. Pass a `Heading` as the child when it is a section |
| Description | `pp-dialog__description` | `<p>` | §6 |
| Close | `pp-dialog__close` | `<button>` or `asChild` | Closes on activation. Any number, anywhere inside the panel |

Every element in the portal is ours: a dialog is not positioned by popper,
so there is no wrapper of Radix's (the one `Popover` and `Tooltip` have).

## Props

**`Dialog`** (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open: boolean) => void` | — / `false` / — | RULES §5.5 |
| `children` | `ReactNode` | — | The parts |

**`DialogTrigger`**, **`DialogClose`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Renders the child instead of a `<button>` |
| …rest | `ComponentPropsWithoutRef<'button'>` | — | |

**`DialogContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `Element \| null` | `document.body` | 4.1 §3. Scrim and panel are portalled together |
| `onOpenAutoFocus`, `onCloseAutoFocus` | Radix's | — | §7; each can `preventDefault()` |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` | Radix's | — | §5; each can `preventDefault()` |
| `aria-label` / `aria-labelledby` / `aria-describedby` | `string` | — | §6; a supplied name or description wins over the parts' |
| `className` / `style` | | — | The panel |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | The panel |

**`DialogTitle`**, **`DialogDescription`**: `ComponentPropsWithoutRef<'div'>` / `<'p'>`.

Not exposed: `modal` (§2), `forceMount` (4.1 §6), `onFocusOutside` (§5),
Radix's `Overlay` and `Portal` (§1).

Exported types: `DialogProps`, `DialogTriggerProps`, `DialogContentProps`,
`DialogTitleProps`, `DialogDescriptionProps`, `DialogCloseProps`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on trigger, scrim and panel | Scrim fades; panel fades and scales (§8). Both stay mounted until the exit ends |
| Theme | `data-pp-theme` on the scrim | Scrim and panel resolve every token in the trigger's theme; without a trigger or a scope, nothing is written (D-062 §3) |
| Page behind | `aria-hidden` on the rest of the page, `overflow: hidden` and scrollbar padding on `<body>`, `pointer-events: none` on `<body>` | Radix's, all three; none of it is ours to style |

Under `prefers-reduced-motion` every animation is `none`, in this
component's own stylesheet (D-062 §5).

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-dialog-scrim` | `--pp-color-bg-scrim` | The scrim's fill. The token's first consumer; it has existed since 0.2 |
| `--pp-dialog-gutter` | `--pp-space-4` | The least space between the panel and the viewport's edge |
| `--pp-dialog-bg` | `--pp-color-bg-raised` | Panel fill — the elevated surface, which differs from the page in dark |
| `--pp-dialog-border-color` | `--pp-color-border-subtle` | Panel edge. Decoration: the shadow and the scrim carry the separation (RULES §3) |
| `--pp-dialog-radius` | `--pp-radius-4` | Corners. One step up from `Popover`: a bigger box |
| `--pp-dialog-padding` | `--pp-space-5` | Inside |
| `--pp-dialog-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-dialog-max-inline-size` | `--pp-measure-sm` | The ceiling (§3) |

Text is `--pp-color-text`, declared on the panel because the portal leaves
whatever the app set on a wrapper behind. The title is
`--pp-font-size-4`, `--pp-font-weight-semibold`, `--pp-line-height-tight`;
the description `--pp-color-text-muted` at `--pp-font-size-3`,
`--pp-line-height-normal` — body size, not `Popover`'s `2`, because a dialog's
description is read as a paragraph. Stacks at `--pp-z-overlay` (scrim) and
`--pp-z-modal` (panel), 4.1 §4.

**Contrast, computed at the gate (D-048 §1).** `--pp-color-text` on
`--pp-color-bg-raised` is the pair `Popover` already leans on, asserted by
`lint:contrast`. The scrim carries no text and is no boundary: it has no
contrast obligation and none is added. The panel's edge over a dimmed page
is the shadow's and the fill's to make visible, not the border's. Nothing
new is asserted and nothing missing is leaned on.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Enter / Space on the trigger | Opens. Native button activation; Radix listens to click |
| Tab / Shift+Tab | Moves through the panel's tabbables and **loops**: from the last to the first and back. Nothing outside is reachable |
| Escape | Closes; focus returns to the trigger (§7). Only the topmost layer (4.1 §8) |
| Enter / Space on `Close` | Closes |

Every row is Radix's; the component installs no key handler. APG's Modal
Dialog pattern says the same four things. Its note that Escape "may" be
preventable when the dialog has unsaved input is `onEscapeKeyDown` (§5).

## Accessibility notes

- Trigger: `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` → the
  panel's id while open.
- Panel: `role="dialog"`, `aria-modal="true"`, named by `DialogTitle` or
  `aria-label` / `aria-labelledby`, described by `DialogDescription` or
  `aria-describedby`, `tabindex="-1"` so it can hold focus when nothing
  inside is tabbable. The rest of the page is `aria-hidden` while it is open.
- Focus enters on open and returns on close (§7).
- **Manual walkthrough:** Tab to the trigger, Enter; confirm the name and
  the description are announced and focus is on the first control; Tab past
  the last control and confirm it wraps to the first; Shift+Tab from the
  first and confirm it wraps to the last; Escape, confirm focus is on the
  trigger and the page is readable again. Open with the pointer and press
  the scrim, confirm it closes. Open a dialog from a row's menu with no
  trigger, close it, confirm focus is on the menu button. Open a dialog
  from inside a dark region of a light page and confirm the scrim and the
  panel are dark. Set `dir="rtl"` on the root and confirm the panel is
  centred. Shrink the window to 320px and confirm the panel shrinks with
  the gutter kept and nothing scrolls sideways. Put more content in it than
  fits and confirm the *scrim* scrolls, the title scrolls away with it, and
  the page behind does not move.

## Container behavior

None of its own — the viewport is its container. The panel is never wider
than the viewport less twice the gutter, at any width, and it is the
scrim, not the page, that scrolls when it is taller. Shown in the gallery
(§10) and asserted at a real 320px viewport in the browser suite.

## Usage

```tsx
// The usual: a short form, a title, a description, two buttons.
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Rename</Button>
  </DialogTrigger>
  <DialogContent>
    <Stack gap="4">
      <Stack gap="1">
        <DialogTitle>Rename file</DialogTitle>
        <DialogDescription>The new name is applied everywhere it is linked.</DialogDescription>
      </Stack>
      <Field label="Name"><Input defaultValue="report.pdf" /></Field>
      <Cluster justify="end" gap="2">
        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
        <DialogClose asChild><Button onClick={rename}>Rename</Button></DialogClose>
      </Cluster>
    </Stack>
  </DialogContent>
</Dialog>

// A corner close: the end of the title row, not an absolute position.
<Cluster justify="between" align="start">
  <DialogTitle><Heading level={2} size="sm">Settings</Heading></DialogTitle>
  <DialogClose asChild>
    <IconButton label="Close" variant="plain" size="sm"><Cross /></IconButton>
  </DialogClose>
</Cluster>

// Controlled, opened from somewhere that is not a trigger. Focus returns
// to the button that was focused when it opened (§7).
const [open, setOpen] = useState(false);
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-label="Edit row">…</DialogContent>
</Dialog>

// Unsaved changes: veto the close, do not confirm it.
<DialogContent
  onEscapeKeyDown={(e) => { if (dirty) e.preventDefault(); }}
  onPointerDownOutside={(e) => { if (dirty) e.preventDefault(); }}
>

// A long body with the title and buttons held still: a bounded Scroller.
<DialogContent>
  <Stack gap="4">
    <DialogTitle>Terms</DialogTitle>
    <Scroller style={{ maxBlockSize: '50vh' }}>…</Scroller>
    <Cluster justify="end"><DialogClose asChild><Button>Agree</Button></DialogClose></Cluster>
  </Stack>
</DialogContent>
```

## Don't

```tsx
// ✗ No name. Title, aria-labelledby or aria-label; development warns.
<DialogContent>…</DialogContent>

// ✗ A non-modal dialog. There is no `modal` prop: beside its trigger it is a
//   Popover; a panel that stays open while the page is used is a Drawer.
<Dialog modal={false}>…</Dialog>

// ✗ A confirmation with a confirmation. Veto the close through the events
//   instead (§5).
<Dialog onOpenChange={(open) => { if (!open && !window.confirm('Discard?')) return; setOpen(open); }}>

// ✗ Sizing the panel. The ceiling is the custom property; the width is the
//   content's.
<DialogContent style={{ width: 720 }} />
<DialogContent style={{ '--pp-dialog-max-inline-size': 'var(--pp-measure-md)' }} />  // ✓

// ✗ A close button positioned by the panel. Placement is the parent's; put
//   it at the end of the title row (§5).
<DialogClose asChild><IconButton label="Close" style={{ position: 'absolute', top: 8, right: 8 }} /></DialogClose>

// ✗ Flipping a controlled dialog from an outside control. The dismissal
//   arrives before the click; say the state instead (D-065 §4).
<Button onClick={() => setOpen((o) => !o)}>Toggle</Button>

// ✗ A destructive default. That is an AlertDialog (4.5), which will not
//   close on a scrim press and will focus the safe button.
<DialogContent><Button tone="danger">Delete</Button></DialogContent>
```

## Testing notes

- **Unit (jsdom):** open and close by trigger, by Escape, by a pointer
  press on the scrim, by `DialogClose`; a right-click on the scrim does not
  close; controlled and uncontrolled; the trigger's `aria-haspopup` /
  `aria-expanded` / `aria-controls`; `role="dialog"` and `aria-modal="true"`;
  `aria-labelledby` present exactly when a `DialogTitle` is mounted and
  pointing at it, `aria-describedby` likewise; `aria-label` on `Content`
  with no title; the name warning, once, in development, and not with any
  of the three names; focus lands on the first tabbable on open and on the
  trigger on close; **without a trigger, focus returns to the element that
  had it** (§7) — and the break check is that removing the restore lands it
  on `<body>`; `aria-hidden` is set on the page's other children while open
  and removed after; `asChild` onto `Button` and `IconButton`; the theme
  copy from a `renderWithTheme` dark scope lands on the scrim; `onEscapeKeyDown`
  with `preventDefault` keeps it open; axe with the dialog open, no rule
  disabled unless §11's check says one must be, with the reason beside it.
- **Browser:** the scrim's box is the viewport's; the panel's centre is the
  viewport's centre in LTR and in `dir="rtl"`; `z-index` is 1000 on the
  scrim and 1100 on the panel, a `Popover` opened inside is above the scrim,
  and a second `Dialog` opened from the first paints above it and Escape
  closes only the second (§4); at a 320px viewport the panel is 288px wide
  and the page has no horizontal overflow; a panel taller than the viewport
  makes the *scrim* scroll and not `<body>`, and the page's scroll offset is
  unchanged after close; the RTL scrollbar compensation, measured and
  recorded (§9); a press on the scrim closes and nothing under it is
  pressed; a dialog opened inside a dark region of a light page carries
  `data-pp-theme="dark"` on its scrim and the scrim's resolved colour is the
  dark theme's; reduced motion opens and closes at once; the gallery holds
  three open dialogs, each scrim the size of its cell, the narrow and
  medium panels below the ceiling and the wide one at it (§10).
- **Break checks (D-035 §3):** drop `aria-modal` (that test); drop the
  no-trigger restore (the focus test); drop the panel's `z-index` (the
  stacking test — the number is relative to the scrim's context, so record
  whether this one is observable); drop the reduced-motion rule (that test);
  drop `data-pp-theme` from the scrim (the theme test); replace
  `place-items` with the physical `translate` centring (the RTL centring
  test); drop `min-inline-size: 0` from the panel (the unbreakable-string
  test, at 320px).
- **Screenshot:** the gallery, both themes (§10), plus
  `npm run dimensions -- --rebaseline index` in the commit that adds the
  registry entry (D-066 §2).
- **Tree-shaking (4.1 §2):** the chunk holding `@radix-ui/react-dialog` is
  referenced by the Dialog page's payload and by neither the Button page's
  nor the Popover page's. The two share Radix's dismissable layer, focus
  scope, portal and presence, which Next may split into a common chunk; the
  assertion is about the dialog's own module, as D-062 §6 and D-065 §6 were
  about the popover's and the tooltip's.

**Dependency (4.1 §2):** `@radix-ui/react-dialog@^1.1.23` into
`dependencies`. It brings `react-remove-scroll` and `aria-hidden`, the two
the 4.1 table priced (328 KB installed for the first); neither has been
installed before, and both are tree-shaken away by any app that never
imports `Dialog`.

## Open questions

Resolve before Gate C.

1. **§2 — no `modal` prop.** The alternative is `Popover`'s mirror image:
   `modal` defaulting to `true`, with `false` giving Radix's non-modal
   dialog — no scrim, no lock, no trap — for a floating panel that stays
   open while the page is used. **Recommendation: none.** A non-modal
   dialog is a different APG pattern with rules this spec does not
   implement, and the scrim is the positioner, so the non-modal panel would
   need a second way to be placed. Add the prop when a spec needs it.
2. **§3 — `--pp-measure-sm` and no `size`.** The alternatives are `xs`
   (20rem, `Popover`'s) as the default, or a `size` prop mapping `sm | md
   | lg` onto three measures. **Recommendation: `sm`, no `size`.** 20rem
   holds no form; a `size` on the panel is the parent's decision on the
   child, and the custom property is the escape. `AlertDialog` gets its
   own, smaller default.
3. **§4 — the scrim scrolls, the panel does not.** The alternative caps the
   panel at the viewport and scrolls inside it, which is what a fixed footer
   needs. **Recommendation: the scrim.** It is Radix's recipe, the title
   stays with its content, and the fixed-footer case is a `Scroller` inside
   the panel — composition rather than a mode.
4. **§6 — `DialogTitle` is a `<div>`, not an `<h2>`.** This is the library's
   precedent (Alert.md §6, Popover §2) and it is weaker here than there: a
   modal dialog is a context of its own, screen-reader users navigate its
   content by heading, and every reference implementation — Radix's default,
   APG's example — renders an `h2`. **Recommendation: keep the `<div>`**,
   because the level still is not ours to pick (an `h2` in a dialog opened
   from an `h4` section is a guess), and `<DialogTitle><Heading level={2}>`
   is one line. If you would rather the component guess `h2`, say so and
   D-numbered it goes; the change is one `asChild` target.
5. **§5 — no automatic close button.** The alternative renders an
   `IconButton label="Close"` in the corner of every panel, which is what a
   consumer coming from shadcn expects. **Recommendation: none.** A footer
   Cancel closes; a corner × is a design choice per app and its placement
   is the parent's; the pattern is one `Cluster` row on the docs page.
6. **§6 — `aria-modal="true"` written by us.** Radix leaves it off on
   purpose (its `aria-hidden` sweep is the mechanism). **Recommendation:
   write it.** APG asks for it, the sweep stays, and the two do not conflict.
7. **§7 — the no-trigger focus restore.** The one behaviour this spec adds
   over Radix's. The alternative is to leave it: a controlled dialog with no
   trigger drops focus to `<body>`, as Radix does today. **Recommendation:
   restore.** APG's rule is "focus returns to the element that invoked the
   dialog", and a menu item or a row is an invoker.
8. **§10 — the gallery portals into contained cells.** The alternative is
   one `defaultOpen` dialog over the page, captured in the middle of a
   full-page screenshot, with the width behaviour asserted only in the
   browser suite. **Recommendation: the cells.** They show the one thing a
   dialog does across widths, and a dimmed full-page baseline would weaken
   every other section's diff on that page.
