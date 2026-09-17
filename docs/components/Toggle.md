# Toggle

A button that stays pressed. Spec:
[`tier-3a-action.md` §3.5](../specs/tier-3a-action.md#35-toggle).

```tsx
import { Toggle } from 'pixel-perfect';
```

## It is not `Switch`

| | `Toggle` | `Switch` (3.12) |
| --- | --- | --- |
| ARIA | `aria-pressed` on a button | `role="switch"`, `aria-checked` |
| Effect | immediate | a value that submits with the form |
| Lives in | a toolbar, a filter bar | a settings list, a form |
| Looks like | a button that stays down | a track and a thumb |

Toolbar with an icon → `Toggle`. Settings row with a label to its left →
`Switch`.

## Usage

```tsx
<Toggle defaultPressed onPressedChange={setBold} aria-label="Bold">
  <Icon decorative><Bold /></Icon>
</Toggle>

<Toggle pressed={showArchived} onPressedChange={setShowArchived}>
  Show archived
</Toggle>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `pressed` | `boolean` | — | Controlled |
| `defaultPressed` | `boolean` | `false` | Uncontrolled |
| `onPressedChange` | `(pressed: boolean) => void` | — | Fires in both modes |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Off is quiet; on fills in |
| `tone`, `size`, `disabled`, `asChild`, `type` | as [`Button`](Button.md) | as `Button` | |

`ref` goes to the root, which carries both `pp-button` and `pp-toggle`. Exposed
as `data-state="on" \| "off"` alongside `aria-pressed`.

**No `loading`.** A toggle's effect is immediate by definition. If it needs a
spinner it is an action, and an action is a `Button`.

**Both modes, always** (RULES §5.5). Pass `pressed` on every render, or pass
`defaultPressed` and never `pressed`. Switching between them mid-life warns in
development instead of silently going inert.

## `data-state="on"` / `"off"`

Not `checked` / `unchecked` — those stay with `aria-checked` controls
(`Checkbox`, `Switch`). The two vocabularies track the two ARIA properties
exactly, so what a control *is* is visible in the DOM without reading our
source.

```css
.pp-toggle[data-state="on"] { /* yours */ }
```

## Styling

Every `--pp-button-*` property, plus:

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-toggle-bg-on` | `--pp-tone-bg-active` | Background when pressed |
| `--pp-toggle-color-on` | `--pp-tone-text-strong` | Label when pressed |

Pressed sits at the filled end of the background ramp, so hovering holds the
fill and strengthens the border instead. Walking the background back toward its
resting colour on hover reads as releasing the button.

## Don't

```tsx
// ✗ a settings row is a Switch — it has a value and it submits.
<Toggle pressed={emails} onPressedChange={setEmails}>Email notifications</Toggle>

// ✗ the name must not change with the state. "Bold" → "Unbold" is announced as
//   a DIFFERENT control appearing; the pressed state is announced separately.
<Toggle pressed={bold} aria-label={bold ? 'Unbold' : 'Bold'}><Bold /></Toggle>

// ✗ controlled and uncontrolled at once. Decide once.
<Toggle pressed={on} defaultPressed onPressedChange={setOn} />

// ✗ icon-only with no name.
<Toggle><Icon decorative><Bold /></Icon></Toggle>
// ✓ three words of aria-label, rather than a fourth component
<Toggle aria-label="Bold"><Icon decorative><Bold /></Icon></Toggle>
```
