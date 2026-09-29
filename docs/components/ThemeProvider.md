# ThemeProvider

The page's theme — `system`, `light` or `dark` — decided before the first
paint, kept across loads and tabs, readable and settable from anywhere
below. Spec: [`ThemeProvider.md`](../specs/ThemeProvider.md).

```tsx
import { ThemeProvider, useTheme } from 'pixel-perfect';
```

One provider, first in `<body>`, writing `data-pp-theme` on `<html>`. It
renders no element of its own: the children as given, and one inline
`<script>` ahead of them that applies the stored choice as the parser
reaches it, so a page set to dark never flashes light while React loads.

**`system` is no attribute at all.** The tokens' own
`prefers-color-scheme` block decides, which is what the page does with no
JavaScript. A theme for *part* of a page is that part's own attribute:
`<aside data-pp-theme="dark">` — no provider involved (D-010).

## Usage

```tsx
// app/layout.tsx
import { ThemeProvider } from 'pixel-perfect';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script sets the attribute before React
    // hydrates, and the server rendered <html> without one.
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

// A client component, anywhere below.
const { theme, resolvedTheme, setTheme } = useTheme();
setTheme('dark');
```

An app that persists the choice itself — a cookie read in the root layout,
an account setting — passes `value` and handles `onValueChange`; the
provider then writes the prop, touches no storage, and its script carries
the value so the first paint is right on a browser that has stored nothing.
Render the attribute on `<html>` yourself too, for a document that is right
without the script:

```tsx
<html lang="en" data-pp-theme={theme === 'system' ? undefined : theme}>
  <body>
    <ThemeProvider value={theme} onValueChange={saveThemeCookie}>{children}</ThemeProvider>
  </body>
</html>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `'system' \| 'light' \| 'dark'` | — | Controlled |
| `defaultValue` | `'system' \| 'light' \| 'dark'` | `'system'` | Uncontrolled starting value; what the script applies when nothing is stored |
| `onValueChange` | `(theme) => void` | — | Every change: `setTheme`, or another tab's, in both modes |
| `storageKey` | `string \| null` | `'pp-theme'` | `null`: kept for the page's life only. Ignored when controlled |
| `nonce` | `string` | — | For the inline script under a Content-Security-Policy |

`value`, not `theme`: RULES §5 bans `theme` as a prop name, since on any
other component it would be a synonym for `tone`, and `value` /
`defaultValue` / `onValueChange` is the vocabulary the rules give every
controllable state.

## `useTheme()`

| Field | Type | Notes |
| --- | --- | --- |
| `theme` | `'system' \| 'light' \| 'dark'` | The choice. `defaultValue` (or the controlled `value`) on the server and the first client render; the stored choice after mount |
| `resolvedTheme` | `'light' \| 'dark' \| undefined` | What is showing. `undefined` until mounted while `theme` is `system` — the server does not know the system |
| `setTheme` | `(theme) => void` | Sets it (uncontrolled) or asks (controlled) |

Throws outside a `ThemeProvider`.

**The DOM is right before React is.** The attribute is set by the script
before the first paint; `theme` and `resolvedTheme` catch up after mount,
because the server cannot know the browser's storage or its system and a
first client render that guessed would be a hydration mismatch. A control
that renders from `theme` shows the default for one render; the page's
colours never do.

## Don't

```tsx
// ✗ A provider per scope. A theme binds to any element by its attribute
//   (D-010), and two providers are two authorities over one <html>.
<aside><ThemeProvider defaultValue="dark">…</ThemeProvider></aside>
// ✓
<aside data-pp-theme="dark">…</aside>

// ✗ Rendering resolvedTheme on the server. It is undefined there on purpose.
<p>Showing {resolvedTheme}</p>
// ✓ Render from the attribute, or after mount.

// ✗ A wrapper "for the context". The provider renders no element; a box
//   here sits between the layout and the content and has to be sized.
<ThemeProvider><div className="app">{children}</div></ThemeProvider>

// ✗ Resolving system yourself and passing it as the theme. The tokens
//   already follow prefers-color-scheme with no attribute, and an
//   attribute that says "dark" for a user who said "system" is a lie the
//   next component reads.
<ThemeProvider value={prefersDark ? 'dark' : 'light'} />
```

## Testing in jsdom

jsdom has no `matchMedia`, and the provider asks it which theme the system
prefers. Stub it once in your test setup, as this repository's
`src/test/setup.ts` does:

```ts
window.matchMedia ??= (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
```
