# 5.9 `Calendar`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-086; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — the focused day, the shown month and the value when uncontrolled |
| **Depends on** | T3 (`done`): the month arrows are `IconButton`s, the days are buttons on the control scale |
| **APG pattern** | The grid of the [Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/): `role="grid"`, one tab stop, arrows move a day or a week, Home/End the week's ends, PageUp/PageDown a month, with Shift a year |

A month of days to pick one from. Standalone here; 4.13 `DatePicker`
puts it in a `Popover` behind an input.

## Purpose

A date is picked from a month laid out as a week grid, because a grid
is what makes "next Tuesday" one glance and one arrow. This is that
grid, with the month's name and a way to the next and the previous
one; the value is one day.

It deliberately does **not**: take a `Date` (a `Date` is an instant in
a time zone, and a day is not — the value is an ISO date string,
`2026-09-28`, the thing a URL, a form and a database already hold);
pull in a date library (the arithmetic a month needs is forty lines,
UTC-anchored so no daylight change moves a day); pick a range or several
days (a `mode` for 5.x later, if the roadmap wants it); or render a
time.

---

## Decisions this spec asks you to approve

### 1. The value is an ISO date; `month` is `YYYY-MM`; both controlled and uncontrolled

```tsx
<Calendar defaultValue="2026-09-28" onValueChange={setDate} />
<Calendar value={date} onValueChange={setDate} month={month} onMonthChange={setMonth} />
```

