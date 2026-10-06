# Roadmap history

What `ROADMAP.md`'s **Current state** block said while the roadmap was worked,
moved here verbatim on 2026-10-06, when it had grown to 846 lines — longer than
anything meant to be read first can be (D-106 §2). Each bullet names the
decision entry that holds its ruling: this file is the narrative,
[`DECISIONS.md`](DECISIONS.md) the record, and
[`DECISIONS-INDEX.md`](DECISIONS-INDEX.md) the way into it. Links below were
written relative to the repository root, where the block used to live.

New history is appended under a new dated heading, newest first, when a
Current state paragraph stops being current.

## As of 2026-09-29: every component built, Tier 6 in review, 73 / 81 done

- **In flight: 6.1 `ThemeProvider`, 6.2 `ThemeToggle` and 6.3 `AppShell`
  (all `review`, 2026-09-29)** — written and built under the standing
  delegation (D-069 §1), every box but the CI-authored baseline checked,
  which does not hold the limit (D-069 §2). 6.3 is the frame: slots for
  the header, sidebar and footer and `children` as the `<main>`, the skip
  link built in, `Split` as the middle row, filling the parent's block
  size and never the viewport's (D-096). **6.5 `PageHeader` is in
  `review`** (D-097): four parts and the consumer's Breadcrumb in one
  flex row that wraps, the description read after the title and painted
  after the actions. **6.6 `Toolbar` is in `review`** (D-098):
  one tab stop over the controls found in its subtree, a text field never
  the stop. **6.4 `NavSidebar` is in `review`** (D-099), the last
  component of the roadmap: plain links in a named nav, a closed group's
  list `hidden` by its own rule. **6.7 `KeyHints` is in `review`**
  (D-100), the parked idea of D-069 §3 as three gestures that reveal and
  accelerate rather than a modifier that changes the components. Every
  component of every tier is built. The batch's first authoring run was
  red for none of them (**D-101**): the code-block baseline was stale by
  D-093 §1's own change on CI's insecure origin and is re-baselined, and
  two reads inside a window are waited out. What remains is the authoring
  run, the `review` → `done` sweep of Tier 6, and 0.10.
  6.2 is the control over 6.1: a square button whose two faces are both
  in the DOM and one of which the stylesheet displays from the document's
  theme, so it is right before React is (D-095). The library
  now owns what the playground's chrome did since D-063: an inline script
  ahead of the page for the first paint, `system` as no attribute, the
  choice under `pp-theme`. Findings in **D-094**: RULES §5 bans `theme` as
  a prop name, so the props are RULES §5.5's `value` / `defaultValue` /
  `onValueChange` (§1); the attribute is written from state only after the
  stored choice has been read into it, or the mount would erase the
  script's work for a frame (§2); Next minifies the serialised script to
  `function f(a,b,c)`, which the ES5 body survives (§4). **Tiers 4 and 5
  are `done`** (2026-09-29,
  **D-093 §6**): the twenty-two items built under the standing delegation
  — 4.5–4.14, 5.1 and 5.3–5.13 — each had every Definition of Done box
  checked but the CI-authored baseline, and their baselines were authored
  on the PR branch and compared green twice, on run 175 (the PR's final
  head) and run 176 (`main` after the merge, where no baseline differed).
  Done count 51 → **73 / 80**, **73 / 81** once 6.7 was added (D-100 §1);
  what remains is Tier 6 and 0.10
- **Run 176 was red anyway, and none of it was a pixel** (**D-093**). One
  harness self-check failed twice and four tests passed on their retry,
  the first time any of them had. Every one was a read taken inside a
  window the page had not left: `CodeBlock` rendered its copy button only
  where `navigator.clipboard` existed, which Node lacks and the browser
  has, so every server-rendered block hydrated against different HTML and
  React re-rendered the page under the test (§1 — error #418, found by a
  crawl of all 65 pages, and the one real defect); the theme self-check
  read a colour inside the frame that started its one-frame
  reduced-motion transition and got the light colour spelled in `oklab`
  (§2); the Scroller's RTL positions were read inside the same kind of
  frame, which a synchronous rewrite of the test then failed every time
  (§4); an Escape landed between a second dialog mounting and Radix
  telling the first it was no longer topmost, and closed both (§3); and a
  DatePicker control read as unfocused two reads after it was focused,
  which no probe reproduced (§5). The button now renders whenever `copy`
  is and checks the clipboard when pressed, as its spec said all along;
  the suite has a `settled` helper — two frames — for a computed style
  read after the change that caused it; the playground marks `<html>` as
  hydrated from an effect after the page's, and the suite's `test` waits
  for it after every navigation; the unexplained read is polled. Three
  mechanisms and one open question, none of them "flaky"
