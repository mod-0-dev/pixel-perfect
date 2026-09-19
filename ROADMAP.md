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

- **In flight:** _none_ — **3.12 `Switch` is `done`.** Next is 3.13 `Select`,
  already `spec` under the Gate C approval of 2026-09-18 (**D-039**), and the
  last component in 3C
- **The spec chose a colour on appearance for the second time in two
  components, and it failed again** (**D-048 §1**). §3.12 put the off track on
  `--pp-color-border-strong` with a `--pp-color-bg-surface` thumb: against the
  real ramp that is **1.97:1 in both directions** in the light theme, so the
  thumb — the thing that says which way the switch is set, and the part WCAG
  1.4.11 most clearly asks about — was what failed. Off is now the library's
  resting control surface with a `--pp-color-text-muted` thumb (5.10:1 light,
  5.49:1 dark) and on is `--pp-tone-solid` with a `--pp-tone-on-solid` thumb;
  **both are pairings `check-contrast.mjs` already asserts**, so the component
  adds no assertion and leans on none that is missing. The spec's reason for a
  filled off track — off must not read as *disabled* — is answered in the thumb
  instead: 5.10:1 against a disabled switch's 1.77:1, which is the difference
  1.4.11's inactive-component exemption expects to see. D-047 §3 was the first
  time; twice is a pattern, and the rule is **compute the pairing at the gate,
  not after the build**
- **A library-wide contrast gap, measured and deliberately NOT fixed here**
  (**D-048 §2**). `--pp-color-border` is **1.55:1** against the page in the
  light theme and `--pp-color-border-strong` is 1.97:1, so the resting edge of
  every control in 3C sits below 1.4.11's 3:1 — and **nothing in
  `check-contrast.mjs` pairs a border step with a surface**, which is the same
  missing check class D-047 §3 named. The neutral ramp has nothing between
  `neutral-8` (1.97) and `neutral-9` (5.90), and `neutral-9` is the *on*
  colour, so no arrangement of existing tokens fixes it: it needs a token-layer
  change plus the missing check plus a re-baseline of every screenshot. That is
  Tier 0.2 work across six shipped components and it is the next thing worth
  doing in this repository
- **`translate` is physical, so the thumb is offset instead** (D-048 §4). A
  thumb moved with `translate` travels rightwards in every writing mode, so the
  switch would run backwards in RTL — on at the start of the track, off at the
  end — and no LTR test can see it. It uses `inset-inline-start` on a
  relatively positioned element, and the browser suite sets `dir="rtl"` and
  watches the thumb cross the track's centre. The only assertion in the file
  that can tell the two mechanisms apart
- **The geometry is derived, not tuned** (D-048 §1, and the reason overriding one
  property moves four things). The thumb is the track minus two insets, the inset
  is half the difference between the track and the size step below it, and the
  travel is `inline − block` — the same distance whatever the inset is, because
  the inset is subtracted at the start and added back at the end
- **Eighth assertion that could not fail, and the same shape as the other
  seven** (D-048 §5). "Disabled beats checked" compared a disabled *on* track
  with a live *off* track, which differ because of `data-state` whatever the
  disabled rule does, so deleting the whole `[data-disabled]` block left it
  green. Sixteen breaks in total, fifteen failing on exactly the test named for
  them. The pattern worth naming: **when an assertion says "A is not B", ask
  what else is different about A and B**
- **A deselected radio is told nothing, and that fact decides the API and the
  stylesheet** (**D-047 §1–2**). Every change to a checkbox is an event on that
  checkbox; a radio's *deselection* happens when a sibling is selected and fires
  nothing at all. So `RadioGroup` holds the value and `Radio` has no `checked`
  or `defaultChecked` — an option that could contradict its group is D-036's
  second source of truth, one tier on. And because React can only describe the
  state a group owns, **the stylesheet paints from `:checked` rather than from
  `data-state`** — a narrow, recorded deviation from RULES §4. `:checked` is not
  one of our private booleans; it is the platform's own state, and it is right
  for a bare radio and for anything the platform changes behind React's back.
  `data-state` is emitted for consumers when the group knows it and **omitted
  rather than guessed** when it does not. The state is read on the root with
  `:has()` — the library's first — because the dot is the input's *sibling*, and
  D-045 says a custom property is only a channel when one element is an ancestor
  of the other. Proven by the only test that can tell the two mechanisms apart:
  a bare radio. Swapping `:has()` for the attribute failed that one assertion
  and left the other seventeen correctly green
