# 6.6 `Toolbar`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `review` — written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-098; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` — a bar across its container; block-level, `min-inline-size: 0` |
| **RSC** | `client` — a roving tabindex is key handling and focus tracking |
| **Depends on** | 3.4 `ButtonGroup` (`done`): the attached groups inside it, and the ruling that it is *not* this component (D-030 §7, D-031); 3.1 `Button`, 3.2 `IconButton`, 3.5 `Toggle`, 1.5 `Separator`: what goes in it |
| **APG pattern** | [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/): `role="toolbar"`, a name, `aria-orientation` when vertical, one tab stop, arrows between controls, `Home` / `End` |

`ButtonGroup`'s spec ruled three times over that it would not be this:
"roving is right for a dense, persistent toolbar of twenty controls and
wrong for three attached buttons … `Toolbar` (6.6) is the roving
component, and this is why it is a separate entry." This is that entry.

## Purpose

A named row of controls that act on the same thing — an editor's
formatting bar, a table's bulk actions, a canvas's tools — reached with
one `Tab` and walked with the arrow keys, so a keyboard user crosses
twenty buttons in one stop instead of twenty. It lays the controls out in
a wrapping row with a gap (or a column), and it manages which of them is
the tab stop.

It deliberately does **not**: style its controls (they are `Button`,
`IconButton`, `Toggle`, `ButtonGroup`, `Separator`, as given); own their
state; or intercept the arrow keys inside a text field (§4).

---

## Decisions this spec asks you to approve

### 1. A roving tabindex over whatever controls are inside, found by the DOM

```tsx
<Toolbar label="Formatting">
  <ButtonGroup label="Style">
    <Toggle aria-label="Bold">B</Toggle>
    <Toggle aria-label="Italic">I</Toggle>
  </ButtonGroup>
  <Separator orientation="vertical" />
  <IconButton label="Link"><LinkGlyph /></IconButton>
  <Button size="sm" variant="outline">Publish</Button>
</Toolbar>
```

No `ToolbarItem` wrapper and no registration: the toolbar finds its
controls in its own subtree — buttons, links, inputs, selects, and
`role`s that mean a control — skips the disabled ones, and keeps exactly
one at `tabIndex={0}` and the rest at `-1`. A wrapper part would make
every control two elements and every `ButtonGroup` inside it a third,
and the APG's own example manages the tabindex by walking the DOM. The
set is re-read after every render and on every key, so a control that
mounts, unmounts or becomes disabled needs nothing from the consumer.
Nothing is written on the controls but `tabindex`.

### 2. The tab stop is the last control focused, else the first

`Tab` into the toolbar lands on the control that had focus last time —
the APG's recommendation, so a user who left at "Italic" returns to
"Italic" — and on the first control the first time or when that control
is gone. A pointer click on any control makes it the stop. Tracked by
element, not by index, so a control inserted before it does not move it.
A text field is the one control that is never remembered (§4).

### 3. Arrows by orientation, mirrored in RTL, wrapping at the ends

`orientation="horizontal"` (default): `ArrowRight` next, `ArrowLeft`
previous, read in the toolbar's resolved direction so that under
`dir="rtl"` `ArrowRight` goes to the control on the right, which is the
previous one — Calendar's rule (D-086 §2), through the same
`directionOf`. `vertical`: `ArrowDown` / `ArrowUp`, and
`aria-orientation="vertical"` written. `Home` and `End` go to the first
and last. The ends wrap (`loop`, `true`): the APG's example wraps, and a
bar of tools is a cycle to a user who reaches for the next one. `loop={false}`
stops at the ends for a toolbar whose order is a sequence.

### 4. Inside a text field the arrows are the caret's

A toolbar may hold an `Input` — a search field on a table's bar. The
APG says the arrows then edit, not navigate; `Home` and `End` too. So the
toolbar leaves a key alone when it was pressed in a text-editing control
(`input` of a text-like type, `textarea`, `contenteditable`): `Tab` out
and back is the way from the field to the buttons. Not a caret-position
heuristic (navigate only at the edges): it is a surprise the first time
and a habit never, and the APG's own textbox example does not do it.

For "out and back" to reach the buttons, **a text field is never the
remembered stop** (D-098 §1): focused, it keeps the stop where it was,
so `Tab` back in lands on a button the arrows work from. Remembered, the
field would be where `Tab` lands, its arrows would be the caret's, and
every control after it would be unreachable from outside by keyboard.

### 5. `ButtonGroup`s, `Separator`s and menus inside

A `ButtonGroup` inside keeps its `role="group"` and its name; its buttons
are controls of the toolbar like any other, so arrows walk into and out
of the group without a step. A `Separator` is not a control and is
skipped; `orientation="vertical"` is the consumer's line, because the
toolbar does not know which gaps are boundaries. A `DropdownMenu`'s
trigger is a control; its open list is portalled, outside the toolbar's
subtree, and Radix's own arrow handling has it. The toolbar handles a key
only when the key's target is one of its controls.

### 6. Layout: a wrapping row with a gap, or a column

`fill`: a block that spans its container, `display: flex; flex-wrap:
wrap; gap: var(--pp-toolbar-gap, var(--pp-space-2)); align-items:
center`; vertical is `flex-direction: column; align-items: flex-start`.
`gap` is a prop on the space scale as `Cluster`'s is. It is not built on
`Cluster` (`Cluster` is a layout with no role and, per its own spec,
"will not guess" a toolbar); it is the same three declarations under a
role, and a `role="toolbar"` on a `Cluster` is that spec's "don't".

