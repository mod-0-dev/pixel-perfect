# 6.1 `ThemeProvider`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `review` — written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written, one renamed by the rule lint (§3, D-094 §1); rulings and findings in D-094; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `n/a` — renders no element of its own: the children as given and one inline `<script>` |
| **RSC** | `client` — a context, an effect that follows `prefers-color-scheme`, a storage listener. The script it renders is emitted on the server too, which is the point |
| **Depends on** | T0 (`done`): the tokens' four theme scopes (D-010, D-011) and the base layer's `color-scheme` |
| **APG pattern** | None. The user-facing surface is 6.2 `ThemeToggle`; this is the plumbing under it |

The roadmap row says "No-flash SSR theme, `prefers-color-scheme` + override".
Every piece of that already exists in the playground's chrome (D-063 §1): a
script in the layout that applies a stored choice before the first paint,
a switcher that sets or clears `data-pp-theme` on `<html>` and keeps the
choice under one key, and `System` meaning *no attribute* so the tokens'
own `prefers-color-scheme` block decides. This component is that, made a
library concern and given the API rules the library gives everything else.

## Purpose

Decides what `data-pp-theme` on `<html>` says — nothing, `light` or
`dark` — and makes it say so **before the first paint**, so a page a user
set to dark never flashes light while React loads. Holds the choice as
state any component below can read and set (`useTheme()`), persists it
across loads and tabs, and follows the operating system while the user has
not chosen.

It deliberately does **not**: theme a *part* of a page — that is the
attribute on that part, no component needed (D-010; §1 below); resolve
`system` into an attribute (§2); render a control (6.2); animate a switch
(§8); or manage more than two themes (§9).

---

## Decisions this spec asks you to approve

### 1. One provider, at the root, writing `<html>`; a scope is an attribute

