# Combobox

A text input that offers a list of options as the user types, and takes
one — or several. Spec: [`Combobox.md`](../specs/Combobox.md). Foundation:
[Overlays](../overlays.md).

```tsx
import { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxEmpty } from '@mod-0-dev/pixel-perfect';
```

The component owns the text, the selection, the open state, the highlight
and the keyboard. **It does not filter: you render the options that
match.** That is one line over an array, and it is what makes options
from a server nothing special.

**Not a `Select`.** A short, static list of a dozen things is `Select`,
and the platform's popup. A combobox is for more options than a list can
show, or for options that arrive as the user types.

## Usage

```tsx
const [city, setCity] = useState('');
const [query, setQuery] = useState('');
const matches = CITIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

<Field label="City">
  <Combobox
    value={city}
    onValueChange={setCity}
    // Filter on what was typed. After a selection the text is the label
    // and `reason` is 'select': the query empties, so a reopened list
    // shows everything.
    onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')}
    getLabel={(v) => NAME[v]}
  >
    <ComboboxInput placeholder="Type a city" />
    <ComboboxList>
      {matches.map((c) => (
        <ComboboxOption key={c.code} value={c.code}>{c.name}</ComboboxOption>
      ))}
      {matches.length === 0 && <ComboboxEmpty>No cities match.</ComboboxEmpty>}
    </ComboboxList>
  </Combobox>
</Field>
```

Everything is also controllable: `value`, `inputValue` (the text) and
`open`, each with a default. `onInputValueChange` reports every change
to the text with a reason — `input` (typed), `select` (set by a
selection) or `value` (following a value set from outside) — and a
consumer filters on `input` only.

Several, as tokens:

```tsx
<Combobox multiple value={cities} onValueChange={setCities} onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} getLabel={(v) => NAME[v]}>
  …
</Combobox>
```

From a server:

```tsx
<Combobox onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')} loading={isFetching}>
  <ComboboxInput />
  <ComboboxList>
    {results.map(…)}
    {isFetching && <ComboboxEmpty>Searching…</ComboboxEmpty>}
  </ComboboxList>
</Combobox>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Combobox` | `<div>`, `Input`'s box | `multiple`; `value` / `inputValue` / `open` trios; `getLabel`; `loading`; `size` / `invalid` / `disabled` / `required`; `name`; `toggleLabel`, `loadingLabel`, `removeLabel` |
| `ComboboxInput` | `<input role="combobox">` | `placeholder`, `aria-label`, the rest of an input's props |
| `ComboboxList` | the panel, portalled, with a `<div role="listbox">` inside | `side` (`bottom`), `sideOffset` (`'1'`), `collisionPadding` (`'2'`), `container` |
| `ComboboxOption` | `<div role="option">` | `value`, `disabled`, `textValue` when the children are not text |
| `ComboboxGroup` / `ComboboxLabel` | `<div role="group">` / `<div>` | A label names its group |
| `ComboboxEmpty` | `<div>` | Your "nothing matches" or "searching" row; rendered beside the listbox, not in it |

## Keyboard

| Key | Behavior |
| --- | --- |
| Typing | Opens the list, clears the highlight |
| `ArrowDown` / `ArrowUp` | Opens the list if closed; highlights the next / previous option, wrapping |
| `Enter` | Takes the highlighted option; otherwise passes, so a form submits |
| `Escape` | Closes the list |
| `Tab` | Closes the list and moves on; what was typed stays |
| `Backspace` in an empty field, `multiple` | Removes the last token |

Focus never leaves the input: the highlight is `aria-activedescendant`, and
a pointer press in the list does not blur the field. A click outside
closes the list and keeps the text. Nothing is highlighted when the list
opens; `ArrowDown` picks the first.

## Labels for values set from outside

When the user takes an option, its label is read from it. A value that
arrives from outside — `defaultValue`, a form's initial state — has no
option on screen while the list is closed, so pass `getLabel` to name it;
without it the value itself is shown.

## Multiple

Taking an option adds a token and keeps the list open; taking a selected
one removes it. Each token has a remove button named `Remove {label}`
(`removeLabel` to change the wording). The list is `aria-multiselectable`
and selected options carry the mark.

## In a Field

`Combobox` takes the field's `id`, description, error, size, `required`
and `disabled` like any control, and the list is named by the field's
label. Standalone, give the input an `aria-label` or a `<label>`: the
list is named by it, and development warns when there is nothing.

## Styling

The box is `Input`'s: every `--pp-input-*` property applies. The list is
`DropdownMenu`'s: every `--pp-dropdown-menu-*` property applies, and the
list is never narrower than the control. `--pp-combobox-token-bg`
(`--pp-tone-bg`) fills a token.

## Forms

`name` renders a hidden input per selected value, so a plain `<form>`
posts the selection. `required` marks the visible input.

## Anatomy

```
<div class="pp-input pp-combobox" data-size data-state data-invalid? data-disabled?>
  └── <div class="pp-combobox__box">
        ├── <div class="pp-combobox__field">
        │     ├── <span class="pp-combobox__token"> … <button class="pp-combobox__remove">
        │     └── <input class="pp-combobox__control" role="combobox" aria-expanded aria-controls aria-activedescendant>
        └── <button class="pp-combobox__toggle" tabindex="-1">
body
  └── <div class="pp-dropdown-menu pp-combobox__list" role="presentation">
        ├── <div class="pp-combobox__listbox" role="listbox">
        │     └── <div class="pp-dropdown-menu__item pp-combobox__option" role="option" aria-selected data-highlighted?>
        └── <div class="pp-combobox__empty">
```

## Testing in jsdom

The list is portalled: query it through `screen`. Open it by typing or
with `ArrowDown`. axe's `region` rule flags the portalled list, as it does
every portal; disable it for the open check.

## Don't

```tsx
// ✗ Expecting the component to filter. It shows what you render.
<ComboboxList>{ALL_CITIES.map(…)}</ComboboxList>

// ✗ A value from outside with no label. Pass getLabel.
<Combobox defaultValue="nl-ams">…</Combobox>

// ✗ A dozen static options. That is a Select.
<Combobox><ComboboxList>{SIZES.map(…)}</ComboboxList></Combobox>

// ✗ A physical side. `start` and `end` reverse with the layout.
<ComboboxList side="left" />
```
