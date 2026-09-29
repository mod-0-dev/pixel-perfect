# 4.11 `Combobox`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-076. Its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` for the control (it is an `Input`'s box); the list is `hug` with the overlay exception (D-061 §3), and never narrower than the control |
| **RSC** | `client` — the whole keyboard model is state |
| **Depends on** | 4.2 `Popover` (`done`): the list's portal and positioning, through `@radix-ui/react-popover`'s `Anchor`; 3.13 `Select` (`done`): whose spec deferred typeahead, async options and multi-select here; 3.8 `Input` and 3.7 `Field`: the box and the wiring; 4.7 `DropdownMenu`: the list's stylesheet |
| **APG pattern** | [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), editable, with a listbox popup and list autocomplete: `role="combobox"` on the input, `aria-expanded`, `aria-controls`, `aria-activedescendant` — focus never leaves the input |

The tier's largest, and the one every earlier spec pointed at: `Select`
kept the platform's popup and sent "typeahead, async options, multi-select"
here; `Popover` withheld its `Anchor` "for 4.11"; `DropdownMenu` gave
RULES §4 `data-highlighted` "for a menu now and a listbox later". Radix has
no combobox, so this is the one Tier 4 component whose behaviour is the
library's own: the list's portal and placement are `Popover`'s primitive,
the list's look is `DropdownMenu`'s stylesheet, and the keyboard model,
the highlight, the selection and the tokens are written here.

## Purpose

A text input that offers a list of options as the user types, and takes one
(or, with `multiple`, several): a city, an assignee, tags, anything with
more options than a `Select` can show or that arrives from a server. The
user types, the list narrows, the arrows highlight, `Enter` takes.

It deliberately does **not**: filter (§2 — the consumer renders the options
that match, which is what makes "async" nothing special); create options
from free text (a `creatable` combobox is a later flag if it is ever
wanted); or replace `Select` (a short, static list of a dozen things is
the platform's popup, and 3.13's argument stands).

---

## Decisions this spec asks you to approve

### 1. Compound, seven parts, and the options are children

```tsx
<Field label="City">
  <Combobox value={city} onValueChange={setCity} onInputValueChange={(text, reason) => setQuery(reason === 'input' ? text : '')}>
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

`Combobox` (the root: every state), `ComboboxInput`, `ComboboxList`,
`ComboboxOption`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxEmpty`. Named
exports (D-062 §1). Options are children, as `Select`'s are — RULES §5.6,
and the only shape that lets an option hold an avatar beside its name.

### 2. The consumer renders the options that match; the component owns everything else

The component does not filter. It owns the text (`inputValue` /
`defaultInputValue` / `onInputValueChange`), the selection (`value` /
`defaultValue` / `onValueChange`; a `string`, or a `string[]` with
`multiple`), the open state (`open` / `defaultOpen` / `onOpenChange`), the
highlight, the keyboard, the tokens and the wiring. The consumer reads
`inputValue`, decides which options to render — by a `filter` over an
array, by a fetch — and renders `ComboboxEmpty` when there are none.

**The text is reported with why it changed**: `onInputValueChange(text,
reason)`, `reason` being `input` (typed), `select` (set to a label, or
cleared, by a selection) or `value` (following a value set from outside).
A consumer filters on `input` only — after a selection the query is empty
and a reopened list shows everything, where filtering on the label would
show one match. That is the one thing a combobox that does not filter has
to say, and Downshift says it the same way.

This is what makes async options nothing special: a fetch that resolves
renders options; while it runs, `loading` on the root shows a spinner in
the control's end slot and marks the list `aria-busy`, and the consumer
renders an `Empty` that says "Searching…". A built-in filter would need a
label for every option in JavaScript, a match rule, a debounce, and would
still be wrong for the server case; Downshift and Ariakit made the same
call.

### 3. Labels: read from the option when it is chosen, asked for when it is not there

An option's label is its text (`textValue` when the children are not
text). When the user chooses one, the component reads it from the option
and shows it: in the input, for a single combobox; as a token, with
`multiple`. That covers every selection the user makes.

