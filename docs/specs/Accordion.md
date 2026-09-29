# 4.10 `Accordion`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-075. In `review` for the CI-authored baseline only (D-069 §2) |
| **Sizing contract** | `fill` — the root, every item, every trigger and every panel fill their container |
| **RSC** | `client` — Radix state, roving focus, a measured height for the motion |
| **Depends on** | Tier 3 (`done`): the control metrics and the focus ring; 1.2 `Heading` for the precedent on levels |
| **APG pattern** | [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): a heading holding a button with `aria-expanded` and `aria-controls`, a `region` labelled by the button; `ArrowUp` / `ArrowDown` and `Home` / `End` between the buttons |

A vertical stack of sections, each with a heading that shows or hides its
content. The second Tier 4 component in flow: nothing floats, nothing is
portalled, and the direction is the page's. What it takes from the tier is
Radix's state and roving focus and, from `Tabs`, the rulings on
`keepMounted` and on not writing a direction.

## Purpose

Sections a reader opens one at a time — an FAQ, a settings page's
groups, a filter sidebar — where the headings are the table of contents
and the content is long enough to hide. One open at a time by default,
any number with `multiple`.

It deliberately does **not**: hold a single disclosure (`Collapsible` is
Radix's primitive beneath this one; a lone "show more" is a `Button` and
a state, and if that proves too little it is a later item); nest (an
accordion inside a panel is fine, an accordion *of* accordions is a
`Tree`, 5.11); or animate the opening beyond the height (the content
does not fade).

---

## Decisions this spec asks you to approve

### 1. Compound, four parts, and the heading level is the root's

