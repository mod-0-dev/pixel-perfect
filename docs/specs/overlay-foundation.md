# 4.1 Overlay foundation

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `spec` — written 2026-09-26. **Gate C is individual** (D-014's carve-out, narrowed by 3A to `Field` and this) |
| **Sizing contract** | `n/a` — a foundation, not a component. Every overlay built on it declares its own |
| **RSC** | `client` — everything here runs after hydration (§7) |
| **Depends on** | Tier 3 `done` (it is). Tier 0.2 tokens: `--pp-z-*`, `--pp-shadow-*`, `--pp-duration-*`, `--pp-easing-*`, `--pp-color-bg-scrim` all exist and none is added |
| **APG pattern** | None of its own. Each overlay names its pattern; this document is what they stand on |

This is the first foundation item with a spec document, because it is the
first whose decisions are permanent in a way Tier 0's were not: the library it
chooses is a dependency every Tier 4 component imports, and the vocabulary it
fixes is one every Tier 4 spec inherits. RULES §8 and D-002 said "Radix / Base
UI" on 2026-09-16 with a slash between them. **This spec removes the slash.**

## Purpose

The five things the roadmap row names — a portal, a dismissable layer, a focus
scope, z-index tokens, floating positioning — plus the two the row does not
name and every Tier 4 component would otherwise solve alone: **what happens to
the theme when content leaves its subtree**, and **what a logical `side` means
when the positioning library speaks in physical ones**.

It deliberately does **not**: ship a component a consumer renders (nothing
here is exported from the package entry point except one provider, §3); wrap
the library's every prop in a prop of ours (each Tier 4 spec chooses its
surface); or take on animation orchestration beyond keeping an element mounted
for its exit transition (§6).

---

## Decisions this spec asks you to approve

### 1. Radix Primitives, not Base UI, not the platform alone

Measured against the registry on 2026-09-26, with each candidate installed in a
scratch project and its type surface read rather than its documentation.

| | Radix Primitives | Base UI | Platform (`<dialog>`, `popover`, anchor positioning) |
| --- | --- | --- | --- |
| Version | `react-popover` 1.1.23, `react-dialog` 1.1.23, `react-tooltip`, `react-dropdown-menu` 2.1.24, `react-toast` 1.2.23 — all stable 1.x/2.x, published 2026-07-31 | `@base-ui-components/react` **1.0.0-rc.0**, 2025-12-04; rc.0 itself carried two breaking changes | — |
| React 19 | `^19.0` in every peer range | `^19` | — |
| Installed size | 84–172 KB per package; `react-remove-scroll` 328 KB and `aria-hidden` for modals | 14 MB, tree-shakeable (`sideEffects: false`); 7 runtime deps incl. `@babel/runtime`, `reselect`, `tabbable`, `use-sync-external-store` | 0 |
| Positioning | floating-ui, JS | floating-ui, JS | CSS anchor positioning: **25 of 35** browsers in `browserslist` `defaults` — missing Firefox 140 ESR, Chrome 109/120, iOS 18.5–18.7 |
| Composition | `asChild` — the mechanism D-003 named and `src/internal/slot.tsx` already mirrors, merge rule for merge rule | `render` prop; `className` and `style` may be functions of state | none |
| State attributes | `data-state="open\|closed"`, `data-side`, `data-align` — **RULES §4's vocabulary, verbatim** | `data-open` / `data-closed`, `data-side` | `:popover-open`, `:modal`, `:open` |
| Foundation pieces | Published standalone: `react-portal`, `react-dismissable-layer`, `react-focus-scope`, `react-popper` — typed, semver'd, undocumented | Per component only (`Popover.Portal`, `.Positioner`, `.Popup`, `.Backdrop`); `floating-ui-react` is bundled but not exported | `showPopover()`, `showModal()`, `inert` |
| jsdom 30 | Runs; positioning lands at 0,0; `ResizeObserver` (already stubbed) | Runs | **`showModal`, `showPopover` and `inert` are all absent** — nothing is unit-testable |

