# 4.13 `DatePicker`

| | |
| --- | --- |
| **Tier** | 4 — Overlay & Interaction |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-091; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — the text, the open state, the Field context |
| **Depends on** | 4.2 `Popover` (`done`), 5.9 `Calendar` (`review`, `done` under the batch, D-073 §2); Input's box and Field's precedence (3.7, 3.8) |
| **APG pattern** | [Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), non-modal: a text field, a button that opens a dialog holding the grid, Escape closes, focus back to the button |

A date typed or picked: Input's box with a text field and a calendar
button, and `Calendar` in a `Popover` behind the button. The last of
Tier 4, which waited for 5.9.

## Purpose

A due date, a birthday, a start of a booking. The reader types it if
they know it — a date is faster to type than to click to — and picks
it from a month if they do not. The value is the ISO date Calendar
takes, so a form, a URL and a database hold one shape, and the field
shows it in the reader's locale.

It deliberately does **not**: pick a time or a range (Calendar's later
modes); mask the input (a mask fights every locale's punctuation; the
field parses what was typed); or be the native `<input type="date">`,
which Input excludes because it "renders as a button that ignores every
token we have" (tier-3c §5) and which no two browsers draw alike.

---

## Decisions this spec asks you to approve

### 1. Input's box with a text field and a calendar button; `Calendar` in a `Popover` behind it

```tsx
<Field label="Due">
  <DatePicker value={due} onValueChange={setDue} locale="en-GB" min="2026-01-01" />
</Field>
```

