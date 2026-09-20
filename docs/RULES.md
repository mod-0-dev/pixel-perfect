# Pixel Perfect — Ground Rules

These are the constitution. They are not style preferences; they are invariants.
A component that violates one is not "mostly fine" — it is not done.

Every rule here exists because some component library we have all suffered
through broke it.

---

## 1. The Sizing Contract

> **No component declares its own `width`, `max-width`, `min-width`, or `margin`.**

Sizing and placement belong to the parent. Every component declares exactly one
sizing contract at design time. It is documented in the component's spec, and it
is **never a prop**.

| Contract | Meaning | Implementation |
| --- | --- | --- |
| `fill` | Expands to occupy the inline space its parent gives it | Block-level, **no** `width` declaration at all (`width: auto` fills naturally), plus `min-inline-size: 0` |
| `hug` | Sizes to its own content | Inline-level or `inline-flex`, no width declaration |

**Why not `width: 100%`?** Because it is the wrong CSS. `width: 100%` resolves
against an indefinite basis inside flex/grid containers, fights `gap`, requires
`box-sizing` vigilance, and overflows the moment padding enters the picture. A
block element with no width declaration already fills its parent, and does so
correctly in every layout context. The rule is *don't declare width*, not
*declare width: 100%*.

### Consequences

- **`Container` is the only component in the library allowed to set `max-width`.**
  That is its entire job. If you want to constrain something, you wrap it.
- **There is no `fullWidth` prop. Ever.** Its existence in other libraries is
  proof their default sizing model is broken.
- **Layout primitives are load-bearing.** Because components can't size or space
  themselves, `Stack`, `Cluster`, `Grid`, and `Container` must land early
  (Tier 2) or the library is unusable.
- **Responsive behavior uses container queries, not viewport media queries.**
  A component never knows the viewport. It may know its own container via
  `@container`. This is the payoff of the whole rule — components behave
  correctly in a sidebar, a modal, and a full-bleed page without being told.

### Use logical properties

`inline-size`, `block-size`, `padding-inline`, `padding-block`, `margin-inline`,
`border-inline-start`. Never `left`/`right`/`width`/`height` in component CSS
unless the property genuinely has no logical equivalent. RTL should work without
a single extra line.

---

## 2. No Outer Margins

A component may never apply margin to its own root element. Not `margin-top`,
not `margin-block-end`, not a `spacing` prop that resolves to margin.

Space *between* things is the parent's concern, expressed with `gap` on a layout
primitive. Space *inside* a component is padding and is the component's concern.

There is no `Spacer` component. `gap` exists.

---

## 3. Styling & Tokens

- Styling is **plain CSS**, authored per component, bundled into a single
  stylesheet that consumers import once.
- **Two-tier tokens.** Primitives (`--pp-palette-blue-600`, `--pp-space-3`) are
  raw values. Semantics (`--pp-color-accent-bg`, `--pp-color-border-subtle`) map
  primitives to meaning.
- **A control's boundary is `--pp-color-border`; a divider is
  `--pp-color-border-subtle`.** The first carries a solved 3:1 guarantee because
  WCAG 1.4.11 asks it of the line that tells you a control is there — and in the
  light theme `bg-surface` *is* `bg-page`, so the edge is the only thing that
  does. The second has no contrast obligation and must not acquire one: a 3:1
  divider is a black line across the page. If the line is what identifies a
  control, it is `border`; if it is decoration, it is `border-subtle`. Asserted
  both ways in `npm run lint:contrast`, value and mapping (D-050). The rule is
  about **boundaries**: a component reaching into the border family for a
  lightness step rather than for a line — `Skeleton`'s sweep does — is not
  choosing a boundary and is not covered.
- **Colour is consumed through semantic tokens only.** A component never
  references `--pp-palette-*`; it reads `--pp-color-*` or, inside a tone
  context, `--pp-tone-*`. A colour must resolve differently per theme and per
  tone, and the semantic layer is what makes that true (D-011).
- **Dimensions are consumed from the primitive scales directly.**
  `--pp-space-*`, `--pp-radius-*`, `--pp-font-size-*`, `--pp-line-height-*`,
  `--pp-font-weight-*`, `--pp-letter-spacing-*`, `--pp-border-width-*`,
  `--pp-duration-*`, `--pp-easing-*`, `--pp-shadow-*` and `--pp-z-*` are the
  vocabulary. A spacing step is the same value in every theme and every tone,
  so a semantic alias over it would add a name and change nothing (D-015).
  Cross-component agreement that genuinely needs a shared definition — how tall
  a medium control is — gets a `--pp-control-*` set when Tier 3 lands.
- **A hardcoded hex, px, rem, ms or z-index in component CSS is a bug.** Every
  value comes from a token. The two rules above say *which* token, not whether.
- **Theming is redefining custom properties.** Dark mode is a token layer, not a
  `dark:` variant sprinkled through components, and it exists from day one — not
  bolted on at Tier 5.
