# Pixel Perfect — Roadmap

**Single source of truth for component status.** Every status change is committed
alongside the work that caused it. Managed by the `/component` skill — see
[`.claude/skills/component/SKILL.md`](.claude/skills/component/SKILL.md).

Ground rules: [`docs/RULES.md`](docs/RULES.md) ·
Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
Definition of Done: [`.claude/skills/component/references/definition-of-done.md`](.claude/skills/component/references/definition-of-done.md)

---

## Status

| Field | Values |
| --- | --- |
| **Status** | `planned` → `spec` → `build` → `review` → `done`, or `deferred` / `blocked` |
| **Contract** | `fill`, `hug`, `n/a` (providers, layout-only, non-visual) |
| **RSC** | `server` (no `'use client'`) / `client` |

**WIP limit: 1**, applying to `build` and `review` only. Specs are approved a
group at a time, so any number of components in a group may sit in `spec`
together ([D-014](docs/DECISIONS.md)). Implementation remains strictly one at a
time. A component may not enter `spec` until every entry in its **Deps** column
is `done`.

### Current state

- **In flight:** _none_. 3.6 `Label` is `done` — Tier 3B is half built
- **Next up:** 3.7 **`Field`**, now unblocked. It is the component D-014's
  carve-out was written about and the last one in Tier 3 approved on its own
  ([D-027](docs/DECISIONS.md)); 3C is one gate after it. `Label`'s spec closes
  with two open questions that are really `Field`'s to answer: where
  `labelHidden` lives (recommendation: on `Field`, wrapping the `Label` in
  `VisuallyHidden`, never a `Label` prop — a label that can hide itself gets
  hidden by accident), and whether `size` rides on both (recommendation: yes,
  `Field` passes it down)
- **What `Label` settled:** **D-034** — a form's type comes from the control
  scale, not the text scale. `size` resolves `--pp-control-font-size-*`, the
  same token the input beside it reads, so a label and its field agree by
  construction; its visible consequence is that `sm` and `md` labels are the
  same size, deliberately. Every component in 3C and 3D follows it. Asserted by
  comparing a `Label`'s computed `font-size` to a `Button`'s rather than to a
  number, because a numeric assertion still passes after someone hardcodes one
  of the two
- **A playground page cannot demonstrate `htmlFor` inside a `Matrix`**
  (D-035 §1). The harness renders its subtree six times, so an `id` inside it
  exists six times and `for` binds to whichever copy is first in the document —
  five of six labels then name a control in another cell. Caught by a browser
  assertion reading an accessible name of `""`. Appearance goes in the matrices;
  association goes outside them, once. `Field`, `Input`, `Checkbox`, `Radio`,
  `Switch` and `Select` all render ids and all will hit this
- **The `'use client'` lint matched prose.** Its regex ran over raw source, so
  `useId()` written inside a comment explaining that `Label` deliberately does
  *not* call it was read as a call. It now walks the AST for identifiers — the
  same fix the module-scope-globals rule beside it already had for the word
  `document` in a JSDoc. A fixture that ships and only *mentions* hooks was
  added, and the self-test's exactly-one-hit count now asserts both directions
- **Two browser assertions could not fail** as first written (D-035 §2–3), and
  one of them still cannot guard the thing it was named for: a space before the
  required glyph only orphans it when the last line is nearly full. That guard
  lives in the jsdom test, where it fails every time. Third time a
  break-it-and-watch check has found a test that could not fail — it is the
  check earning its place, not a coincidence
- **What 3A settled for everything after it:** `--pp-control-*` (32 / 40 / 48,
  so a `Button`, an `Input` and a `Select` agree by construction rather than by
  vigilance), the focus ring (an `outline` in `--pp-color-focus-ring` on every
  tone — the only ring pairing `lint:contrast` verifies), `--pp-tone-solid-active`
  (170 assertions, up from 160), and `useControllableState`, the one
  implementation of RULES §5.5 that eleven components in Tiers 3 and 4 will use
- **Found by the browser, not by jsdom:** `Button`'s loading label shipped as
  `visibility: hidden`, which removes it from the accessibility tree — a button
  announced as "Save" became a button announced as nothing at the moment it
  started working. The jsdom test asserting the accessible name passed against
  the defect (D-030 §2). Anything about what a screen reader perceives has to
  be asserted where layout exists
