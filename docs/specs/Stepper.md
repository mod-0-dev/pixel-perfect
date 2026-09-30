# 5.7 `Stepper`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-084; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler |
| **Depends on** | T2 (`done`) |
| **APG pattern** | None of its own: a `<nav>` around an ordered list, `aria-current="step"` on the current one, which is what ARIA gives `aria-current` the `step` value for |

Where a multi-step process stands: the steps in order, the ones done,
the one now, the ones to come, and a line joining them.

## Purpose

A checkout, a sign-up, a wizard: a process with a fixed order shows
its steps so the reader knows how many there are, which is done, and
which is next. It is a status display, not a control — moving between
steps is the form's Next and Back — and it holds no state: the consumer
says which step is `complete`, `current` or `upcoming`, and the
component draws it.

It deliberately does **not**: navigate (a clickable completed step is
the consumer's `Link` in the step's label, if the process allows going
back); number itself in the markup (an ordered list already tells a
screen reader "2 of 4", so the visible number is a CSS counter); or take
a `variant` or `size`.

---

## Decisions this spec asks you to approve

### 1. Two parts; `status` on a step; the number is a counter and "done" is a check

```tsx
<Stepper>
  <Step status="complete">Account</Step>
  <Step status="current" description="Card or invoice">Payment</Step>
  <Step>Review</Step>
</Stepper>
```

`Stepper` (`<nav aria-label="Progress">` around an `<ol>`) and `Step`
(`<li>`), named exports. `status` is `complete | current | upcoming`,
`upcoming` by default, written as `data-state`; the current step also
carries `aria-current="step"`. The visible number is a CSS counter on
the indicator, because an `<ol>` already announces "2 of 4" and a
number in the markup would be said twice; a completed step shows a
check instead, with "Completed" visually hidden in its label so the
state is heard (D-084 §1).

### 2. Horizontal by default, vertical below 28rem by its container

Steps run in a row, each taking an equal share of the line with a
connector to the next; the last hugs. `orientation="vertical"` stacks
them with the connector running down beside the description. And a
horizontal stepper narrower than its row — a 240px sidebar, a card —
becomes the vertical one by a container query, Pagination's device
(D-082 §2), so the same component is a row in a page and a column in a
panel with nothing configured. The contract is `fill` for the same
reason as Pagination's: the query needs the parent's width. The root
`<nav>` is the container and the `<ol>` inside it is what the query
switches, because a query cannot target its own container (D-084 §2).

### 3. The indicator and the connector say the state; the accent tone says it in colour

| State | Indicator | Label | Connector after it |
| --- | --- | --- | --- |
| `complete` | Solid accent, a check | The page's text | Accent |
| `current` | Accent border (2px), accent number | The page's text, medium | Hairline |
| `upcoming` | Hairline border, muted number | Muted | Hairline |

The root carries `data-pp-tone="accent"`, so every colour here is a
`--pp-tone-*` token resolved in the accent ramp and a consumer's
`data-pp-tone` on a wrapper changes all of them (D-007). The indicator
is a `--pp-control-height-sm` circle (32px), the size of a small
control, so a stepper beside a small Button lines up.

---

## Sizing contract justification

`fill`: a block, no width declaration, `min-inline-size: 0`, the
container for the query (§2).

## Anatomy

