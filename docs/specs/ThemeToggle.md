# 6.2 `ThemeToggle`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `review` — written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-095; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `hug` — a square button, Button's box through the two-class contract with `IconButton` |
| **RSC** | `client` — reads and sets `ThemeProvider`'s context |
| **Depends on** | 6.1 `ThemeProvider` (`review`, baseline only — `done` for Gate B under D-073 §2): the context it reads; 3.2 `IconButton` (`done`): the square box, by its class; 3.1 `Button`: the element; 1.3 `Icon`; 1.4 `VisuallyHidden` |
| **APG pattern** | [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/). A plain button whose name says what pressing it does — not a toggle button: `aria-pressed` would have to say which theme is "on", and the answer is state the server does not have (§6) |

## Purpose

The control in a header that flips the page between light and dark: a
square icon button showing the theme that is on and named for the one a
press brings. Pressing it sets an explicit theme through `ThemeProvider`
— from `system` too, whichever way the system was not.

It deliberately does **not**: offer `system` as a destination (§1 — that is
three choices and a different control, the recipe on the docs page);
carry ARIA state (§6); or read the theme it is *inside* — it shows the
document's, which is the one it controls (§5).

---

## Decisions this spec asks you to approve

### 1. Two destinations, and the three-way is a recipe

The roadmap row depends on `IconButton`: this is the compact control, one
square, and a square has room for one action. Pressing it moves to the
opposite of what is showing. A user on `system` who presses it has chosen,
and the choice is kept (6.1 §3); the way back to `system` is a preference
somewhere with room for three words, which is `ButtonGroup` + `Toggle` +
`useTheme()` — twenty lines the playground's own chrome is made of, given
on the docs page as the recipe. A `cycle` mode (system → light → dark →
system) was considered and rejected: a three-state cycle behind one icon
is a control the user has to press to discover, and the third state's icon
("auto") is a symbol nobody agrees on.

### 2. The face is chosen by CSS from the document's theme, so it is right before React is

`useTheme()`'s `resolvedTheme` is `undefined` on the server and on the
first client render, by design (6.1 §5). A toggle that picked its icon and
its name from it would render a placeholder face, then swap after
hydration, on every load — a flash in the one control whose job is the
theme. So the toggle renders **both** faces, and the stylesheet displays
one:

```css
.pp-theme-toggle [data-when] { display: none; }
:root[data-pp-theme="light"] .pp-theme-toggle [data-when="light"] { display: … }
:root[data-pp-theme="dark"]  .pp-theme-toggle [data-when="dark"]  { display: … }
@media (prefers-color-scheme: light) { :root:not([data-pp-theme]) .pp-theme-toggle [data-when="light"] { display: … } }
@media (prefers-color-scheme: dark)  { :root:not([data-pp-theme]) .pp-theme-toggle [data-when="dark"]  { display: … } }
```

Those are the tokens' own four scopes (D-010) read from the toggle's side,
so the face and the page's colours are decided by the same selectors and
cannot disagree — not before hydration, not after a system change, not
with JavaScript off. `display: none` removes a part from the accessibility
tree as well as the screen, so the visible face's label is the button's
whole name (§3). This is why the attribute is `data-when` and there are two
of everything: the browser, not React, knows the theme first.

`prefers-color-scheme` is a preference query, which the token layer already
uses and RULES §1 does not forbid — the ban is on viewport queries, the
thing a component must not know. A component knowing the user's colour
preference is a component knowing what its own tokens know.

### 3. The icon shows what is on; the name says what a press does

A sun while the page is light, a moon while it is dark: what every theme
toggle the user has met shows, and what reads as a state at a glance. The
accessible name is the action — "Switch to dark theme" while light shows —
because a button is named for what it does, and "Sun" tells a screen reader
user nothing. The two default names are props (`darkLabel`, `lightLabel`)
for translation; the two glyphs are props (`lightIcon`, `darkIcon`) for an
icon set, and the defaults are the library's own, as CodeBlock's copy glyph
and the menus' chevrons are.

### 4. Built on `Button` with `IconButton`'s class, not on `IconButton`