- **Cascade is explicit.** Everything ships inside `@layer`:
  `@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides;`
  Consumers always win without `!important`.
- **Class names are prefixed `pp-`** and follow `pp-<component>__<part>`
  (e.g. `pp-field__error`). No utility classes leak out of the library.
- **Each component exposes component-scoped custom properties as its styling
  API** (`--pp-button-bg`, `--pp-button-radius`). That is the supported escape
  hatch for one-off overrides — not `!important`, not deep selectors.
- **Motion respects `prefers-reduced-motion`** in every animated component.

---

## 4. State Lives in Data Attributes

Visual state is exposed on the DOM so consumers can style it without prop
drilling and without knowing our internals:

`data-state="open|closed|checked|unchecked|indeterminate"`, `data-disabled`,
`data-invalid`, `data-loading`, `data-readonly`, `data-orientation`,
`data-side`, `data-align`.

Style off these attributes internally too. If our own CSS needs a boolean class
that consumers can't see, we got the API wrong.

---

## 5. API Conventions

Consistency beats cleverness. These are fixed vocabulary — do not invent
synonyms per component.

- **`variant`** — visual treatment: `solid | outline | ghost | plain`
- **`tone`** — semantic color: `neutral | accent | danger | success | warning`
- **`size`** — `sm | md | lg`. Default `md`.
- Never `color`, `kind`, `type` (reserved by HTML), `appearance`, `theme`.

Structural requirements for every component:

1. Forwards `ref` to its root element.
2. Accepts `className` and `style`, merged — never replaced, never ignored.
3. Spreads remaining props onto the root element (so `aria-*`, `data-*`, and
   event handlers pass through).
4. Exports its props type as `<Name>Props`.
5. Stateful components support **controlled and uncontrolled** use:
   `value` / `defaultValue` / `onValueChange`, `open` / `defaultOpen` /
   `onOpenChange`. Both, always. No exceptions.
6. Composition over configuration. Prefer `<Card><Card.Header/></Card>` over
   `<Card headerTitle=... headerIcon=... />`. If a component has more than ~10
   props, it is probably two components.
7. No polymorphic `as` prop. It is a TypeScript tarpit and an inference killer.
   Use Radix-style `asChild` render delegation where composition genuinely
   requires it.

---

## 6. Accessibility Is a Gate, Not a Phase

- Keyboard interaction matches the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
  pattern for the component. Where APG and real-world behavior disagree, note it
  in the spec and pick deliberately.
- Focus is always visible: `:focus-visible` styling, never `outline: none` without
  a replacement.
- Every interactive component ships an automated axe check plus a documented
  manual keyboard walkthrough in its spec.
- Color pairings meet WCAG AA (4.5:1 text, 3:1 UI) **in both themes**. Token
  contrast is verified at the token layer, once, not per component.
- Icon-only controls require an accessible name. The type system should make it
  impossible to omit.

---

## 7. Next.js / RSC Constraints

- `'use client'` goes **only** on components that actually need it (hooks, state,
  effects, event handlers, browser APIs). Purely presentational components stay
  server-compatible.
- Every spec documents the component's RSC compatibility.
- No `window`, `document`, or `matchMedia` access at module scope.
- IDs come from `useId()`. Never a counter, never `Math.random()`.
- No layout-shift-on-hydrate: server and first client render must match.

---

## 8. Dependencies

- Tiers 1–3 and 5: **zero runtime dependencies.** If it needs a library, we
  designed it wrong.
- Tier 4 (overlays, menus, combobox, date picker): built on **Radix / Base UI**
  primitives for behavior. We own 100% of the markup, class names, and styling;
  they own focus traps, dismissable layers, typeahead, and ARIA wiring. Writing
  our own focus management is not a badge of honor, it is a year of a11y bugs
  that were fixed upstream in 2021.
- Everything is peer-dep'd on React, side-effect-free, tree-shakeable, and
  exports a single CSS file.

---

## 9. Definition of Done

A component is done when every box in
[`.claude/skills/component/references/definition-of-done.md`](../.claude/skills/component/references/definition-of-done.md)
is checked. "Mostly done" components are how libraries end up with forty
half-built widgets and no users. **WIP limit is 1.**

---

## 10. Quick Reference — Banned

| Banned | Instead |
| --- | --- |
| `width`, `max-width`, `min-width` in component CSS | Nothing (fill), or `Container` (constrain) |
| `margin` on a component root | `gap` on a layout primitive |
| `fullWidth`, `width`, `maxWidth`, `m`/`mt`/`mb` props | The sizing contract |
| Hardcoded colors / spacing / radii | Semantic tokens |
| Viewport media queries inside a component | `@container` |
| `outline: none` without a focus-visible replacement | `:focus-visible` styling |
| Polymorphic `as` prop | `asChild` |
| `!important` | `@layer` ordering + component custom properties |
| A `Spacer` component | `gap` |
| Controlled-only or uncontrolled-only state | Both |
| `color` / `kind` / `appearance` prop names | `tone` / `variant` |