- **CI's authoring commit records what it authors** (**D-092**). Run 174
  was a PR run on the authoring commit for 4.13, and `npm test` was red on
  it: four baselines with no manifest entry against the guard's limit of
  three, the shape of every authoring commit that adds a page, because the
  recording step was local and came after the pull. The `visual` job now
  runs `npm run dimensions` before it commits, so the manifest lands with
  the files at the runner's geometry and an authoring commit is green on
  its own; the `/component` build box says to pull that commit, not to
  record after it
- **The playground shows one theme at a time, and the index is a page**
  (**D-063**). The Matrix rendered every subtree six times, three widths in
  each of two theme columns; it now renders three, in the theme a switcher in
  the page chrome set on `<html>` — the way an app is themed (D-010). The
  screenshot suite captures every page twice instead, one per theme, and the
  browser assertions that compared columns switch explicitly. Every baseline
  is re-authored; the dimensions manifest is recorded from the authored set
  afterwards, so one CI run in between fails its unguarded count by design
  (§3). The home page groups the components by tier with a summary each, and
  every component page carries a way back and its neighbours
- **A safety net that hid the wire** (**D-060 §1**). `RangeSlider`'s spec
  promised the assertion its thumb-placement formula is for: press the visible
  thumb, drag, and the value that moves must be that thumb's. Written that way
  it passed, and the break would not have failed it — if our thumb drifts off
  the native one, or the native thumb takes no pointer events, the press lands
  on bare track and the root's own routing moves the nearer thumb to the
  pressed value: the same thumb, the same place. The test now hit-tests
  `elementFromPoint` at each thumb's centre before it drags. A mechanism that
  degrades gracefully needs a test that can see the degradation, or the
  graceful part is what gets tested. Same entry: the stacking rule the spec
  wrote for a coincident pair is applied to the pair's midpoint, because native
  thumbs overlap at any two values within a thumb's width (§2)
- **A claim about inheritance that no test had ever run** (**D-059**). `Alert`
  said its tone "inherits into" the `Button`s and `Link`s inside it — in the
  source, the stylesheet, the spec, the docs, this file and the 0.7.0
  changelog. It does not: both write their own `data-pp-tone` from a default,
  and the nearest context wins. Launchpad found it with a grey "Try again" on a
  red alert. The `solid` rejection it propped up survives re-measurement (step
  11 sits at one lightness in every hue); a test now pins the real behaviour.
  Same entry: `live="polite"` was documented for exactly the mount-on-demand
  case its own paragraph called unreliable, and "set the tone" on the checkable
  three now says *where*
- **A border's surfaces are neutral; a ring's are not** (**D-056 §2**). The
  generator solved the focus ring against neutral's step 1 while `edge` three
  lines below it solved against steps 1, 2 and 3 — and `solveEdge`'s comment
  says why its own set is neutral-only: "a danger-toned input sits on the page,
  not on a red one." True of a border, which sits between a control and the
  page. False of a ring, which is drawn on whatever the focused thing is
  sitting on, and since `Alert` that can be a red one. Worst pairing in the
  library **2.54 → 3.06**; 242 assertions → **293**
- **A gallery that drew every step except the ones with an obligation**
  (**D-056 §4**). `/tokens` renders steps 1-12 and `on-solid`, so `focus`,
  `edge` and `edge-strong` — the only three carrying an explicit WCAG target,
  and the only three deliberately off-ramp — were drawn by nothing, above prose
  saying "the focus ring are solved for their contrast targets". A change to any
  of them moved **zero pixels in 37 screenshots**. 0.11's own failure mode one
  layer up: a value nothing looked at
- **`outline-width` is not the property that says a ring is drawn** (**D-054
  §1**). Two assertions in `NumberInput` and `Slider` read it on an *unfocused*
  control and expected `0px`. Chromium reports the **specified** width —
  `medium`, `3px` — for an element whose `outline-style` is `none`, and whether
  it does depends on the build: this container says `0px`, the runner says
  `3px`, with nothing different about the component. They fail on `main` too.
  `outline-style` is the property that answers "is there a line". The same trap
  was caught in `Alert`'s own ring assertion three hours earlier (D-053 §5) and
  the generalisation was not made then
- **A guard whose manifest cannot be regenerated by a command stops being
  regenerated** (**D-054 §2**). `screenshot-dimensions` fails at three
  unrecorded baselines; `number-input.png` and `slider.png` shipped unrecorded
  with 3D and `alert.png` made three. The guard was right and there was nothing
  to update the manifest *with* — D-050 §5 said "regenerate deliberately" and
  meant hand-edited JSON. `npm run dimensions` is that missing half, and it adds
  missing entries only: overwriting one is how a guard is made to bless the
  drift it exists to catch