It does not cover a value that arrives from outside — `defaultValue`, a
controlled `value` set by a form's initial state — whose option may not
be rendered, because the list is closed and its children are not mounted.
So the root takes **`getLabel?: (value: string) => string`**, used for a
value the component has never seen chosen. Without it the value itself is
shown, which is honest for `"amsterdam"` and wrong for `"nl-ams"`, and
the docs page says when to pass it. A registration context (every option
telling the root its label) would not help: an unrendered option cannot
register (D-036, from another side).

### 4. The keyboard is APG's, and focus never leaves the input

| Key | Behavior |
| --- | --- |
| Typing | Opens the list; the highlight clears; `onInputValueChange` |
| `ArrowDown` / `ArrowUp` | Opens the list if closed; highlights the next / previous enabled option, wrapping; the highlighted option is scrolled into view |
| `Enter` | Takes the highlighted option, if the list is open and one is highlighted; otherwise the event passes (a form submits) |
| `Escape` | Closes the list, if open; otherwise passes |
| `Tab` | Closes the list; focus moves on. Nothing is taken |
| `Backspace` in an empty input, `multiple` | Removes the last token |
| `Home` / `End` | The caret's, as in any text field (APG: optional for options; not taken) |

The highlight is `aria-activedescendant` on the input and
`data-highlighted` on the option (D-072 §2's listbox); focus stays in the
input throughout, including on a pointer press in the list, which the
list refuses (`pointerdown` prevented) so the field does not blur. A
pointer over an option highlights it; a click takes it. The chevron at
the control's end toggles the list, is `tabindex="-1"`, and focuses the
input first. **Nothing is highlighted by default when the list opens**
(APG's reading; a consumer who wants the first match ready for `Enter`
has `Enter` fall through today and a `autoHighlight` flag if ever asked).

Taking an option: a single combobox sets the input's text to the label,
closes the list, and calls `onValueChange`; a `multiple` one toggles the
value in the array, clears the text, keeps the list open, and adds or
removes a token. A blur — focus leaving the control and its list — closes
the list and keeps whatever was typed: the text is the consumer's, and a
combobox that erases a half-typed city on a stray click is one nobody
trusts.

### 5. The control is `Input`'s box, by the two-class contract, and `multiple` grows it

The root carries `pp-input pp-combobox`: `Input.css` resolves the size,
the invalid tone, the disabled surface and the private variables on the
root exactly as for an `Input` (D-070 §1's contract, and the second time
`Input`'s root has served another component). What differs is *where the
box is drawn*: an `Input` draws it on the `<input>`; a combobox draws it
on a box **around** the input, because with `multiple` the tokens sit
inside the box before the text. So `Combobox.css` draws the box —
border, radius, surface, the control's minimum height — from `Input`'s
variables on a wrapper, and the `<input>` inside is naked. The focus
ring is the box's, via `:has()` on the focused input, so the tokens'
remove buttons ring themselves and the box rings for the text.

Single: the box is the control's height and the input fills it. Multiple:
the box is *at least* the control's height and wraps tokens and the input
(`flex-wrap`), the input taking what is left of the last line. A token is
a `Badge`'s metrics — `--pp-size-6` tall, `--pp-font-size-1`, the neutral
tone's surface — with a remove button of its own (`aria-label="Remove
{label}"`). The end slot holds the chevron, or a `Spinner` while `loading`.
`size`, `invalid`, `disabled`, `required` follow `Input`'s precedence:
prop, then `Field`, then the default.

### 6. The list is `DropdownMenu`'s panel, never narrower than the control, and a listbox

`ComboboxList` renders Radix Popover's content, anchored to the box
(`Anchor`, Popover §8's promise kept) with the tier's `side` (logical,
`bottom`), `align="start"`, `sideOffset="1"` and `collisionPadding="2"` as
steps, and the theme across the portal. The content is a presentation
panel, not the listbox: a `listbox` may hold only options and groups, and
the consumer's `Empty` row must sit somewhere — so the options go in a
listbox of the panel's own and any `ComboboxEmpty` among the children is
rendered after it (D-076 §4). It carries `pp-dropdown-menu pp-combobox__list`, and an
option carries `pp-dropdown-menu__item pp-combobox__option` with the
menu's indicator for a selected option — the same rows, the same
highlight, the same gutter, one stylesheet (D-073 §1's argument for the
CSS). `DropdownMenu.css`'s gutter selector gains `[role="option"]`: a
listbox's options can be chosen, so they align like checkable rows.

The list is never narrower than the control: `min-inline-size` from
Radix's anchor width, which `.stylelintrc.json` admits for this file as
the one value it may take (D-076 §3), and the menu's ceiling above that —
so a list under a narrow field is the field's width, and one under a wide
field is the field's width too. `max-block-size` is the available height
and the list scrolls, the highlighted option kept in view.

The listbox is named as its input is: by the input's `aria-label`, or by
the `<label>` the input has (a `Field`'s), read when the list opens; a
development warning when neither exists, because an unnamed listbox fails
axe and the user alike.

### 7. `multiple`, tokens, and the selected mark

`aria-multiselectable="true"` on the listbox; every selected option is
`aria-selected="true"` and `data-state="checked"` with the mark in the
gutter; taking one keeps the list open. Tokens render in the box in
selection order, each with its remove button; `Backspace` in an empty
input removes the last. A single combobox marks its one selected option
the same way and closes on taking it.

### 8. Forms, and what is not here

`name` on the root renders a hidden input per selected value, so a plain
`<form>` posts the selection; `required` marks the *visible* input, whose
emptiness is what the browser can check. Not here: `creatable` (free text
becomes a value), `autoHighlight`, a `size` on the list, virtualised
options — each a flag or a later item if asked for, none assumed.

---

## Sizing contract justification

`fill` for the control: it is an `Input`'s box on a `Field`'s grid, and
the same argument as 3.8's. `hug` with the exception for the list, which
has no parent in flow and takes the control's width as its floor.

## Anatomy

```
<div class="pp-input pp-combobox" data-size data-invalid data-disabled data-state="open|closed" data-pp-tone?>   the root: Input's variables
  └── <div class="pp-combobox__box">                                                                          the drawn box; Popover's anchor
        ├── <span class="pp-combobox__token" data-value>                                                     (multiple, per selected value)
        │     ├── {label}
        │     └── <button class="pp-combobox__remove" aria-label="Remove {label}" type="button">
        ├── <input class="pp-combobox__control" role="combobox" aria-expanded aria-controls aria-autocomplete="list"
        │          aria-activedescendant? autocomplete="off" id aria-describedby aria-invalid>
        ├── <button class="pp-combobox__toggle" tabindex="-1" aria-label="Show options" type="button">     the chevron
        │     └── <svg>                                                                                        or a Spinner while loading
        └── <input type="hidden" name value>                                                                 (per selected value, with `name`)

body / container
  └── <div>                                                                                                   Radix's positioned wrapper
        └── <div class="pp-dropdown-menu pp-combobox__list" role="presentation" data-state data-side data-align data-pp-theme>   the panel
              ├── <div class="pp-combobox__listbox" role="listbox" id aria-labelledby|aria-label aria-multiselectable? aria-busy?>
              │     ├── <div class="pp-dropdown-menu__item pp-combobox__option" role="option" id aria-selected data-state="checked|unchecked"
              │     │        data-highlighted? aria-disabled? data-value data-label>
              │     │     ├── <span class="pp-dropdown-menu__indicator pp-combobox__indicator">             while selected
              │     │     └── {children}
              │     └── <div class="pp-dropdown-menu__group pp-combobox__group" role="group" aria-labelledby>
              │           └── <div class="pp-dropdown-menu__label pp-combobox__label" id>
              └── <div class="pp-combobox__empty" role="presentation">                                        (consumer's, beside the listbox)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Combobox | `pp-input pp-combobox` | `<div>` | The root; `ref`, `className`, `style` here |
| ComboboxInput | `pp-combobox__control` | `<input role="combobox">` | `ref` → the input; `placeholder`, `aria-label`, `onKeyDown` and the rest land here |
| ComboboxList | `pp-dropdown-menu pp-combobox__list` | `<div role="presentation">` holding the `<div role="listbox">` | `side`, `sideOffset`, `collisionPadding`, `container`; `ref`, `className`, `style` on the panel |
| ComboboxOption | `pp-dropdown-menu__item pp-combobox__option` | `<div role="option">` | `value`, `disabled`, `textValue` |
| ComboboxGroup / ComboboxLabel | `pp-dropdown-menu__group` / `__label` | `<div role="group">` / `<div>` | As the menu's (D-072) |
| ComboboxEmpty | `pp-combobox__empty` | `<div>` | The consumer's "nothing matches" |

## Props

**`Combobox`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `multiple` | `boolean` | `false` | §7; the value's shape follows it |
| `value` / `defaultValue` / `onValueChange` | `string` forms, or `string[]` with `multiple` | — | RULES §5.5 |
| `inputValue` / `defaultInputValue` / `onInputValueChange` | `string` / `string` / `(text: string, reason: 'input' \| 'select' \| 'value') => void` | — / `''` / — | §2 |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` forms | — / `false` / — | |
| `getLabel` | `(value: string) => string` | — | §3 |
| `loading` | `boolean` | `false` | A spinner in the end slot; `aria-busy` on the list |
| `size` / `invalid` / `disabled` / `required` | `Input`'s | field, then defaults | |
| `name` | `string` | — | §8 |
| …rest | `ComponentPropsWithoutRef<'div'>` | — | Root |

**`ComboboxInput`**: `Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue'>`.
**`ComboboxList`**: `side?: 'top' | 'bottom' | 'start' | 'end'` (`'bottom'`), `sideOffset?: Space` (`'1'`),
`collisionPadding?: Space` (`'2'`), `container?`, …`<'div'>`. **`ComboboxOption`**:
`value: string`, `disabled?`, `textValue?`, …`<'div'>`. **`ComboboxGroup`**,
**`ComboboxLabel`**, **`ComboboxEmpty`**: …`<'div'>`.

Exported types: `ComboboxProps`, `ComboboxSingleProps`, `ComboboxMultipleProps`,
`ComboboxInputProps`, `ComboboxListProps`, `ComboboxOptionProps`,
`ComboboxGroupProps`, `ComboboxLabelProps`, `ComboboxEmptyProps`, `ComboboxSide`,
`ComboboxInputReason`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on the root and the list; `aria-expanded` on the input | The list; the chevron turned |
| Highlighted option | `data-highlighted`; `aria-activedescendant` on the input | The menu's hover fill |
| Selected option | `aria-selected`, `data-state="checked \| unchecked"` | The mark in the gutter |
| Invalid / disabled / size | `Input`'s attributes on the root | `Input`'s |
| Loading | `aria-busy` on the list; the spinner | |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-input-*` | `Input`'s | The box: `Input`'s properties apply, unrenamed |
| `--pp-combobox-token-bg` | `--pp-tone-bg` (neutral) | A token |
| `--pp-dropdown-menu-*` | `DropdownMenu`'s | The list, unrenamed |

**Contrast, computed at the gate (D-048 §1).** The box is `Input`'s
pairings; the list is `DropdownMenu`'s; a token is `--pp-tone-text-strong`
on `--pp-tone-bg` (12 on 3, the soft Button's pair). Nothing new is
asserted and nothing missing is leaned on.

## Keyboard interaction

§4's table.

## Accessibility notes

- Input: `role="combobox"`, `aria-expanded`, `aria-controls` → the list,
  `aria-autocomplete="list"`, `aria-activedescendant` → the highlighted
  option, `autocomplete="off"`; a `Field`'s `id`, `aria-describedby`,
  `aria-invalid`, `required`, `disabled`.
- List: `role="listbox"`, named as the input is (§6), `aria-multiselectable`
  with `multiple`, `aria-busy` while loading. Option: `role="option"`,
  `aria-selected`, `aria-disabled`.
- A token's remove button is a real button with a name; `Backspace` is the
  shortcut, not the only way.
- **Manual walkthrough:** Tab to the field, type, confirm the list opens
  and is announced with its name; `ArrowDown`, confirm the option is
  announced and marked; `Enter`, confirm the text is the label and the
  list closed; `ArrowDown` again, `Escape`; with `multiple`, take two,
  confirm two tokens and the list still open, `Backspace` twice on the
  empty input; click the chevron; click outside; Tab away with the list
  open, confirm it closed and the text stayed.

## Container behavior

The control fills at every width; the list is the control's width or
wider up to the ceiling, and scrolls.

## Usage

§1's example, and:

```tsx
<Combobox multiple value={tags} onValueChange={setTags} getLabel={(v) => TAGS[v]}>
  <ComboboxInput placeholder="Add a tag" />
  <ComboboxList>
    {Object.entries(TAGS).filter(([, name]) => name.toLowerCase().includes(query.toLowerCase())).map(([v, name]) => (
      <ComboboxOption key={v} value={v}>{name}</ComboboxOption>
    ))}
  </ComboboxList>
</Combobox>
```

## Don't

```tsx
// ✗ Expecting the component to filter. It shows what you render.
<ComboboxList>{ALL_CITIES.map(…)}</ComboboxList>

// ✗ A value from outside with no label. Pass getLabel.
<Combobox defaultValue="nl-ams">…</Combobox>

// ✗ A dozen static options. That is a Select, and the platform's popup.
<Combobox><ComboboxList>{['S', 'M', 'L'].map(…)}</ComboboxList></Combobox>

// ✗ A physical side. `start` and `end` reverse with the layout.
<ComboboxList side="left" />
```

## Testing notes

- **Unit (jsdom):** the roles and the wiring; typing opens and reports;
  the arrows highlight and wrap, skipping a disabled option,
  `aria-activedescendant` following; `Enter` takes, sets the text, closes,
  reports; `Escape` closes; `Tab` closes and keeps the text; a click takes;
  `multiple`: tokens, the mark, the list stays open, `Backspace` removes,
  the remove button removes, `aria-multiselectable`; `getLabel` for a
  value from outside; controlled and uncontrolled for all three states;
  `Field`'s id, description and error reach the input; `loading` shows the
  spinner and `aria-busy`; `name` posts hidden inputs; refs, `className`,
  `style`; a part outside the root throws; axe open, with options and
  with only an `Empty`, both themes.
- **Browser:** the list is never narrower than the control (a narrow and a
  wide field); the highlighted option scrolls into view in a long list;
  the box rings on focus and a token's button rings itself; a pointer
  press in the list does not blur the input; the theme crosses; the
  chevron turns; reduced motion.
- **Break checks (D-035 §3):** drop the `pointerdown` refusal (the blur
  test); drop `min-inline-size` (the width test); drop the `:has()` gutter
  extension (the alignment of a selected option's label); drop the
  scroll-into-view (the long-list test); drop `getLabel` (the token label
  test).
- **Screenshot:** the gallery renders one open combobox per Matrix cell
  with two of five options matching, one highlighted, one selected.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§2 — no built-in filter.** Alternative: a `filter` prop over the
   children's labels. **Recommendation: none.** The consumer renders the
   matches; async becomes ordinary.
2. **§3 — `getLabel`.** Alternative: object values `{ value, label }`.
   **Recommendation: strings and `getLabel`.** Strings post in forms and
   compare; a label is asked for only when the option is not there.
3. **§4 — nothing highlighted on open.** Alternative: the first match.
   **Recommendation: nothing.** APG's; a flag if asked.
4. **§5 — `Input`'s root, the box drawn around.** Alternative: a
   stylesheet of its own. **Recommendation: `Input`'s root.** The invalid,
   disabled and size logic is written once.
5. **§6 — `DropdownMenu`'s stylesheet for the list.** Alternative: its
   own. **Recommendation: the menu's.** One row, one highlight, one
   gutter, for every list of things the library draws.