`IconButton` requires `label` and writes it as `aria-label`, which would
override the content — and the content is the point (§2). So the toggle is
`Button` carrying `pp-button pp-icon-button pp-theme-toggle`: Button's
element and stylesheet, IconButton's square through its class (the two-class
contract of D-070 §1, and `IconButton.css` says its root carries both), and
one rule set of its own for the faces. `variant` defaults to `ghost` as
IconButton's does (D-030 §10), `size` to `md`; both, `tone`, `disabled`, the
`--pp-button-*` and `--pp-icon-button-size` overrides pass through. The
type still cannot be built without a name: the two labels have defaults,
and an empty string is refused in development.

### 5. `:root`, not the nearest scope

D-010 lets a theme bind to any element, so a toggle can sit inside a dark
sidebar on a light page. It controls the *document*, so its face is the
document's — the selectors in §2 read `:root`, not the nearest
`[data-pp-theme]`. A toggle inside `<aside data-pp-theme="dark">` on a light
page shows the sun and offers dark, because that is what pressing it does
to the page. Asserted in the browser suite with exactly that markup.

### 6. No ARIA state

Not a toggle button: `aria-pressed="true"` would mean "dark is on" (or
light — the choice is arbitrary, which is the first sign it is wrong), and
it would be an attribute React writes after mount, so it would be wrong on
the server and for the first render, the thing §2 exists to prevent. Not a
`switch` for the same reason. A button whose name changes with the page is
exactly what a screen reader user hears from every other theme control that
works, and the name is in the DOM from the first byte.

### 7. The playground gets a page, and the chrome keeps its switcher

The chrome's three-way switcher is the harness's `setTheme` (D-063 §2) and
the recipe of §1; replacing it with the toggle would re-author every
baseline for a header icon. The toggle has its own page — sizes, variants,
one inside a nested scope — and its own browser tests; the chrome does not
change and no existing baseline moves.

---

## Sizing contract justification

`hug`: a button. Square by `IconButton.css`'s `inline-size`, under the
D-019 exemption that file records (the inline size restates the block size).
Nothing here declares a size.

## Anatomy

```
<button class="pp-button pp-icon-button pp-theme-toggle" type="button" data-variant="ghost" data-size="md" data-pp-tone="neutral">
  └── <span class="pp-button__content">                                            Button's own wrapper (D-030 §2)
        ├── <span class="pp-icon pp-theme-toggle__icon" data-when="light" aria-hidden>   the sun
        ├── <span class="pp-icon pp-theme-toggle__icon" data-when="dark"  aria-hidden>   the moon
        ├── <span class="pp-visually-hidden pp-theme-toggle__label" data-when="light">   "Switch to dark theme"
        └── <span class="pp-visually-hidden pp-theme-toggle__label" data-when="dark">    "Switch to light theme"
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-button pp-icon-button pp-theme-toggle` | `<button>` | Button's, squared by IconButton's class (§4) |
| content | `pp-button__content` | `<span>` | Button's, as on every Button |
| icon | `pp-icon pp-theme-toggle__icon` | `Icon` (`decorative`) | Two; `data-when` says which theme shows it (§2) |
| label | `pp-visually-hidden pp-theme-toggle__label` | `VisuallyHidden` | Two; the displayed one is the button's name (§3) |

`data-when="light" | "dark"` on a part is not state (RULES §4): it names
the document theme under which the part is displayed. The toggle's state is
the document's, on `<html>`.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Button's; IconButton's default |
| `tone` | `Tone` | `'neutral'` | Button's |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button's and IconButton's; the icon follows it as IconButton's does |
| `darkLabel` | `string` | `'Switch to dark theme'` | The name while light shows: what a press does |
| `lightLabel` | `string` | `'Switch to light theme'` | The name while dark shows |
| `lightIcon` | `ReactNode` | a sun | Shown while light shows |
| `darkIcon` | `ReactNode` | a moon | Shown while dark shows |
| `disabled` | `boolean` | `false` | Button's |
| `onClick` | `MouseEventHandler` | — | Runs first; `preventDefault()` keeps the theme |

Extends Button's props minus `children`, `asChild`, `aria-label` and
`loading`. `ref` to the button; `className` and `style` merged; the rest
spread. `ThemeToggleProps` exported.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Which face | `:root[data-pp-theme]`, or the system's preference with none (§2) | Sun or moon; the matching name |
| Disabled | Button's `disabled` | Button's |