- **The spec picked a radio design on appearance, and one of the two is not
  available at AA** (**D-047 §3**). A `--pp-tone-solid` dot on the neutral
  surface — the border-only treatment §3.11 specified — is **1.87:1 in the light
  theme's `warning` tone**, against a 3:1 requirement, and no check in
  `lint:contrast` pairs a tone step with the surface, so nothing would have
  caught it. The box fills instead and the dot is `--pp-tone-on-solid`: the one
  mark-on-fill pairing the token layer already verifies at 4.5:1 in every hue and
  both themes, and the same one `Checkbox`'s mark uses
- **A stale dev server made three break-it results garbage, and it looked like a
  component bug** (**D-047 §5**). A `next start` left over from the previous
  cycle kept serving HTML pointing at a chunk the new build had deleted, so the
  page loaded with **no stylesheet at all** — every computed colour came back
  transparent or black, and one run "failed" a `Checkbox` test this build never
  touched. Two rules, both extending D-037 §4 and D-044 §5: **a served-CSS check
  must be verified in both directions before it is trusted** (two of the patterns
  used here matched in the broken and the unbroken build — one because the
  minifier strips the quotes from `[data-state="checked"]`), and **let the test
  runner own the server**, because a hand-started one that survives a rebuild is
  not a stale stylesheet, it is no stylesheet
- **Seventh test that could not fail, and an inert guard beside it** (D-047
  §4–5). The pointer test clicked the centre of an *unselected* radio, where the
  dot is `scale(0)` and has a zero-sized box, so nothing could intercept the
  pointer and deleting `pointer-events: none` left it green; it now clicks a
  *selected* one and asserts focus, because clicking an already-selected radio
  is a no-op by design and the dot is a `<span>` that cannot take focus. The
  change handler's `if (event.target.checked)` guarded nothing — the platform
  fires `change` only for the radio being selected — and went under D-037 §5.
  Sixteen breaks in total, fourteen failing on exactly the test named for them
- **A sweep on 2026-09-18 found two shipped defects and five false claims, all of
  them prose disagreeing with code** (**D-045**, **D-046**). The checkbox-row
  pointer was promised in four places and set nowhere, and could not have
  reached the label from where it was promised — a custom property inherits
  downward and the label is the control's sibling — so a horizontal `Field`
  now sets `--pp-label-cursor` on itself. `Scroller` `both` shaded one axis; it
  now measures both and reports the inline axis as `data-overflow-inline`. The
  Definition of Done gained one line: a claim about another component's
  behaviour is asserted or linked, never restated
- **A private custom property is not private, and `Icon`'s `--_size` beat
  `Checkbox`'s** (**D-044 §1**). The indicator carries `.pp-icon` as well as
  `.pp-checkbox__indicator`, and `Icon.css` declares `--_size: 1em` on that very
  element — correctly, under D-024's always-emit rule. So reading
  `var(--_size)` down there resolved to Icon's value and an `lg` checkbox drew a
  16px mark in a 24px box, which on the page looks like a design choice. The
  leading underscore is a naming convention; CSS has no component scope. **The
  other half of D-024: emit your private properties on your own root, and
  resolve them there too** — a custom property is substituted where it is
  declared, so resolving on the root and letting the result inherit reads your
  own value by construction. `Radio`, `Switch` and `Select` all render another
  component's root as one of their parts and will all hit this
- **React restores `checked` for a controlled input; nothing restores
  `indeterminate`** (D-044 §2). A click clears the DOM property, and a parent
  that ignores `onCheckedChange` never re-renders, so the effect does not run
  either — the third state gone on the first click, in the component that exists
  to hold it. Re-asserted at the end of the change handler, where React's
  batching makes the render-time value the correct one to write
- **Borrowing a precedent is not sharing its cause** (D-044 §3). `flex-shrink: 0`
  was copied from `Icon` and was inert: a flex item's automatic minimum size is
  its content's, and this content is an `<input>` with a definite `inline-size`,
  where Icon's is an SVG at `100%` that contributes nothing to min-content. The
  declaration went (D-037 §5) and so did the test beside it, which could not
  fail — the first draft of its demo used a **wrapping** `Cluster`, making it a
  squeeze test with no squeeze in it
- **A scale exists to stop people inventing values, and this is the case where
  the value genuinely is not on it** (**D-043 §1**). A one-row `Textarea` should
  be exactly an `Input`'s height — D-028's agreement, on the axis D-028 never
  had to think about, because every control before this one declared a fixed
  height. The padding that produces it is `(height − line box − borders) / 2` =
  **3.8 / 7.8 / 10.2px**, and nothing on the space scale is within 1.8px of the
  third: `lg` would be 4.4px short or 3.6px over. So it is a `calc()` over the
  same tokens `Input` reads — no hardcoded length, no new token, and the
  agreement is structural rather than a number someone eyeballed once
