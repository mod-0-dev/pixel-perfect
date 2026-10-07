---
'pixel-perfect': minor
---

**Breaking.** `Split`'s parts are named exports, `SplitSidebar` and
`SplitMain`, like every other compound's. `Split.Sidebar` and `Split.Main`
are gone, not deprecated: replace `<Split.Sidebar>` with `<SplitSidebar>` and
`<Split.Main>` with `<SplitMain>`, and import both. `SplitSlotProps` is now
`SplitSidebarProps` and `SplitMainProps`.

**Breaking, at the type level.** `CodeBlock` needs a `title` or a `label`.
Its scroll region was named "Code" by default, so a page of blocks was a page
of regions nobody could tell apart. Untyped callers that give neither get a
development warning and the old name.