- **How Tiers 4 and 5 were built** (2026-09-28, closed 2026-09-29 above):
  4.5 `AlertDialog`, 4.6 `Drawer`, 4.7 `DropdownMenu`, 4.8 `ContextMenu`,
  4.9 `Tabs`, 4.10 `Accordion`, 4.11 `Combobox`, 4.12 `Toast` and 4.14
  `CommandPalette` sat in `review` together, waiting only on their
  CI-authored baselines (D-069 §2): the whole of Tier 4 but 4.13, which
  waited on 5.9. Under the standing delegation of D-069 §1 the rest of
  Tier 4 was built in sequence, one in `build` at a time, each moved to
  `review` with every box but the baseline checked, and one authoring run
  at the end of the PR closed them together. 4.5 is `Dialog` with two
  rules changed (D-070); 4.6 is `Dialog` placed at an edge, on the same
  package, with the anchored axis a token (D-071 §1, §2). Building 4.6
  found that Radix's scroll lock strips a padded `<body>` of its gutter
  while any modal is open, shifting the page (D-071 §6): the playground
  pads a wrapper now, and the gap is documented on the Dialog page. 4.7 is
  the tier's first list of commands: Radix's menu with the direction read
  from the trigger at open time, `align` starting, and a gutter only where
  a mark can appear (D-072). 4.8 is that list opened at the pointer, its
  twelve shared parts built once by an internal factory and drawn by 4.7's
  stylesheet, with no CSS of its own (D-073). 4.9 is the tier's first
  non-overlay: a hairline, a bar on it, a strip that scrolls, and the
  page's direction as the component's (D-074). 4.10 is the second: headings
  on hairlines, `multiple` as a boolean, the heading level asked once
  (D-075). 4.11 is the tier's largest and the one whose behaviour is the
  library's own — Popover's anchor, the menu's stylesheet, Input's box,
  and a keyboard model written here; the consumer renders the matches
  (D-076). 4.12 is the region and the imperative API the roadmap promised,
  an `Alert` that floats (D-077). 4.14 closes the tier, made of it with no
  package added (D-078). 4.13 `DatePicker` waits on 5.9 `Calendar`. **Tier 5
  is under way**: 5.1 `Card` is in `review` (2026-09-28, D-079), the first
  Server Component compound, its parts named exports like every other's;
  5.3 `Progress` is in `review` (D-080), the determinate half of Spinner;
  5.4 `Table` is in `review` (D-081), the tier's data component; 5.5
  `Pagination` is in `review` (D-082), compact by its container; 5.6
  `Breadcrumb` is in `review` (D-083); 5.7 `Stepper` is in `review`
  (D-084); 5.8 `EmptyState` is in `review` (D-085); 5.9 `Calendar` is in
  `review` (D-086), which unblocks 4.13 `DatePicker`; 5.10 `FileUpload` is
  in `review` (D-087); 5.11 `Tree` is in `review` (D-088); 5.12
  `CodeBlock` is in `review` (D-089); 5.13 `AvatarGroup` is in `review`
  (D-090), the last of the tier's own items; and **4.13 `DatePicker` is in
  `review`** (D-091), which closes Tier 4 — every item of Tiers 4 and 5 is
  built; the batch's authoring run and the `review` → `done` sweep are the
  bullet above (D-093 §6). **4.4 `Dialog` is `done`** (2026-09-27): built
  the day its spec was approved by delegation (D-067, the shape of D-057,
  D-061 and D-064), its baselines CI-authored on the PR branch and compared
  green on run 139 (D-013). Next up is **4.5 `AlertDialog`**, which is this
  component with two rules changed: no close on a scrim press, and focus on
  the least destructive button. Findings in **D-068**: a hug panel is as wide as
  its content asks, not as wide as its ceiling — a short form is 26rem, a
  paragraph reaches 40rem (§1); `min-inline-size: 0` lets the panel shrink
  and `overflow-wrap: anywhere` is what makes an unbreakable string wrap
  inside it, and the spec had named only the first (§2); an explicit
  `aria-labelledby={undefined}` spread after Radix's own erased every
  titled dialog's name, which axe caught (§3); and a page a dialog hides is
  a page a role locator cannot see, in Testing Library and in Playwright
  (§4). Everything §11 promised held (§5): containment holds the scrim to
  the cell, a page under three locks still has a height, Radix drops a
  trigger-less dialog's focus to the body, the RTL scrollbar compensation
  is on the wrong side by source and unmeasurable in headless Chromium, a
  popover from inside is neither hidden nor below the scrim, axe passes with
  no rule disabled, and the Radix dialog chunk is referenced by no other
  page. 26 unit and 14 browser assertions; six browser breaks and two unit
  breaks, each caught by its named test, in two rounds because the first
  combined run was a wash (§7).
  [`Dialog.md`](docs/specs/Dialog.md) went to Gate C with eight open
  questions and a recommendation on each. The first modal, which 4.5, 4.6 and 4.14
  gate on, and the first component that takes the page away from the user —
  scroll lock, `aria-hidden` on the rest, a focus trap — so each is decided
  in the spec rather than inherited. What it asks for: modal only, no
  `modal` prop (§2); the scrim is Radix's `Overlay` rendered by `Content`
  and is the panel's *parent*, positioner and scroll container in one,
  centred by a grid because the logical spelling of the usual `translate`
  centring lands a full panel off centre in RTL (§4); `position: fixed;
  inset: 0` on the scrim as the other half of D-061 §3's exception (§4);
  the ceiling is `--pp-measure-sm` and there is no `size` (§3); no
  automatic close button (§5); `aria-modal="true"` written by us, since
  Radix relies on its `aria-hidden` sweep alone (§6); and the one change to
  Radix's behaviour — a dialog opened with no trigger returns focus to the
  element that had it, where Radix drops it to `<body>` (read in the 1.1.23
  source, §7). The gallery portals a `defaultOpen` dialog into a
  `contain: layout` box in each Matrix cell, so a cell is a viewport and the
  three widths show the shrink a real viewport gets (§10); two assumptions
  behind that are named for the build (§11). Next up after it: 4.5
  `AlertDialog`, which is this component with two rules changed
