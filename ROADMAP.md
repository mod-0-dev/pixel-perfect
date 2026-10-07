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
is `done`. An item in `review` waiting only on its CI-authored baseline does
not hold the limit ([D-069 §2](docs/DECISIONS.md)); Gate C is satisfied in
advance for every remaining item by the standing delegation of D-069 §1.

**Parked idea (D-069 §3):** a modifier key that switches the components into
display combinations — a Tier 6 spec of its own, once the components exist.

### Current state

The block that used to stand here grew to 846 lines of findings; it is in
[`docs/HISTORY.md`](docs/HISTORY.md) verbatim, and every ruling it cites is one
line in [`docs/DECISIONS-INDEX.md`](docs/DECISIONS-INDEX.md) (D-106). This block
says where things stand, is refreshed on every transition, and stays short
enough to be read first.

- **In review: 0.10 docs site, 0.12 brand accent and 0.13 agent docs**
  (2026-10-06, under the standing delegation of D-069 §1). 0.10 is the
  playground made a front door: a composition on a `Stage` you can resize
  leads the index, three example screens built from the library alone, every
  component's doc rendered by the library's own components, and the rules as
  a page (D-104). 0.12 is `pixel-perfect/theme` and
  `npx pixel-perfect theme --accent …`: the palette solved around a
  consumer's accent by the library's own generator and checked by its own
  contrast checks, with a lab at `/theme` (D-103). 0.13 ships `dist/AGENTS.md`
  and the component docs to a consuming app's coding agent (D-105). Each waits
  on the user's review of the PR; 0.10 and 0.12 also on their pages'
  CI-authored baselines.
- **Every baseline is re-authored on this PR** (D-107 §7). The chrome's theme
  switcher is a `SegmentedControl` now, so every page's pixels change at the
  switcher. That is under the 1% tolerance on most pages, which is the stale
  baseline D-101 §1 re-authored rather than left. Heights were measured
  against `main`: only avatar-group (+262px), link (+684px) and the new
  segmented-control page move. Those, the index (one more registry card)
  and button-group (a line of prose with a bare `<code>`, D-102 §2) are
  re-baselined with `--rebaseline`; the manifest holds the other 148 through
  the window. Its authoring run, then one more run that compares what it
  authored, close it.
- **The playground works on a phone** (D-102). A `phone` Playwright project
  (390x844, touch) asserts every page fits the screen and scrolls under a
  finger. It found the four modal galleries that locked a phone out for
  good, `/tokens` pushing the page sideways, `VisuallyHidden` widening the
  document from inside a scrolled region (1.4, fixed, D-102 §3), and
  `Combobox` unable to be narrower than ~256px (4.11, fixed — the harness's
  own overflow flag had been reporting it). `AppShell`'s skip link read a
  token that does not exist (6.3, fixed), and `lint:rules` now fails any
  stylesheet that does (D-102 §7).
- **D-102 §7's five, fixed, and a sixth from a phone** (D-107, 2026-10-07):
  `AvatarGroup` counts each face's ring in its overlap and centres a covered
  face's initials in what stays visible (§1); `Split`'s parts are named
  exports (§2, breaking); a single choice is the new 3.18 `SegmentedControl`,
  which `ThemeToggle.md`, the chrome's theme switcher and the Stage presets
  now use (§3); `CodeBlock` needs a `title` or a `label` (§4, breaking at the
  type level); `Code` inside a `Link` takes its ink (§5); and iOS Safari no
  longer enlarges the text in a `CodeBlock`, `Table` or `Scroller` whose
  lines run past the screen (§6). The chrome's switcher changed, so every
  baseline is re-authored (§7).
