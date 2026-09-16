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

**WIP limit: 1.** At most one component may be in `spec`, `build`, or `review`
at any time. A component may not enter `spec` until every entry in its **Deps**
column is `done`.

### Current state

- **In flight:** _none_
- **Next up:** 0.4 Playground, 0.5 Test harness, 0.8 Release pipeline
- **Done:** 4 / 75 tracked items (8 foundations + 67 components)

---

## Tier 0 — Foundations

Not components. Nothing else may start until this tier is `done`.

| # | Item | Status | Deps | Notes |
| --- | --- | --- | --- | --- |
| 0.1 | Package scaffold (TS, build, exports, peer deps) | `done` | — | Standalone package (D-005). `tsc` for JS+types, lightningcss for CSS |
| 0.2 | Token layer — primitives + semantics, light + dark | `done` | 0.1 | OKLCH ramps with contrast solved, not eyeballed. `--pp-tone-*` rewired by `[data-pp-tone]` (D-007). 160 assertions in `npm run lint:contrast` |
| 0.3 | Cascade layers + minimal reset | `done` | 0.2 | `@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides`. Reset uses `:where()` so the app always wins |
| 0.4 | Playground app (Next.js, container-width harness) | `planned` | 0.1 | Must render any component at 3 container widths × 2 themes |
| 0.5 | Test harness — Vitest + Testing Library + axe | `planned` | 0.1 | |
| 0.6 | Visual regression (Playwright screenshots) | `planned` | 0.4 | |
| 0.7 | **Rule lint** — fail on banned CSS/props | `done` | 0.3 | `npm run lint`: stylelint + source rules + contrast + a self-test proving every rule still fires |
| 0.8 | Docs site + changesets + release pipeline | `planned` | 0.1 | |

---

## Tier 1 — Atoms

No internal state, no a11y surface beyond semantics.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `Text` | `planned` | fill | server | T0 | Typography scale, `tone`, truncation |
| 1.2 | `Heading` | `planned` | fill | server | 1.1 | Visual level decoupled from semantic level |
| 1.3 | `Icon` | `planned` | hug | server | T0 | `1em` sizing, `currentColor`, required label or `aria-hidden` |
| 1.4 | `VisuallyHidden` | `planned` | n/a | server | T0 | |
| 1.5 | `Separator` | `planned` | fill | server | T0 | Horizontal + vertical, `role="separator"` |
| 1.6 | `Spinner` | `planned` | hug | server | T0 | `prefers-reduced-motion` |
| 1.7 | `Skeleton` | `planned` | fill | server | T0 | |
| 1.8 | `Badge` | `planned` | hug | server | T0 | The canonical `hug` case |
| 1.9 | `Avatar` | `planned` | hug | client | 1.3 | Image fallback needs state |
| 1.10 | `Kbd` | `planned` | hug | server | T0 | |
| 1.11 | `Code` | `planned` | hug | server | T0 | Inline only; block code is Tier 5 |

---

## Tier 2 — Layout Primitives

Load-bearing. The sizing contract is unusable without these.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `Stack` | `planned` | fill | server | T0 | Vertical flow, `gap`, `align` |
| 2.2 | `Cluster` | `planned` | fill | server | 2.1 | Horizontal, wrapping, `gap`, `justify` |
| 2.3 | `Grid` | `planned` | fill | server | 2.1 | Explicit columns + `auto-fit` mode |
| 2.4 | `Container` | `planned` | fill | server | 2.1 | **The only component allowed to set `max-width`** |
| 2.5 | `Center` | `planned` | fill | server | 2.1 | |
| 2.6 | `Split` | `planned` | fill | server | 2.3 | Sidebar + main; container-query driven collapse |
| 2.7 | `AspectRatio` | `planned` | fill | server | T0 | |
| 2.8 | `Scroller` | `planned` | fill | client | T0 | Overflow container, scroll shadows |

---

## Tier 3 — Form & Action Core

The heart of the library. `Field` is the workhorse — build it before the inputs.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `Button` | `planned` | hug | client | T2 | `variant` × `tone` × `size`, loading state |
| 3.2 | `IconButton` | `planned` | hug | client | 3.1, 1.3 | Accessible name required by types |
| 3.3 | `Link` | `planned` | hug | server | 1.1 | `asChild` for `next/link` |
| 3.4 | `ButtonGroup` | `planned` | hug | server | 3.1, 2.2 | |
| 3.5 | `Toggle` | `planned` | hug | client | 3.1 | Pressed state |
| 3.6 | `Label` | `planned` | fill | server | 1.1 | |
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