- **4.3 `Tooltip` is `done`** (2026-09-27): built
  the day its spec was approved by delegation (D-064, the shape of D-057
  and D-061), its baselines CI-authored on the PR branch and compared green
  on run 132 (D-013). The first component to build on 4.1 alone. The
  three assumptions the spec named were checked first and all held (D-065
  §6): a disabled trigger opens in Chromium, three `defaultOpen` tooltips
  coexist, `instant-open` skips the entry animation. Findings in **D-065**:
  Testing Library's async wrapper waits on a real `setTimeout(0)` and
  advances only Jest's fake timers past it, so vitest's need
  `shouldAdvanceTime` (§1); `--pp-color-text` is not redefined on the
  panel, because `Kbd` paints it on the page's surface (§2); a scroll event
  lands one frame after the scroll and closes what focus just opened (§3);
  and an outside button that *flips* a controlled overlay re-opens it, so
  the demo's buttons say a state (§4). Fifteen browser assertions, 27 unit;
  five browser breaks and one unit break, each caught by its named test
  (§7). The Radix tooltip chunk is referenced by no other page's payload.
  **Then the visual job went red on a re-run, and the cause was CI's**
  (**D-066**): its "changed" classification read `git status`, which
  cannot see a mismatch — Playwright writes diffs to `test-results/`, never
  over a baseline — so it had been `false` on every run ever, and run 128
  authored Tooltip's baselines over a real 19px change to the index page
  (one card per registry entry, D-063 §4). CI now reads the `-diff.png`
  Playwright writes; the index baseline records the registry count it was
  authored with and `npm test` fails when the registry has moved on; and
  `npm run dimensions -- --rebaseline index` is the deliberate re-baseline
  as one command, which the `/component` build step now requires with the
  registry entry. The RTL side tests' flake (a box read before placement)
  is closed for Popover and Tooltip alike (§3).
  [`Tooltip.md`](docs/specs/Tooltip.md) keeps the tier's shape (`Tooltip`,
  `TooltipTrigger`, `TooltipContent`, named exports per D-062 §1) and adds
  an optional `TooltipProvider` with a fallback, so one tooltip needs no
  setup and a toolbar gets Radix's skip delay by wrapping once. It asks for
  two Tier 0.2 tokens, `--pp-color-bg-inverse` and `--pp-color-text-inverse`
  — the body-text pair reversed, asserted under their own names — because a
  `--pp-tone-solid` label is a mid grey that reads as a disabled control. It
  keeps Radix's `closed | delayed-open | instant-open` as an extension of
  RULES §4, since `instant-open` is the fact that stops a toolbar's tooltips
  re-animating; wires the tooltip as a description (`aria-describedby`),
  never a name, and accepts an `IconButton`'s repeated label being read
  twice; does not expose `disableHoverableContent`, the one switch whose
  only effect is to fail WCAG 1.4.13; and settles the arrow `Popover` §8
  deferred here: none. Six open questions, each with a recommendation.
  `@radix-ui/react-tooltip` is added with the spec so the lockfiles land
  with it