```tsx
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

`ThemeProvider` writes `data-pp-theme` on `document.documentElement` and
nowhere else. D-010 lets a theme bind to any element, and that stays how a
dark sidebar in a light app is made: `<aside data-pp-theme="dark">`. A
provider that took a `target` would be a second way to write one
attribute, and a nested `ThemeProvider` would be two authorities over one
`<html>`. There is one, and the docs page's first "don't" is a second.

`suppressHydrationWarning` on `<html>` is the consumer's line, as in the
playground (D-063 §1): the server renders `<html>` without the attribute
when the choice lives in the browser, the script below adds it before
React hydrates, and that is the one attribute React must not "correct".
React 19 treats an attribute mismatch as a development warning, not the
#418 of D-093 §1; the line silences the warning it would otherwise print
on every load.

### 2. Three words, and `system` is the absence of an attribute

```ts
type Theme = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';
```

`system` removes the attribute; the tokens' `:root:not([data-pp-theme])`
block under `prefers-color-scheme: dark` then decides, which is the
library's own default and its no-JavaScript path (D-010, D-063 §1). The
provider does **not** resolve `system` to `light` or `dark` and write
*that*: it would make the page depend on the script for its default
colours, and it would make `[data-pp-theme]` — the selector every scoped
theme and every overlay's copy reads (overlay-foundation §3) — say
something the user did not.

### 3. Controlled and uncontrolled, in RULES §5.5's words, with the app's persistence in controlled mode

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `Theme` | — |
| `defaultValue` | `Theme` | `'system'` |
| `onValueChange` | `(theme: Theme) => void` | — |
| `storageKey` | `string \| null` | `'pp-theme'` |
| `nonce` | `string` | — |

`value` / `defaultValue` / `onValueChange`, and not `theme` /
`defaultTheme` / `onThemeChange`: RULES §5 bans `theme` as a prop name,
because on every other component it would be a synonym for `tone`, and the
rule lint enforces the ban by name. The vocabulary the rule points to is
RULES §5.5's own, and it reads right here — the provider's value *is* the
theme. The hook keeps the word: `useTheme()` returns `theme`, which is a
field, not a prop, and there is nothing else it could be called.

RULES §5.5: both, always. **Uncontrolled** is the common case: the
provider owns the choice, persists it under `storageKey` in
`localStorage` (an explicit `light` or `dark` is stored; `system` is
stored as *nothing*, `removeItem`, so a key that was never set and a user
who chose the system are the same state — the playground's convention,
which the screenshot suite already relies on), and follows another tab's
change through the `storage` event. `storageKey={null}` keeps the choice
for the life of the page only.

**Controlled** (`value` given) is for an app that persists the choice
itself — a cookie read in the root layout, an account setting. The
provider writes the attribute from the prop, reports `setTheme()` through
`onValueChange` and touches no storage. The script (§4) then carries the
controlled value, so the first paint is right without the browser having
stored anything; such an app also renders `<html data-pp-theme={theme}>`
itself, and the two agree.

### 4. No flash: an inline script, rendered by the provider, before its children

The provider renders one `<script>` ahead of `children`. It runs as the
parser reaches it — before any content after it has been laid out or
painted — reads the stored choice (uncontrolled) or carries the given one
(controlled) and sets or removes the attribute on `<html>`. In a Next App
Router layout the provider is the first thing in `<body>`, so the whole
page paints themed. This is the mechanism the playground has used since
D-063 as a `beforeInteractive` `next/script` in `<head>`; a library
component cannot import `next/script` (RULES §8 — no runtime dependency
outside Tier 4) and does not need to: React renders an inline script in
place, and a script in the body's first bytes is early enough.

The script is a function serialised with its arguments — the key, the
default, the controlled value — in a `try` so a browser that forbids
storage still themes the page from the default. `nonce` is passed through
for a Content-Security-Policy that requires one. The script is the only
thing the provider renders besides the children: no wrapper element,
because a wrapper would be a box between the app's layout and the app's
content, which is a sizing-contract problem waiting to happen.

### 5. `useTheme()`: what the app can know, and when

```ts
const { theme, resolvedTheme, setTheme } = useTheme();
```

- `theme` — the choice: `system`, `light` or `dark`. On the server and on
  the first client render it is `defaultValue` (or the controlled `value`);
  the stored choice is read in an effect after mount, because the server
  cannot know it and a first client render that differed from the server's
  would be D-093 §1 again. The **attribute** is right from the first paint
  regardless (§4); it is the React state that catches up one render later.
  A component that renders from `theme` must be built for that render, and
  6.2 is.
- `resolvedTheme` — `light` or `dark`: what is showing. Equal to `theme`
  when that is not `system`; otherwise read from
  `matchMedia('(prefers-color-scheme: dark)')` after mount and kept live
  through its `change` event, and **`undefined` until then** — the server
  does not know the system, and a guess would be a mismatch or a flash.
- `setTheme(next)` — sets it (uncontrolled) or asks (controlled), and
  reports through `onValueChange` either way. So does a change from
  another tab: the app that mirrors the choice somewhere wants both.

Throws outside a provider, as `useToast()` does: a theme control with no
provider is a bug, not a default.

### 6. Storage and the media query are read in effects, never at module scope

RULES §7. `matchMedia`, `localStorage` and `document` are touched in
effects and event handlers only, so the module imports cleanly on the
server and the first client render is the server's. The storage listener
and the media listener are added on mount and removed on unmount.

### 7. The playground dogfoods it

The layout's `THEME_SCRIPT` and the switcher's own storage code are
replaced by `ThemeProvider` and `useTheme()`. Same key, same values, same
attribute, same DOM for the switcher, so the screenshot suite's stored
choice and the harness's `setTheme` helper are unchanged and no baseline
moves. The provider becomes the first child of `<body>`, before the
`.shell` wrapper; the `HydrationMark` (D-093 §5) stays where it is.

### 8. No `disableTransitionOnChange`

A switch animates whatever declares a transition on a colour — a control's
border and background over `--pp-duration-fast` — while the page's own
background snaps. The library that made this a prop suppresses transitions
for a frame with an injected `* { transition: none !important }`, and
`!important` is RULES §10's table. Recommendation: **no prop**. The
library's transitions are 140ms and on controls; a switch that fades them
is what every themed site does, and an app that wants otherwise owns one
line of CSS. Recorded as a decision so it is not re-litigated per component.

### 9. Two themes

`Theme` is a closed union. A "themes" array, custom theme names, or a
high-contrast third theme would be a token-layer decision first (four
scopes are generated per theme, D-011), and no consumer has asked. The
type says two; adding a third is a tokens PR that widens it.

---

## Sizing contract justification

`n/a`: the provider renders its children and a `<script>`. No element, no
size, nothing for RULES §1 to bind. Wrapping the app in a `<div>` "for the
context" is exactly the box the rule forbids: it would sit between the
app's layout and the app's content and have to be told how to size.

## Anatomy

```
<ThemeProvider>
  ├── <script nonce?>           the pre-paint theme script (§4)
  └── {children}                as given
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| script | — | `<script>` | Inline; sets or removes `data-pp-theme` on `<html>` before the content after it paints. The only DOM the provider owns |

No `pp-` class: there is no element to style. The attribute the provider
writes, `data-pp-theme`, is the tokens' (D-010).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `Theme` | — | Controlled |
| `defaultValue` | `Theme` | `'system'` | Uncontrolled starting value; also what the script applies when nothing is stored |
| `onValueChange` | `(theme: Theme) => void` | — | Every change of the choice — `setTheme`, or another tab's — in both modes |
| `storageKey` | `string \| null` | `'pp-theme'` | `null`: not persisted. Ignored when controlled |
| `nonce` | `string` | — | For the inline script under a CSP |
| `children` | `ReactNode` | — | |