- **Found and not fixed:** a pressed `Toggle`'s fill is 1.26:1 against the
  page, so a row of them (a toolbar's Bold / Italic) tells pressed from not
  by a fill nobody measured (D-107 §8); a `SegmentedControl` inside a
  `Toolbar` is untested (spec, out of scope); a bare `<code>` in the
  playground's prose (58 files) is set in the machine's own `monospace`,
  and AlertDialog's baseline shows `?gallery=open` broken after its `?`
  (D-102 §2); and the visual job passes an authoring run in which a
  functional test failed (D-106 §5).
- **6.1–6.7 are `review`**, each waiting only on its CI-authored baseline,
  which this PR's authoring run re-authors with the rest (D-069 §2). The sweep
  of Tier 6 to `done` follows the run that compares them.
- **Still open from Tier 2:** consume the layout primitives in
  [launchpad](https://github.com/mod-0-dev/launchpad), deleting `.lp-stack`,
  `.lp-cluster`, `.lp-grid`, `.lp-page`, `.lp-shell` and its last viewport
  media query
- **Done:** 73 / 84 tracked items (13 foundations + 71 components) — 10
  foundations + 63 components. The denominator moved from 81 to 83 when 0.12
  and 0.13 were added (D-103 §6, D-105 §3), and to 84 with 3.18 (D-107 §3).
  What remains is Tier 6 (6.1–6.7), 3.18, 0.10, 0.12 and 0.13, all in
  `review`.

---

## Tier 0 — Foundations

Not components. Nothing else may start until this tier is `done`.

| # | Item | Status | Deps | Notes |
| --- | --- | --- | --- | --- |
| 0.1 | Package scaffold (TS, build, exports, peer deps) | `done` | — | Standalone package (D-005). `tsc` for JS+types, lightningcss for CSS |
| 0.2 | Token layer — primitives + semantics, light + dark | `done` | 0.1 | OKLCH ramps with contrast solved, not eyeballed. `--pp-tone-*` rewired by `[data-pp-tone]` (D-007). A control's boundary is an off-ramp solved step, because a conforming one inverts the ramp (D-050). **242** assertions in `npm run lint:contrast`, value **and** mapping |
| 0.3 | Cascade layers + minimal reset | `done` | 0.2 | `@layer pp.reset, pp.tokens, pp.base, pp.components, pp.overrides`. Reset uses `:where()` so the app always wins |
| 0.4 | Playground app (Next.js, container-width harness) | `done` | 0.1 | `Matrix` renders 3 widths in the theme the chrome's switcher set on `<html>` (D-063; it rendered both themes side by side until then), each cell a query container, overflow flagged at runtime. An index grouped by tier, `/tokens` gallery, `/harness` self-check |
| 0.5 | Test harness — Vitest + Testing Library + axe | `done` | 0.1 | `npm test`. jsdom for behaviour/a11y/API; anything CSS-dependent belongs in `tests/visual`. Includes an axe canary and a D-011 regression guard |
| 0.6 | Visual regression (Playwright screenshots) | `done` | 0.4 | `npm run test:visual`. Baselines authored by CI only (D-013), on a PR branch only (D-042). Two per page since D-063, one per theme, through the playground's switcher. Functional harness assertions run anywhere |
| 0.7 | **Rule lint** — fail on banned CSS/props | `done` | 0.3 | `npm run lint`: stylelint + source rules + contrast + a self-test proving every rule still fires |
| 0.8 | Changesets + release pipeline | `done` | 0.1 | Proven end to end 2026-09-18 after five silent failures (D-038): **`v0.1.0` tagged**, `CHANGELOG.md` on `main`, 27 changesets consumed. npm publish stays opt-in via `PUBLISH_TO_NPM`. See `docs/RELEASING.md` |
| 0.9 | CI pipeline (GitHub Actions) | `done` | 0.5, 0.6 | Lint, typecheck, test, build, token-freshness, visual regression on every PR |
| 0.10 | Docs site | `review` | 0.4 | The playground made a front door rather than a second site (D-104 §1): the index leads with a composition on a resizable `Stage`, then Examples, Theme and Rules; `/docs/<slug>` renders `docs/components/<Name>.md` with the library's own components; `/examples` holds three screens built from the library alone, each on a `Stage`; `/rules` renders `docs/RULES.md`. Waits on review and its pages' CI-authored baselines |
| 0.11 | **Focus ring off the page** | `done` | 0.2 | `--pp-color-focus-ring` is asserted against `neutral-1` only, where it is 3.06:1. It is **2.94 / 2.85** on `--pp-color-bg-surface` and **2.74–2.77 / 2.54–2.57** on a tinted step 3, against 1.4.11's 3:1 (D-053 §2). **Done** 2026-09-21 (D-056). Solved against steps 1, 2 and 3 of **every hue** rather than neutral's step 1 — a border's surfaces are neutral, a ring's are not. Light 66.18% → 63.34%, dark 49.70% → 53.99%; worst pairing **2.54 → 3.06**. **293** assertions in `lint:contrast`, up from 242, including a cross-hue set for the one ring colour that ships. `/tokens` now draws `focus`, `edge` and `edge-strong`, which it never had — one baseline re-authored, no component CSS touched. D-055 corrects this row's first estimate, which claimed one shared colour and a re-baseline of 35 |
| 0.12 | Brand accent, solved and proven | `review` | 0.2 | `pixel-perfect/theme` (`createTheme`) and `npx pixel-perfect theme --accent …`: the complete palette solved around a consumer's accent by the generator that writes the library's own, emitted in `pp.overrides` across the four theme scopes, and checked from its text by the checks `lint:contrast` runs (D-103). The library accent reproduces `primitives.css` declaration for declaration; 96 accents around the hue wheel pass all 290. A lab at `/theme`. Waits on review and `/theme`'s CI-authored baselines |
| 0.13 | Agent docs in the package | `review` | 0.1 | `npm run build` writes `dist/AGENTS.md` (the rules that change what an agent writes, the banned list, setup, an index of every component) and ships `docs/components/*.md` and `docs/RULES.md` beside it, links re-pointed so none dead-ends (D-105). Waits on review |

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
| 2.8 | `Scroller` | `done` | fill | client | T0 | Overflow container, scroll shadows. The tier's only client component and only a11y surface. `both` reports the inline axis as `data-overflow-inline` (D-046) |

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
| **3C — Native inputs** | 3.8–3.13 | [`tier-3c-inputs.md`](docs/specs/tier-3c-inputs.md) — **complete** 2026-09-20, all six `done`. Approved 2026-09-18 (D-039) |
| **3D — Composite inputs** | 3.14–3.15 | [`tier-3d-composite.md`](docs/specs/tier-3d-composite.md) — **complete** 2026-09-21, both `done` (D-051, D-052). 3.16 `Form` moved to its own gate; 3.17 `RangeSlider` added by D-052 §5 |

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `Button` | `done` | hug | client | T2 | `variant` × `tone` × `size`, `loading`, `asChild`. Ships `--pp-control-*` and the focus ring (D-028, D-029) |
| 3.2 | `IconButton` | `done` | hug | client | 3.1, 1.3 | `label` is a required `string`. Square, on the control scale. No `asChild` (D-031) |
| 3.3 | `Link` | `done` | hug | server | 1.1 | `tone` + `underline`; no `variant`, no `size` (D-030 §6). `asChild` for `next/link` |
| 3.4 | `ButtonGroup` | `done` | hug | server | 3.1 | Always attached; the spaced case is `Cluster`. One-border seam, no negative margin (D-033) |
| 3.5 | `Toggle` | `done` | hug | client | 3.1 | `aria-pressed`, `data-state="on|off"`. Ships the shared `useControllableState` (D-032) |
| 3.6 | `Label` | `done` | fill | server | 1.1 | [`Label.md`](docs/specs/Label.md). Scales off `--pp-control-font-size-*`, not the `Text` scale (D-034). `required` is an `aria-hidden` glyph; `invalid` ships no colour |
| 3.7 | **`Field`** | `done` | fill | client | 3.6 | [`Field.md`](docs/specs/Field.md). Context + `useField()`, never `cloneElement` (D-036). `error` is the invalid state. Every input in 3C composes into this |
| 3.8 | `Input` | `done` | fill | client | 3.7 | Ships the control surface and the tone-shifted focus border. **Two elements** — a form control does not fill (D-040). Baseline landed after the fact (D-042) |
| 3.9 | `Textarea` | `done` | fill | client | 3.7 | Auto-resize opt-in, floored at `rows`. Block padding derived from `--pp-control-*`, because the space scale cannot express it (D-043) |
| 3.10 | `Checkbox` | `done` | hug | client | 3.7 | Tri-state, and only the caller can set the third. 16/20/24 from the size scale; 2.5.8 through the spacing exception (D-044) |
| 3.11 | `Radio` / `RadioGroup` | `done` | hug / fill | client | 3.7 | **No roving tabindex** (D-039 §5) — radios sharing a `name` already are the APG pattern. `RadioGroup` generates the `name` and owns the value; `gap` defaults to `"3"` for WCAG 2.5.8. Paints from `:checked`, not `data-state` (D-047) |
| 3.12 | `Switch` | `done` | hug | client | 3.7 | A 2:1 track, and the only member of the checkable three that is not square. Paints from `data-state`, because every change to a switch is an event on it — D-047 §2's deviation does not transfer. Off is the resting control surface with a muted thumb; the specified `--pp-color-border-strong` track was 1.97:1 (D-048) |
| 3.13 | `Select` | `done` | fill | client | 3.7 | **Native `<select>` first.** Custom listbox is 4.11. The placeholder is seeded with `defaultValue=""`, because the HTML reset algorithm skips a disabled option; painted from `:checked` and `data-placeholder` is emitted only when controlled (D-049) |
| 3.14 | `NumberInput` | `done` | fill | client | 3.8 | `type="text"` with `role="spinbutton"`, never `type="number"` (3C §13.5). `null` is empty, `undefined` is uncontrolled. Clamp and snap on commit, never on a keystroke. Formatting is opt-in because an ambient locale cannot hydrate |
| 3.15 | `Slider` | `done` | fill | client | 3.7 | Native `<input type="range">`, **single-thumb**. The track is ours and the thumb is the platform's: the fill is a grid **column**, not a gradient, so RTL needs no declaration (D-052 §1). `onValueCommit`, because React maps `onChange` to *input*. No `readOnly` — HTML's ruling (D-049 §4's shape) |
| 3.16 | `Form` | `done` | fill | client | 3.7, 5.2, 3.3 | [`Form.md`](docs/specs/Form.md). Built 2026-09-22 (D-058); **done** 2026-09-26, once its CI-authored baseline had been compared green on `main` (D-013's second half). Deps gained 3.3 `Link`, which the summary composes (spec §9). Error summary, submission state; validation stays the app's job. **Its own Gate C**, approved out of the 3D group 2026-09-21: it is not a composite input, its error summary is an `Alert` (5.2), and addressing each field by id may need `Field` to gain a registration API — the class D-014's carve-out was written about |
| 3.17 | `RangeSlider` | `done` | fill | client | 3.15 | [`RangeSlider.md`](docs/specs/RangeSlider.md), approved by delegation (D-057); built 2026-09-26, the day Gate A opened (D-060). Its baseline was CI-authored on the PR branch and compared green on the re-run (D-013); recording it tripped the dimensions guard at exactly the limit D-054 §2 set, because `form.png` and `tokens.png` were unrecorded too — all three are now in the manifest. Both blockers below have a proposed answer: the inputs are transparent and the visible thumbs are ours, so the ring is drawn on a thumb with nothing suppressed; a track press is routed to the nearer thumb by the root (spec §1, §2). The two-thumb case, deferred from 3.15 with both blockers named (D-052 §5): two overlapping inputs each ring the **whole** track, and moving the ring onto the thumb needs `outline: none` (banned, D-029); and the `pointer-events` layering that makes both thumbs draggable takes a track click away |
| 3.18 | `SegmentedControl` | `review` | hug | client | 3.4, 3.7, 3.11 | [`SegmentedControl.md`](docs/specs/SegmentedControl.md), added, written and built 2026-10-07 under the standing delegation (D-069 §1); rulings in D-107 §3; awaiting its CI-authored baselines (D-013). Exactly one of a few options as an attached row of buttons: native radios, so the browser is the APG pattern and the value submits (§1); the checked segment solid neutral, because a pressed Toggle's fill is 1.26:1 against the page (§2); ButtonGroup's seams and Button's box by the two-class contract (§3); named by `label` or its `Field` (§4); painted from `:checked` (§5). What `ButtonGroup.md` meant by "a RadioGroup styled as buttons"; the playground's theme switcher and Stage presets are made of it |

---

## Tier 4 — Overlays & Disclosure

Behavior from **Radix Primitives** (D-061; D-002 had left the choice open). We own every DOM node and every pixel.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | Overlay foundation | `done` | n/a | client | T3 | [`overlay-foundation.md`](docs/specs/overlay-foundation.md), written and approved by delegation 2026-09-26 (D-061). Settles **Radix Primitives**, one package per Tier 4 component as a `dependency`; theme copied across the portal, tone not; a logical `side` vocabulary (`top \| bottom \| start \| end`); the five `--pp-z-*` tokens mapped to layers; and that 4.1 is `done` with 4.2 `Popover`, tested through it, in one PR (spec §9) |
| 4.2 | `Popover` | `done` | hug | client | 4.1 | [`Popover.md`](docs/specs/Popover.md), approved by delegation 2026-09-26 (D-061 §2 — written after the delegation; its decisions are listed for reversal before merge). The sizing exception the row promised is D-061 §3: an overlay has no parent in flow and takes its ceiling from `--pp-measure-xs`. Built with 4.1 in one PR |
| 4.3 | `Tooltip` | `done` | hug | client | 4.1 | [`Tooltip.md`](docs/specs/Tooltip.md), written and approved by delegation 2026-09-27 (D-064); built the same day, findings in D-065; **done** 2026-09-27 once its CI-authored baselines had been compared green (run 132, D-013). Its PR also found and fixed the CI classification that could author over a regression (D-066). The tier's compound shape plus an optional `TooltipProvider` with a fallback; a description (`aria-describedby`), never a name; two new Tier 0.2 tokens for the inverse surface; Radix's three `data-state` values kept as an extension of RULES §4; no arrow, settling `Popover` §8. Six open questions, each with a recommendation |
| 4.4 | `Dialog` | `done` | hug | client | 4.1 | [`Dialog.md`](docs/specs/Dialog.md), approved by delegation 2026-09-27 (D-067), every one of its eight recommendations adopted as written; built the same day, findings in D-068; **done** 2026-09-27 once its CI-authored baselines had been compared green (run 139, D-013). The first modal, and the one 4.5, 4.6 and 4.14 gate on. Modal only, no `modal` prop; the scrim is Radix's `Overlay` rendered by `Content` and is the panel's parent — positioner and scroll container in one, centred by a grid so RTL needs nothing; ceiling `--pp-measure-sm`, no `size`; `aria-modal` and a focus restore for a trigger-less dialog are the two things added over Radix; the gallery portals into `contain: layout` cells, so a cell is a viewport |
| 4.5 | `AlertDialog` | `done` | hug | client | 4.4 | [`AlertDialog.md`](docs/specs/AlertDialog.md), written and built 2026-09-28 under the standing delegation (D-069); findings in D-070. `Dialog` with two rules changed — no close on a scrim press, focus on `Cancel` — drawn by Dialog's stylesheet through two classes per part; ceiling `--pp-measure-xs`. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.6 | `Drawer` | `done` | hug | client | 4.4 | [`Drawer.md`](docs/specs/Drawer.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-071. A modal sheet from one of four logical sides, built on Radix's dialog (no new package) and drawn on Dialog's scrim; the anchored axis is a token, `--pp-drawer-size`, and the panel scrolls, not the scrim. The build found Radix's scroll lock stripping a padded `<body>` of its gutter (D-071 §6): the playground now pads a wrapper, and the Dialog page documents the gap. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.7 | `DropdownMenu` | `done` | hug | client | 4.2 | [`DropdownMenu.md`](docs/specs/DropdownMenu.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-072. Typeahead and submenus are Radix's; the direction is read from the trigger at open time and handed to Radix as `dir`, so the arrow keys and the submenu's side read correctly in RTL. Fifteen named parts; `align` defaults to `start` (D-072 §1); rows are the small control height; a checkable item earns the list its gutter by `:has()`; `data-highlighted` joins RULES §4 (D-072 §2). The stylesheet is shared with 4.8. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.8 | `ContextMenu` | `done` | hug | client | 4.7 | [`ContextMenu.md`](docs/specs/ContextMenu.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-073. `DropdownMenu`'s list opened at the pointer: the twelve parts a menu is made of are built once by an internal factory and drawn by 4.7's stylesheet through two classes, so this component ships no CSS; the trigger is a region that renders a `<div>`; the direction is read from the region at open time. Gate B read 4.7's `review` (baseline only) as `done` (D-073 §2). **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.9 | `Tabs` | `done` | fill | client | T3 | [`Tabs.md`](docs/specs/Tabs.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-074. The tier's first non-overlay: one look (a hairline, a two-pixel accent bar on it under the selected tab), the strip scrolls at a narrow width rather than wrapping, `keepMounted` for a panel that holds a form, and the page's direction is the component's — Radix's `dir` attribute is not written. `data-state="active\|inactive"` joins RULES §4. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.10 | `Accordion` | `done` | fill | client | T3 | [`Accordion.md`](docs/specs/Accordion.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-075. Headings on hairlines, a chevron that turns, a height that animates; `multiple` is a boolean (RULES §5 reserves `type`) with the value's shape to match; `collapsible` defaults to `true`; `headingLevel` on the root sets every heading once; `keepMounted` as Tabs'. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.11 | `Combobox` | `done` | fill | client | 4.2, 3.13 | [`Combobox.md`](docs/specs/Combobox.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-076. The one Tier 4 component whose behaviour is the library's own: the list on Popover's `Anchor`, its look DropdownMenu's stylesheet, the control Input's box; the keyboard, `aria-activedescendant`, the selection and the tokens written here. The consumer renders the options that match and `onInputValueChange` says why the text changed; `multiple` as tokens; `getLabel` for a value set from outside; `loading` for options from a server. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.12 | `Toast` | `done` | fill | client | 4.1 | [`Toast.md`](docs/specs/Toast.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-077. Region + imperative API, as promised: one `ToastProvider`, one `useToast()` (`toast`, `dismiss`, `update`), no element. A toast is an `Alert` that floats, drawn by Alert's stylesheet through two classes; the region is fixed at a logical corner, a token wide, with a `limit` and a queue; `live` is Alert's word for Radix's `type`. **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| 4.13 | `DatePicker` | `done` | fill | client | 4.2, 5.9 | [`DatePicker.md`](docs/specs/DatePicker.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-091; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). Input's box with a text field and a calendar button, `Calendar` at `sm` in a `Popover` behind it (§1); typed text parsed on commit in the locale's order, the text derived from the value unless mid-edit after a draft that lied to a refusing owner (§2); the ISO value, a hidden input by `name`, the Field's precedence (§3). Closes Tier 4 |
| 4.14 | `CommandPalette` | `done` | fill | client | 4.11, 4.4 | [`CommandPalette.md`](docs/specs/CommandPalette.md), written and built 2026-09-28 under the standing delegation (D-069); rulings and findings in D-078. The last of Tier 4 and made of it, with no package added: Dialog's modal through two classes, Combobox's highlight through a shared hook, DropdownMenu's row through its class and private variables, Kbd's key caps. The consumer renders the matches; the first is highlighted as the user types; `hotkey="mod+k"` once on the root; focus returns to whatever had it. Gate B read 4.11's `review` (baseline only) as `done` (D-073 §2). **Done** 2026-09-29: its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |

---

## Tier 5 — Composition & Data

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 5.1 | `Card` | `done` | fill | server | T2 | [`Card.md`](docs/specs/Card.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-079; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). The first Server Component compound: `Card` / `CardHeader` / `CardBody` / `CardFooter` as named exports, and RULES §5.6 now says every compound's parts are (§1). A bordered raised surface, no shadow, no `tone` / `variant` / `size`; one hairline per adjacent pair of sections; the foot sunken (§2). An interactive card is the consumer's link or button by `asChild` (§2). The wrap of a URL in the body is the card's `overflow-wrap`, not `min-inline-size: 0`, which the clip makes unobservable — found by the break check (§3) |
| 5.2 | `Alert` | `done` | fill | server | 1.3, 3.2 | [`Alert.md`](docs/specs/Alert.md). No `variant` and no `size`: an alert is the only component whose children are arbitrary, and a `solid` fill puts a `plain` `Button` at 1.04:1 (spec §1). `role="alert"` is opt-in — the default is no live region (§2). Holds no state, so `onDismiss` reports the intent and the caller unmounts it — which is what keeps it `server` (§4). **Deps corrected from 2.2 to 3.2 at approval**: it composes `IconButton` and does not compose `Cluster`. The root is flex, not a grid — a grid gaps between *tracks*, so an alert with no icon paid 12px for the empty one (D-053 §3) |
| 5.3 | `Progress` | `done` | fill | server | T0 | [`Progress.md`](docs/specs/Progress.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-080; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). `value` present is determinate, absent is indeterminate, `aria-valuenow` omitted when there is none; `determinate` joins `data-state` (§1). A name is required at the type level, `label` or `aria-labelledby` (§2). The fill is a flex item so it slides in every browser and grows from the right in RTL with no rule (§2); the sweep moves by `inset-inline-start`; reduced motion pulses the whole bar. `tone` defaults to `accent`, recorded beside Spinner's `neutral` (§3) |
| 5.4 | `Table` | `done` | fill | server | T2 | [`Table.md`](docs/specs/Table.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-081; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). A semantic table in a named region that scrolls, focusable always (§1); `caption` a prop of the root, one of three names required (§2); the table stretched by a grid, never by a width (§3); sorting and selection are hooks, `sort` → `aria-sort`, `selected` → `data-state`. Found on the way: `useId` is not a client hook, and the rule lint and RULES §7 now say so (§4); a ring read in the frame focus landed in is 0px wide under the reset's reduced-motion crush (§5); the UA centres a `th` and a cell that wraps a date is worse than one that scrolls, both seen on the screenshot and not by the first green run (§6) |
| 5.5 | `Pagination` | `done` | fill | client | 3.1 | [`Pagination.md`](docs/specs/Pagination.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-082; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). A window with a constant number of slots, buttons or links by `getHref` (§1); the compact form is a container query, which is why the contract is `fill` (§2); the current page is Toggle's `on` in the accent ramp (§3). Found on the way: `:dir()` does not ship — the build rewrites it into `:lang()` — so RULES §1 says `[dir="rtl"]` and the Scroller's RTL swap is fixed (§4); a Button drawn on an `<a>` was underlined, fixed in Button.css (§5) |
| 5.6 | `Breadcrumb` | `done` | fill | server | 3.3 | [`Breadcrumb.md`](docs/specs/Breadcrumb.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-083; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). Five named parts, the last a span with `aria-current`; the separator is the stylesheet's, after each crumb, out of the tree (§1); a trail wraps at its separators (§2). A `nowrap` the break check could not observe was followed through and found wrong (§3) |
| 5.7 | `Stepper` | `done` | fill | server | T2 | [`Stepper.md`](docs/specs/Stepper.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-084; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). Two parts; the number a counter, done a check, `aria-current="step"` (§1); vertical the base, a row above 28rem by its container (§2); every colour a tone token in the accent scope (§3). Found by the rectangles and the screenshot: grid auto-placement seated the circle after the label, and an `auto` column left the row's connector zero wide (§4) |
| 5.8 | `EmptyState` | `done` | fill | server | 5.1 | [`EmptyState.md`](docs/specs/EmptyState.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-085; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). Five parts on the Tier 1–2 primitives (§1); centred and held to `measure-xs` by a grid track, never a width (§2); `outline` is Card's frame made dashed by the two-class contract (§3) |
| 5.9 | `Calendar` | `done` | fill | client | T3 | [`Calendar.md`](docs/specs/Calendar.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-086; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). An ISO value and a `YYYY-MM` month, both controllable, no date library — `src/internal/date.ts` (§1); our own grid on `div`s with one tab stop and the APG keys, arrows mirrored in RTL (§2); names and digits by `Intl` (§3). A sixth week of fillers is hidden as a row (§4). Standalone; 4.13 `DatePicker` consumes it and is unblocked |
| 5.10 | `FileUpload` | `done` | fill | client | 3.7 | [`FileUpload.md`](docs/specs/FileUpload.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-087; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). The hidden native input is the mechanism and the Trigger the one tab stop (§1); `onSelect(accepted, rejected)` with reasons by type, size and count, drop and dialog checked alike (§2); a file field is a `group` Field, because a label pointing at a button replaces its name (§3); items with a `Progress` bar, truncating (§4). It selects and shows; uploading is the consumer's |
| 5.11 | `Tree` | `done` | fill | client | T3 | [`Tree.md`](docs/specs/Tree.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-088; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). Nested items, a parent by its children, `expanded` and `selected` each controllable, collapsed children unmounted (§1); focus on the row, which is the `treeitem` and owns its group — the ring rule refused `outline: none` on the `<li>`, rightly (§2); rows on the control scale indented by one custom property (§3) |
| 5.12 | `CodeBlock` | `done` | fill | client | 1.11 | [`CodeBlock.md`](docs/specs/CodeBlock.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-089; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). The frame and not the highlighter: `code` for text or `CodeBlockLine` children for tokens (§1); the `<pre>` a named region that scrolls, the code stretched by a grid (§2); a counter gutter under the D-019 exemption, a pointed line across the whole width (§3); a copy button that says "Copied" (§4). Highlighting stays a peer |
| 5.13 | `AvatarGroup` | `done` | hug | server | 1.9, 2.2 | [`AvatarGroup.md`](docs/specs/AvatarGroup.md), written and built 2026-09-28 by delegation (D-069 §1), rulings and findings in D-090; **done** 2026-09-29 once its CI-authored baselines had been compared green (runs 175 and 176, D-013; the sweep is D-093 §6). A list of the children with the first `max` shown and the rest a count drawn as an avatar (§1); overlap by a grid whose columns are narrower than a face, no margin (§2); `size` on the group written into the faces, the group's variables their own names after a self-referencing cycle (§3). Added per D-016 §7 |

---

## Tier 6 — App Shell

Opinionated patterns. Only build what the consuming app actually needs.

| # | Component | Status | Contract | RSC | Deps | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 6.1 | `ThemeProvider` | `review` | n/a | client | T0 | [`ThemeProvider.md`](docs/specs/ThemeProvider.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-094; awaiting its CI-authored baseline (D-013). No-flash SSR theme, `prefers-color-scheme` + override: one provider at the root writing `data-pp-theme` on `<html>`, `system` the absence of the attribute (§2), `value` / `defaultValue` / `onValueChange` — RULES §5 bans `theme` as a prop name (§3, D-094 §1) — with the app's persistence in controlled mode, an inline script rendered before the children for the first paint (§4), `useTheme()` with `resolvedTheme` `undefined` until mounted (§5). The playground is themed by it, with the same key, values and switcher DOM, so no baseline moved (§7); the index is re-baselined for the tier and the entry (D-066 §2)
| 6.2 | `ThemeToggle` | `review` | hug | client | 6.1, 3.2 | [`ThemeToggle.md`](docs/specs/ThemeToggle.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-095; awaiting its CI-authored baseline (D-013). Gate B read 6.1's `review` (baseline only) as `done` (D-073 §2). A square button that flips light and dark (§1); both faces rendered and one displayed by CSS from the document's theme — the tokens' four scopes read from the toggle's side — so it is right before hydration and cannot disagree with the page (§2); the icon shows what is on, the name says what a press does (§3); Button with IconButton's class, not IconButton, because the name is content (§4); `:root`, not the nearest scope (§5); no ARIA state (§6); its own page, the chrome unchanged (§7) |
| 6.3 | `AppShell` | `review` | fill | server | 2.6 | [`AppShell.md`](docs/specs/AppShell.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-096; awaiting its CI-authored baseline (D-013). The frame a Next layout wraps its pages in: `header`, `sidebar` and `footer` as element slots and `children` as the `<main>` — a deliberate step off RULES §5.6's child-parts shape, because a Server Component root must own `<main>` to wire the skip link (§1, D-096 §1); the skip link built in and first (§2); `Split` as the middle row with its two knobs forwarded (§3); a sunken sidebar and hairlines that need no side (§4); `sticky` for the header (§5); fills the parent's block size, never the viewport's (§6); the document model, not scrolling panes (§7) |
| 6.4 | `NavSidebar` | `review` | fill | client | 6.3, 5.11 | [`NavSidebar.md`](docs/specs/NavSidebar.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-099; awaiting its CI-authored baseline (D-013). The app's primary navigation for AppShell's sidebar slot: a named `<nav>` of sections, items and disclosure groups (§1); the app says which link is current and a group holding it is open and marked (§2); a closed group's list is rendered and `hidden` — which needs its own `display: none`, because an author `display` beats the user agent's (§3, D-099 §1); plain links, no roving tabindex, 5.11's row and not its role (§4, §5); not a drawer, composition instead (§6); `asChild` for `next/link` (§7). The last component of the roadmap |
| 6.5 | `PageHeader` | `review` | fill | server | 2.2, 5.6 | [`PageHeader.md`](docs/specs/PageHeader.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-097; awaiting its CI-authored baseline (D-013). Four named parts — title, description, actions, the root — and the consumer's `Breadcrumb` first, placed by its class (§1); one flex row that wraps, so an absent part costs no gap and nothing is placed by area (§2); the description reads after the title and paints after the actions by `order`, the library's one visual reorder, of a paragraph nothing focuses (§3); the title a `Heading` at level 1 (§4) |
| 6.6 | `Toolbar` | `review` | fill | client | 3.4 | [`Toolbar.md`](docs/specs/Toolbar.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-098; awaiting its CI-authored baseline (D-013). The roving component `ButtonGroup`'s spec promised (D-030 §7): `role="toolbar"` with a required name, one tab stop over the controls found in its own subtree and re-read by an observer, no wrapper part (§1, D-098 §2); the last-focused control remembered — never a text field, whose arrows are the caret's and which would strand the controls after it (§2, §4, D-098 §1); arrows by orientation mirrored in RTL, wrapping unless `loop={false}` (§3); a wrapping row with a `gap`, not a `Cluster` (§6) |
| 6.7 | `KeyHints` | `review` | n/a | client | 1.10, 4.4, 4.14 | [`KeyHints.md`](docs/specs/KeyHints.md), written and built 2026-09-29 under the standing delegation (D-069 §1); rulings and findings in D-100; awaiting its CI-authored baseline (D-013). The parked idea of D-069 §3 in the form that passes the accessibility gate: a shortcut declared on the control (`data-pp-hotkey`) or registered as a command (`useKeyHint`), `mod+k` chords and `g i` sequences (§1); hold `revealKey` to see every shortcut on its control, a picture and never a mode, hints that climb when they would overlap (§2, D-100 §3); `jumpKey` labels every control on screen and typing the label focuses it (§3); `helpKey` opens the sheet on a Dialog (§4); every key remappable and off-able, WCAG 2.1.4 (§5); a modifier that changes what a component does is ruled out (§6). Added per D-100 §1 |

---

## Deferred / Rejected

| Item | Decision | Reason |
| --- | --- | --- |
| `Spacer` | rejected | `gap` exists. See RULES §2 |
| `Box` | rejected | A styled `div` with props is how sizing rules die |
| Polymorphic `as` | rejected | TS tarpit. `asChild` instead. See RULES §5 |
| Charts | out of scope | Use a charting library |
| Form validation engine | out of scope | The app's job; `Field` just renders the error |