- **4.1 Overlay foundation and 4.2 `Popover` are
  `done`** (2026-09-26): built the same day, their baselines CI-authored on
  the PR branch and compared green (run 123, D-013). Next up is **4.3
  `Tooltip`**, the first component to build on 4.1 alone. Both were approved
  by delegation (D-061) — 4.2's spec written after the
  delegation was given, so its decisions are listed in the PR for reversal
  before merge. Built together, 4.1 tested through 4.2 (4.1 §9); findings in
  **D-062**, three of which corrected the specs: the parts are named exports
  because React forbids dotting into a client module from a Server Component
  (§1); a modal popover closes on an outside press and swallows it (§4); and
  the reset's reduced-motion crush does not reach an animation declared in
  `pp.components`, so each overlay carries its own rule (§5). Tier 4 is
  **Radix Primitives**, decided (D-061 §1). 4.1 is the first foundation
  with a spec document, because its choices are the dependency and the
  vocabulary every Tier 4 component inherits. It measures
  Radix against Base UI and against the platform (`<dialog>`, `popover`, CSS
  anchor positioning: 25 of 35 target browsers) and recommends Radix, on
  vocabulary as much as stability: `asChild` and `data-state` / `data-side` /
  `data-align` are Radix's names and already RULES §4's. It also names the
  problem the roadmap row did not: a portal leaves the `[data-pp-theme]`
  subtree, so the theme must be carried across and the tone must not. The
  4.2 spec adds the tier's sizing exception (D-061 §3): an overlay has no
  parent in flow, so it takes its ceiling from a new `--pp-measure-xs`.
  **3.17 `RangeSlider` is `done`** (2026-09-26):
  built the day Gate A opened, its baseline CI-authored on the PR branch and
  compared green on the re-run (D-013), and the last box closed the same day
  once the dimensions guard — tripped at its limit by that baseline plus two
  older unrecorded ones (D-060 §7) — had all three recorded. **Tier 3 is
  complete.** Next up is **4.1 Overlay foundation**, which both 3.16 and
  3.17 gated; it is the first Tier 4 item and the first to take a runtime
  dependency (RULES §8). Its spec was approved by delegation (D-057) and
  D-058's addendum checked the two browser assumptions the build depends on
  before it began; both held again in the browser suite (D-060). Twelve browser
  assertions, five browser breaks and one unit break, each failing on the test
  named for it. **3.16 `Form` is `done`**
  (2026-09-26): built 2026-09-22 (D-058), it
  sat in `review` for one box only — the screenshot baseline, which CI authored
  on the PR branch and then compared green on `main` in runs 109 and 111 after
  the merge, which is the half of D-013 that "authored" does not cover. Nothing
  in the component changed between `review` and `done`. Next up after
  `RangeSlider` is **Tier 4.1**, the overlay foundation, which unlocks once
  both are `done`. Before these: **0.11 is `done`** (D-056) and **5.2 `Alert`
  is `done`** (D-053), the first component of Tier 5. **0.11** is not a
  blocker: the focus ring below
- **The focus ring has only ever been verified against the page, and Alert is
  the first component to put a focusable control somewhere else** (Alert spec
  §9, open question 2). `--pp-color-focus-ring` is one colour library-wide
  (D-029) and `lint:contrast` asserts exactly one pairing for it — 3.06:1
  against `neutral-1`. Measured at the gate against the surfaces that actually
  exist: **2.94 light / 2.85 dark on `neutral-2`** (`--pp-color-bg-surface`,
  already shipping) and **2.74–2.77 light / 2.54–2.57 dark on a tinted step 3**,
  against 1.4.11's 3:1. `Button.css`'s header already said the five
  `--pp-tone-focus` values "are asserted against nothing"; the half nobody
  measured is that the ring that *is* asserted is asserted against one
  background out of three. Not fixable inside a component: a second ring colour
  in `.pp-alert` is the one thing D-029 exists to prevent.
  **D-048 §2's shape, found before the build rather than after it** — and
  unlike D-048 §2 it is on the roadmap rather than only in prose: **0.11**,
  with the two missing `check-contrast.mjs` pairings landing beside the token
  change so the fix and the assertion arrive together (the D-050 pattern).
  **The sizing of that item was wrong and D-055 corrects it**: this bullet said
  the ring's value was identical in both themes and that the fix needed a
  per-theme or two-tone ring plus a re-baseline. It has been per theme since
  0.2, and solving both against steps 1-3 is the whole of it
- **Every pairing `Alert` itself introduces was computed at the gate and every
  one is already asserted** (spec §9) — title 14.02–14.35 / 12.76–12.98, body
  and dismiss glyph 4.59 in both themes, edge 3.04–3.08 against its own fill and
  3.40 / 3.66 against the page. The fill is `--pp-tone-bg` (step 3) rather than
  `--pp-tone-surface` (step 2) *because* step 3 is the step the existing checks
  are named after. This is what D-048 §1 asked for after `Switch` failed it
  twice, and the first spec to arrive at the gate with the table already filled
  in