```tsx
<Accordion defaultValue="shipping" headingLevel={3}>
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

`Accordion` (the root), `AccordionItem` (`value`, `disabled`),
`AccordionTrigger` (a `<button>` inside a heading), `AccordionContent`
(`role="region"`, `keepMounted`). Named exports (D-062 §1). Radix has a
fifth part, `Header`, the heading around the button; here it is drawn by
the trigger, because a trigger outside a heading is the one shape APG
forbids and a part nobody may omit is not a part.

**The heading's level is `headingLevel` on the root**, `2`–`6`, default
`3` (Radix's). Alert.md §6 ruled that a component cannot know the right
level — and it cannot — but an accordion's headings are one level, all
of them, and they *must* be headings (APG): so the level is asked once,
where it is known, and not on every item. `Heading` (1.2) requires its
`level`; this defaults, because an accordion under a page's `h2` is `h3`
far more often than not, and a wrong default here is an outline nit, not
an inaccessible control.

### 2. `multiple` is a boolean, not a `type`; `collapsible` defaults to `true`

Radix's root takes `type: 'single' | 'multiple'`. RULES §5 reserves `type`
(HTML's), so the prop is **`multiple?: boolean`**, and the value's shape
follows it: `string` for one, `string[]` for many, a discriminated union
on `multiple` so `onValueChange` is typed to match.

`collapsible` (single only) defaults to **`true`**, the opposite of
Radix's: pressing the open section's heading closes it. Radix's default
exists for the strict APG reading where exactly one panel is always
open; the common expectation — a section you opened, you can close — is
the default here, and `collapsible={false}` is the strict form.

### 3. `fill`, in flow, and the look is a list of headings on hairlines

The root fills its container and stacks its items; every trigger is the
full width. A hairline (`--pp-color-border-subtle`) above the first item
and below every item; the trigger is a row of the label and a chevron at
the inline end, at least `--pp-control-height-lg` tall (48px: a target a
thumb finds) with `--pp-space-3` of block padding for a label that wraps,
in `--pp-font-size-3` at medium weight in the text colour; no fill, no
inline padding (the hairlines run edge to edge and the label sits on the
container's edge, as the content below it does). The chevron is
`--pp-color-text-muted` and turns 180° when the item is open. Disabled:
`--pp-color-text-disabled`. No `variant`, no `size`; the properties are
the escapes.

### 4. The content's height animates, and the padding is on an inner body

Radix measures the content's height into
`--radix-collapsible-content-height` and keeps the closing element
mounted for its exit, so the panel opens and closes as a height, over
`--pp-duration-normal` with the decelerate / accelerate pair (4.1 §6).
The animated element carries no padding — a padded box animated to zero
height is its padding tall — so the children sit in a body of the
component's own with `--pp-space-4` below (the heading's own padding is
the space above). `overflow: hidden` on the animated element, and
`prefers-reduced-motion` makes both directions `none` (D-062 §5).

### 5. `keepMounted`, as `Tabs` §7, and it hides itself

A closed panel's element stays in the DOM, empty and `hidden`, so
`aria-controls` resolves; its children render while open. `keepMounted`
keeps them rendered while closed — for a form in a panel — and, as for
`Tabs` (D-074 §3), Radix's `forceMount` drops `hidden` and shows the
panel, so the component sets `hidden` from a mirror of the open value. A
kept panel does not animate closed: Radix's exit runs on unmount, and a
kept panel never unmounts.

### 6. `data-state="open | closed"`, `data-disabled`, no `orientation`, no direction

Radix writes `open` / `closed` on the item, the heading, the trigger and
the content — RULES §4's own words. Radix's `orientation="horizontal"`
(a row of panels, arrows left and right) is not exposed: an accordion
is a stack, and the row form is a different component's job if it is
ever wanted. Nothing here writes a direction (D-074 §2's rule), and with
one orientation Radix's arrow keys need none.

---

## Sizing contract justification

`fill`: the root is a block that takes its container's width; items,
triggers and panels fill it; heights are content's. Nothing hugs. A long
label wraps inside its trigger; a wide child of a panel is the panel's
child's problem, as everywhere.

## Anatomy

```
<div class="pp-accordion">
  └── <div class="pp-accordion__item" data-state data-disabled?>
        ├── <h3 class="pp-accordion__header" data-state>                            (h2–h6 by headingLevel)
        │     └── <button class="pp-accordion__trigger" aria-expanded aria-controls? id data-state disabled?>
        │           ├── {children}
        │           └── <svg class="pp-accordion__chevron">
        └── <div class="pp-accordion__content" role="region" aria-labelledby id data-state hidden?>
              └── <div class="pp-accordion__body">
                    └── {children}
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Accordion | `pp-accordion` | `<div>` | The root. `ref`, `className`, `style` here |
| AccordionItem | `pp-accordion__item` | `<div>` | `value`, `disabled` |
| AccordionTrigger | `pp-accordion__trigger` | `<button>` in an `<h3>` | `ref`, `className`, `style` land on the button; the heading takes nothing |
| AccordionContent | `pp-accordion__content` | `<div role="region">` | `keepMounted`; children in the body |

## Props

**`Accordion`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `multiple` | `boolean` | `false` | §2 |
| `value` / `defaultValue` / `onValueChange` | `string` / `string` / `(value: string) => void`, or `string[]` forms with `multiple` | — | RULES §5.5 |
| `collapsible` | `boolean` | `true` | Single only (§2) |
| `disabled` | `boolean` | `false` | Every item |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `3` | §1 |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | Root |

**`AccordionItem`**: `value: string`, `disabled?`, …`<'div'>`.
**`AccordionTrigger`**: …`<'button'>`. **`AccordionContent`**:
`keepMounted?`, …`<'div'>`.

Exported types: `AccordionProps`, `AccordionSingleProps`,
`AccordionMultipleProps`, `AccordionItemProps`, `AccordionTriggerProps`,
`AccordionContentProps`, `AccordionHeadingLevel`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on item, heading, trigger, content | The panel's height; the chevron turned |
| Disabled | `data-disabled` on item, heading, content; `disabled` on the trigger | Disabled text |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-accordion-line-color` | `--pp-color-border-subtle` | The hairlines |
| `--pp-accordion-trigger-height` | `--pp-control-height-lg` | The trigger's minimum |
| `--pp-accordion-trigger-padding-block` | `--pp-space-3` | Above and below a label |
| `--pp-accordion-body-padding` | `--pp-space-4` | Below the content |

**Contrast, computed at the gate (D-048 §1).** The label is
`--pp-color-text` on the page (12 on 1 / 3, asserted); the chevron is
`--pp-color-text-muted` (11 on 1 / 3, Text's muted pair); the hairline
is `border-subtle`, no obligation by design (D-050). Nothing new is
asserted and nothing missing is leaned on.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` | Between the triggers and into an open panel's content, in DOM order |
| `Enter` / `Space` on a trigger | Toggles its panel (`collapsible`), or opens it |
| `ArrowDown` / `ArrowUp` | Next / previous trigger, wrapping |
| `Home` / `End` | First / last trigger |

