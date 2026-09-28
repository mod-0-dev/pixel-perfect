---
'pixel-perfect': minor
---

Add `Tabs` (4.9): one panel of several, chosen by its tab, on
`@radix-ui/react-tabs`. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`;
`value` / `defaultValue` / `onValueChange`, `orientation`, `activationMode`,
`keepMounted` on a panel. One look: a hairline under the list and a
two-pixel accent bar on it under the selected tab; the strip scrolls at a
narrow width rather than wrapping. The page's direction is the component's:
Radix's `dir` attribute is not written, and the value its arrow keys need
is read at mount. `data-state="active|inactive"` joins RULES §4.