No `data-state`: the state is the document's.

## Styling API

Button's `--pp-button-*` and IconButton's `--pp-icon-button-size`, through
the classes the root carries. Nothing of its own: the toggle draws no pixel
Button and IconButton do not.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` | Focuses the button |
| `Enter` / `Space` | Presses it: the opposite theme is set |

Button's. Cross-checked against the APG button pattern.

## Accessibility notes

- Name: the displayed label, "Switch to dark theme" or "Switch to light
  theme" — the action, not the state (§3). Right from the first byte,
  because the choice of label is the stylesheet's (§2).
- The icons are `Icon decorative` (`aria-hidden`), so the name is the label
  alone; the hidden face is `display: none` and out of the tree.
- No `aria-pressed`, no `role="switch"` (§6).
- Focus ring: Button's.
- After a press the name changes with the page; nothing is announced beyond
  what the button says next time it is read, which is what every working
  theme control does. A page that wants "Dark theme on" announced owns a
  `role="status"` line.

## Container behavior

None. A square button.

## Usage

```tsx
import { ThemeToggle } from 'pixel-perfect';

// In a header, under the app's ThemeProvider.
<ThemeToggle />

// Translated, outlined, small
<ThemeToggle size="sm" variant="outline" darkLabel="Zum dunklen Design" lightLabel="Zum hellen Design" />

// Your icon set
<ThemeToggle lightIcon={<SunIcon />} darkIcon={<MoonIcon />} />
```

The three-way, when the app wants `system` reachable:

```tsx
const { theme, setTheme } = useTheme();
<ButtonGroup label="Theme">
  {(['system', 'light', 'dark'] as const).map((value) => (
    <Toggle key={value} size="sm" variant="outline" pressed={theme === value} onPressedChange={() => setTheme(value)}>
      {value[0].toUpperCase() + value.slice(1)}
    </Toggle>
  ))}
</ButtonGroup>
```

## Don't

```tsx
// ✗ Outside a ThemeProvider. useTheme() throws; there is nothing to toggle.
<ThemeToggle />

// ✗ Choosing the face yourself from resolvedTheme. It is undefined on the
//   server; the stylesheet already chooses, from the same scopes the tokens use.
<ThemeToggle lightIcon={resolvedTheme === 'light' ? <Sun /> : null} />

// ✗ Two toggles because the page has a dark sidebar. Both control <html>;
//   both show the document's face (§5). One is enough.
```

## Tests

- **Unit:** both icons and both labels rendered with `data-when`; the
  root carries the three classes and Button's `data-variant` / `data-size`
  / `data-pp-tone`, `ghost` and `md` by default; a press sets the opposite
  of `resolvedTheme` (light → `dark`, dark → `light`, `system` on a dark
  system → `light`); `onClick` first and `preventDefault()` keeps the theme;
  custom labels and icons; an empty label warns in development; `disabled`
  presses nothing; `ref`, `className`, `style`; throws outside a provider;
  axe.
- **Browser:** under `light` the sun is displayed, the moon is not, and the
  accessible name is "Switch to dark theme"; pressing sets `dark` on
  `<html>`, the faces swap and the name flips; under `system` with an
  emulated dark system the moon shows with no attribute; inside a nested
  `data-pp-theme="dark"` on a light page the sun shows (§5); the box is
  IconButton's — square, the control height for each size, beside an
  `IconButton` of the same size; the served HTML carries both labels.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **Flip, or cycle through `system`?** Flip (§1). The third state is a
   different control, given as a recipe.
2. **Icon shows the current theme, or the destination?** Current (§3); the
   name is the destination.
3. **`aria-pressed`?** No (§6): which theme is "on" is arbitrary, and it is
   state the server does not have.
4. **Follow the nearest theme scope, or the document's?** The document's
   (§5): it is what the toggle controls.
5. **Replace the chrome's switcher?** No (§7): every baseline would move
   for a header icon, and the switcher is the recipe.
6. **Ship default glyphs?** Yes (§3), as other components do, overridable.
