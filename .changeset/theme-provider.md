---
'pixel-perfect': minor
---

Add `ThemeProvider` (6.1) and `useTheme()`: the page's theme — `system`,
`light` or `dark` — decided before the first paint by an inline script the
provider renders ahead of its children, kept in `localStorage` and followed
across tabs, or controlled by the app with `value` and `onValueChange`.
`system` writes no attribute, so the tokens follow `prefers-color-scheme`
as they always have; `resolvedTheme` says what is showing once mounted.