- **`rows` is the floor because the measurement resets first, not because
  anything enforces it** (D-043 §2). `autoResize` writes `block-size: auto`,
  reads `scrollHeight`, writes it back, and both halves of the claim fall out of
  the reset: `scrollHeight` is max(content, client), so measuring against a
  height the component wrote itself could only ratchet upward — and with no
  height of its own the element falls back to `rows`, so there is no minimum
  stored anywhere to drift from the attribute
- **Fifth break-it check, and the first that found nothing** (D-043 §5). Five
  unit tests and four browser assertions were broken on purpose and each failed
  on exactly the test named for it — including the padding calc, which failed by
  8.39px at `sm`, the precise 4.2px-per-side error the arithmetic predicts, with
  the broken value confirmed in the **served** stylesheet first (D-037 §4). The
  check earning its place four times and then coming up empty once is what a
  working practice looks like, not a reason to stop running it
- **`Input` shipped in `v0.2.0` with no visual baseline, and `main` went red
  over it** (**D-042**). D-041 gave the registry/`PAGES` drift a test and still
  did not land the file: PR #9 merged three seconds before its own visual job
  started, and the authored `input.png` was pushed to the branch two minutes
  after that branch stopped mattering. Every later push to `main` re-authored it
  and had the push rejected — `GH006 … Changes must be made through a pull
  request` — which is **D-038's shape a second time**: everything upstream
  green, an Actions write vetoed by policy at the very last step. Twice is a
  pattern: *a CI step that writes to the repository is a step policy can veto,
  and it looks like a working pipeline until someone reads the last line of a
  job that mostly passed.* The baseline now lands through a PR, where its
  presence makes CI **compare** it rather than author it — the verification
  D-013 asks for and an authoring run cannot give. Authoring is gated to
  `pull_request` events, and `main` now fails naming the missing file instead of
  attempting a push it is forbidden to make. **The root cause is not in the
  repository:** `main` has no required status checks, so nothing stops a merge
  that lands before any check reports. Requiring them was **considered and
  declined** — a `GITHUB_TOKEN` push starts no workflow run, so an authoring
  commit would become a head SHA the required checks never report on and block
  its own PR, once per new component, 68 components ahead of us. **The
  `main`-side guard is therefore the mitigation, not a spare one:** delete it as
  redundant and this failure goes back to being silent
- **A test that two lists agree is not a test that the artifact exists**
  (D-042). `tests/unit/playground-registry.test.ts` passed correctly at every
  moment of the failure above, while the baseline it was written to protect was
  absent from `main`
- **A form control does not fill, and RULES §1 says it does** (**D-040 §1**).
  The rule's argument against `width: 100%` is that a block element with no
  width declaration "already fills its parent … in every layout context". True
  of a `<div>`; false of every control in this tier. Measured inside a 600px
  parent: `<input>` **185px**, `<textarea>` **182px**, `<select>` **52px**, a
  `<p>` 600px. As a grid item every one of them is 600px; as a flex item the
  input is still 185px, because a flex item needs `flex-grow`. So every 3C
  component has a `display: grid` root and the control stretches into it —
  **no width is declared anywhere**, so the rule is satisfied rather than bent.
  `Input` and `Textarea` were specified as single-element components and are not
- **A state declaration goes on the root, never on a descendant selector**
  (D-040 §3). `.pp-input[data-invalid] .pp-input__control` is 0-3-0 and outranks
  `.pp-input__control:focus-visible` at 0-2-0, so focus never shifted the border
  on an invalid control and `--pp-tone-focus` reached valid controls only —
  silently undoing half of D-039 §4. On the root the property inherits down and
  the control's own pseudo-class wins for that element. Inheritance, not a
  specificity race
- **Fourth test that could not fail** (D-040 §3). Both focus assertions compared
  a *valid* control against an *invalid* one and called the difference the focus
  shift — but those differ because of `data-invalid`, so deleting the focus rule
  outright left all seven green. It is no longer evidence about those tests:
  **a test's value is established by watching it fail, and a suite where that
  has never been done is unmeasured**
- **A subtractive type over a union with a string escape hatch subtracts
  nothing** (D-040 §2). `Exclude<HTMLInputTypeAttribute, 'checkbox' | …>` bans
  nothing, because React's union ends in `(string & {})` and `'checkbox'` is
  assignable to it. `Input`'s `type` is an explicit allow-list
- **The one precedence rule, in all six:** an explicit prop beats the field,
  which beats the default — for `size`, `required`, `disabled` and `invalid`
  alike, including `disabled={false}` inside a disabled `Field`. "Explicit wins"
  is a rule you can hold in your head; "explicit wins except for disabled" is one
  you have to look up