```
<nav class="pp-stepper" aria-label="Progress" data-orientation="horizontal" data-pp-tone="accent">
  └── <ol class="pp-stepper__list">
        └── <li class="pp-stepper__step" data-state="complete|current|upcoming" aria-current="step"?>
              ├── <span class="pp-stepper__indicator" aria-hidden="true">   (a counter, or the check)
              └── <span class="pp-stepper__body">
                    ├── <span class="pp-stepper__label">Payment <span class="pp-visually-hidden">Completed</span>?
                    └── <span class="pp-stepper__description">Card or invoice
              (the connector is the step's ::after, except the last's)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Stepper | `pp-stepper` | `<nav>` | The landmark and the container |
| list | `pp-stepper__list` | `<ol>` | A row, or a column |
| Step | `pp-stepper__step` | `<li>` | `data-state`; the connector is its `::after` |
| indicator | `pp-stepper__indicator` | `<span>` | The counter or the check; `aria-hidden` |
| body | `pp-stepper__body` | `<span>` | |
| label | `pp-stepper__label` | `<span>` | The children |
| description | `pp-stepper__description` | `<span>` | Optional |

## Props

**`Stepper`**: `orientation?: 'horizontal' | 'vertical'` (`horizontal`),
`label?: string` (`'Progress'`), …`<'nav'>` less `aria-label`.
**`Step`**: `status?: 'complete' | 'current' | 'upcoming'` (`upcoming`),
`description?: ReactNode`, `children` (the label), …`<'li'>`.

Exported types: `StepperProps`, `StepProps`, `StepStatus`,
`StepperOrientation`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| complete | `data-state="complete"` | Solid indicator with a check, accent connector |
| current | `data-state="current"`, `aria-current="step"` | Accent ring, medium label |
| upcoming | `data-state="upcoming"` | Hairline ring, muted |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-stepper-gap` | `--pp-space-3` | Between indicator, label and connector |
| `--pp-stepper-connector-color` | `--pp-color-border-subtle` | A connector not yet reached |
| `--pp-stepper-connector-done-color` | `--pp-tone-solid` | A connector after a completed step |

**Contrast, computed at the gate (D-048 §1).** The check is
`--pp-tone-on-solid` on `--pp-tone-solid`, the pairing every solid
Button carries; the current number is `--pp-tone-text` on the page;
the upcoming number and the descriptions are muted text on the page.
Connectors are decoration (D-050).

## Keyboard interaction

None. Nothing here is focusable; a link in a label is the consumer's.

## Accessibility notes

- `<nav aria-label="Progress">`, an `<ol>` (position announced),
  `aria-current="step"` on the current step.
- The indicator is `aria-hidden`: the counter would be said twice and
  the check says nothing. "Completed" is visually hidden in a completed
  step's label.
- **Manual walkthrough:** jump to the "Progress" landmark; hear "list,
  3 items"; the second reads "Payment, Card or invoice, current step";
  the first "Account, Completed".

## Container behavior

`fill`. A horizontal stepper below 28rem is the vertical one.

## Usage

```tsx
<Stepper>
  <Step status="complete">Account</Step>
  <Step status="current" description="Card or invoice">Payment</Step>
  <Step description="Check and confirm">Review</Step>
</Stepper>

<Stepper orientation="vertical" label="Setup">…</Stepper>
```

## Don't

- Don't number the labels; the counter and the list do.
- Don't make it the navigation; Next and Back are the form's.
- Don't pass an array of steps; render `Step`s.
- Don't put more than one `current` step.

## Testing notes

- **Unit:** the landmark and its name; the `<ol>` and the steps in
  order; `data-state` per status and `upcoming` by default;
  `aria-current="step"` on the current one only; the check and the
  hidden "Completed" on a completed step and on no other; the
  description; `orientation` and the accent tone on the root; refs,
  `className` and `style`; axe both themes, both orientations.
- **Browser:** the counters `1 2 3` on the indicators and none on a
  completed one; the indicators' size; the states' colours — the solid
  indicator, the current ring, the muted upcoming; the connector after a
  completed step in the accent and after the current a hairline, none
  after the last; horizontal at 960px is one row and at 240px a column;
  vertical is a column at every width; in a plain narrow parent the
  column is the component's own container answering.
- **Break checks (D-035 §3):** drop `container-type` (the plain parent
  stays a row); drop the done-connector colour; drop the current ring;
  drop the counter (`content`).
- **Screenshot:** the three-step stepper per cell, plus vertical and a
  five-step one outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **Clickable steps?** No: a `Link` in a label when the process allows
   it. Recommend no.
2. **An `error` status?** Not now: the form's error lives in the form.
   Recommend deferring; it is one more `data-state` value when needed.