- **A type is a claim about callers who typecheck, and a library has callers who
  do not.** `IconButton` omitted `asChild` from its props type and still spread
  it into `Button`, which delegated to the `<Icon>` element and rendered a
  `<span>` with a button's classes and no button semantics (D-031). `Toggle`
  drops `loading` explicitly for the same reason
- **Verified, not asserted:** 35 computed-style assertions in
  `tests/visual/harness.spec.ts`, thirteen of them new. Nine Tier 3A claims
  were checked by deliberately breaking the component and watching the test
  fail on the right symptom; one of those breaks exposed a focus test that
  could not fail at all and it was rewritten (D-009). The `'use client'` lint
  narrowing was checked in both directions, because scoping a rule too widely
  looks exactly like a passing lint
- **Still open from Tier 2:** consume the layout primitives in
  [launchpad](https://github.com/mod-0-dev/launchpad), deleting `.lp-stack`,
  `.lp-cluster`, `.lp-grid`, `.lp-page`, `.lp-shell` and its last viewport
  media query
- **Done:** 34 / 78 tracked items (10 foundations + 68 components) — 9
  foundations (0.10 docs site is deferred, not blocking) + 25 components

---

## Tier 0 — Foundations

Not components. Nothing else may start until this tier is `done`.

| # | Item | Status | Deps | Notes |
| --- | --- | --- | --- | --- |
| 0.1 | Package scaffold (TS, build, exports, peer deps) | `done` | — | Standalone package (D-005). `tsc` for JS+types, lightningcss for CSS |
| 0.2 | Token layer — primitives + semantics, light + dark | `done` | 0.1 | OKLCH ramps with contrast solved, not eyeballed. `--pp-tone-*` rewired by `[data-pp-tone]` (D-007). 160 assertions in `npm run lint:contrast` |
| 0.3 | Cascade layers + minimal reset | `done` | 0.2 | `@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides`. Reset uses `:where()` so the app always wins |
| 0.4 | Playground app (Next.js, container-width harness) | `done` | 0.1 | `Matrix` renders 3 widths × 2 themes, each cell a query container, overflow flagged at runtime. `/tokens` gallery, `/harness` self-check |
| 0.5 | Test harness — Vitest + Testing Library + axe | `done` | 0.1 | `npm test`. jsdom for behaviour/a11y/API; anything CSS-dependent belongs in `tests/visual`. Includes an axe canary and a D-011 regression guard |
| 0.6 | Visual regression (Playwright screenshots) | `done` | 0.4 | `npm run test:visual`. Baselines authored by CI only (D-013). Functional harness assertions run anywhere |
| 0.7 | **Rule lint** — fail on banned CSS/props | `done` | 0.3 | `npm run lint`: stylelint + source rules + contrast + a self-test proving every rule still fires |
| 0.8 | Changesets + release pipeline | `done` | 0.1 | Versions, changelogs and tags by default; npm publish is opt-in via `PUBLISH_TO_NPM`. See `docs/RELEASING.md` |
| 0.9 | CI pipeline (GitHub Actions) | `done` | 0.5, 0.6 | Lint, typecheck, test, build, token-freshness, visual regression on every PR |
| 0.10 | Docs site | `planned` | 0.4 | Deferred until there are components worth documenting |

---

## Tier 1 — Atoms

No internal state, no a11y surface beyond semantics. Specified as one batch in
[`docs/specs/tier-1-atoms.md`](docs/specs/tier-1-atoms.md).

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `Text` | `done` | fill | server | T0 | Typography scale, `tone`, truncation |
| 1.2 | `Heading` | `done` | fill | server | 1.1 | Visual level decoupled from semantic level |
| 1.3 | `Icon` | `done` | hug | server | T0 | `1em` sizing, `currentColor`, required label or `aria-hidden` |
| 1.4 | `VisuallyHidden` | `done` | n/a | server | T0 | |
| 1.5 | `Separator` | `done` | fill | server | T0 | Horizontal + vertical, `role="separator"` |
| 1.6 | `Spinner` | `done` | hug | server | T0 | `prefers-reduced-motion` |
| 1.7 | `Skeleton` | `done` | fill | server | T0 | |
| 1.8 | `Badge` | `done` | hug | server | T0 | The canonical `hug` case |
| 1.9 | `Avatar` | `done` | hug | client | 1.3 | Image fallback needs state |
| 1.10 | `Kbd` | `done` | hug | server | T0 | |
| 1.11 | `Code` | `done` | hug | server | T0 | Inline only; block code is Tier 5 |

---

## Tier 2 — Layout Primitives

Load-bearing. The sizing contract is unusable without these. Specified as one
batch in [`docs/specs/tier-2-layout.md`](docs/specs/tier-2-layout.md).

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `Stack` | `done` | fill | server | T0 | Vertical flow, `gap`, `align`. Ships the shared `gap` scale (D-020) |
| 2.2 | `Cluster` | `done` | fill | server | 2.1 | Horizontal, wrapping, `gap`, `justify`. Wrapping needs no query |
| 2.3 | `Grid` | `done` | fill | server | 2.1 | Fixed columns, `auto-fit`, or a raw template (D-022 §4). Tracks are always `minmax(0, 1fr)` |
| 2.4 | `Container` | `done` | fill | server | 2.1 | **The only component allowed to set `max-inline-size`.** Also the tree's query-container anchor. `--pp-measure-*` (D-025) |
| 2.5 | `Center` | `done` | fill | server | 2.1 | Centres in the box it is given; does not constrain a measure. No height prop |
| 2.6 | `Split` | `done` | fill | server | 2.3 | Sidebar + main; container-query collapse at a named breakpoint. No `side` prop (D-022 §3) |
| 2.7 | `AspectRatio` | `done` | fill | server | T0 | A grid, so the child stretches on both axes without an `inline-size` |
| 2.8 | `Scroller` | `done` | fill | client | T0 | Overflow container, scroll shadows. The tier's only client component and only a11y surface |

---

## Tier 3 — Form & Action Core

The heart of the library. `Field` is the workhorse — build it before the inputs.

Approved in four groups rather than sixteen gates, narrowing D-014's carve-out
to the component it was written about — see
[`docs/specs/tier-3a-action.md`](docs/specs/tier-3a-action.md) §0.

| Group | Components | Spec |
| --- | --- | --- |
| **3A — Action core** | 3.1–3.5 | [`tier-3a-action.md`](docs/specs/tier-3a-action.md) — **`done`** 2026-09-17 (D-027 … D-033) |
| **3B — Field foundation** | 3.6–3.7 | individually approved; `Field` is what D-014 protects |
| **3C — Native inputs** | 3.8–3.13 | one gate, after 3B is `done` |
| **3D — Composite inputs** | 3.14–3.16 | one gate |

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `Button` | `done` | hug | client | T2 | `variant` × `tone` × `size`, `loading`, `asChild`. Ships `--pp-control-*` and the focus ring (D-028, D-029) |
| 3.2 | `IconButton` | `done` | hug | client | 3.1, 1.3 | `label` is a required `string`. Square, on the control scale. No `asChild` (D-031) |
| 3.3 | `Link` | `done` | hug | server | 1.1 | `tone` + `underline`; no `variant`, no `size` (D-030 §6). `asChild` for `next/link` |
| 3.4 | `ButtonGroup` | `done` | hug | server | 3.1 | Always attached; the spaced case is `Cluster`. One-border seam, no negative margin (D-033) |
| 3.5 | `Toggle` | `done` | hug | client | 3.1 | `aria-pressed`, `data-state="on|off"`. Ships the shared `useControllableState` (D-032) |
| 3.6 | `Label` | `done` | fill | server | 1.1 | [`Label.md`](docs/specs/Label.md). Scales off `--pp-control-font-size-*`, not the `Text` scale (D-034). `required` is an `aria-hidden` glyph; `invalid` ships no colour |
| 3.7 | **`Field`** | `planned` | fill | client | 3.6 | Label + description + error + `useId` wiring + `data-invalid` propagation. Every input composes into this |
| 3.8 | `Input` | `planned` | fill | client | 3.7 | |
| 3.9 | `Textarea` | `planned` | fill | client | 3.7 | Auto-resize opt-in |
| 3.10 | `Checkbox` | `planned` | hug | client | 3.7 | Indeterminate state |
| 3.11 | `Radio` / `RadioGroup` | `planned` | hug / fill | client | 3.7 | Roving tabindex |
| 3.12 | `Switch` | `planned` | hug | client | 3.7 | |
| 3.13 | `Select` | `planned` | fill | client | 3.7 | **Native `<select>` first.** Custom listbox is 4.11 |
| 3.14 | `NumberInput` | `planned` | fill | client | 3.8 | Locale-aware, step controls |
| 3.15 | `Slider` | `planned` | fill | client | 3.7 | Single + range |
| 3.16 | `Form` | `planned` | fill | client | 3.7 | Error summary, submission state; validation stays the app's job |

---

## Tier 4 — Overlays & Disclosure

Behavior from Radix / Base UI. We own every DOM node and every pixel.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | Overlay foundation | `planned` | n/a | client | T3 | Portal, dismissable layer, focus scope, z-index tokens, floating positioning |
| 4.2 | `Popover` | `planned` | hug | client | 4.1 | Sizing contract exception — documented in spec |
| 4.3 | `Tooltip` | `planned` | hug | client | 4.1 | |
| 4.4 | `Dialog` | `planned` | hug | client | 4.1 | |
| 4.5 | `AlertDialog` | `planned` | hug | client | 4.4 | |
| 4.6 | `Drawer` | `planned` | hug | client | 4.4 | |
| 4.7 | `DropdownMenu` | `planned` | hug | client | 4.2 | Typeahead, submenus |
| 4.8 | `ContextMenu` | `planned` | hug | client | 4.7 | |
| 4.9 | `Tabs` | `planned` | fill | client | T3 | |
| 4.10 | `Accordion` | `planned` | fill | client | T3 | |
| 4.11 | `Combobox` | `planned` | fill | client | 4.2, 3.13 | Async options, multi-select |
| 4.12 | `Toast` | `planned` | fill | client | 4.1 | Region + imperative API |
| 4.13 | `DatePicker` | `planned` | fill | client | 4.2, 5.9 | |
| 4.14 | `CommandPalette` | `planned` | fill | client | 4.11, 4.4 | |

---

## Tier 5 — Composition & Data

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 5.1 | `Card` | `planned` | fill | server | T2 | Compound: `Card.Header` / `.Body` / `.Footer` |
| 5.2 | `Alert` | `planned` | fill | server | 1.3, 2.2 | |
| 5.3 | `Progress` | `planned` | fill | server | T0 | Determinate + indeterminate |
| 5.4 | `Table` | `planned` | fill | server | T2 | Semantic table; sorting/selection hooks, no data layer |
| 5.5 | `Pagination` | `planned` | fill | client | 3.1 | |
| 5.6 | `Breadcrumb` | `planned` | fill | server | 3.3 | |
| 5.7 | `Stepper` | `planned` | fill | server | T2 | |
| 5.8 | `EmptyState` | `planned` | fill | server | 5.1 | |
| 5.9 | `Calendar` | `planned` | fill | client | T3 | Standalone; `DatePicker` consumes it |
| 5.10 | `FileUpload` | `planned` | fill | client | 3.7 | Drag/drop, progress |
| 5.11 | `Tree` | `planned` | fill | client | T3 | |
| 5.12 | `CodeBlock` | `planned` | fill | client | 1.11 | Highlighting is a peer dep |
| 5.13 | `AvatarGroup` | `planned` | hug | server | 1.9, 2.2 | Overlapping stack with overflow count. Added per D-016 |

---

## Tier 6 — App Shell

Opinionated patterns. Only build what the consuming app actually needs.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 6.1 | `ThemeProvider` | `planned` | n/a | client | T0 | No-flash SSR theme, `prefers-color-scheme` + override |
| 6.2 | `ThemeToggle` | `planned` | hug | client | 6.1, 3.2 | |
| 6.3 | `AppShell` | `planned` | fill | server | 2.6 | |
| 6.4 | `NavSidebar` | `planned` | fill | client | 6.3, 5.11 | |
| 6.5 | `PageHeader` | `planned` | fill | server | 2.2, 5.6 | |
| 6.6 | `Toolbar` | `planned` | fill | client | 3.4 | |

---

## Deferred / Rejected

| Item | Decision | Reason |
| --- | --- | --- |
| `Spacer` | rejected | `gap` exists. See RULES §2 |
| `Box` | rejected | A styled `div` with props is how sizing rules die |
| Polymorphic `as` | rejected | TS tarpit. `asChild` instead. See RULES §5 |
| Charts | out of scope | Use a charting library |
| Form validation engine | out of scope | The app's job; `Field` just renders the error |