One part. The root carries `pp-input` and its own class, so Input.css
draws the box — the height, the edge, the surface, the states — and
this file adds the button in the box (Combobox's device, 4.11). The
button (`aria-label="Choose date"`, `aria-haspopup="dialog"`,
`aria-expanded`) is a Popover trigger; the panel is `pp-popover` and
its own class, a `role="dialog"` named "Choose date", holding a
`Calendar` at `sm` bound to the value. Picking a day sets the value,
closes the panel and returns focus to the button; Escape closes; a
press outside closes. Arrow Down in the text field opens the panel
too, with focus on the calendar's tab stop.

### 2. Typed text is parsed on commit, in the locale's order of parts

The field shows the value formatted by `Intl` in the locale's numeric
form (`09/28/2026`, `28.09.2026`), and what is typed is parsed on
Enter and on blur: `YYYY-MM-DD` as is, else three numbers in the order
`Intl.DateTimeFormat(locale).formatToParts` gives for year, month and
day, so a reader types the way their locale writes. A two-digit year is
this century. Text that does not parse marks the field invalid
(`aria-invalid`, the danger edge) and reports nothing; an emptied field
reports `undefined`. `format` and `parse` props override both (D-091
§2).

### 3. `value` is the ISO date, controlled or uncontrolled; a form gets it by `name`

`value` / `defaultValue` / `onValueChange` (RULES §5.5), the value an
ISO date or `undefined`. With `name`, a hidden input carries the ISO
value for a form, because the visible field carries the locale's text.
`min`, `max`, `isDateDisabled`, `today`, `weekStartsOn` and `locale`
pass to the calendar; `size`, `invalid`, `disabled`, `required`,
`readOnly` follow the Field with the tier's precedence, and the field's
`id` and description land on the text input, which its label points at.

---

## Sizing contract justification

`fill`: Input's contract — the box takes its parent's width, the text
field stretching in it; the panel hugs its calendar.

## Anatomy

```
<span class="pp-input pp-date-picker" data-size="md" data-state="open|closed" data-invalid? data-disabled?>
  ├── <div class="pp-date-picker__box">                            (the Popover anchor)
  │     ├── <input class="pp-date-picker__control" type="text" inputmode="numeric">
  │     └── <button class="pp-date-picker__toggle" aria-label="Choose date" aria-haspopup="dialog" aria-expanded>
  ├── <input type="hidden" name value="2026-09-28">?
  └── (portalled) <div class="pp-popover pp-date-picker__panel" role="dialog" aria-label="Choose date">
        └── <div class="pp-calendar" …>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-input pp-date-picker` | `<span>` | Input's box states |
| box | `pp-date-picker__box` | `<div>` | The edge; the anchor |
| control | `pp-date-picker__control` | `<input type="text">` | The Field's control |
| toggle | `pp-date-picker__toggle` | `<button>` | Opens the panel |
| panel | `pp-popover pp-date-picker__panel` | `<div role="dialog">` | Holds the Calendar |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | ISO date or `undefined` | — | |
| `locale` | `string` | the runtime's | For the text and the calendar |
| `min` / `max` / `isDateDisabled` / `today` / `weekStartsOn` | | — | To the calendar |
| `format` | `(iso, locale) => string` | Intl numeric | |
| `parse` | `(text, locale) => string \| undefined` | the locale's order | |
| `placeholder` | `string` | the locale's pattern, e.g. `MM/DD/YYYY` | |
| `name` | `string` | — | A hidden input with the ISO value |
| `size` / `invalid` / `disabled` / `required` / `readOnly` | | the Field's | |
| `toggleLabel` | `string` | `'Choose date'` | The button's and the dialog's name |

…`ComponentPropsWithoutRef<'input'>` less `type`, `value`,
`defaultValue`, `size`, `className`, `style` (the last two land on the
root, D-039 §1). Exported: `DatePickerProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| open | `data-state="open"` on the root, `aria-expanded` | The panel |
| invalid (a Field's, or unparsable text) | `data-invalid`, `aria-invalid` | The danger edge |
| disabled / readonly | `data-disabled` / `data-readonly` | Input's |

## Styling API

Input's (`--pp-input-*`) for the box, Popover's (`--pp-popover-*`) for
the panel, Calendar's inside. `--pp-date-picker-panel-padding`
(`--pp-space-3`) for the panel.

**Contrast, computed at the gate (D-048 §1).** Input's, Popover's and
Calendar's pairings; the button's glyph is muted text on the surface.

## Keyboard interaction

| Key | Where | Does |
| --- | --- | --- |
| Enter | the field | Commits the text |
| Arrow Down | the field | Opens the panel, focus on the calendar |
| Tab | the field | To the button |
| Enter / Space | the button | Opens the panel |
| Escape | the panel | Closes, focus to the button |
| Calendar's keys | the panel | Calendar's; Enter picks and closes |

## Accessibility notes

- The text field is the labelled control; the button is named "Choose
  date" with `aria-haspopup="dialog"` and `aria-expanded`; the panel is
  a named non-modal dialog.
- Focus into the calendar's tab stop on open, back to the button on
  close (Radix's, kept).
- Unparsable text is `aria-invalid`; the message is the Field's `error`.
- **Manual walkthrough:** type `28.09.2026` in a German field, Tab, hear
  nothing wrong; press the button, hear "Choose date, dialog", the
  28th; Escape back to the button.

## Container behavior

`fill`; the box is the line, the panel hugs and flips above when there
is no room below (Popover's).

## Usage

```tsx
const [due, setDue] = useState<string | undefined>();
<Field label="Due" description="DD/MM/YYYY" error={error}>
  <DatePicker value={due} onValueChange={setDue} locale="en-GB" min={todayISO} name="due" />
</Field>
```

## Don't

- Don't pass a `Date`; pass an ISO date.
- Don't omit `locale` in a server-rendered app; the text must agree on
  both sides.
- Don't mask the field; it parses.

## Testing notes

- **Unit:** the box, the field and the button; the value formatted in
  the locale and `de-DE`; typing and Enter reporting the ISO value and
  reformatting, blur the same; ISO typed; a two-digit year; unparsable
  text invalid and silent; an emptied field reporting `undefined`; the
  button opening a dialog with the calendar, focus on the day, a pick
  closing and reporting and focus back on the button; Arrow Down
  opening; Escape closing; `min` disabling in the calendar; a Field's
  label, description, `invalid`, `disabled` and `size`; the hidden
  input by `name`; controlled and uncontrolled; refs, `className`,
  `style`; axe closed and open, both themes.
- **Browser:** the box the height and edge of an Input beside it, the
  button inside the box at its end; the ring on the box when the field
  is focused; the panel below the box, start-aligned, holding a `sm`
  calendar; RTL: the button at the start (left), the panel from the
  right; the open state.
- **Break checks (D-035 §3):** drop the box's grid (the button below
  the field); drop the box ring; drop the toggle's height; drop the
  panel's padding.
- **Screenshot:** a Field with a value per cell; a sizes row, an
  invalid one, a disabled one and RTL outside; the panel open in one.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A native `<input type="date">` on touch devices?** No: two
   drawings of one field, and the native one ignores the tokens.
2. **A range picker?** Calendar's later mode.
3. **Segmented input (DD / MM / YYYY)?** Not now; a parse in the
   locale's order covers the typing.