- **A variant table was rejected on measurement, not on taste** (spec §1). An
  `Alert` is the only component whose children are arbitrary. A `solid`
  variant puts them on step 9, where `--pp-tone-text` is **1.04–1.16:1** in
  light — not low contrast, invisible. (This bullet first said the tone
  context inherits into a caller's `Button`s and `Link`s; it does not, and the
  rejection holds anyway — **D-059**.) `plain` is 1.10–1.12:1 against the page,
  which is not a block at all. One treatment ships
- **A layout whose parts are optional wants a container that spaces items, not
  one that reserves tracks** (**D-053 §3**). The spec drew a three-column grid.
  Built that way, an alert with **no icon** starts 12px in from its own padding
  edge — one `--pp-alert-gap`, paid for the empty track it left behind, because
  a grid gaps between *tracks* and whether anything is in them is not part of
  the question. The root is flex. Measured both ways, and the alert that does
  have an icon is inset by exactly the icon plus the gap, which is what says the
  measurement is reading the right thing rather than reading zero for a
  different reason
- **`min-inline-size: 0` sizes the box and nothing else** (**D-053 §4**). The
  browser suite's box measurement passed on its first run while the playground
  harness flagged four of six cells: the alert's own *edges* stayed inside its
  parent and the *glyphs* of an unbreakable URL went on painting past them. Two
  separate guarantees the spec had treated as one. `overflow-wrap: anywhere` is
  what makes it true — `anywhere` rather than `break-word` because it also
  shrinks the min-content size. `Badge` and `Button` do the opposite and are
  right to: they hug their own content, and this one holds someone else's prose
- **An assertion pointed at the one hue where its two colours are the same**
  (**D-053 §5**). "The focus ring inside an alert is the one library-wide ring"
  took `.first()`, which is the page's `accent` alert — and `--pp-tone-focus`
  for `accent` **is** the value `--pp-color-focus-ring` resolves to. It compared
  a colour with itself, and giving the ring a tone left it green. D-048 §5 from
  the other side: **when an assertion says A equals B, ask what would make them
  differ.** Seventeen breaks in total, fifteen failing on exactly the test named
  for them — and the seventeenth is a declaration nothing observes,
  `min-inline-size: 0`, which the test now says out loud instead of implying a
  guarantee it does not carry
- **The gradient that was never written** (**D-052 §1**). Spec §8 expected the
  slider's fill to be a `linear-gradient` on the native track. That is
  *physical* — a range input reverses in RTL, so the fill would run from the
  wrong end — it would have to be written **twice** because the two engines'
  track pseudo-elements cannot share a selector list, and Firefox's
  `::-moz-range-progress` would be a third treatment of the same idea in one
  engine. The track and fill are two spans of ours instead, and the fill is a
  grid **column**: columns follow the inline axis, so RTL is right with nothing
  declared and the gradient is written **zero** times. The thumb is also centred
  with no negative margin — giving the native track box the thumb's own block
  size does what every recipe uses `margin-block-start: -Npx` for, which RULES
  §2 forbids outright
- **A duration crushed to almost zero is not the same as no transition**
  (**D-052 §3**). The focus-ring assertion failed with `:focus-visible`
  matching, `outline-style: solid` and `outline-width: 0px` — an impossible
  combination. `reset.css` crushes transitions under `prefers-reduced-motion` to
  `all 0.00001s` rather than removing them, and the Playwright config pins
  `reducedMotion: 'reduce'`, so a `getComputedStyle` in the same frame reads the
  **old** value. Measured 0px immediately and 2px fifty milliseconds later. It
  surfaced only because an unrelated `scrollIntoViewIfNeeded` moved the timing
  by a frame — which is what a latent flake looks like from outside. The four
  affected assertions are now `expect.poll`
- **A third assertion that could not fail, found by running the break**
  (**D-052 §4**). "The thumb is centred on the track it draws" compared the
  control's centre with the track span's — both ours, neither the thumb — and
  survived the deliberate break that drops the thumb off the line. **The thumb's
  box is not observable from script**: Chromium's
  `getComputedStyle(el, '::-webkit-slider-thumb')` returns the host element's
  metrics, and there is no PNG decoder in the tree for a pixel probe. The test
  was renamed and scoped to the half it can check. Three such assertions in two
  components — **the break check is not a formality**
- **`page.mouse` takes viewport coordinates and does not scroll** (D-052 §2).
  Two assertions reported the slider as inert; the clicks had landed 6,000px
  off-screen. `locator.click()` scrolls, the raw mouse API does not
