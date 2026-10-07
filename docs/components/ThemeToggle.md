# ThemeToggle

A square button that flips the page between light and dark. Spec:
[`ThemeToggle.md`](../specs/ThemeToggle.md).

```tsx
import { ThemeToggle } from '@mod-0-dev/pixel-perfect';
```

Under a [`ThemeProvider`](ThemeProvider.md). Shows a sun while the page is
light and a moon while it is dark; named "Switch to dark theme" or "Switch
to light theme" — what a press does. Pressing it sets an explicit theme,
from `system` too.

**The face is the stylesheet's, not React's.** Both faces are rendered and
CSS displays one, chosen from `<html>`'s `data-pp-theme` or, with none,
from `prefers-color-scheme` — the same scopes the tokens resolve by. So
the toggle is right on the first paint, before hydration, and cannot
disagree with the page. Nothing to wire.

## Usage

```tsx
<header>
  <ThemeToggle />
</header>

// Translated, outlined, small
<ThemeToggle size="sm" variant="outline" darkLabel="Zum dunklen Design" lightLabel="Zum hellen Design" />

// Your icon set
<ThemeToggle lightIcon={<SunIcon />} darkIcon={<MoonIcon />} />
```

## Props

Button's, minus `children`, `asChild`, `aria-label` and `loading`, plus:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | IconButton's default |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The icon follows |
| `tone` | `Tone` | `'neutral'` | |
| `darkLabel` | `string` | `'Switch to dark theme'` | The name while light shows |
| `lightLabel` | `string` | `'Switch to light theme'` | The name while dark shows |
| `lightIcon` | `ReactNode` | a sun | Shown while light shows |
| `darkIcon` | `ReactNode` | a moon | Shown while dark shows |
| `onClick` | `MouseEventHandler` | — | Runs first; `preventDefault()` keeps the theme |

Styling: Button's `--pp-button-*` and IconButton's `--pp-icon-button-size`
— the root carries both classes.

## The three-way

When the app wants `system` reachable, that is a preference with room for
three words, not a square:

```tsx
const { theme, setTheme } = useTheme();

<SegmentedControl label="Theme" size="sm" value={theme} onValueChange={(value) => setTheme(value as Theme)}>
  <SegmentedControlItem value="system">System</SegmentedControlItem>
  <SegmentedControlItem value="light">Light</SegmentedControlItem>
  <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
</SegmentedControl>
```

A [`SegmentedControl`](SegmentedControl.md): a theme is exactly one of
three, so it is a radio group — "Light, radio button, checked, 2 of 3".
This recipe was a `ButtonGroup` of `Toggle`s until D-107 §3, which a
screen reader heard as three pressed-or-not buttons, and which
[`ButtonGroup.md`](ButtonGroup.md) has always said a single choice is not.
`theme` is `system` on the server and the first client render (the
provider reads the stored choice after mount), so the checked segment
catches up one render after hydration; the page's colours do not wait.

## Don't

```tsx
// ✗ Outside a ThemeProvider. useTheme() throws; there is nothing to toggle.
<ThemeToggle />

// ✗ Choosing the face yourself from resolvedTheme. It is undefined on the
//   server; the stylesheet already chooses, from the scopes the tokens use.
<ThemeToggle lightIcon={resolvedTheme === 'light' ? <Sun /> : null} />

// ✗ One per themed region. Every toggle controls <html> and shows the
//   document's face — a toggle in a dark sidebar on a light page shows the
//   sun and offers dark. One is enough.
```
