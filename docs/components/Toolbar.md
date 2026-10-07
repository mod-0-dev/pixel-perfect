# Toolbar

A named row of controls reached with one Tab and walked with the arrow
keys. Spec: [`Toolbar.md`](../specs/Toolbar.md).

```tsx
import { Toolbar } from 'pixel-perfect';
```

Put your controls inside — [`Button`](Button.md), [`IconButton`](IconButton.md),
[`Toggle`](Toggle.md), a [`ButtonGroup`](ButtonGroup.md), a
[`Separator`](Separator.md), an [`Input`](Input.md) — and the toolbar
finds them. No wrapper part: it reads its own subtree, skips the
disabled ones, and keeps exactly one as the tab stop, the control that
had focus last or the first. Arrows move between them; `Home` and `End`
jump; the ends wrap.

**Inside a text field the arrows are the field's.** Type in a search
box and the arrows move the caret; Tab out and back lands on the
toolbar's last-focused button, from which the arrows reach everything.
A field is never the tab stop, for exactly that reason. No caret-edge
trick.

**A [`SegmentedControl`](SegmentedControl.md) inside is walked segment by
segment.** The arrows move focus onto each segment without selecting it,
as the APG's toolbar example walks its alignment group, and `Space`
selects the focused one. Standing alone, its arrows select; in a toolbar
the toolbar has them.

## Usage

```tsx
<Toolbar label="Formatting">
  <ButtonGroup label="Style">
    <Toggle size="sm" aria-label="Bold" pressed={bold} onPressedChange={setBold}>B</Toggle>
    <Toggle size="sm" aria-label="Italic" pressed={italic} onPressedChange={setItalic}>I</Toggle>
  </ButtonGroup>
  <Separator orientation="vertical" />
  <IconButton size="sm" label="Insert link"><LinkGlyph /></IconButton>
  <IconButton size="sm" label="Insert image"><ImageGlyph /></IconButton>
  <Input size="sm" type="search" aria-label="Find" placeholder="Find" />
</Toolbar>

<Toolbar label="Tools" orientation="vertical" loop={false}>…</Toolbar>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | **required** | The toolbar's name |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Which arrows move, and row or column |
| `loop` | `boolean` | `true` | Wrap at the ends |
| `gap` | `Space` | `'2'` | A step of the space scale between the controls |

`ref` to the root; `className` and `style` merged; the rest spread.
`role` and `aria-label` are the component's.

## Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Into the toolbar, onto the remembered control; out of it past the rest |
| `ArrowRight` / `ArrowLeft` | Horizontal: next / previous in the writing direction |
| `ArrowDown` / `ArrowUp` | Vertical: the same |
| `Home` / `End` | First / last |
| Any of these in a text field | The field's |

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-toolbar-gap` | `--pp-space-2` (via `gap`) | Between the controls |

## Don't

```tsx
// ✗ Three attached buttons. That is ButtonGroup, every button its own tab stop.
<Toolbar label="View"><ButtonGroup label="View">…</ButtonGroup></Toolbar>

// ✗ Navigation. Links to pages are a <nav>, not a toolbar.
<Toolbar label="Main"><Link href="/">Home</Link>…</Toolbar>

// ✗ A toolbar in a toolbar. One row of controls has one tab stop.
<Toolbar label="Outer"><Toolbar label="Inner">…</Toolbar></Toolbar>

// ✗ role="toolbar" on a Cluster. It has the role and none of the keys.
<Cluster role="toolbar">…</Cluster>
```