- **The structure the previous component had already solved** (**D-051 §3**).
  Spec §9 claimed `NumberInput` *inverts* the control surface — steppers inside
  the box, therefore border, fill and radius on the wrapper and the ring drawn
  by `:has()`. Built that way it rendered **two concentric focus rings**:
  `reset.css` draws `:where(:focus-visible)` on the inner input too, and no unit
  test could see it because jsdom implements neither `:has()` nor that cascade.
  The only way to keep the structure was `outline-width: 0` — legal, because the
  ban covers the `outline` *shorthand*, which is **D-025's shape for the third
  time**. `Select` had already answered it: one grid cell, the control carrying
  the surface and reserving room at its end, the thing at the end placed over
  that room. §9's conclusion survived and its reasoning did not. **Check whether
  the last component solved it before deciding that this one is different**
- **A condition written as a list of exemptions was a claim** (**D-051 §2**).
  The spec derived `inputMode` as `Number.isInteger(step) && (min === undefined
  || min >= 0)`, which hands an *unbounded* integer field a numeric keypad — and
  an unbounded field accepts negatives, which that keypad has no key for. The
  paragraph above it makes exactly this argument about the decimal separator and
  does not apply it to the sign. "Unknown" and "known to be non-negative" are
  not the same case, and `||` had merged them
- **One score of one component defect to four test defects** (**D-051 §6**). The
  browser suite failed five of nine on its first run. Two of the four test bugs
  were assertions that could not fail: one read `borderTopColor` off an element
  with no border, one measured fill against `clientWidth`, which excludes a
  border and **keeps padding**, so the harness's own 12px read as a component
  filling 214 of 238. D-035 §3 says break it and watch the test fail; the mirror
  is **when a test fails, establish which of the two is wrong before changing
  either**
- **A browser assertion that cannot run is worse than none** (**D-051 §4**).
  Spec §8 promised the `Slider` vendor-pseudo-element guard would read the thumb
  "in both Chromium and Firefox projects". `playwright.config.ts` defines one
  project and the environment ships one browser, so it could never have run —
  and a test that silently does not exist reads exactly like one that passes. It
  becomes a **source rule** in `lint:rules` instead, landing with 3.15. Before a
  spec promises a guard, name the mechanism that runs it
- **One Definition of Done line is argued for rather than checked** (**D-051
  §5**). `role="spinbutton"` replaces the implicit `textbox` role, and §5 said
  the trade should be settled by a VoiceOver/NVDA walkthrough. No screen reader
  is available here, so it has not been. Recorded rather than ticked, because
  the difference between "checked" and "argued for" is the whole reason the
  checklist exists
- **Two open questions were settled from local sources, not from memory**
  (spec §Open questions). `w3.org` and MDN are both unreachable from this
  environment, so ARIA 1.2's relaxation of `aria-valuenow` for `spinbutton` was
  verified against **axe-core 4.13** (`allowedAttrs`, no `requiredAttrs`) and
  **aria-query 5.3** (`requiredProps {}`) — both of which still mark it
  *required* for `slider`, which is what shows the data is not simply thin. And
  lightningcss was measured passing all five vendor pseudo-elements through
- **A control's boundary is a solved token, not a ramp step** (**D-050 §1–2**).
  `--pp-color-border` was step 7 at **1.55:1** against the page in light, and it
  could not be fixed inside the ramp: a conforming neutral border lands at
  L 0.633, *below* step 8's fixed L 0.780, so putting it at position 7 inverts
  the ramp and trips the generator's own `assertMonotonic`. Two **off-ramp**
  solved steps join `-focus` instead — `-edge` (≥3:1) and `-edge-strong`
  (≥4.5:1), per hue, per theme — and the 1–8 ramp is untouched. The semantic
  names were re-pointed rather than joined by a fourth: `border` and
  `border-strong` now conform, `border-subtle` deliberately does not, and
  **RULES §3 says which is which**, because two tokens that sound alike where
  only one conforms make every future component a silent coin-flip
- **The check was written first and watched go red** (**D-050 §3**). The six
  missing border-vs-surface pairings report **1.40–2.04:1** against the steps
  `--pp-color-border` resolved to before the fix. 170 → 242 assertions. The new
  half worth knowing about: `check-contrast.mjs` only ever read
  `primitives.css`, and components read *semantic* names — so the **mapping is
  asserted by name too**, because re-pointing it back at a ramp step would
  otherwise leave every value assertion green while every control returned to
  1.55:1