- **What D-039 settled that outlives 3C:** the root is the box and the control is
  the element (so `ref` and rest props go to the `<input>`, `className` and
  `style` to the wrapper); the native input is the painted control, never a
  hidden input behind a `div role="checkbox"`; and the mark is an inline `Icon`
  rather than a CSS asset — the first ruling proposed a `mask-image` data URI
  plus a lint rule to police it, and **a ruling that needs a new lint rule to be
  safe is evidence the mechanism is wrong**
- **0.8 is `done`, and was `blocked` for one day after five silent failures**
  (**D-038**). The `Release` workflow had failed on every merge to `main` since
  Tier 0 without anyone looking, always at the last step: the repository policy
  forbade Actions from opening the version PR. Everything upstream succeeded
  every time, so a failing release looked like a working one. Fixed by flipping
  `can_approve_pull_request_reviews`, and **proven end to end the same day**:
  PR #6 merged, `Tag release` ran for the first time instead of being skipped,
  and the library has its first release — **`v0.1.0` tagged on origin**,
  `CHANGELOG.md` on `main`, `0.0.0` → `0.1.0`, all 27 changesets consumed.
  The tag was read from `git ls-remote` rather than inferred from a green step,
  because **a step succeeding and an artifact existing are different claims** —
  mistaking one for the other is what cost five merges. The lesson generalises
  past linters (D-009): **infrastructure is `done` when it has been observed
  producing its artifact, not when its config file exists**
- **What `Field` settled for all of 3C:** controls read their wiring from
  context and are never cloned (D-036, extending D-033 one tier on); `error` is
  the invalid state, with no `invalid` prop to contradict it and `''` counting
  as valid because that is what form libraries hand you; `aria-describedby` is
  built from what actually rendered, because a token pointing at a missing
  element is ignored silently and so fails invisibly in testing and totally in
  use; `field.size` is deliberately absent from the spreadable control props,
  since spreading it onto a native `<input>` sets the HTML `size` attribute —
  a control sizing itself, in the one place RULES §1 would never look
- **A render prop cannot cross the server/client boundary** (D-037 §2).
  `Field`'s escape hatch for controls the library does not own is therefore
  client-only: a Server Component passing `children` as a function fails the
  Next.js build outright. Passing an *element* works from anywhere, which is one
  more reason 3C's controls read context instead of being handed props
- **A failing `tsc` silently serves a stale stylesheet** (D-037 §4).
  `npm run build` is `build:js && build:css`, so a type error leaves
  `dist/pixel-perfect.css` untouched and the playground serves the previous CSS
  — and two break-it checks concluded a test was worthless when the break had
  never shipped. **Every browser check from here on proves the break is in the
  served CSS first.** Grep the served file, not `dist/`: lightningcss does not
  minify and Next.js does, so a pattern that assumes one reports zero for the
  other
- **Two CSS declarations were lying about being load-bearing** (D-037 §5).
  `Field`'s horizontal grid explicitly placed the control and the label;
  removing both changed nothing, because source order plus pinning the
  description and error to column 2 produces the identical grid. Deleted. A
  declaration that can be removed with no observable effect is a claim of a
  dependency that does not exist
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
- **Done:** 40 / 78 tracked items (10 foundations + 68 components) — 9
  foundations + 31 components. The one foundation not `done` is 0.10 docs site,
  deferred and not blocking

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
| 0.6 | Visual regression (Playwright screenshots) | `done` | 0.4 | `npm run test:visual`. Baselines authored by CI only (D-013), on a PR branch only (D-042). Functional harness assertions run anywhere |
| 0.7 | **Rule lint** — fail on banned CSS/props | `done` | 0.3 | `npm run lint`: stylelint + source rules + contrast + a self-test proving every rule still fires |
| 0.8 | Changesets + release pipeline | `done` | 0.1 | Proven end to end 2026-09-18 after five silent failures (D-038): **`v0.1.0` tagged**, `CHANGELOG.md` on `main`, 27 changesets consumed. npm publish stays opt-in via `PUBLISH_TO_NPM`. See `docs/RELEASING.md` |
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
| **3C — Native inputs** | 3.8–3.13 | [`tier-3c-inputs.md`](docs/specs/tier-3c-inputs.md) — **approved** 2026-09-18 (D-039). Implementing in order |
| **3D — Composite inputs** | 3.14–3.16 | one gate |

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
| 3.13 | `Select` | `spec` | fill | client | 3.7 | **Native `<select>` first.** Custom listbox is 4.11 |
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
