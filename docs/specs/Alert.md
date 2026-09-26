# 5.2 `Alert`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-21 (D-053); amended by D-059 |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no hooks, no state, no browser API (§8) |
| **Depends on** | 1.3 `Icon` — composed (§5). 3.2 `IconButton` — composed, only when `onDismiss` is given (§4). **Not** 2.2 `Cluster`; the roadmap's `Deps` was corrected from `1.3, 2.2` to `1.3, 3.2` at approval (D-053 §9) |
| **APG pattern** | [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — deliberately **not** applied by default (§2) |

Approved on its own gate 2026-09-21. It is the first component of Tier 5 and it
unblocks 3.16 `Form`, whose error summary is an `Alert`. Build findings are
below and in [D-053](../DECISIONS.md).

## Purpose

A bordered, tone-coloured block that says something happened, or something is
true, about the region of the page it sits in. A failed save, a queued export, a
"you are viewing test data" banner, the summary above a form that would not
submit.

It deliberately does **not**:

- **Hide itself.** There is no `open`, no `defaultOpen`, no internal dismissed
  state. `onDismiss` reports the intent and the caller unmounts it (§4).
- **Float, stack, queue or time out.** That is `Toast` (4.12), which owns a
  persistent live region and an imperative API. An `Alert` is in the document
  flow where the caller put it.
- **Interrupt.** `role="alert"` is opt-in, not the default, and the reason is
  the whole of §2.
- **Render a field's error.** `Field` (3.7) already does, with the
  `aria-describedby` wiring an inline error needs. An `Alert` inside a `Field`
  is two error mechanisms for one error.
- **Carry a heading level.** `h2` or `h3` is a document-structure decision that
  depends on where the caller put the alert, and a component that guesses it
  produces an outline nobody asked for (§6).
- **Ship icons.** `Icon` (1.3) ships none of its own and neither does this
  (§5).

---

## Decisions this spec asks you to approve

### 1. One visual treatment. No `variant`, and the three rejections are measured

`Badge` and `Button` share a four-variant table (`solid` / `outline` / `ghost` /
`plain`) and the obvious move is to reuse it a third time. This spec does not,
and the argument is numbers rather than taste. Every figure below is
`scripts/color.mjs` run against the committed `primitives.css`, light theme
first, across all five hues.

**An `Alert` is the only component in the library whose children are
arbitrary.** A `Badge` holds a word. A `Button` holds a label. An `Alert` holds
whatever the caller writes, and in practice that is prose with a `Link` in it
and a `Cluster` of `Button`s under it. So the variant question is not "how
should the box look" but "what does each box do to the controls inside it".

(**Amended by D-059.** This paragraph first said the tone context "inherits
into all of it". It does not: `Button` and `Link` write their own
`data-pp-tone` from a default, so they keep their own hue inside an alert. The
rejection below survives, re-measured against what they actually resolve to.)

| Rejected variant | What it does to the block | Measured |
| --- | --- | --- |
| `solid` (`--pp-tone-solid` fill) | Puts caller content on step 9. Prose reads `--pp-tone-text` there: **1.04–1.16:1** in light and **1.10–1.46:1** in dark. A `plain` `Button` (its own neutral step 11) and a `Link` (its own accent step 11) land at **1.05–1.16:1** and **1.09–1.47:1**, because step 11 sits at one lightness in every hue. Not "low contrast": invisible. `warning`, whose step 9 is light, is the outlier at **2.73** / **1.94** — still under 4.5:1, and left out of the ranges above (D-059) | `text(11)` vs `solid(9)` |
| `outline` (no fill) | The border alone. It reads as a generic box; nothing carries the tone at a glance, which is the one job the tone has | — |
| `plain` (no fill, no border) | `--pp-tone-bg` against the page is **1.10–1.12:1** light, **1.19–1.20:1** dark. Without a border there is no block, only slightly tinted prose | `bg(3)` vs `neutral-1` |

So: one treatment, **`--pp-tone-bg` fill plus a `--pp-tone-border` edge**, and
`tone` is the only axis. This follows D-030 §6, where `Link` was given neither
`variant` nor `size` on the same grounds — a fixed vocabulary says what a prop
must be *called* when it exists, not that every component must have one.

The consequence to accept: a caller who wants a loud, filled, critical banner
cannot get one from this component. They get `tone="danger"` and a tinted block.
`--pp-alert-bg` and `--pp-alert-color` are the documented escape (§Styling API),
and a caller who overrides both owns the contrast they land on — which is
exactly the trade the measurement above says the library should not make by
default.

### 2. `role="alert"` is opt-in. The default is no live region at all

This is the decision the component is named after, and the name is the trap.

`role="alert"` is an assertive live region: it interrupts whatever the screen
reader is saying. That is correct for "your session expires in 60 seconds" and
wrong for the six other things people build with an alert box. Three further
facts push the default the same way:

- **A live region announces changes to a region that already existed.** An
  `Alert` server-rendered into the initial HTML has no "change" to announce. The
  behaviour ranges from silence to a double read depending on the screen reader
  and how fast the page settled, and none of it is something the component can
  control.
- **A region that is always present is never news.** A permanent "test mode"
  banner with `role="alert"` re-announces on every navigation that re-mounts it.
- **`Field` already ruled on this shape** for the error message (`Field.md` §5):
  no `role`, no `aria-live`, because a string that is both live and referenced
  by `aria-describedby` is announced twice by several screen readers.

So `live` is a prop, defaulting to `off`:

| `live` | Root gets | For |
| --- | --- | --- |
| `off` *(default)* | no role, no `aria-live` | Anything present when the page renders |
| `polite` | `role="status"` | An alert that stays mounted while its content changes, and can wait for a pause (**amended by D-059** — was "something that appeared because the user did something", which in React means mounting it, the case the paragraph below says is not reliable) |
| `assertive` | `role="alert"` | Something that must interrupt |

The values are ARIA's own words on purpose: a caller who knows what
`aria-live="polite"` does needs no further documentation, and one who does not
is not helped by us inventing `urgency="low"`.

`role` rather than a bare `aria-live` attribute, because `role="status"` and
`role="alert"` also imply `aria-atomic="true"` — the region is read as a whole
rather than as the one word that changed — and they are the better-supported
spelling. A caller who needs something else sets `role` or `aria-live`
explicitly; both pass through the spread and both land after ours.

**The cost, named rather than hidden** (the `Field` §5 habit): mounting an
element that already carries `role="alert"` is the *less* reliable way to
announce something. The reliable way is a region that exists first and receives
text afterwards, which is `Toast`'s (4.12) whole architecture. `live="assertive"`
here is best-effort for the mount case and works in current Chromium, Firefox
and WebKit; if it turns out not to be enough for `Form`'s error summary, `Form`
moves focus to the summary instead — which the component already supports,
because it forwards `ref` and spreads `tabIndex`.

### 3. `tone` defaults to `neutral`, and the tone is never the only signal

`neutral`, like every other tone-taking component in the library, rather than an
"info" default dressed up as `accent`. A grey bordered block is a perfectly good
note, and it is what `<Alert>` with no props should be.

What this spec will **not** do is let the tone be the only thing distinguishing
a success from a failure. It is a documented "don't" below, not a mechanism:
the sentence inside the alert has to say what happened. This is the same
argument that made `underline="always"` the `Link` default (D-030 §7) and that
kept colour off an invalid `Label` (`Label.md` §4) — colour is reinforcement,
never the carrier.

### 4. `onDismiss` reports the intent. The component holds no state

RULES §5.5 requires controlled **and** uncontrolled from every stateful
component. The cheapest way to satisfy it here is not to be stateful.

`onDismiss` is an event-handler prop, not a state prop. When it is present the
component renders an `IconButton` and calls back; the caller removes the alert
from its own tree. Nothing is stored, so there is no mode to get wrong, no
`useControllableState`, and no `'use client'`.

Rejected: `open` / `defaultOpen` / `onOpenChange` with internal state. It is
more API, it makes the component client-only, and it puts the alert's visibility
somewhere the app cannot see — which is wrong for the case that actually
matters, where dismissing a banner has to be remembered across a reload.

The dismiss control is `IconButton` (3.2), `variant="plain"`, `size="sm"`,
`tone` passed through from the alert — explicitly, because an `IconButton`
writes its own tone from a default and would not inherit one (D-059):

- `plain` and not `IconButton`'s `ghost` default, because `ghost`'s fill is
  `--pp-tone-bg` — the alert's own surface — over a `--pp-tone-border-subtle`
  border, so a `ghost` button here draws a visible outlined box for no reason
  and no fill at all. `plain` is transparent with a `--pp-tone-bg-hover` hover,
  which is the same hue one step darker.
- `size="sm"` is a 32px square (`--pp-control-height-sm`), clearing WCAG 2.5.8's
  24px minimum without a spacing exception.
- Its glyph is `--pp-tone-text` on `--pp-tone-bg`: **4.59:1 in both themes**,
  against 1.4.11's 3:1.

`dismissLabel` is a required-in-practice string defaulting to `"Dismiss"`,
because `IconButton`'s `label` is non-optional by design (D-031) and a library
that ships an English string has to let a caller replace it.

**The `Deps` column in `ROADMAP.md` says `1.3, 2.2`.** This spec adds 3.2
(`done`), and does not compose 2.2 at all. Both are tracking corrections to make
when the row moves, not scope changes.

### 5. No default icons, and `icon` takes the SVG rather than an `<Icon>`

Every other library ships four glyphs here — an i in a circle, a tick, a
triangle, a cross. This one should not, for the reason `Icon`'s own spec gives:
it ships no icons of its own.

The apparent counter-example is `Select`'s chevron (D-039 §3), and it is not
one. `appearance: none` *deletes* the arrow the platform drew, and a select with
no arrow is not identifiable as a select — the chevron replaces something that
was taken away. An alert loses nothing by having no glyph. Four opinionated
glyphs are a design system's identity, and putting them in a primitive means
every consumer who has their own icon set ships both.

So `icon` is a slot: `icon?: ReactNode`, taking the **SVG**, which the component
wraps in `<Icon decorative>`. Same shape as `IconButton`'s `children` and
`Select`'s chevron, so sizing and `aria-hidden` are guaranteed rather than
requested.

`decorative` and not a label, deliberately. If the glyph carried the meaning it
would need a name, and then a screen reader would hear "warning, warning: the
export failed". The text says what happened; the glyph is for the eye.

**This is the decision I would most like a second opinion on.** The alternative
— five defaults keyed off `tone`, overridable by `icon`, removable with
`icon={null}` — is one paragraph of code and it is what most people expect from
`<Alert tone="danger">`. If you want it, say so at approval and it lands with
the build; the `null`-is-explicit-none convention is already established by
`NumberInput` (3.14).

### 6. `title` is a prop and renders a `<div>`, not a heading

**A prop rather than a subcomponent**, for D-036's reason arriving in a
different place. `Field` takes eleven configuration props because it has to
*compute* `aria-describedby` in one pass. `Alert` takes `title` because it has
to *place* it: the layout is a three-column grid — icon, content, dismiss — and
the icon spans what the title and the body occupy. A `<Alert.Title>` the
component cannot see until render is a structure it cannot lay out without
asking children to register themselves, which is the runtime-discovery problem
D-036 refused.

**A `<div>` rather than a heading**, because the right level is `h2` in a page
banner, `h3` inside a card, and nothing at all in a one-line notice. `Heading`
(1.2) exists precisely because the visual level and the semantic level are
different decisions, and this component knows neither.

The escape is composition and needs no extra prop: `title` is a `ReactNode`, so
`title={<Heading level={3} size="sm">Export failed</Heading>}` puts a real
heading inside `.pp-alert__title`, which then contributes grid placement and
lets the `Heading` win on type. Documented under Usage.

### 7. No `size`

Three sizes of `Alert` is six more screenshots and a decision nobody needs. An
alert is a block at page or section scale; the field-scale case is `Field`'s
error, which is a different component with different wiring (§Purpose).

`--pp-alert-padding-block` and `--pp-alert-padding-inline` are the escape for a
caller who genuinely needs a denser banner. Same ruling as D-030 §6 for `Link`.

### 8. `server`, and that survives rendering a client component

No hooks, no state, no `useId`, no browser API — so no `'use client'`, and an
`Alert` renders on the server like `Badge` does.

Rendering `IconButton` (which is `'use client'`) does not change that: a server
component importing a client component is the ordinary RSC boundary, and D-032
already scoped the lint rule to what ships rather than to what is imported. The
consequence a caller must know, and which is documented rather than prevented:
`onDismiss` is a function, so the component that passes it must itself be a
client component. React's error for this case is clear and the library should
not paper over it.

### 9. The measured contrast, at the gate

D-048 §1 and D-049 §3: compute the pairing before the build, not after. Every
pairing this component introduces, both themes, all five hues:

| Pairing | Light | Dark | Needs | Already asserted by `lint:contrast`? |
| --- | --- | --- | --- | --- |
| Title — `text-strong(12)` on `bg(3)` | 14.02–14.35 | 12.76–12.98 | 4.5 | **Yes** (`body text vs component bg`, ≥7) |
| Body — `text(11)` on `bg(3)` | 4.59 | 4.59 | 4.5 | **Yes** (`muted text vs component bg`) |
| Edge — `border(edge)` vs page `neutral-1` | 3.40 | 3.66 | 3.0 | **Yes** (`edge vs page bg`) |
| Edge — `border(edge)` vs own `bg(3)` | 3.04–3.08 | 3.04–3.08 | 3.0 | **Yes** (`edge vs component bg`) |
| Dismiss glyph — `text(11)` on `bg(3)` | 4.59 | 4.59 | 3.0 | **Yes** — same pairing as the body |

**The component adds no pairing the token layer does not already assert**, which
is what D-048 §1 asked for after `Switch` failed it twice. The fill is
`--pp-tone-bg` — step 3, the "component bg" every one of those checks is named
after — rather than `--pp-tone-surface` (step 2) for exactly this reason: step 3
is the step the assertions cover, and it is the step every other component's
resting surface already uses.

**And one pairing that fails, which this component did not cause and cannot
fix.** The focus ring is one colour library-wide, `--pp-color-focus-ring` =
`--pp-palette-accent-focus` (D-029), and `lint:contrast` asserts exactly one
pairing for it — against the **page**, where it is 3.06:1. Against a tinted
step-3 surface it is:

| Ring against | Light | Dark |
| --- | --- | --- |
| `neutral-1` (page) — the asserted pairing | 3.06 | 3.06 |
| `neutral-2` (`--pp-color-bg-surface`) | 2.94 | 2.85 |
| `<hue>-3` (this component's surface) | **2.74–2.77** | **2.54–2.57** |

So the dismiss button's ring, and the ring on any `Link` in the body, is below
1.4.11's 3:1 against the surface it is drawn on. This is D-048 §2's shape
exactly: a missing check class reads precisely like a passing one, and the ring
has been unverified on every surface but the page since 3A. `Button.css`'s own
header says the five `--pp-tone-focus` values "are asserted against nothing" —
the half nobody measured is that the one ring that *is* asserted is asserted
against one background out of three.

It cannot be fixed inside this component: overriding `--pp-color-focus-ring`
inside `.pp-alert` would be a second ring colour in the library, which is the
one thing D-029 exists to prevent.

**Corrected 2026-09-21, while building 0.11 (D-055).** This paragraph first
said the ring's colour was "identical in both themes by design, so moving it
darker fixes light and breaks dark", and that the fix needed a per-theme or
two-tone ring plus a re-baseline of every screenshot. All of that was wrong,
and it was wrong because a `grep` matched two `:root`-shaped blocks and the
second was `[data-pp-theme="light"]`, not the dark one. **The ring has been per
theme since 0.2** — light L 66.18%, dark L 49.70% — and both were merely solved
against step 1. Solving them against steps 1, 2 and 3 of every hue is the whole
fix: light moves to 63.34%, dark to 53.99%, and the worst pairing in the library
goes from 2.54 to 3.06. No new mechanism, and no re-baseline, because no
baseline page renders a focused element.

**What this spec proposes:** build `Alert` now, record the measurement in
DECISIONS, and add the missing checks (`focus vs 2`, `focus vs 3`) to
`check-contrast.mjs` **together with** the token-layer fix, as its own roadmap
item, next. That is the D-048 §2 → D-050 path, which worked. The alternative —
hold 5.2 until the ring is redesigned — is also defensible and is yours to pick;
see Open questions.

---

## Sizing contract justification

`fill`. An alert is a block that spans the column it is placed in: a banner
above a page, a summary above a form, a notice inside a card. Hugging its
content would make a two-word alert a two-word-wide box floating in a page
width, which is not a thing anyone wants and is not something the caller could
correct without the `max-inline-size` RULES §1 reserves for `Container`.

Implementation is RULES §1's letter: `display: grid`, no `width` /
`inline-size` / `max-inline-size` declaration anywhere in `Alert.css`, plus
`min-inline-size: 0` so a long unbroken string in the body cannot push the grid
past its parent.

No exception requested.

## Anatomy

```
<div class="pp-alert" data-pp-tone="danger" [role="alert"|"status"]>
  ├── <span class="pp-icon pp-alert__icon" aria-hidden="true">   — only when `icon`
  │     └── {icon}
  ├── <div class="pp-alert__content">
  │     ├── <div class="pp-alert__title">  — only when `title`
  │     └── <div class="pp-alert__body">   — {children}
  └── <button class="pp-button pp-icon-button pp-alert__dismiss"> — only when `onDismiss`
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-alert` | `div` | The grid, the fill, the edge, the tone context. `className`, `style`, `ref` and the spread all land here |
| Icon | `pp-alert__icon` | `span` wrapping `Icon` | A wrapper one line box tall, holding a `decorative` (therefore `aria-hidden`) `Icon`. The wrapper is what aligns the glyph without a nudge; `Icon` itself must stay square, because `.pp-icon > svg` is 100% of both axes and a taller box would stretch the drawing |
| Content | `pp-alert__content` | `div` | Column 2. Exists so the optional title and the body stack as one grid item; without it, "no title" would have to be a second grid template |
| Title | `pp-alert__title` | `div` | `--pp-tone-text-strong`, `--pp-font-weight-medium`. Not a heading (§6) |
| Body | `pp-alert__body` | `div` | `--pp-tone-text`. Rendered only when there are children — an always-present empty box is a flex item, so it would pay a row gap. `undefined`, `null` and `false` are all "no slot"; `0` and `''` are content |
| Dismiss | `pp-alert__dismiss` | `IconButton` → `button` | Column 3, `align-self: start`, so it stays on the first line of a tall alert |

**The icon sits on the first line without a nudge.** RULES §2 bans the
`margin-block-start: -2px` every recipe uses. Instead the icon box is given
exactly one line box of height —
`block-size: calc(var(--pp-font-size-3) * var(--pp-line-height-snug))` — and
`Icon` already centres its SVG inside itself, so the glyph lands on the text's
optical centre from the two tokens that define that line box. Nothing is tuned,
and changing the type scale moves both together. This is D-052 §1's habit:
derive it so the arithmetic is the documentation.

**Corrected at build: the root is flex, not a three-column grid (D-053 §3).**
Built as `grid-template-columns: auto minmax(0, 1fr) auto` with the parts placed
in those columns, an alert with **no icon** starts 12px in from its own padding
edge — one `--pp-alert-gap`, paid for the empty track it left behind. A grid
gaps between *tracks*; whether anything is in them is not part of the question.
Flex gaps only between items that exist, so an absent slot costs nothing and
nothing needs explicit placement. Measured both ways in the browser suite.

**2.2 `Cluster` is not composed.** The roadmap listed it as a dependency and the
layout turns out not to need it: the actions row is the caller's
(`<Cluster gap="2">` inside `children`), which is RULES §5.6 working as
intended. The dependency is real as ordering — an alert without layout
primitives has nowhere to put its buttons — and not as an import.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `Tone` | `'neutral'` | The fixed vocabulary. Sets `data-pp-tone` on the root (D-007). Reaches bare text and `currentColor`; a `Button`, `Link`, `Badge` or `Code` inside keeps its own (D-059) |
| `title` | `ReactNode` | — | Rendered in `.pp-alert__title`. Omit it and the body is the whole alert (§6) |
| `icon` | `ReactNode` | — | The **SVG**, not an `<Icon>`. Wrapped in `<Icon decorative>` (§5) |
| `onDismiss` | `() => void` | — | Its presence renders the dismiss button. The component does not hide itself (§4) |
| `dismissLabel` | `string` | `'Dismiss'` | The dismiss button's accessible name. Ignored when `onDismiss` is absent |
| `live` | `'off' \| 'polite' \| 'assertive'` | `'off'` | `polite` → `role="status"`, `assertive` → `role="alert"` (§2) |
| `children` | `ReactNode` | — | The body. Prose, and whatever the caller puts under it |

Seven props, all of the root `div`'s own props spread on top. No `variant` (§1),
no `size` (§7), no `open` (§4). `AlertProps extends ComponentPropsWithoutRef<'div'>`.

## State

`Alert` has no state. It is a block that renders what it was given, which is
why §4 and §8 come out the way they do.

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Tone | `data-pp-tone="<tone>"` | Fill, edge, title and body colour, all through `--pp-tone-*` |
| Live region | `role="status"` / `role="alert"` | None — it is an assistive-tech affordance with no visual form |

RULES §4 requires visual state on `data-*` attributes. There is no visual state
here to expose, and inventing `data-dismissible` to have something in this table
would be an attribute that restates the presence of a button.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-alert-bg` | `--pp-tone-bg` | Root fill |
| `--pp-alert-color` | `--pp-tone-text` | Body text. The dismiss glyph is the same token, reached through the tone passed to its `IconButton` |
| `--pp-alert-title-color` | `--pp-tone-text-strong` | Title |
| `--pp-alert-border-color` | `--pp-tone-border` | The edge |
| `--pp-alert-radius` | `--pp-radius-3` | Corner radius |
| `--pp-alert-padding-block` | `--pp-space-3` | Vertical padding |
| `--pp-alert-padding-inline` | `--pp-space-4` | Horizontal padding |
| `--pp-alert-gap` | `--pp-space-3` | Column gap: icon → content → dismiss |
| `--pp-alert-row-gap` | `--pp-space-1` | Title → body |

Per D-024, none of these is written inline by the component; each is read with a
token fallback (`var(--pp-alert-bg, var(--pp-tone-bg))`) and set by consumers.

## Keyboard interaction

The alert itself is not focusable and takes no keys. The dismiss button is an
ordinary `button`:

| Key | Behavior |
| --- | --- |
| `Tab` | Moves to the dismiss button in document order, after any focusable content in the body |
| `Enter` / `Space` | Activates the dismiss button — the platform's, not ours |
| `Escape` | **Nothing.** Deliberate |

**`Escape` does not dismiss, and that is a divergence worth stating.** Escape
belongs to dismissable *layers* — the overlay foundation (4.1) and everything
built on it. An inline alert that swallowed Escape would take it from the
`Dialog` it is sitting inside, so the first alert inside a modal would break
the modal. APG's Alert pattern specifies no keyboard interaction at all, which
is the same conclusion arrived at from the other end.

The manual walkthrough to record at Gate D: Tab from the content before the
alert → focus enters the body's links in order → focus reaches the dismiss
button → Enter fires `onDismiss` → focus behaviour after the caller unmounts the
alert is the caller's, and is a documented "don't" below.

## Accessibility notes

- **Role.** None by default; `status` or `alert` when `live` says so (§2).
- **The icon is never the name.** `<Icon decorative>` sets `aria-hidden`, so an
  alert announces its text and nothing else.
- **The title is not a heading** (§6), so an alert adds nothing to the document
  outline unless the caller passes a `Heading`.
- **Announcement order.** With `role="alert"` or `role="status"`, `aria-atomic`
  is implied, so the whole region is read: title, then body, then the dismiss
  button's name. "Export failed. Try again in a few minutes. Dismiss, button."
  That trailing "Dismiss, button" is the cost of putting the control inside the
  region, and it is the right trade — moving it outside would leave a button
  with no programmatic relationship to the thing it closes.
- **Contrast.** §9. Every pairing the component introduces is one the token
  layer already asserts; the one failing pairing is the library-wide focus ring,
  measured and attributed there.
- **Colour is never the signal.** §3.
- **Focus after dismissal** belongs to the caller, because the caller owns the
  unmount. Documented under Don't.

## Container behavior

None, and that is deliberate: there is no `@container` rule in `Alert.css`.

The row is three flex items — an icon box that sizes to the glyph, a content box
that takes what is left and may shrink to nothing, and a 32px dismiss button. At a narrow container the content
column simply gets narrow and the prose wraps; the icon and the dismiss button
are both fixed and small, and together they are under 4rem, so there is no width
at which the arrangement stops working. Moving the dismiss button below the
content at some breakpoint would be a change with no problem behind it.

**Corrected at build (D-053 §4): `min-inline-size: 0` sizes the box and nothing
else.** This paragraph originally claimed it made the arrangement true for an
unbreakable string rather than merely true for prose. It does not. It lets the
flex item shrink below its automatic minimum, so the alert's own *edges* stay
inside its parent — and the *glyphs* of a long URL go right on painting past
them. The box measurement passed on the browser suite's first run while the
playground harness flagged four of six cells. `overflow-wrap: anywhere` on the
root is what makes it true, and it is inherited, so the title is covered by the
same declaration.

Checked at Gate D in the playground at all three container widths, both themes.

## Usage

```tsx
// The default: a neutral note.
<Alert>Exports are generated overnight.</Alert>

// Tone, title, and an icon from the caller's own set.
<Alert tone="danger" title="Export failed" icon={<XCircleIcon />}>
  The report could not be generated. Try again in a few minutes.
</Alert>

// Appearing in response to something the user did. The region is the
// caller's and is always mounted, so the alert's arrival is the change it
// announces; `live` stays off (D-059).
<div role="status">
  {saved && (
    <Alert tone="success" title="Saved">
      Your changes are live.
    </Alert>
  )}
</div>

// Actions go in children, spaced by a layout primitive (RULES §5.6).
<Alert tone="warning" title="Payment method expires soon">
  <Stack gap="3">
    <Text>Your card ending 4242 expires next month.</Text>
    <Cluster gap="2">
      <Button size="sm" tone="warning">Update card</Button>
      <Button size="sm" variant="plain" tone="warning">Remind me later</Button>
    </Cluster>
  </Stack>
</Alert>

// Dismissal: the caller owns the visibility. This component is a client
// component, because it passes a function (§8).
'use client';
const [showBanner, setShowBanner] = useState(true);
return showBanner ? (
  <Alert tone="accent" onDismiss={() => setShowBanner(false)} dismissLabel="Close">
    You are viewing test data.
  </Alert>
) : null;

// Heading semantics when the alert really is a section of the document.
<Alert tone="danger" title={<Heading level={2} size="sm">3 problems</Heading>}>
  …
</Alert>
```

## Don't

```tsx
// ✗ Tone as the only signal. A screen reader hears "Done." either way, and so
//   does anyone who cannot separate this green from the red one above it.
<Alert tone="success">Done.</Alert>
<Alert tone="danger">Done.</Alert>
// ✓ Say what happened.
<Alert tone="success">Your invoice was sent.</Alert>

// ✗ An alert for a field's error. Field already renders it, with the
//   aria-describedby wiring this has no way to reproduce.
<Field label="Email">
  <Input />
  <Alert tone="danger">Enter a valid email.</Alert>
</Field>
// ✓ Field.md §4: `error` IS the invalid state.
<Field label="Email" error="Enter a valid email."><Input /></Field>

// ✗ assertive by reflex. This is in the initial HTML; there is no change to
//   announce, and on the screen readers that do announce it, it interrupts.
<Alert live="assertive" tone="accent">You are viewing test data.</Alert>
// ✓ A banner that is always there is not news.
<Alert tone="accent">You are viewing test data.</Alert>

// ✗ Expecting the alert to disappear. onDismiss is a report, not a command;
//   this renders a close button that does nothing visible.
<Alert onDismiss={() => track('dismissed')}>…</Alert>
// ✓ The caller owns the unmount, and the focus that follows it.
{open && <Alert onDismiss={() => { setOpen(false); headingRef.current?.focus(); }}>…</Alert>}

// ✗ Sizing it. There is no width prop and there never will be (RULES §1).
<Alert style={{ maxWidth: 480 }}>…</Alert>
// ✓ Wrap it.
<Container size="sm"><Alert>…</Alert></Container>

// ✗ A stack of alerts as a notification queue. They do not stack, order,
//   deduplicate or expire.
{notifications.map((n) => <Alert key={n.id}>{n.text}</Alert>)}
// ✓ That is Toast (4.12).
```

## Build findings

Full reasoning in [D-053](../DECISIONS.md). The short version:

1. **The root is flex, not the three-column grid this spec drew** (§3 of D-053).
   A grid gaps between tracks, so an alert with no icon paid 12px for the empty
   one. Corrected in Anatomy above.
2. **`min-inline-size: 0` sizes the box and nothing else** (§4). The glyphs of
   an unbreakable URL went on painting past the edges it kept in place;
   `overflow-wrap: anywhere` is what this spec should have specified.
   Corrected in Container behavior above.
3. **Seventeen breaks were run; fifteen failed on the test named for them**
   (§5). Of the two that did not: the focus-ring assertion was pointed at the
   page's `accent` alert, whose `--pp-tone-focus` *is* the value
   `--pp-color-focus-ring` resolves to — so it compared a colour with itself
   and survived being given a tone. It reads the `danger` alert now. And
   `min-inline-size: 0` is observed by no assertion at all, which the test now
   says out loud instead of implying a guarantee it does not carry.
4. **Nothing else in §1–§9 changed.** The contrast table in §9 was computed
   before the build and the browser suite confirmed every figure in it; the
   legibility of a caller's `plain` `Button` against the fill is now an
   assertion rather than an argument, and it is the only place in the library
   where a tone step is paired with a caller's control.

The visual baseline is authored by CI on this branch (D-013, D-042); it is
deliberately absent from the commit that adds the page.

## Open questions

All three were resolved at approval on 2026-09-21.

1. **Default per-tone icons — shipped or not?** *Not.* `icon` is a slot taking
   the caller's SVG, and the library ships none of its own (§5, D-053 §9).
2. **The focus ring on a tinted surface** (§9), 2.74–2.77:1 light and
   2.54–2.57:1 dark against 3:1. *Build now, fix at the token layer next* — the
   D-048 §2 → D-050 path. It became roadmap item **0.11** and was fixed the
   same day; it turned out to be far smaller than this spec estimated, for the
   reason §9 now records. Nothing in `Alert.css` touches the ring, and a browser
   assertion holds the line that there is still exactly one ring colour.
3. **`ROADMAP.md`'s `Deps` for 5.2.** *Corrected to `1.3, 3.2`* on the move to
   `build`.