- **Four decorative users were measured; only one opted out** (**D-050 §4**).
  `Spinner`'s track at 3.40:1 read as a ring rather than an arc, so it took the
  subtle step. `Badge`'s outline and `Kbd`'s keycap kept the new edge on
  purpose. **`Skeleton`'s "fix" was written and then rejected on sight**: it
  brought the dark sweep from 2.09:1 back to 1.46:1 and left the bars barely
  distinguishable from the surface, which is the exact problem the file's own
  comment already recorded. The right number, optimised against the wrong
  constraint — **a measurement is only useful once you have said what decision
  it is allowed to make**, and the way to tell is to build it and look. And
  **every disabled control dropped to `border-subtle`** — 1.4.11 exempts
  inactive components, and leaving them on the live edge erases the very
  difference D-048 §1 relied on. `Button` already did this and was the only one
- **A generated file claimed a guarantee nothing produced** (**D-050 §6**).
  `primitives.css`'s header said step 8 was "strong border and focus ring
  (>= 3:1 on step 1)". Step 8 is 1.97:1, and the focus ring had been moved to
  its own solved token *because* step 8 could not carry it — stated twelve lines
  above. The D-045 class, in the one place where the prose is the specification
- **The re-baseline window is guarded rather than trusted** (D-050 §5). All 34
  baselines are deleted and CI authors them, so for one commit the visual suite
  verifies nothing. `dimensions.json` is recorded beforehand and a unit test
  asserts every authored baseline matches the geometry that existed then: a pure
  colour change moves no pixel boundary
- **A spec instruction that could not be carried out as written**
  (**D-049 §1**). §3.13 described `placeholder` as "a disabled, hidden,
  selected-by-default `<option value="">`". The HTML *ask for a reset* algorithm
  selects the first option **that is not disabled**, so the third does not
  follow from the other two: left alone, the browser silently selects option
  two and the control looks right while holding a value nobody chose. The
  component seeds `defaultValue=""` when the caller gave neither `value` nor
  `defaultValue`, which routes through the `value` *setter*, where no such
  exclusion exists. **The same bug had a second door**: both props reached the
  element through the prop spread, so `defaultValue={maybeUndefined}` — an
  ordinary way to write an optional initial value — overwrote the seed and
  handed back option two. They are written below the spread now. The
  generalisation: **a spec sentence that mixes attributes with behaviour is a
  list of things that must each be made true**
- **The placeholder is painted from `:checked`, and that is D-047 §2's shape
  with a different cause** (**D-049 §2**). §2 ruled this control holds no state,
  so an uncontrolled select's selection changes without React being told — and
  `form.reset()` and a write through the ref do not tell it either. An
  attribute written from the initial value is right until the first of those.
  So the stylesheet reads
  `:has(option[data-pp-placeholder]:checked)` — the platform's own state,
  correct in all three cases — and `data-placeholder` is emitted only when the
  select is **controlled** and **omitted rather than guessed** otherwise. The
  marker is on the option we render, so a caller's own `<option value="">None</option>`
  stays a real choice rather than an absent one
- **The first component whose colour was computed at the gate** (**D-049 §3**),
  which is what D-047 §3 and D-048 §1 both asked for after failing it. The
  chevron is the one new pairing and it matters more than a decorative glyph
  would — `appearance: none` takes the platform's arrow away, so ours is the
  graphic that identifies the control as a select. `--pp-color-text-muted` on
  the surface is **5.10:1 light, 5.12:1 dark** against 1.4.11's 3:1, and it is a
  pairing `check-contrast.mjs` already asserts in both themes. Nothing was
  discovered after the build this time
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
  change plus the missing check plus a re-baseline of every screenshot. **Closed
  by D-050** on 2026-09-20, in exactly that shape — and the estimate was right
  about the work and wrong about where the colour could live: it could not be a
  re-pointed ramp step, because a conforming one inverts the ramp
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
- **Done:** 73 / 81 tracked items (11 foundations + 70 components) — 10
  foundations + 63 components: every item of Tiers 1–5, the twenty-two of
  Tiers 4 and 5 built under the standing delegation the latest (2026-09-29,
  D-093 §6), 4.14 `CommandPalette` the last of Tier 4 by number and 5.13
  `AvatarGroup` the last of Tier 5. What remains is Tier 6 (6.1–6.7) and
  0.10. The denominator moved from 80 to 81 when **6.7 `KeyHints`** was
  added (D-100 §1), the parked idea of D-069 §3; from 79 to 80 when **0.11**
  (the focus ring off the page) was added by D-053 §2 and closed the same day by
  D-056; it had moved from 78 to 79 when 3.17 `RangeSlider` was added (D-052
  §5). The one foundation not `done` is 0.10 docs site, deferred since there
  were no components worth documenting — there are now 63, so that reasoning has
  expired