**Radix.** The library's own conventions were set against it before a line of
Tier 4 existed: `asChild` (D-003) and RULES §4's `data-state` / `data-side` /
`data-align` are Radix's names, so a Tier 4 component built on Radix emits the
library's vocabulary with no translation layer, and one built on Base UI
would translate `data-open` into `data-state="open"` on every part of every
component, or amend RULES §4. Radix is stable and small, and its per-component
packages are what each Tier 4 item adds as it lands (§2). Base UI is the more
complete library — it has the `NavigationMenu`, `Combobox` and `Toast` this
roadmap will want — but it is a release candidate that broke its own API in its
last release, and pinning a moving target under fourteen components is the
wrong trade at 0.7.

**Not the platform alone, and the number is why.** `<dialog>` is in 32 of 35
targets and `popover` in all but Chrome 109; CSS anchor positioning, which is
what would replace floating-ui, is in 25 — Firefox ESR and iOS 18 are not
edge cases. A platform popover would still need JS positioning for ten of the
thirty-five, which is floating-ui, which is what Radix already wraps. And
jsdom implements none of the three APIs, so every behaviour would be
browser-only tested (D-051 §4's shape, library-wide). **Revisit when anchor
positioning reaches the `defaults` set**; the revisit is cheap because §5's
vocabulary is logical already and nothing in a Tier 4 spec names a JS
positioning concept.

**Not floating-ui directly.** It is a positioning library with interaction
hooks; the focus trap, the layer stack and the ARIA wiring would be ours to
assemble, which is precisely the year D-002 declined.

**Not Radix's standalone foundation packages.** `react-dismissable-layer`,
`react-focus-scope` and `react-popper` are published and typed but Radix
documents only the composed primitives. Building `Popover` from the four
pieces would gain nothing over `@radix-ui/react-popover`, which composes the
same four, and would take on an undocumented surface. The composed package
per component is the unit.

### 2. Dependencies, not peers, one package per component, and the tier stays tree-shakeable

Each Tier 4 component adds its own `@radix-ui/react-<name>` to
`dependencies` (caret range) in the commit that builds it. Not
`peerDependencies`: a consumer installing `pixel-perfect` should not be asked
to know which primitive a `Tooltip` is made of, and a version they pick could
be one our CSS was not written against.

The package stays `sideEffects: ["*.css"]` and every Radix package is
side-effect-free and marked so, so an app that imports `Button` and never
`Dialog` bundles no Radix. Asserted at Gate D: a build of the playground's
`/components/button` page is checked for the absence of the Radix chunk.

**What the playground needs.** It installs `pixel-perfect` as `file:..`
(D-012), a symlink to the repository root; the library's own dependencies
resolve from the root's `node_modules`, which `npm ci` at the root provides in
CI before the playground's own install. Turbopack's root is already pinned to
the repository (`next.config.ts`), so the resolution stays inside it. Checked
at the 4.2 build, not assumed.

### 3. Theme crosses the portal; tone does not

**The problem the roadmap row does not name.** Every colour in this library is
resolved by inheritance from the nearest `[data-pp-theme]` and
`[data-pp-tone]` (D-007, D-011). A portal renders its subtree into
`document.body`, outside both. A popover opened from a dark-themed sidebar
in a light-themed app would paint light — or, in the playground's Matrix,
every popover in the `dark` cells would render in `light`.

**Theme is carried.** The foundation's internal `Portal` copies
`data-pp-theme` from the nearest scope of the element the overlay is anchored
to (the trigger; for a `Dialog`, the trigger or the element that opened it)
onto the portal's own root element, once, when the overlay mounts. Overlays
are transient, so a theme toggled while one is open is not tracked; the next
open reads the new value. When the app's theme lives on `<html>`, the copy
finds it and nothing changes.

**Tone is not.** `data-pp-tone` is *not* copied. A popover opened from a
`danger` button is not a danger-toned popover; it starts neutral, as a
portalled subtree naturally does, and the overlay's own `tone` prop — where a
Tier 4 spec offers one — sets it. D-059 §1 is the same ruling from the other
side: nothing interactive inherits a tone by accident.

**`container`.** Each overlay passes through Radix's `container` prop for the
consumer who portals elsewhere — into a themed wrapper, or a scoped root for
CSS reasons. There is **no** `OverlayProvider` in 4.1: one context for one
prop that most apps never set is the D-036 objection, and the theme copy above
removes the main reason to want it. If three Tier 4 specs each end up asking
for a provider, that is the moment to add one.

### 4. z-index is a token per layer, applied by the component's own CSS

| Layer | Token | Used by |
| --- | --- | --- |
| scrim behind a modal | `--pp-z-overlay` | 4.4 `Dialog` backdrop, 4.6 `Drawer` |
| modal content | `--pp-z-modal` | 4.4, 4.5, 4.6 |
| non-modal floating content | `--pp-z-popover` | 4.2 `Popover`, 4.7 `DropdownMenu`, 4.8, 4.11 `Combobox` list, 4.13 |
| toast region | `--pp-z-toast` | 4.12 `Toast` |
| tooltip | `--pp-z-tooltip` | 4.3 `Tooltip` |

All five exist since 0.2 and are consumed by nothing yet. Each Tier 4 stylesheet
declares `z-index: var(--pp-z-…)` on its content root, and nothing is written
inline. Radix's popper wrapper reads the content's computed `z-index` and
applies it to the positioned wrapper (`contentZIndex` in `react-popper`), so
the token reaches the element that actually stacks. **Checked at the 4.2
build, not assumed** — it is the one Radix mechanism this ordering relies on.

A **modal above a popover** (a dialog opened from a menu item) stacks
correctly by the table. A **popover inside a modal** (a select inside a
dialog) does not by the table alone — `--pp-z-popover` is above
`--pp-z-modal`, so it wins, which is right; but a *second* dialog opened from
that popover stacks below it. Radix's layer stack handles dismissal in that
nesting; the paint order is ours, and the answer is that later portals append
later in `<body>` and same-token siblings paint in DOM order. Stated so 4.4
tests it rather than discovers it.

### 5. `side` is logical, and `data-side` reports what was resolved

Radix's `side` is `top | right | bottom | left` — physical, which RULES §1's
"RTL should work without a single extra line" cannot accept as a consumer
prop: a `side="right"` popover in an RTL layout is on the wrong side of its
trigger. floating-ui already treats `align: start | end` logically (it reads
the anchor's `direction`); only the side axis is physical.

**The vocabulary every Tier 4 spec uses:**

| Prop | Values | Default |
| --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | per component (`Popover` `bottom`, `Tooltip` `top`) |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` |
| `sideOffset` | `number` (px) | per component |
| `collisionPadding` | `number` | `8` |

`start` and `end` resolve to `left` / `right` from the trigger's computed
`direction` at open time — never at module scope (RULES §7) — by one internal
function, `resolveSide`, that every component calls. Radix may then *flip*
the side to avoid a collision; the side it settled on is written by Radix as
`data-side` in physical terms on its content node, and **the component's root
carries `data-side` in this table's terms**, mapped back through the same
direction. RULES §4's `data-side` and `data-align` mean the logical values.

`top` and `bottom` are kept as they are rather than renamed `block-start` /
`block-end`: no target has a vertical writing mode use for a popover, and the
longer names buy nothing a user can perceive.

**Positioning data reaches CSS through our names.** Radix writes
`--radix-popper-available-height`, `-available-width`, `-anchor-width`,
`-anchor-height` and `-transform-origin` on the wrapper. A Tier 4 stylesheet
may read them — that is what makes a `DropdownMenu` no wider than its trigger,
or a list no taller than the space below it — but the **docs page names only
`--pp-<component>-*`**; a vendor variable in a consumer's stylesheet is a
coupling this library does not offer.

### 6. Open and close are `data-state`, the motion is ours, and Radix keeps the exit mounted

Every overlay root carries `data-state="open|closed"` (RULES §4). Entry and
exit are CSS `animation`s keyed on it, using `--pp-duration-fast` and
`--pp-easing-decelerate` / `-accelerate`; Radix's `Presence` keeps a closing
element mounted until its `animation-name` finishes, so the exit is seen. The
reset's `prefers-reduced-motion` crush applies, so a reduced-motion user gets
an instant open and close with no work in any component.

**`forceMount` is not exposed.** It exists for consumers driving animation
with a library; this library's motion is CSS.

### 7. Nothing here renders on the server, and that is a documented gap, not a bug

Radix's `Portal` mounts after hydration (`useLayoutEffect(() => setMounted(true))`),
so a `defaultOpen` dialog is absent from the server HTML and appears on the
first client render. Because it is portalled and fixed, that is not a layout
shift — but it is a **flash**, and a form that needs a modal without JavaScript
does not get one. This is the RULES §7 line "server and first client render
must match" applied honestly: the two *do* match (both render nothing in the
portal); what differs is the render after hydration.

Consequences each Tier 4 spec inherits: every Tier 4 component is
`'use client'` (Radix's packages carry the directive too); an overlay that
must exist in the HTML — a no-JS error summary — is not an overlay, it is
`Alert` (which is why `Form` composes one, Form.md §2).

### 8. Dismissal, focus and scroll are Radix's defaults, with two library-wide rulings

- **Escape belongs to the top layer.** Alert.md §Keyboard deferred `Escape`
  here. Radix's `DismissableLayer` stack dismisses only the topmost layer, so
  an alert inside a dialog inside a page never intercepts it. No component
  handles Escape itself.
- **Outside press dismisses a non-modal overlay and is blocked by a modal
  one.** Radix's `disableOutsidePointerEvents` for modals: a click outside a
  dialog neither passes through nor closes it unless the component says so
  (4.5 `AlertDialog` never closes on outside press; 4.4 `Dialog` does).
- **Focus returns to the trigger on close**, Radix's `onCloseAutoFocus`
  default, and moves into the content on open. A component that opens
  somewhere else — a `Toast` never takes focus — says so in its own spec.
- **Modal scroll lock** is `react-remove-scroll`, which Radix's `Dialog`
  pulls in. It compensates for the scrollbar with padding on `<body>`; the
  RTL case of that compensation is 4.4's to verify, named here so it is.
- **Modal `aria-hidden` on the rest of the page** is Radix's `aria-hidden`
  dependency. Accepted; writing it ourselves is the D-002 year.

### 9. What this item ships, and how the Definition of Done reads for a foundation

Code, all under `src/internal/overlay/` and none of it exported:

- `Portal.tsx` — Radix's portal with §3's theme copy.
- `side.ts` — `resolveSide(element, side)` and its inverse for `data-side`.
- `stubs` in `src/test/setup.ts` for what Radix needs and jsdom lacks, found
  at the 4.2 build rather than guessed here (the `ResizeObserver` stub is
  already there).

Documentation: `docs/overlays.md`, the page every Tier 4 docs page links —
theme across the portal, the logical `side` vocabulary, the z-index table,
the no-JS gap, the `container` prop.

**No dependency is added by 4.1 itself.** The first Radix package arrives
with 4.2 `Popover`, which is the first component to exercise every piece
above, and 4.1's internals are tested through it. That means 4.1's Gate D is
walked *with* 4.2's: the foundation is `done` when `Popover` is, not before,
and the two are one PR. Marking 4.1 `done` with untested internals would be a
box ticked by reasoning (D-051 §5).

| Definition of Done box | For 4.1 |
| --- | --- |
| Spec, sizing contract, props, anatomy | This document; contract `n/a`; no props of its own; anatomy is `.pp-portal` |
| Sizing & spacing, styling | The portal root declares nothing but `data-pp-theme`; no CSS file |
| API | `resolveSide` is internal; RULES §5 applies to what 4.2 exports |
| Accessibility | Inherited from Radix and asserted per component |
| RSC | §7 |
| Tests | Through 4.2's suites: theme copy (unit and browser), `resolveSide` (unit, both directions), tree-shaking (build assertion) |
| Playground, docs | `docs/overlays.md`; the playground page is 4.2's |
| Changeset | With 4.2's, naming the dependency policy |

---

## Anatomy

```
<div class="pp-portal" data-pp-theme="light|dark">      (appended to body, or to `container`)
  └── … the overlay component's own root, with data-state / data-side / data-align
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Portal root | `pp-portal` | `<div>` | §3's theme copy. No CSS, no z-index, no size |

## Props

None. `resolveSide` is a function, not a component. The vocabulary in §5 is
what each Tier 4 spec's props table uses.

## State

| State | Exposed as | By |
| --- | --- | --- |
| Open / closed | `data-state` | Radix, on every overlay root |
| Resolved side / align | `data-side`, `data-align` (logical, §5) | The component, from Radix's physical value |
| Theme | `data-pp-theme` on `.pp-portal` | §3 |

## Styling API

None of its own. The z-index tokens (§4) are the shared contract.

## Keyboard interaction

Per component. The only library-wide row: **`Escape` dismisses the topmost
dismissable layer and nothing else** (§8).

## Accessibility notes

Per component, against its APG pattern. What is fixed here: focus enters the
overlay on open and returns to the trigger on close; a modal hides the rest of
the page from assistive tech and locks scroll; a non-modal overlay does
neither.

## Container behavior

`n/a`. An overlay is positioned against the viewport and its anchor, which is
what makes it an overlay; container queries do not apply to the portal root.

## Usage

```tsx
// 4.2 and after. Nothing from 4.1 is used directly.
<Popover side="end" align="start">…</Popover>
```

## Don't

```tsx
// ✗ Portalling into an unthemed container and expecting the theme to follow.
//   The copy reads the TRIGGER's scope; a `container` of your own is yours to theme.
<Popover container={untouchedDiv} />

// ✗ A tone on the trigger, expected inside the overlay. Tone does not cross (§3).
<Button tone="danger"><Popover>…</Popover></Button>

// ✗ A physical side. `start` and `end` reverse with the layout; `right` does not exist.
<Popover side="right" />
```

## Open questions

Resolve before Gate C.

1. **§1 — Radix over Base UI.** The strongest counter-argument is coverage:
   Base UI ships `NavigationMenu`, `Combobox`, `Toast`, `Autocomplete` and
   `PreviewCard` today, and Radix's equivalents are thinner (`Combobox` in
   particular will be built on `Popover` + our own list, 4.11). If you would
   rather bet on Base UI reaching 1.0 before 4.11, say so now; switching
   after 4.2 means rewriting every Tier 4 wrapper's vocabulary.
   **Recommendation: Radix.** The vocabulary alignment is not cosmetic — it
   is RULES §4 — and a stable dependency under fourteen components beats a
   complete one that is still breaking.
2. **§3 — theme copied once at mount.** The alternative is a
   `MutationObserver` on the scope element so a theme toggle updates open
   overlays. **Recommendation: once.** Overlays are transient, the observer
   is an effect every open pays, and the case is a toggle pressed while a
   popover is open.
3. **§9 — 4.1 is `done` with 4.2, in one PR.** The alternative is to build
   4.1's internals against a throwaway harness and close it alone.
   **Recommendation: with 4.2.** A foundation tested by nothing that ships is
   D-051 §5's "argued, not checked".
4. **§5 — `start`/`end` on the side axis, `top`/`bottom` kept physical.**
   The alternative is the fully logical `block-start` / `block-end` /
   `inline-start` / `inline-end`, which Base UI offers.
   **Recommendation: as written.** Four short words, and the two that matter
   for RTL are logical.
