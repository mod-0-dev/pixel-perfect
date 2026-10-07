# DatePicker

A date typed or picked: Input's box with a text field and a calendar
button, and `Calendar` in a `Popover` behind the button. Spec:
[`DatePicker.md`](../specs/DatePicker.md).

```tsx
import { DatePicker } from '@mod-0-dev/pixel-perfect';
```

A client component. The value is an ISO date, `2026-09-28`; the field
shows it in the reader's locale and parses what they type in that
locale's order.

## Usage

```tsx
const [due, setDue] = useState<string | undefined>();
<Field label="Due" description="DD/MM/YYYY" error={error}>
  <DatePicker value={due} onValueChange={setDue} locale="en-GB" min={todayISO} name="due" />
</Field>
```

Type `28/09/2026` (or `2026-09-28`) and press Enter or leave the field:
the value is reported and the text reformatted. Text that is not a
date marks the field invalid and reports nothing; pair it with a
Field `error`. An emptied field reports `undefined`.

Press the button, or Arrow Down in the field, for the calendar; pick a
day to set it, Escape to leave. `min`, `max`, `isDateDisabled`,
`today` and `weekStartsOn` pass through to the calendar.

Pass `locale` in a server-rendered app, so the text agrees on both
sides. `name` adds a hidden input with the ISO value for a form.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | ISO date or `undefined` | — | |
| `locale` | `string` | the runtime's | The text and the calendar |
| `min` / `max` / `isDateDisabled` / `today` / `weekStartsOn` | | — | To the calendar |
| `format` / `parse` | functions | Intl numeric | Override the text |
| `placeholder` | `string` | the locale's pattern | e.g. `DD/MM/YYYY` |
| `name` | `string` | — | A hidden input with the ISO value |
| `size` / `invalid` / `disabled` / `required` / `readOnly` | | the Field's | |
| `toggleLabel` | `string` | `'Choose date'` | The button's and the dialog's name |

The rest goes on the text input; `className` and `style` land on the
box.

## Accessibility

The text field is the labelled control. The button is named "Choose
date", `aria-haspopup="dialog"`, `aria-expanded`; the panel is a named
dialog with the calendar, focus on its tab stop, back to the button on
close. Unparsable text is `aria-invalid`.

## Styling

Input's `--pp-input-*` for the box, Popover's `--pp-popover-*` for the
panel, Calendar's inside it, and `--pp-date-picker-panel-padding`
(`--pp-space-3`).

## Anatomy

```
<span class="pp-input pp-date-picker" data-state="closed">
  ├── <div class="pp-date-picker__box">
  │     ├── <input class="pp-date-picker__control" type="text">
  │     └── <button class="pp-date-picker__toggle" aria-label="Choose date">
  └── (portalled) <div class="pp-popover pp-date-picker__panel" role="dialog"> <div class="pp-calendar">
```

## Don't

```tsx
// ✗ A Date. Pass an ISO date.
<DatePicker value={new Date()} />

// ✗ A mask. It parses the locale's punctuation as typed.
<DatePicker mask="99/99/9999" />

// ✗ No locale on the server. The text must agree on both sides.
```