`useTheme(): { theme: Theme; resolvedTheme: ResolvedTheme | undefined; setTheme(theme: Theme): void }`.

No `variant`, `tone`, `size`, `className`, `style` or `ref`: there is no
element for them to reach. `ThemeProviderProps` is exported.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| The choice | `data-pp-theme="light" \| "dark"` on `<html>`, or absent for `system` | The tokens' scope (D-010); `color-scheme` from the base layer |
| What is showing | `resolvedTheme` from the hook; on the page, the tokens | — |

The provider writes nothing else. `data-state` is for a component's own
element, and there is none.

## Styling API

None. The component draws nothing; the theme's look is the token layer.

## Keyboard interaction

None. The control is 6.2 `ThemeToggle`.

## Accessibility notes

- With no choice made, the page follows `prefers-color-scheme`, which is
  the user's stated preference; an explicit choice is kept, so a user who
  overrode the system is not returned to it on the next load.
- `color-scheme` follows the attribute through the base layer, so native
  form controls and scrollbars match the theme (`base.css`).
- The first paint is in the chosen theme (§4): no flash of the wrong one,
  which for a light-sensitive user is not cosmetic.
- No live region, no announcement: a theme change is visible by
  definition, and the control that made it (6.2) reports its own state.

## Container behavior

None. Not a box.

## Usage

```tsx
// app/layout.tsx — once, first in <body>
import { ThemeProvider } from 'pixel-perfect';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

// Anywhere below (a client component)
const { theme, resolvedTheme, setTheme } = useTheme();
setTheme('dark');

// The app persists the choice itself (a cookie read on the server)
<html lang="en" data-pp-theme={theme === 'system' ? undefined : theme}>
  <body>
    <ThemeProvider value={theme} onValueChange={saveToCookie}>{children}</ThemeProvider>
  </body>
</html>
```

## Don't

```tsx
// ✗ A provider is not a scope. D-010: a theme binds to any element by its
//   attribute, and two providers are two authorities over one <html>.
<aside>
  <ThemeProvider defaultValue="dark">…</ThemeProvider>
</aside>
// ✓
<aside data-pp-theme="dark">…</aside>

// ✗ Rendering the resolved theme on the server. It is undefined there and
//   on the first client render on purpose; the DOM attribute is what is
//   right from the first paint.
<p>You are in {resolvedTheme} mode</p>

// ✗ A wrapper "for the context". The provider renders no element; adding
//   one puts a box between the layout and the content.
<ThemeProvider><div className="app">{children}</div></ThemeProvider>
```

## Tests

- **Unit:** the server string carries the script before the children, and
  no other element; the script, evaluated against a document with `dark`
  stored, sets the attribute; with nothing stored and `defaultValue`
  `light`, sets `light`; with nothing stored and the default `system`,
  sets nothing; with a controlled `value`, carries it and reads no storage;
  `storage` throwing is caught. Uncontrolled `setTheme` writes the
  attribute, the storage and `onValueChange`; `system` removes both;
  `storageKey={null}` writes no storage; a `storage` event for the key
  from another tab updates the theme. Controlled `setTheme` reports and
  does not write; the attribute follows the prop. `resolvedTheme` is
  `undefined` on the first render under `system`, then the media query's,
  and follows its `change`; equals `theme` when explicit. `useTheme()`
  throws outside a provider. Server HTML hydrates in a client with a
  stored choice without a recoverable error (D-093 §1's test shape).
- **Browser:** the served HTML has the provider's script before the
  page's first content; the harness self-check (switch, reload, the
  attribute before paint, `system` clears) now exercises the provider;
  under an emulated dark system with no attribute the page is dark, which
  is the tokens' block and the reason §2 writes nothing.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **A `target` for the attribute?** No (§1). One `<html>`, one authority;
   a scope is an attribute.
2. **Resolve `system` into an attribute?** No (§2): the no-JS default and
   every `[data-pp-theme]` reader depend on its absence meaning "the
   system".
3. **`disableTransitionOnChange`?** No (§8); it needs `!important`.
4. **`resolvedTheme` as `undefined` before mount, or a guess?** `undefined`
   (§5). A guess is a hydration mismatch or a flash, and the type says so.
5. **Cookie mode built in?** No: controlled mode is the cookie mode (§3),
   and the app owns the cookie. A `storage` adapter prop is API for one
   consumer that has not appeared.
6. **A storage key per app, or one?** A default of `pp-theme`, overridable
   (§3): two apps on one origin need two keys, and the default matches the
   playground, whose suite already stores it.
