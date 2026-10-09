# Calendar

A month of days to pick one from. Spec:
[`Calendar.md`](../specs/Calendar.md). Standalone; `DatePicker` puts it
in a `Popover` behind an input.

```tsx
import { Calendar } from '@mod-0-dev/pixel-perfect';
```

A client component. The value is an ISO date, `2026-09-28` — not a
`Date`, which is an instant in a time zone, and a day is not.

## Usage

```tsx
const [date, setDate] = useState<string | undefined>();
<Calendar value={date} onValueChange={setDate} locale="en-GB" />
```

Uncontrolled with `defaultValue`. The month shown is the value's, or
today's; control it with `month` / `onMonthChange` (`YYYY-MM`) when
something else moves it.

`today` is a prop. In a server-rendered app pass it, and pass `locale`:
the names come from `Intl`, and a server and a client that disagree
about the locale disagree about the names.

```tsx
<Calendar defaultValue="2026-09-28" today="2026-09-28" locale="en-US" />
```

Bounds and disabled days:

```tsx
<Calendar min="2026-01-01" max="2026-12-31" isDateDisabled={(iso) => isHoliday(iso)} />
```

`weekStartsOn` (0 is Sunday) overrides the locale's first day; without
the locale's week info the week starts on Monday. `size` is the day's
height.

## Keyboard

One tab stop. Arrow Left and Right move a day (mirrored in a
right-to-left layout), Up and Down a week, Home and End to the week's
ends, PageUp and PageDown a month, with Shift a year. Enter or Space
picks. Moving past the month's edge shows the next month and focus
follows; a disabled day is skipped.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | ISO date | — | The day |
| `month` / `defaultMonth` / `onMonthChange` | `YYYY-MM` | the value's | The month shown |
| `today` | ISO date | the runtime's | `aria-current`, the default month |
| `min` / `max` | ISO date | — | Inclusive |
| `isDateDisabled` | `(iso) => boolean` | — | |
| `disabled` | `boolean` | `false` | |
| `locale` | `string` | the runtime's | |
| `weekStartsOn` | `0 … 6` | the locale's, else 1 | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The day's height |
| `label` | `string` | `'Calendar'` | The group's name |

## Accessibility

`role="grid"` labelled by the month, rows and column headers, one tab
stop with a roving `tabindex`; every day named in full ("Monday,
September 28, 2026"); `aria-selected` on the picked cell,
`aria-current="date"` on today; the filler days before and after the
month are `aria-hidden`. The month name is a polite live region, so a
keyboard user hears the month change.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-calendar-gap` | `--pp-space-1` | Between days |
| `--pp-calendar-day-radius` | `--pp-control-radius` | A day's corners |
| `--pp-calendar-selected-bg` | `--pp-tone-solid` | The picked day |
| `--pp-calendar-selected-color` | `--pp-tone-on-solid` | Its text |

## Anatomy

```
<div class="pp-calendar" role="group" aria-label="Calendar">
  ├── <div class="pp-calendar__header">  (Previous month, the month, Next month)
  └── <div class="pp-calendar__grid" role="grid">
        ├── <div class="pp-calendar__weekdays" role="row"> <span class="pp-calendar__weekday" role="columnheader">
        └── <div class="pp-calendar__week" role="row"> <div class="pp-calendar__cell" role="gridcell"> <button class="pp-calendar__day">
```

## Don't

```tsx
// ✗ A Date. Pass an ISO date.
<Calendar value={new Date()} />

// ✗ No locale in a server-rendered app. The names must agree on both sides.
<Calendar defaultValue="2026-09-28" />

// ✗ A range by two clicks. Not a mode yet.
```
