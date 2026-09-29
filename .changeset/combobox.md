---
'pixel-perfect': minor
---

Add `Combobox` (4.11): a text input that offers a list of options as the
user types, and takes one or, with `multiple`, several as tokens.
`Combobox`, `ComboboxInput`, `ComboboxList`, `ComboboxOption`,
`ComboboxGroup`, `ComboboxLabel`, `ComboboxEmpty`. The component owns the
text, the selection, the open state, the highlight (`aria-activedescendant`;
focus never leaves the input) and the keyboard; the consumer renders the
options that match, which is what makes options from a server nothing
special (`loading`). The control is `Input`'s box, the list is
`DropdownMenu`'s panel anchored by Popover's primitive and never narrower
than the control; `getLabel` names a value set from outside; `name` posts
hidden inputs.