Every row is Radix's; the component installs no key handler.

## Accessibility notes

- Trigger: a `<button>` inside an `<h2>`–`<h6>`, `aria-expanded`,
  `aria-controls` → its panel while it is open (Radix omits it while
  closed; the region is labelled by the trigger either way);
  `aria-disabled` when it is the open item of a non-collapsible accordion
  (Radix's), `disabled` when disabled.
- Content: `role="region"`, `aria-labelledby` → its trigger.
- **Manual walkthrough:** Tab to the first heading, confirm it is
  announced as a heading and a button, collapsed; `Enter`, confirm the
  panel opens and is announced as a region named by the heading;
  `ArrowDown`, confirm the next heading; `End`, `Home`; `Enter` on the
  open one, confirm it closes; in a `multiple` accordion open two; in a
  `collapsible={false}` one confirm the open heading is `aria-disabled`
  and does not close.

## Container behavior

`fill` at every width; labels wrap inside their triggers.

## Usage

```tsx
<Accordion defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent><Text>Orders ship within two days.</Text></AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent><Text>Thirty days, no questions.</Text></AccordionContent>
  </AccordionItem>
</Accordion>
```

## Don't

```tsx
// ✗ A trigger outside its item, or an item without both parts.
<Accordion><AccordionTrigger>Lost</AccordionTrigger></Accordion>

// ✗ A form in a panel that unmounts. keepMounted.
<AccordionContent><ProfileForm /></AccordionContent>

// ✗ A heading level on the item. It is the root's, once.
<AccordionTrigger level={2}>…</AccordionTrigger>

// ✗ An accordion of accordions. That is a Tree.
<AccordionContent><Accordion>…</Accordion></AccordionContent>
```

## Testing notes

- **Unit (jsdom):** the heading at the root's level around a button with
  `aria-expanded` / `aria-controls`, the region labelled by it,
  `data-state` on every part; single: opening one closes the other,
  pressing the open one closes it, `collapsible={false}` does not and
  marks it `aria-disabled`; `multiple`: two open; controlled and
  uncontrolled in both shapes; `disabled` on an item and on the root;
  `ArrowDown` / `ArrowUp` / `Home` / `End`; `keepMounted` keeps the
  children, hidden; refs, `className`, `style` on every part; a part
  outside the root throws; axe, both themes.
- **Browser:** the trigger is at least the large control height and the
  label `--pp-font-size-3`; the hairlines are one pixel above the first
  item and below each; the chevron is turned 180° on the open item;
  under reduced motion the content's animation is `none` and the
  chevron's transition is none; opening an item in a single accordion
  closes the open one; `Tab` from a trigger reaches its open panel's
  content; a kept panel keeps what was typed.
- **Break checks (D-035 §3):** drop the chevron's rotation (the chevron
  test); drop the reduced-motion rule; make the heading a block (the
  trigger no longer fills it); drop the `hidden` mirror (the kept-panel
  test: two panels showing); ignore `multiple` (the multiple test). The
  `overflow: hidden` on the content is not observable under reduced
  motion and is not checked.
- **Screenshot:** the gallery renders three items with the second open in
  each cell.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§2 — `collapsible` defaults to `true`.** Alternative: Radix's
   `false`. **Recommendation: `true`.** A section you opened, you can
   close.
2. **§1 — `headingLevel` on the root, defaulting to `3`.** Alternatives:
   required, as `Heading`'s; or a `div` with `role="heading"`.
   **Recommendation: optional, default 3.** One question, asked once.
3. **§6 — no `orientation`.** Alternative: pass Radix's through.
   **Recommendation: none.** An accordion is a stack.
4. **§1 — no separate `Header` part.** Alternative: Radix's five parts.
   **Recommendation: four.** A part nobody may omit is not a part.
