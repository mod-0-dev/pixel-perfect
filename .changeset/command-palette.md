---
'pixel-perfect': minor
---

Add `CommandPalette` (4.14): every command one keystroke away — a search
field over a list of commands, in a modal. Made of the tier with no package
added: Dialog's modal and scrim, Combobox's highlight, DropdownMenu's row,
Kbd's key caps. `CommandPalette` (with an optional `hotkey` such as
`mod+k`), `Trigger`, `Content`, `Input`, `List`, `Item` (`onSelect` with a
preventable close), `Group`, `Label`, `Shortcut` (`keys`), `Empty`. The
consumer renders the commands that match; the first is highlighted as the
user types and `Enter` runs it.