`value` / `defaultValue` / `onValueChange` for the day, `month` /
`defaultMonth` / `onMonthChange` for the month shown (RULES §5.5). With
no month given, the calendar shows the value's month, else `today`'s.
`today` is a prop (`YYYY-MM-DD`, default the runtime's date), so a
server render, a test and a screenshot can agree on what today is.
`min` and `max` (ISO) bound the pickable days; `isDateDisabled(iso)`
disables more; `disabled` disables all (D-086 §1).

### 2. Our own grid, on `div`s, one tab stop, the APG keys

Radix has no calendar, and a `<table>` cannot fill its container or
stretch its cells without a width, so the grid is `div`s with the roles
— `grid`, `row`, `columnheader`, `gridcell` — laid out by CSS grid
(`repeat(7, 1fr)`), each day a `<button>` stretched to its cell. One
day has `tabindex="0"` (the selected one when shown, else today, else
the first), the rest `-1`; arrows move a day or a week, Home and End go
to the week's ends, PageUp and PageDown a month (Shift: a year), Enter
and Space pick; moving past the month's edge shows the next month and
focus follows. A disabled day is skipped, not landed on. Arrow Left
goes to the previous day in LTR and to the next in RTL, because the grid
runs the other way there (D-086 §2). The days before the first and
after the last of the month fill the grid, `aria-hidden`, muted and not
focusable: the previous month is one PageUp away.

### 3. Names by `Intl`; `weekStartsOn` from the locale when it says, else Monday

Month and weekday names come from `Intl.DateTimeFormat(locale)`; a
weekday header is the narrow form with the long one as its
`aria-label`. `locale` is a prop; without one the runtime's locale is
used, which is what `NumberInput` does and carries the same warning: a
server and a client that disagree about the locale disagree about the
names, so pass it. The first day of the week is `weekStartsOn` (0–6),
else the locale's week info where the runtime provides it, else Monday
(D-086 §3).

### 4. A day is a button on the control scale; the value is solid, today is accent

`size` is the day's height — `--pp-control-height-sm/md/lg` — and the
grid's columns are equal shares of the line, so a calendar fills a
popover and a sidebar alike. The selected day is `--pp-tone-solid` with
`--pp-tone-on-solid` text (`aria-selected` on its cell); today is the
accent's text, medium, with `aria-current="date"`; hover is
`--pp-tone-bg-hover`; a disabled day is muted and struck by nothing
(disabled Buttons are not struck either). The root writes
`data-pp-tone="accent"`. The month name sits between the arrows,
`aria-live="polite"`, so a keyboard user hears the month change.

---

## Sizing contract justification

`fill`: the root is a block that takes its parent's width, the grid's
seven columns equal shares of it, each day stretched to its column and
`size` tall. A 240px sidebar gives 30px columns at `sm`; a popover gives
whatever `DatePicker` gives.

## Anatomy

```
<div class="pp-calendar" role="group" aria-label="Calendar" data-size="md" data-pp-tone="accent">
  ├── <div class="pp-calendar__header">
  │     ├── <button class="pp-button pp-icon-button pp-calendar__nav" aria-label="Previous month">
  │     ├── <span class="pp-calendar__month" aria-live="polite">September 2026
  │     └── <button … aria-label="Next month">
  └── <div class="pp-calendar__grid" role="grid" aria-labelledby="(the month)">
        ├── <div class="pp-calendar__weekdays" role="row">
        │     └── <span class="pp-calendar__weekday" role="columnheader" aria-label="Monday">M
        └── <div class="pp-calendar__week" role="row">
              ├── <div class="pp-calendar__cell" role="gridcell" aria-selected?>
              │     └── <button class="pp-calendar__day" tabindex="0|-1" aria-label="Monday, 28 September 2026" aria-current="date"?>
              └── <div class="pp-calendar__cell" aria-hidden="true"> <span class="pp-calendar__day" data-outside>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-calendar` | `<div role="group">` | Named "Calendar" by default |
| header | `pp-calendar__header` | `<div>` | Arrows and the month |
| nav | `pp-icon-button pp-calendar__nav` | `IconButton` | Previous / next month |
| month | `pp-calendar__month` | `<span>` | Live |
| grid | `pp-calendar__grid` | `<div role="grid">` | Seven columns |
| weekday | `pp-calendar__weekday` | `<span role="columnheader">` | Narrow name, long label |
| cell | `pp-calendar__cell` | `<div role="gridcell">` | `aria-selected` |
| day | `pp-calendar__day` | `<button>` or `<span>` | The tab stop moves among these |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | ISO date | — | The picked day |
| `month` / `defaultMonth` / `onMonthChange` | `YYYY-MM` | the value's, else today's | The month shown |
| `today` | ISO date | the runtime's | For `aria-current` and the default month |
| `min` / `max` | ISO date | — | Bounds, inclusive |
| `isDateDisabled` | `(iso: string) => boolean` | — | More days disabled |
| `disabled` | `boolean` | `false` | Everything |
| `locale` | `string` | the runtime's | For the names |
| `weekStartsOn` | `0 … 6` | the locale's, else 1 | 0 is Sunday |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The day's height |
| `label` | `string` | `'Calendar'` | The group's name |

…`ComponentPropsWithoutRef<'div'>` less `children`, `aria-label`,
`defaultValue`. Exported: `CalendarProps`, `CalendarSize`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| selected day | `aria-selected="true"` on the cell, `data-state="selected"` on the day | Solid accent |
| today | `aria-current="date"` | Accent text, medium |
| outside day | `data-outside` on the day, `aria-hidden` on the cell | Muted, inert |
| disabled day | `disabled` | Muted |
| focused day | `tabindex="0"` | The ring |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-calendar-gap` | `--pp-space-1` | Between days |
| `--pp-calendar-day-radius` | `--pp-control-radius` | A day's corners |
| `--pp-calendar-selected-bg` | `--pp-tone-solid` | The picked day |
| `--pp-calendar-selected-color` | `--pp-tone-on-solid` | Its text |

**Contrast, computed at the gate (D-048 §1).** A day is the page's
text on the page; hover is the page's text on the accent `bg-hover`
step (a ghost Button's hover pairing); the selected day is `on-solid`
on `solid`, every solid Button's pairing; today is `--pp-tone-text` in
the accent ramp on the page, Link's pairing; a disabled day is
`--pp-color-text-disabled`, exempt (WCAG 1.4.3).

## Keyboard interaction

| Key | Moves |
| --- | --- |
| Tab | Into the grid (one stop) and out |
| Arrow Right / Left | A day forward / back (mirrored in RTL) |
| Arrow Down / Up | A week forward / back |
| Home / End | The week's first / last day |
| PageUp / PageDown | A month back / forward; with Shift a year |
| Enter / Space | Picks the focused day |

## Accessibility notes

- `role="grid"` labelled by the month; rows and column headers; one
  tab stop, roving `tabindex`; each day named in full ("Monday, 28
  September 2026") so a screen reader never hears a bare "28".
- `aria-selected` on the picked cell, `aria-current="date"` on today;
  outside days `aria-hidden`.
- The month name is `aria-live="polite"`.
- **Manual walkthrough:** Tab to the 28th, hear its full name; Arrow
  Down to the 5th of next month and hear "October 2026"; Enter, hear
  "selected".

## Container behavior

`fill`; the columns share the width. Below about 224px at `md` the
day's number no longer fits its cell; `sm` in a sidebar.

## Usage

```tsx
const [date, setDate] = useState<string | undefined>();
<Calendar value={date} onValueChange={setDate} min="2026-01-01" locale="en-GB" />
```

## Don't

- Don't pass a `Date`; pass an ISO date.
- Don't render it without `locale` in a server-rendered app; the
  names must agree.
- Don't make it a range picker by clicking twice; that is a `mode`
  the roadmap does not have yet.

## Testing notes

- **Unit:** the group, the grid labelled by the month; weekdays for
  `en-US` starting Sunday and Monday; the month's days and the outside
  fillers hidden; the tab stop on the value, on today, on the first;
  a click picks and reports, moves when uncontrolled and holds when
  controlled; `today` is current; `min`, `max` and `isDateDisabled`
  disable; arrows, Home, End, PageUp, PageDown, Shift+PageUp, Enter and
  Space; a skipped disabled day; the arrows change the month and report;
  `size`, `label`, `disabled`; a bad ISO string rejected at the type
  level? No — a string is a string; a bad one is `undefined` in
  development with a warning; axe both themes.
- **Browser:** seven equal columns the cell's width; the day's height
  per `size`; the selected day's surface and text; today's colour and
  weight; hover; the ring on the focused day; RTL: the grid runs from
  the right and Arrow Left moves forward; Arrow Down past the month's
  end shows the next month with focus on the day.
- **Break checks (D-035 §3):** drop `repeat(7, 1fr)` (the columns);
  drop the selected surface; drop today's colour; drop the day's
  height.
- **Screenshot:** September 2026 with the 28th picked and today the
  28th, per cell; the sizes and a bounded one outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A `mode="range"`?** Not now; the value shape changes and DatePicker
   does not need it. Recommend deferring, as its own roadmap item.
2. **A year/month `Select` in the header?** Not now; PageUp with Shift
   moves a year. Recommend deferring.
3. **Outside days clickable?** No: `aria-hidden` fillers; PageUp is one
   key.