### 7. A name is required

`label` is required, as `ButtonGroup`'s and `IconButton`'s are: an
unnamed toolbar is an unnamed landmark-like region to a screen reader,
and a type that allows it is a review comment waiting to happen.

---

## Sizing contract justification

`fill`: block-level, `min-inline-size: 0`, no inline size; the controls
wrap within what the parent gives. A toolbar that hugged would sit at the
start of its row and leave the end empty for no reason a consumer chose.

## Anatomy

```
<div class="pp-toolbar" role="toolbar" aria-label="Formatting" data-orientation="horizontal">
  └── {children}   — the consumer's controls; one carries tabindex="0", the rest "-1"
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-toolbar` | `<div>` | `role="toolbar"`, the name, `aria-orientation="vertical"` when vertical, `data-orientation` always |

No parts: the controls are the consumer's components.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | **required** | The toolbar's name (§7) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Which arrows, and the layout (§3, §6) |
| `loop` | `boolean` | `true` | Wrap at the ends (§3) |
| `gap` | `Space` | `'2'` | A step of the space scale (§6) |

`ref` to the root; `className` and `style` merged; the rest spread
(`role` and `aria-label` are the component's). `ToolbarProps` exported.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Orientation | `data-orientation`, `aria-orientation` (vertical only) | Row or column |
| The tab stop | `tabindex="0"` on one control | None: it is which control `Tab` reaches |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-toolbar-gap` | `--pp-space-2` (via `gap`) | Between controls |

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Into the toolbar, onto the remembered control; out of it, past every other control |
| `ArrowRight` / `ArrowLeft` | Horizontal: next / previous control in the writing direction; wraps unless `loop={false}` |
| `ArrowDown` / `ArrowUp` | Vertical: the same |
| `Home` / `End` | First / last control |
| Any of these in a text field | Left to the field (§4) |
| `Enter`, `Space` | The control's own |

Cross-checked against the APG Toolbar pattern; the one divergence from its
text is §4's refusal of the caret-edge heuristic, which its own example
also omits.

## Accessibility notes

- `role="toolbar"` with `aria-label={label}`; `aria-orientation` only
  when vertical, since horizontal is the role's default.
- One tab stop (§2), so a toolbar of twenty is one `Tab` to cross — which
  is why `ButtonGroup` alone is not this (D-030 §7).
- Nothing is announced on arrow moves beyond the control that gains focus,
  which is the pattern.
- The controls keep their own names, roles, states and rings.

## Container behavior

The row wraps by its own content at any width; no query.

## Usage

```tsx
<Toolbar label="Formatting">
  <ButtonGroup label="Style">
    <Toggle aria-label="Bold" pressed={bold} onPressedChange={setBold}>B</Toggle>
    <Toggle aria-label="Italic" pressed={italic} onPressedChange={setItalic}>I</Toggle>
  </ButtonGroup>
  <Separator orientation="vertical" />
  <IconButton label="Insert link"><LinkGlyph /></IconButton>
  <IconButton label="Insert image"><ImageGlyph /></IconButton>
</Toolbar>

<Toolbar label="Bulk actions" orientation="vertical" loop={false}>…</Toolbar>
```

## Don't

```tsx
// ✗ Three attached buttons. That is ButtonGroup, every button its own tab stop.
<Toolbar label="View"><ButtonGroup label="View">…</ButtonGroup></Toolbar>

// ✗ Navigation. Links to pages are a <nav>, not a toolbar.
<Toolbar label="Main"><Link href="/">Home</Link>…</Toolbar>

// ✗ A toolbar in a toolbar. One row of controls has one tab stop.
<Toolbar label="Outer"><Toolbar label="Inner">…</Toolbar></Toolbar>

// ✗ Reaching for role="toolbar" on a Cluster. It has the role and none of the keys.
<Cluster role="toolbar">…</Cluster>
```

## Tests

- **Unit:** role, name, `data-orientation`, `aria-orientation` only when
  vertical; the first control is `tabindex="0"` and the rest `-1`; arrows
  move focus and the stop, wrapping, and not wrapping with `loop={false}`;
  `Home` / `End`; vertical uses `Up` / `Down` and ignores `Left` / `Right`;
  a disabled control is skipped; a control that unmounts while it is the
  stop hands the stop to the first; a click on a control makes it the
  stop; inside a text input the arrows and `Home` / `End` are left alone
  and the field is never the stop, so `Tab` out and back lands on a button;
  a `ButtonGroup`'s buttons are controls and it keeps its group; RTL
  mirrors `Left` / `Right`; `gap` writes `data-pp-gap`; `ref`,
  `className`, `style`, rest; `label` required at the type level; axe.
- **Browser:** `Tab` from before the toolbar lands on its first control
  and `Tab` again leaves it past the rest; `ArrowRight` walks the row,
  `End` and `Home` jump; under `dir="rtl"` `ArrowRight` goes to the
  control on the right; the row wraps in the narrow cell and spans the
  wide one; the vertical toolbar is a column and answers `ArrowDown`.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **A `ToolbarItem` wrapper, or find the controls?** Find them (§1), as
   the APG's example does.
2. **Wrap at the ends?** Yes by default, `loop={false}` to stop (§3).
3. **Arrows inside a text field?** The field's (§4), no caret heuristic.
4. **Remember the last control?** Yes (§2), by element.
5. **Build on `Cluster`?** No (§6): a role with keys is a component.
