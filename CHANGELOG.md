# pixel-perfect

## 0.12.0

### Minor Changes

- efcafe2: The package is published to npm as `@mod-0-dev/pixel-perfect` (the unscoped name belongs to someone else). Import from `@mod-0-dev/pixel-perfect`, `@mod-0-dev/pixel-perfect/theme` and `@mod-0-dev/pixel-perfect/styles.css`; a git dependency keyed `pixel-perfect` should be re-keyed to the new name. Relative imports inside `dist/` now name their file, so the package loads under Node, webpack 5 and TypeScript's `nodenext` resolution as well as Vite and Turbopack.
- 6840439: **A pressed `Toggle` is its tone's solid fill.** It was the soft end of the
  background ramp, 1.26:1 against the page in the light theme, so in a row of
  toggles (a toolbar's Bold and Italic) pressed and not pressed were hard to
  tell apart. Pressed is now `--pp-tone-solid` with `--pp-tone-on-solid` text,
  and hovering it darkens to `--pp-tone-solid-hover`. A disabled pressed toggle
  keeps a subtle edge, so it still reads as pressed. `--pp-toggle-bg-on` and
  `--pp-toggle-color-on` still override both, and now default to the solid
  tokens.
  
  **Breaking, at the type level.** `Toggle` has no `solid` variant, because
  pressed is the solid fill and a solid toggle would look the same on and off.
  Use `ghost` (the default), `outline` or `plain`. An untyped `variant="solid"`
  is drawn as `ghost` with a development warning. `ToggleVariant` is exported.
  Keep `tone="warning"` off a Toggle: its solid is 1.87:1 against the page in
  the light theme.
  
  `Toolbar` is now tested and documented with a `SegmentedControl` inside it.
  Its arrows walk the segments without selecting them, as the APG toolbar
  example walks its alignment group, and `Space` selects the focused one.

## 0.11.1

### Patch Changes

- d37ee45: Raise the Radix Primitives floor to their current releases: `react-dialog`
  and `react-popover` 1.2, `react-tooltip` 1.3, and patch releases of
  `react-accordion`, `react-alert-dialog`, `react-context-menu`,
  `react-dropdown-menu`, `react-tabs` and `react-toast`. No API change.

## 0.11.0

### Minor Changes

- fe9a437: **Breaking.** `Split`'s parts are named exports, `SplitSidebar` and
  `SplitMain`, like every other compound's. `Split.Sidebar` and `Split.Main`
  are gone, not deprecated: replace `<Split.Sidebar>` with `<SplitSidebar>` and
  `<Split.Main>` with `<SplitMain>`, and import both. `SplitSlotProps` is now
  `SplitSidebarProps` and `SplitMainProps`.
  
  **Breaking, at the type level.** `CodeBlock` needs a `title` or a `label`.
  Its scroll region was named "Code" by default, so a page of blocks was a page
  of regions nobody could tell apart. Untyped callers that give neither get a
  development warning and the old name.
- fe9a437: Add `SegmentedControl` and `SegmentedControlItem`: exactly one of a few
  options, drawn as an attached row of buttons, built on native radios — one
  tab stop, arrows that move and select, a value that submits with a form, and
  "Light, radio button, checked, 2 of 3" to a screen reader. The checked segment
  is the neutral solid fill, 5.90:1 against the page in light and 7.07:1 in
  dark. A pressed `Toggle`'s fill is 1.26:1, too faint to tell a choice from its
  neighbour. Named by `label`, or by the `Field` around it. Use it where you had
  a `ButtonGroup` of `Toggle`s with exactly one pressed.

### Patch Changes

- fe9a437: Fix `AvatarGroup` hiding part of every covered face's initials: the overlap
  did not count the 2px ring each face draws outside itself, so the next face
  hid a fifth of the face plus the ring. The overlap now includes the ring, and
  a covered face's initials sit in the middle of the part left visible, so
  pairs like "AT", "GH" and "MH" keep both letters (MH at `md` and `lg`).
  The group is 2px wider per face.
  
  Fix `Code` inside a `Link` keeping its own grey ink: it takes the link's
  colour, at rest and on hover, on its own background. Every link tone on that
  background is 4.5:1 or better in both themes, now asserted by
  `npm run lint:contrast`.
  
  Fix code blocks, tables and scrollers rendering larger text on iPhone when
  their content is wider than the screen: iOS Safari's text autosizing enlarged
  text in any box whose lines ran past the screen edge. `CodeBlock`, `Table`
  and `Scroller` set `text-size-adjust: 100%`. A responsive app should set it
  on `html` too, for its own content.

## 0.10.0

### Minor Changes

- 833f882: Ship `dist/AGENTS.md` for the coding agent in your app: setup, the rules that
  change what an agent writes (no width or margin on a component, layout through
  the primitives, `tone`/`variant`/`size`, named parts, `asChild`), the banned
  list, and an index of every component — with every component's doc and the
  rules beside it in `dist/docs/`. Point your agent at it; for Claude Code, add
  `@node_modules/pixel-perfect/dist/AGENTS.md` to your app's `CLAUDE.md`.
- 833f882: Add `pixel-perfect/theme` and the `pixel-perfect theme` command: your brand
  colour, solved by the library's own generator and proven by its own contrast
  checks. `npx pixel-perfect theme --accent "#7c3aed" --out src/brand.css`
  writes the complete palette — every hue in both themes, every focus ring
  re-solved against every surface — as a stylesheet to import after
  `pixel-perfect/styles.css`, reports where each theme's solid fill landed and
  whether it had to move to carry its text, and refuses to write a palette that
  fails any check the library's own tokens pass. `createTheme({ accent })` is
  the same thing as a function, and `--neutral accent` leans the greys toward
  your hue. The library's own palette is unchanged: its accent reproduces the
  shipped tokens declaration for declaration.

### Patch Changes

- 833f882: Fix `Combobox` overflowing a parent narrower than about 256px: its box's
  `1fr` track took the native input's intrinsic width as its minimum, so the
  control could not shrink — it overflowed a 240px column and pushed a phone's
  page sideways. The track is `minmax(0, 1fr)`, and the input shrinks with it.
  Fix `AppShell`'s skip link reading `--pp-font-size-sm`, a token that does not
  exist, so its size silently fell back to the inherited one; it reads
  `--pp-font-size-2`. A new rule in `npm run lint` fails any component
  stylesheet that reads a `--pp-*` property nothing defines.
- 833f882: Fix `VisuallyHidden` widening the page from inside a horizontally scrolled
  region. Its box was absolute with no inset, so past the region's edge it was
  positioned against the nearest positioned ancestor — often the viewport —
  escaped the region's clip and gave the document a phantom horizontal
  scrollbar (a `Spinner`'s label made a page 514px wide on a 390px phone). It
  now takes `inset-inline-start: 0`, which keeps it inside its containing block;
  the block axis keeps its static position, so screen readers still scroll to
  the right place. Every component that embeds one — `Spinner`, `Stepper`,
  `ThemeToggle`, `KeyHints`, `Field` with `labelHidden`, `CodeBlock` — is fixed
  with it.

## 0.9.0

### Minor Changes

- 729f7f4: Add `Accordion` (4.10): a vertical stack of sections, each with a heading
  that shows or hides its content, on `@radix-ui/react-accordion`.
  `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
  `multiple` is a boolean (not Radix's `type`) with `string` or `string[]`
  values to match; `collapsible` defaults to `true`; `headingLevel` on the
  root sets every heading once; `keepMounted` on a panel keeps its children
  rendered, hidden. One look: headings on hairlines, a chevron that turns,
  a height that animates and is instant under reduced motion.
- 729f7f4: Add `AlertDialog` (4.5): `Dialog` with two rules changed. A press on the
  scrim does not close it, and focus lands on `AlertDialogCancel`, the safe
  button. Compound — `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`,
  `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`,
  `AlertDialogAction` — as named exports; `role="alertdialog"`. Dialog's
  stylesheet draws it (every part carries both classes, so every
  `--pp-dialog-*` override applies) and its ceiling is `--pp-measure-xs`
  through `--pp-alert-dialog-max-inline-size`. With no `Cancel` the panel
  takes focus and development warns. Built on `@radix-ui/react-alert-dialog`.
- f7a97e0: Add `AppShell` (6.3): the frame a layout wraps its pages in. `header`,
  `sidebar` and `footer` slots around `children` in the page's `<main>`, a
  skip link to the content rendered first, `Split` as the middle row so the
  sidebar stacks above the content when the shell is narrow — by its own
  width, never the viewport's — and `sticky` to keep the header in view. It
  fills the block size its parent gives it and never sets the viewport's.
- 729f7f4: Add `AvatarGroup` (5.13): a list of `Avatar`s overlapping in a row by a
  grid whose columns are narrower than a face, the first `max` shown and
  the rest a count drawn as an avatar and named "n more"; `size` on the
  group sizes every face. A Server Component that hugs.
- 729f7f4: Add `Breadcrumb` (5.6): a navigation landmark and an ordered list of
  `BreadcrumbItem`s — `BreadcrumbLink`s (a neutral `Link`, underlined on
  hover), a `BreadcrumbPage` with `aria-current`, and a named
  `BreadcrumbEllipsis` where a trail is cut. The separator is the
  stylesheet's, out of the accessibility tree; a long trail wraps at a
  separator into lines of whole crumbs. A Server Component.
- 729f7f4: Add `Calendar` (5.9): a month grid with one tab stop and the APG keys,
  the value an ISO date and the month shown `YYYY-MM`, both controlled or
  uncontrolled; names from `Intl`; `today`, `min`, `max`,
  `isDateDisabled`, `weekStartsOn`; seven equal columns of its container,
  each day a button on the control scale. The date arithmetic lives in
  `src/internal/date.ts`, UTC-anchored.
- 729f7f4: Add `Card` (5.1): a bordered raised surface with `CardHeader`, `CardBody`
  and `CardFooter`, any of which may be absent, and a hairline between the
  ones present; the foot on the sunken surface; no shadow by default.
  `asChild` makes the consumer's link or button the card, with a hover lift
  and the focus ring. A Server Component. The parts of every compound —
  server ones included — are named exports (RULES §5.6, amended).
- 729f7f4: Add `CodeBlock` (5.12): block code in Card's frame on the sunken
  surface, in Code's typography — `code` split into lines, or
  `CodeBlockLine` children from the consumer's highlighter — with a
  counter gutter, pointed lines, a title, a language badge, a copy button
  that says "Copied", and a `<pre>` that is a named region scrolling a
  long line inside itself; `wrap` wraps instead. No highlighter is
  bundled.
- 729f7f4: Add `Combobox` (4.11): a text input that offers a list of options as the
  user types, and takes one or, with `multiple`, several as tokens.
  `Combobox`, `ComboboxInput`, `ComboboxList`, `ComboboxOption`,
  `ComboboxGroup`, `ComboboxLabel`, `ComboboxEmpty`. The component owns the
  text, the selection, the open state, the highlight (`aria-activedescendant`;
  focus never leaves the input) and the keyboard; the consumer renders the
  options that match, which is what makes options from a server nothing
  special (`loading`). The control is `Input`'s box, the list is
  `DropdownMenu`'s panel anchored by Popover's primitive and never narrower
  than the control; `getLabel` names a value set from outside; `name` posts
  hidden inputs.
- 729f7f4: Add `CommandPalette` (4.14): every command one keystroke away — a search
  field over a list of commands, in a modal. Made of the tier with no package
  added: Dialog's modal and scrim, Combobox's highlight, DropdownMenu's row,
  Kbd's key caps. `CommandPalette` (with an optional `hotkey` such as
  `mod+k`), `Trigger`, `Content`, `Input`, `List`, `Item` (`onSelect` with a
  preventable close), `Group`, `Label`, `Shortcut` (`keys`), `Empty`. The
  consumer renders the commands that match; the first is highlighted as the
  user types and `Enter` runs it.
- 729f7f4: Add `ContextMenu` (4.8): `DropdownMenu`'s list of commands, opened at the
  pointer by a secondary press, a long press, or `Shift+F10` on a focused
  element, on `@radix-ui/react-context-menu`. The trigger is a region that
  renders a `<div>`; the twelve parts a menu is made of are `DropdownMenu`'s,
  built once, and every node carries `DropdownMenu`'s class first so one
  stylesheet draws both. The direction is read from the region at open time.
  `open` / `defaultOpen` / `onOpenChange`; modal by default.
- 729f7f4: Add `DatePicker` (4.13): Input's box with a text field and a calendar
  button, `Calendar` in a `Popover` behind it; the value an ISO date,
  controlled or uncontrolled; typed text parsed on commit in the
  locale's order and formatted back by `Intl`; unparsable text
  `aria-invalid`; `name` for a form's hidden ISO value. The last of
  Tier 4.
- 729f7f4: Add `Dialog` (4.4), the first modal. Behaviour — the portal, the focus
  trap, the dismissable layer, the scroll lock, the `aria-hidden` sweep — is
  Radix's (`@radix-ui/react-dialog`, tree-shaken away by any app that never
  imports it); every node and pixel is ours.
  
  - **`Dialog`** is compound: `Dialog`, `DialogTrigger`, `DialogContent`,
    `DialogTitle`, `DialogDescription`, `DialogClose`, as named exports.
    `Trigger` and `Close` take `asChild` to become the `Button` or
    `IconButton` you pass. Controlled with `open` / `onOpenChange`,
    uncontrolled with `defaultOpen`.
  - **Modal, and only modal.** There is no `modal` prop: beside its trigger a
    panel is a `Popover`; a panel that stays open while the page is used is a
    `Drawer`.
  - **The scrim is rendered by `Content` and is the panel's parent.** It dims
    the page, centres the panel with a grid (so RTL needs nothing), and is
    the scroll container: a panel taller than the viewport keeps its height
    and the scrim scrolls, never the page. Styled by `--pp-dialog-scrim`.
  - **The panel hugs its content up to `--pp-measure-sm`** (40rem) or the
    viewport less the gutter, whichever is less. No `size`; the ceiling is
    `--pp-dialog-max-inline-size`.
  - **Named by `DialogTitle`** (or `aria-label` / `aria-labelledby`);
    development warns when nothing names it. `aria-modal="true"` on the
    panel.
  - **Focus** moves to the first tabbable on open, loops inside, and returns
    to the trigger on close — or, for a dialog opened with no trigger, to the
    element that had focus when it opened.
  - Closes on Escape, on a press on the scrim, and from any `DialogClose`;
    `onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside` can veto.
    No automatic close button.
  - The theme crosses the portal: the scrim carries `data-pp-theme` read from
    the trigger's scope. `prefers-reduced-motion` makes open and close instant.
  - Styling: `--pp-dialog-scrim`, `-gutter`, `-bg`, `-border-color`,
    `-radius`, `-padding`, `-shadow`, `-max-inline-size`.
- 729f7f4: Add `Drawer` (4.6): a modal panel that slides in from an edge of the
  viewport and stays the full height (or width) of it. `Dialog` with a
  different placement — same parts, renamed (`Drawer`, `DrawerTrigger`,
  `DrawerContent`, `DrawerTitle`, `DrawerDescription`, `DrawerClose`), same
  rules — plus `side: 'start' | 'end' | 'top' | 'bottom'` (logical, default
  `end`). The anchored axis is `--pp-drawer-size` (20rem for a side drawer,
  half the viewport for a sheet), capped at the viewport; the panel scrolls,
  never the page. Built on `@radix-ui/react-dialog`, already a dependency.
- 729f7f4: Add `DropdownMenu` (4.7): a list of commands anchored to the button that
  opened it, on `@radix-ui/react-dropdown-menu`. Fifteen named parts —
  `DropdownMenu`, `Trigger`, `Content`, `Item`, `CheckboxItem`, `RadioGroup`,
  `RadioItem`, `ItemIndicator`, `Group`, `Label`, `Separator`, `Sub`,
  `SubTrigger`, `SubContent` and `Shortcut`. `side` is logical and offsets are
  steps of the space scale, as across Tier 4; the direction is read from the
  trigger at open time, so submenus open on the arrow key that points into
  them in either direction. `align` defaults to `start`; rows are the small
  control height; a menu with a checkable item gains a gutter so its labels
  align; `tone="danger"` marks a destructive command; `CheckboxItem` and
  `RadioGroup` are controlled or uncontrolled. Modal by default.
- 729f7f4: Add `EmptyState` (5.8): a glyph in a tile, a title, a description and
  the actions that would fill the space — `EmptyStateIcon`,
  `EmptyStateTitle`, `EmptyStateDescription` and `EmptyStateActions` on
  the Tier 1–2 primitives — centred and held to a readable measure by a
  grid; `variant="outline"` is a dashed frame on Card's surface. A Server
  Component.
- 729f7f4: Add `FileUpload` (5.10): a hidden native file input behind a
  `FileUploadTrigger` Button, a `FileUploadDropzone` that takes a drop,
  and a `FileUploadList` of `FileUploadItem`s with a size, a `Progress`
  bar, an error line and a remove button; selection refused by type,
  size and count with reasons through `onSelect`; the Trigger is the
  labelled control in a `Field`. It selects and shows; uploading is the
  consumer's.
- f7a97e0: Add `KeyHints` (6.7): three gestures for the keyboard reader. Hold a key
  to see every control's shortcut drawn on the control; press a key to
  label every control on screen and type the label to focus it; press a
  key for the sheet of every shortcut. Declare a shortcut on its control
  with `data-pp-hotkey` or register a command with `useKeyHint`; chords
  are `mod+shift+n`, sequences `g i`; every single key is a prop and
  `null` turns it off. `formatKeys` for your own keycaps.
- f7a97e0: Add `NavSidebar` (6.4): an app's primary navigation for `AppShell`'s
  sidebar slot — a named `<nav>` of sections, links with an icon and
  trailing content, and disclosure groups that open to show more. Plain
  links, every one a tab stop; the app marks the current link; a closed
  group's links stay in the HTML, `hidden`; `asChild` for `next/link`.
- e03b15a: Add the overlay foundation (4.1) and `Popover` (4.2), the first Tier 4
  component. Tier 4 is built on **Radix Primitives**: behaviour — the portal,
  the dismissable layer, the focus scope, the positioning — is Radix's, and
  every DOM node, class name and pixel is ours. `@radix-ui/react-popover` is the
  package's first runtime dependency; it is tree-shaken away by any app that
  never imports `Popover`.
  
  - **`Popover`** is compound: `Popover`, `.Trigger`, `.Content`, `.Title`,
    `.Description`, `.Close`. `Trigger` and `Close` take `asChild` to become the
    `Button` you pass. Controlled with `open` / `onOpenChange`, uncontrolled
    with `defaultOpen`. Non-modal by default; `modal` traps focus, locks scroll
    and hides the page.
  - **The content is a named `dialog`.** `PopoverTitle` names it, or pass
    `aria-label` / `aria-labelledby`; development warns when nothing does.
  - **The theme crosses the portal.** The panel carries `data-pp-theme` read
    from its trigger's scope, so a popover opened from a dark region of a light
    page paints dark. The tone does not cross.
  - **`side` is logical**: `top | bottom | start | end`, with `start` and `end`
    following the layout's direction. `data-side` on the panel reports the
    physical side it was placed on.
  - **Offsets are steps of the space scale.** `sideOffset` and
    `collisionPadding` are `Space` indexes, resolved to pixels from the token.
  - **The panel hugs its content up to `--pp-measure-xs`** (a new 20rem step
    of the measure scale) or the space available, whichever is less — the
    overlay exception to the no-`max-width` rule, because an overlay has no
    parent in flow to size it.
  - Styling: `--pp-popover-bg`, `-border-color`, `-radius`, `-padding`,
    `-shadow`, `-max-inline-size`.
- f7a97e0: Add `PageHeader` (6.5): the top of a page as four parts — `PageHeader`,
  `PageHeaderTitle` (the `<h1>`), `PageHeaderDescription`,
  `PageHeaderActions` — with your `Breadcrumb` first. One flex row that
  wraps: the actions sit at the end of the title's row and drop under it
  when the row is too narrow; the description is written after the title
  and painted after the actions; a part you leave out costs no space.
- 729f7f4: Add `Pagination` (5.5): a navigation landmark of previous, next and a
  window of page numbers around the current one, the first and the last
  always reachable; controlled and uncontrolled; `getHref` makes every page
  a link; narrower than its row it becomes "6 of 12" between the arrows by
  a container query, so the same component is compact in a sidebar and full
  in a column.
- 729f7f4: Add `Progress` (5.3): a bar filled as far as `value` says, sweeping
  while there is no value; `role="progressbar"` with a name required at
  the type level (`label` or `aria-labelledby`); `size` is the thickness
  and `tone` the fill, `accent` by default; the fill slides between values
  and follows the writing direction; reduced motion pulses instead of
  sweeping. A Server Component.
- 729f7f4: Add `Stepper` (5.7): a navigation landmark and an ordered list of
  `Step`s, each `complete`, `current` or `upcoming`; the number a CSS
  counter, done a check, the current step `aria-current="step"`; a row
  that becomes a column below 28rem by its container, or
  `orientation="vertical"`. A Server Component.
- 729f7f4: Add `Table` (5.4): a semantic table in a named, focusable region that
  scrolls on the inline axis; `Table` / `TableHeader` / `TableBody` /
  `TableFooter` / `TableRow` / `TableHead` / `TableCell` as named exports.
  `caption` names the region; `size` is the row's density; `striped`;
  `selected` on a row; `align` and `sort` (`aria-sort`) on cells. The table
  is stretched to its region by a grid, never by a width. A Server
  Component.
- 729f7f4: Add `Tabs` (4.9): one panel of several, chosen by its tab, on
  `@radix-ui/react-tabs`. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`;
  `value` / `defaultValue` / `onValueChange`, `orientation`, `activationMode`,
  `keepMounted` on a panel. One look: a hairline under the list and a
  two-pixel accent bar on it under the selected tab; the strip scrolls at a
  narrow width rather than wrapping. The page's direction is the component's:
  Radix's `dir` attribute is not written, and the value its arrow keys need
  is read at mount. `data-state="active|inactive"` joins RULES §4.
- f7a97e0: Add `ThemeProvider` (6.1) and `useTheme()`: the page's theme — `system`,
  `light` or `dark` — decided before the first paint by an inline script the
  provider renders ahead of its children, kept in `localStorage` and followed
  across tabs, or controlled by the app with `value` and `onValueChange`.
  `system` writes no attribute, so the tokens follow `prefers-color-scheme`
  as they always have; `resolvedTheme` says what is showing once mounted.
- f7a97e0: Add `ThemeToggle` (6.2): a square button that flips the page between light
  and dark through `ThemeProvider`. Both faces — a sun named "Switch to dark
  theme", a moon named "Switch to light theme" — are rendered and the
  stylesheet displays one from `<html>`'s theme or the system's preference,
  so it is right before hydration and never disagrees with the page. Labels
  and icons are props; Button's variants, tones and sizes apply.
- 729f7f4: Add `Toast` (4.12): a brief message at a corner of the viewport, announced,
  gone after a moment, on `@radix-ui/react-toast`. `ToastProvider` once near
  the root (`placement`, logical; `duration`; `limit`) and `useToast()`
  anywhere below: `toast(options)` returns an id, `dismiss(id?)`,
  `update(id, options)`. Every toast is an `Alert` that floats — `tone`,
  `icon`, `title`, `description`, one `action` with `altText`, a dismiss —
  drawn by Alert's stylesheet; timers pause on hover, focus and blur; `F8`
  reaches the region; a swipe toward the inline end dismisses.
- f7a97e0: Add `Toolbar` (6.6): a named row of controls with one tab stop. It finds
  the controls in its own subtree — no wrapper part — keeps the last
  focused one as the stop, walks them with the arrow keys in the writing
  direction (Up and Down when vertical), jumps with Home and End, wraps
  at the ends unless `loop={false}`, and leaves the keys alone inside a
  text field. A wrapping row with a `gap`, or a column.
- a195946: Add `Tooltip` (4.3), the first component built on the overlay foundation
  alone. Behaviour — the delays, the grace area between trigger and panel, the
  dismissable layer, the positioning — is Radix's (`@radix-ui/react-tooltip`,
  tree-shaken away by any app that never imports it); every node, class name
  and pixel is ours.
  
  - **`Tooltip`** is compound: `Tooltip`, `TooltipTrigger`, `TooltipContent`,
    as named exports. `Trigger` takes `asChild` to become the `IconButton` or
    `Button` you pass. Controlled with `open` / `onOpenChange`, uncontrolled
    with `defaultOpen`.
  - **`TooltipProvider` is optional.** Wrap a toolbar once and moving between
    its buttons opens each tooltip at once, with no delay and no entry
    animation; a lone tooltip needs no provider. `delayDuration` (700ms) and
    `skipDelayDuration` (300ms) are milliseconds.
  - **A description, never a name.** The trigger gets `aria-describedby` while
    the tooltip is open; the trigger must already have a name (an
    `IconButton`'s `label`), and the tooltip repeats it.
  - **An inverse surface.** Two new semantic tokens, `--pp-color-bg-inverse`
    and `--pp-color-text-inverse` (the body-text pair reversed, in both
    themes), asserted by `lint:contrast`. The panel carries `data-pp-theme`
    read from its trigger's scope, so a tooltip opened from a dark region of a
    light page paints light.
  - **`data-state` is `closed | delayed-open | instant-open`** — Radix's three
    values. `instant-open` (keyboard focus, a controlled open, a neighbour's
    skip delay) plays no entry animation. "Is it open" is
    `:not([data-state="closed"])`.
  - **`side` is logical** (`top | bottom | start | end`, default `top`), and
    `sideOffset` (`'1'`) and `collisionPadding` (`'2'`) are steps of the space
    scale. Hugs its text up to `--pp-measure-xs` or the space available.
  - WCAG 1.4.13: hoverable, dismissable (Escape), persistent.
    `disableHoverableContent` is not exposed. Touch opens nothing; a click on
    the trigger closes it.
  - Styling: `--pp-tooltip-bg`, `-color`, `-radius`, `-padding-block`,
    `-padding-inline`, `-shadow`, `-max-inline-size`.
- 729f7f4: Add `Tree` (5.11): the ARIA tree view as nested `TreeItem`s — one tab
  stop, the arrows to move, expand and collapse, Home, End, Enter and
  Space — with `expanded` and `selected` each controlled or uncontrolled;
  rows on the control scale indented by level through one custom
  property; a collapsed node's children not rendered.

### Patch Changes

- f7a97e0: `CodeBlock` renders its copy button wherever `copy` is on, and checks for
  the Clipboard API when the button is pressed rather than when it renders.
  The button used to exist only where `navigator.clipboard` did, which is a
  different answer on the server and in the browser, so every server-rendered
  block hydrated against different HTML and React re-rendered the page on
  the client. Without a clipboard the press does nothing, as the spec always
  said.

## 0.8.0

### Minor Changes

- 52e4f30: Add `RangeSlider` (3.17): a two-thumb range control on the same numeric
  contract as `Slider` and `NumberInput`, for a price band, a day window, an
  acceptable range. The two-thumb case was deferred from `Slider` with two
  blockers named, and this component exists to solve those two and nothing else.
  
  - **Two native `<input type="range">` elements, stacked, each spanning the full
    `min`–`max`.** The drag on a thumb, pointer capture, touch, every keyboard
    row, `role="slider"` with its value attributes, and right-to-left reversal
    are all the platform's.
  - **The inputs are transparent and the thumbs you see are ours.** So the focus
    ring is drawn on the focused thumb alone, by a sibling selector, with nothing
    suppressed — no `outline: none` anywhere. It is also the first slider thumb
    in the library a test can measure.
  - **A press on bare track moves the nearer thumb and keeps dragging it.** The
    `pointer-events` layering that makes both thumbs draggable takes the track
    press away from the inputs, so the root handles it: maps the pointer to a
    value, RTL-aware, picks the nearer thumb, focuses its input and captures the
    pointer until release.
  - **The thumbs cannot cross, and the clamp is on the value.** Each input keeps
    the full range so its travel stays aligned with our thumb; a change that
    would cross is clamped to the other thumb's value. When the two meet, the
    input on top is the one that can move toward the open side
    (`data-thumb-top`), so a pair pushed to `max` can be pulled apart.
  - **The value is a tuple**, `[start, end]`, always ordered, defaulting to
    `[min, max]`. No minimum gap: a zero-width range is a meaningful selection.
  - **`thumbLabels`** (default `['Minimum', 'Maximum']`) names each thumb; the
    group is named by `<Field group>`. `name` goes on both inputs, so
    `FormData.getAll(name)` is `[start, end]`.
  - `onValueChange` fires continuously and `onValueCommit` once, as on `Slider`.
    `size`, `invalid` and `disabled` read from the field; `--pp-range-slider-*`
    mirror `--pp-slider-*`.

### Patch Changes

- 8d088df: Correct `Alert`'s documentation, and say where the checkable controls take a
  tone (D-059). No runtime behaviour changes.
  
  - **An `Alert`'s tone does not reach the `Button`s and `Link`s inside it.** The
    0.7.0 entry said it did. Each writes its own `data-pp-tone` from its default
    (`neutral` / `accent`), and the nearest context wins — so pass `tone` to them
    yourself. Bare text and `currentColor` do take the alert's hue.
  - **`live` only announces reliably on an alert that is already mounted.** For a
    message that appears by mounting, `{saved && <Alert live="polite">}` may be
    read twice or not at all; keep a `role="status"` element mounted and render
    the alert inside it with `live` off. The `tone` and `live` JSDoc now say so.
  - **`Checkbox`, `Radio` and `Switch` take a tone from an ancestor.** There is no
    `tone` prop — the root's own is reserved for `invalid` — so set
    `data-pp-tone` on the `Field`; `invalid` still wins.

## 0.7.0

### Minor Changes

- 26c8334: Add `Alert` (5.2) — a bordered, tone-coloured block for something that happened
  or something that is true. The first component of Tier 5, and what 3.16 `Form`'s
  error summary is built from.
  
  - **`role="alert"` is opt-in.** The component is named `Alert` and is not an
    ARIA alert until you say so: an assertive live region interrupts, and a live
    region announces *changes* to a region that already existed — so one rendered
    into the initial HTML has no change to announce and may be read twice or not
    at all. `live` is `off` (no role), `polite` (`role="status"`) or `assertive`
    (`role="alert"`). `role` rather than a bare `aria-live` attribute, because
    both roles also imply `aria-atomic`.
  - **`onDismiss` reports the intent and hides nothing.** No `open`, no internal
    state, so the component stays a Server Component and a dismissed banner is
    something your app can remember across a reload. The caller unmounts it, and
    owns where focus goes next.
  - **No `variant`, and the rejections were measured.** An `Alert` is the only
    component whose children are arbitrary, so the tone context inherits into
    your `Button`s and `Link`s. A `solid` fill puts `--pp-tone-text` at
    **1.04–1.16:1** in the light theme — not low contrast, invisible — and a
    `plain` one is 1.10:1 against the page, which is not a block at all. One
    treatment ships: `--pp-tone-bg` with a `--pp-tone-border` edge.
  - **Every pairing was computed before the build and every one is already
    asserted by `lint:contrast`**: title 14.02–14.35 light / 12.76–12.98 dark,
    body and dismiss glyph 4.59 in both themes, edge 3.04–3.08 against its own
    fill and 3.40 / 3.66 against the page. The fill is step 3 *because* that is
    the step those checks are named after.
  - **No default icons.** `icon` takes your SVG and wraps it in
    `<Icon decorative>`; the library ships none of its own.
  - **`title` renders a `<div>`, not a heading** — the right level is `h2` in a
    page banner and `h3` inside a card, and the component knows neither. Pass a
    `Heading` as `title` when the alert really is a section of the document. It
    also reclaims the name from HTML's `title` tooltip attribute, which is
    omitted from the props type.
  - No `size`; `--pp-alert-padding-block` / `-inline` are the escape.
- 253eed7: Add `Form` (3.16): a `<form>` that summarises the errors your app found and
  refuses a second submission while the first is pending. It does not validate
  and holds no field values.
  
  - **Error summary.** `errors: FormError[]` (`{ target, message }`) renders a
    danger `Alert` as the form's first child, with one link per error. Each link
    is a real `#target` href, so it works without JavaScript. With JavaScript,
    following a link focuses the control and scrolls its whole field, label
    included, into view. A group `Field` is targeted by its own `id`, and the
    checked radio (or the first one) gets focus.
  - **`Field` is unchanged.** Targets are `Field`'s existing `controlId`, so each
    message is passed twice: to the `Field` and to the summary.
  - **Focus moves to the summary after a submit that produced errors**, including
    one that resolves after `pending`, and when the form mounts with errors. It
    never moves for errors set without a submit, such as validation on blur.
  - **`pending` cancels any submit while set**, including a React 19 `action`, and
    disables nothing, so focus stays on the button that was pressed.
  - **`noValidate` defaults to `true`.** Native validation would cancel the submit
    for an empty required field before your `onSubmit` ran.
  - `gap` uses the shared space scale (default `'5'`), and `--pp-form-gap` overrides it.
  - Test setups on jsdom need an `Element.prototype.scrollIntoView` stub.

### Patch Changes

- 6e97ea8: **The focus ring is now solved against every surface it can be drawn on, not
  just the page** (roadmap 0.11, D-056).
  
  `--pp-color-focus-ring` was solved and asserted against step 1 alone, three
  lines above an `edge` that has been solved against steps 1, 2 **and** 3 since
  D-050. Its other neighbours were real the whole time: `--pp-color-bg-surface` is
  step 2 and shipped at 2.94 / 2.85 from Tier 3A, and any toned surface is step 3,
  where `Alert` (5.2) put a focusable control at 2.74–2.77 light and 2.54–2.57
  dark — against WCAG 1.4.11's 3:1.
  
  - The ring solves against all five hues' steps 1–3, not only neutral's. A
    border's surfaces are neutral, because a danger-toned input sits on the page;
    a ring's are not, because it is drawn on whatever the focused thing sits on.
  - Light moves L 66.18% → 63.34%, dark L 49.70% → 53.99%. **Worst pairing in the
    library: 2.54:1 → 3.06:1**, both themes, all five hues, all three surfaces.
  - `npm run lint:contrast` goes from 242 assertions to **293**, including a
    cross-hue set for the one ring colour that actually ships.
  - The `/tokens` gallery now renders `focus`, `edge` and `edge-strong` — the
    three solved off-ramp steps it had never drawn, so a change to the only tokens
    with a stated contrast obligation moved no pixel in any screenshot.
  
  Nothing but the ring's colour changes. No component CSS was touched.

## 0.6.0

### Minor Changes

- 934f578: **A control's boundary now meets WCAG 1.4.11.** `--pp-color-border` measured
  1.55:1 against the page in the light theme, where `--pp-color-bg-surface` *is*
  `--pp-color-bg-page` — so a text field's fill is literally the page and the
  border was the only thing identifying the control. Every control in Tiers 3A–3C
  shipped below the 3:1 floor.
  
  - Two **off-ramp** solved primitives per hue, joining `-focus`, `-on-solid` and
    `-solid-active`: `--pp-palette-<hue>-edge` (≥3:1 against every neutral
    surface) and `-edge-strong` (≥4.5:1). The 1–8 ramp is untouched, because a
    conforming neutral border lands at L 0.633 — below step 8's fixed L 0.780 —
    so putting it at step 7 inverts the ramp.
  - `--pp-color-border` and `--pp-color-border-strong` (and their `--pp-tone-*`
    counterparts, in all five hues) re-point at those steps.
    `--pp-color-border-subtle` deliberately does **not**: a divider is not a user
    interface component, and a 3:1 divider is a black line across the page. RULES
    §3 now states which to reach for.
  - `npm run lint:contrast` gains the border-vs-surface pairings it never had —
    170 → 242 assertions — and now also asserts the semantic **mapping** by name,
    so re-pointing a token back at a ramp step fails the build instead of
    silently returning every control to 1.55:1.
  - `Spinner`'s track moves to the decorative step — at 3:1 it read as a ring
    rather than an arc. `Skeleton`'s sweep, `Badge`'s outline and `Kbd`'s keycap
    keep the new edge on purpose; the skeleton's dark sweep is wider than its
    light one as a result, which is recorded rather than "fixed", because the
    symmetric version left the dark bars barely visible.
  - Every **disabled** control drops to `--pp-color-border-subtle`. WCAG exempts
    inactive components, and leaving them on the live edge erases the difference
    the exemption exists to allow.
  
  **Visually breaking in a minor release:** every bordered control has a darker,
  clearly visible edge in both themes. Override `--pp-<component>-border-color`
  per component, or re-point `--pp-color-border` in your own layer, if you were
  relying on the old hairline.
- 23b7551: Add `NumberInput` (3.14) — a numeric text field with steppers, bounds, a step,
  and formatting that is correct outside en-US. The first component of Tier 3D.
  
  - **`type="text"` with `role="spinbutton"`, never `type="number"`.** That input
    mutates its value on a scroll wheel over a focused field, rejects a locale
    decimal comma, and reports `value === ''` for anything it cannot parse, so
    `1,5` in a German locale is silently lost. It also cannot hold `1.234,5`,
    which rules it out a second time the moment formatting exists.
  - **`null` is empty; `undefined` is uncontrolled.** `value={undefined}` already
    means "uncontrolled" to the shared state hook, so an empty *controlled* field
    spelled that way switches modes silently and stops answering to its owner.
    `number | null` makes it a type error at the call site instead.
  - **`min`, `max` and `step` are applied on commit — blur, a stepper, an arrow
    key, Enter — and never while you are typing.** At `step={10}`, snapping per
    keystroke turns `1` into `10` before the `5` arrives, so `15` cannot be typed
    at all. The snap is rounded to `step`'s own precision, so a `step={0.1}` field
    produces `0.3` rather than `0.30000000000000004`. Text that is not a number
    reverts rather than clearing: a typo should not destroy data nobody asked to
    delete.
  - **Formatting is opt-in, and that is a hydration ruling.** `Intl.NumberFormat`
    with no locale resolves the runtime's — Node's on the server, the user's in
    the browser — so an ambient locale breaks server/client agreement in a
    component that never mentions the viewport. Without `locale` the display is
    `String(value)`. With one, parsing is derived from the *same* formatter via
    `formatToParts`, so separators and non-Latin digits round-trip without a
    hardcoded list.
  - **The steppers are plain buttons and are not tab stops.** `IconButton` is
    square on the control scale, so two stacked is 80px of button in a 40px
    control — the reuse is arithmetically impossible. `type="button"` is set and
    tested, because a `<button>` in a `<form>` defaults to `submit`. They disable
    at the bound they reach, and on an empty field the first press commits the
    bound that exists rather than starting from an invisible zero.
  - **The control is the surface and the steppers overlay it**, which is `Select`'s
    structure with two buttons instead of one chevron. The first build put the
    surface on the wrapper and drew the ring with `:has()`, which rendered two
    concentric focus rings — the reset draws one on the inner input too. Four
    components now read `--pp-control-*` and are the same height in a row.
  
  `Intl.NumberFormat` is constructed during render with an explicit locale or not
  at all, so the markup is identical on the server and the client.
- f78db62: Add `Select` (3.13) — the native `<select>` on the shared control surface, with
  our chevron. Tier 3C is complete.
  
  - **The platform popup is kept.** `appearance: none` repaints the closed box and
    nothing else, so the open list stays the operating system's: a wheel on iOS, a
    listbox on desktop, correct with a screen reader and in a right-to-left locale
    with no code of ours involved. The custom listbox — typeahead, async options,
    multi-select — is `Combobox` (4.11). `multiple` is a type error, and is
    stripped at runtime for the caller who ignores the type.
  - **`placeholder` seeds `defaultValue=""` rather than relying on `selected`.**
    The HTML *ask for a reset* algorithm picks the first option **that is not
    disabled**, so a disabled placeholder is skipped and the browser silently
    selects option two. Seeding routes through the `value` setter, which has no
    such exclusion. Give `value` or `defaultValue` and yours wins.
  - **The placeholder is painted from `:has(option[data-pp-placeholder]:checked)`,
    not from an attribute.** This control holds no state, so an uncontrolled
    select's selection changes without React being told — as do `form.reset()` and
    a write through the ref. `data-placeholder` is on the root for consumers to
    style off, and only when the select is controlled; it is omitted rather than
    guessed otherwise.
  - The chevron is `--pp-color-text-muted`: 5.10:1 on the light surface, 5.12:1 on
    the dark one, against the 3:1 WCAG 1.4.11 asks of the graphic that identifies
    a control — which it is, now that the platform's own arrow is gone. Measured
    before the component was written; both pairings are ones the token layer
    already verifies.
  - Options are `children`, so `<optgroup>` and disabled options are just markup.
    `--pp-select-padding-inline` moves both edges and the chevron's reserved room
    together, so a long value truncates before it reaches the glyph.
  - No `readOnly`: HTML has none for `<select>`, a `pointer-events` fake leaves the
    control operable from the keyboard, and `disabled` alone drops the value from
    the form.
- 23b7551: Add `Slider` (3.15) — a single-thumb range control on `<input type="range">`.
  Tier 3D's second and last component.
  
  - **The native element is the painted control.** Arrow keys, Home/End,
    Page Up/Down, step-on-drag, pointer capture including drag-outside-and-back,
    touch, `role="slider"` with the value attributes, and right-to-left reversal
    all come from the platform; the component installs no key handler at all. That
    is what keeps Tier 3 at zero runtime dependencies.
  - **The track is ours and the thumb is the platform's.** The filled portion is a
    **grid column**, not a `linear-gradient`: a gradient needs `to right`, which
    fills from the wrong end in an RTL layout where the native control reverses,
    and it would have to be written twice because the WebKit and Firefox track
    pseudo-elements cannot share a selector list. Grid columns follow the inline
    axis, so RTL is correct with nothing declared about it.
  - **`onValueCommit`, because React does not expose the native `change` event for
    a range input.** `onChange` maps to *input*, so it fires on every pixel of a
    drag; without a commit callback the only way to avoid a request per pixel is
    to reimplement pointer and key release handling. A commit fires only when the
    value actually changed, so tabbing past a slider sends nothing.
  - **Single-thumb only.** A two-thumb range is a separate component: two
    overlapping inputs each draw `:focus-visible` across the whole track, and
    moving the ring onto the thumb pseudo-element needs `outline: none`, which
    this library bans outright.
  - **No `readOnly`** — the attribute is defined for text-like controls and the
    browser ignores it on a range, so offering it would be a promise the platform
    refuses to keep. No `required` either: a slider always has a value.
  - `min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue` and
    `onValueChange` mean exactly what they mean on `NumberInput` — one numeric
    contract, two controls, shared in one internal module rather than implemented
    twice.
  
  The rule lint gains a rule with this component: **no selector list may mix a
  `-webkit-` and a `-moz-` pseudo-element.** An unknown pseudo-element invalidates
  the entire list in the engine that does not know it, so grouping the two thumb
  blocks silently unstyles Firefox while looking correct in Chrome.

## 0.5.0

### Minor Changes

- 85ac430: Add `Radio` and `RadioGroup` (3.11) — one choice from a visible set, on the
  native input, painted with `appearance: none`.
  
  - **No roving tabindex.** Radios sharing a `name` already implement the APG
    Radio Group pattern in every browser, and `RadioGroup` generates that `name`
    from `useId()` so two unnamed groups are not silently one group.
  - The group owns the value, because a radio that is deselected by a sibling is
    told nothing — `value` / `defaultValue` / `onValueChange` on the group, no
    `checked` prop on the option.
  - 16 / 20 / 24 from the size scale, and `gap` defaults to `"3"` because that is
    the floor at which WCAG 2.5.8's spacing exception holds for `sm`.
  - The stylesheet paints from `:checked` rather than from `data-state`, so a
    radio the platform changes behind React's back is still painted correctly.
  - Reads `size`, `required`, `disabled` and invalid state from `Field` through
    the group; an explicit prop always wins, including `disabled={false}`.
- f11d6ee: Add `Switch` (3.12) — an on/off control whose effect is immediate, on the native
  input, painted with `appearance: none`.
  
  - `role="switch"` on a native `<input type="checkbox">`, which is the APG
    construction: the semantics, the keyboard and the form participation stay, and
    only the announced role changes. `data-state="checked|unchecked"` is the line
    against `Toggle`, which is `aria-pressed`.
  - **The off state is a thumb, not a track colour.** The specified
    `--pp-color-border-strong` track measured 1.97:1 on the page in the light
    theme, and a surface thumb on it 1.97:1 too, so the thing that says which way
    the switch is set was the part that failed WCAG 1.4.11. Off is now the
    library's resting control surface with a `--pp-color-text-muted` thumb (5.10:1
    light, 5.49:1 dark); on is `--pp-tone-solid` with a `--pp-tone-on-solid` thumb.
    Both are pairings the token layer already verifies.
  - A 2:1 track at the checkable block sizes — 32×16 / 40×20 / 48×24 — so a `md`
    switch is exactly as tall as a `md` checkbox beside it. The thumb, the inset
    and the travel all derive from the track's block size, so one override moves
    all four.
  - The thumb moves with `inset-inline-start`, not `translate`: a translated thumb
    travels rightwards in every writing mode and would run the switch backwards
    in RTL.
  - Reads `size`, `required`, `disabled` and invalid state from `Field`; an
    explicit prop always wins, including `disabled={false}`.

## 0.4.0

### Minor Changes

- ecab9f0: `Scroller` with `orientation="both"` now measures and shades both axes. It
  reports the block axis as `data-overflow`, as before, and the inline axis as a
  new `data-overflow-inline` attribute; all four edges draw a shadow when content
  lies beyond them. As shipped, `both` measured the block axis only and the inline
  edge had no shadow and no attribute. `vertical` and `horizontal` are unchanged
  and carry no inline attribute. See D-046.

### Patch Changes

- ecab9f0: A `Field` with `orientation="horizontal"` — the checkbox arrangement — now shows
  a pointer cursor over its label, so the whole row reads as the click target it
  is. It sets `Label`'s `--pp-label-cursor` on its own root; a disabled field does
  not, because clicking a disabled control's label does nothing.
  
  `Label`'s documentation said `Checkbox` would set this property on its own root.
  It never did, and it could not have reached the label from there: inside a
  `Field` the label is the control's sibling, and a custom property only inherits
  downward. See D-045.

## 0.3.0

### Minor Changes

- e860b48: Add `Checkbox` (3.10) — a binary or tri-state checkbox on the native input,
  painted with `appearance: none` and marked by an inline `Icon`.
  
  - 16 / 20 / 24 from the size scale, not the 32 / 40 / 48 control scale. `sm` and
    `md` conform to WCAG 2.5.8 through the spacing exception, which is the same
    geometry behind `RadioGroup`'s `gap` default.
  - `checked` / `defaultChecked` / `onCheckedChange` with a third state the caller
    owns: clicking an indeterminate box produces `true`, never `'indeterminate'`.
    The native `onChange` is chained rather than replaced, so `register()` from
    `react-hook-form` still works.
  - Reads `size`, `required`, `disabled` and invalid state from `Field`; an
    explicit prop always wins, including `disabled={false}`.
- 897c388: Add `Textarea` (3.9): a multi-line text control on the same surface as `Input`,
  with opt-in auto-resize.
  
  It reads `size`, `required`, `disabled` and the invalid state from the `Field`
  above it through `useField()`, works standalone when there is no field, and
  follows the same precedence rule as every control in this tier: an explicit prop
  beats the field, which beats the default — including `disabled={false}` inside a
  disabled field, which does enable the control. `value`, `defaultValue` and
  `onChange` go straight to the DOM, as they do for `Input`.
  
  `autoResize` grows the control with its content and never below `rows`. The
  measurement resets `block-size` to `auto` before reading `scrollHeight`, which
  is both halves of the mechanism: `scrollHeight` is max(content, client), so
  measuring against a height the component wrote itself could only ratchet upward
  and never shrink — and the reset is also where the `rows` floor comes from, with
  no second source of truth to drift from. It re-measures on width changes only;
  writing `block-size` is itself a resize, so watching height would re-enter
  forever. CSS `field-sizing: content` is deliberately not used: shipping both
  means two resize behaviours depending on the browser, and the one that is easy
  to test is the one that is not running for your users.
  
  `resize` is `'vertical'` or `'none'`. There is no `'horizontal'` — a
  user-widened textarea overflows the `Field`'s grid column and takes the layout
  with it, which is the one thing the sizing contract exists to prevent.
  
  The vertical padding is derived from `--pp-control-*` rather than picked off the
  space scale, because the scale cannot express the 10.2px `lg` needs. The payoff
  is that a one-row `Textarea` is exactly an `Input`'s height at every size, by
  construction rather than by anyone checking.

## 0.2.0

### Minor Changes

- ca2c923: Add `Input` (3.8): a single-line text control on the shared control surface,
  and the first of Tier 3C.
  
  It reads `size`, `required`, `disabled` and the invalid state from the `Field`
  above it through `useField()`, and works standalone when there is no field. One
  precedence rule everywhere: an explicit prop beats the field, which beats the
  default — including `disabled={false}` inside a disabled field, which does
  enable the control.
  
  `value`, `defaultValue` and `onChange` go straight to the DOM. That is the
  fullest compliance with the controlled-and-uncontrolled rule rather than an
  exception to it: React's own inputs already implement it, and wrapping them
  would hand you an `onChange` taking a bare string, which `react-hook-form`
  cannot register and which cannot read `event.target.validity`.
  
  **It renders two elements, because an `<input>` does not fill.** A block element
  with no width declaration fills its parent — except a form control, which has an
  intrinsic inline size from the HTML `size` attribute and measures 185px inside a
  600px parent. The root is a one-cell grid, the control stretches into it, and no
  width is declared anywhere. `ref` and every native prop go to the `<input>`;
  `className` and `style` go to the root, which is the box you are styling.
  
  Focus draws two different things: the one library-wide ring outside the box, and
  a tone-shifted border inside it — so an invalid field stays red while you are
  fixing it instead of losing its error state the moment you click into it.
  
  `size` is the control scale and never the HTML attribute, which counts
  characters. `type` is an allow-list; `checkbox`, `radio`, `range`, `file` and
  the button types are other components, and `color` and `hidden` are not text
  fields.

## 0.1.0

### Minor Changes

- 6d265e8: Add `AspectRatio` (2.7): reserves a box of a given shape before its content
  loads, so an image or embed does not shift the page when it arrives.
  
  The root is a grid with the child at `1 / 1`, because a single grid item
  stretches on the inline axis by default — so the child fills both axes without
  the component ever declaring `inline-size`. `ratio` is required; there is no
  ratio that is right when you did not think about it.
- 3b7edec: Add `Avatar` (1.9): an image with initials fallback, required `name`, and `data-state` for load status.
- 3b7edec: Add `Badge` (1.8): a status chip with `variant`, `tone` and `size`, sized by its content.
- f3bcbfa: Add `ButtonGroup` (3.4): related buttons rendered as one attached unit, with a
  required `label` and `orientation`.
  
  It is the attached case and only the attached case — a group that merely spaces
  buttons out *is* `<Cluster gap="2">`, so there is no `attached` prop. It does
  not manage selection: one-of-many is a `RadioGroup`, several-of-many is a row of
  `Toggle`s.
  
  It styles its children by descendant selector rather than cloning them with
  props, so `asChild` children and mixed `Button` / `IconButton` contents work.
  Every button keeps its own tab stop, deliberately not the APG toolbar's roving
  tabindex — that is `Toolbar` (6.6).
- f3bcbfa: Add `Button` (3.1): an action control with `variant`, `tone`, `size`, a
  `loading` state and `asChild`. It hugs its label — there is no `fullWidth`
  prop; stretch it from the parent.
  
  Two things it brings that outlive it:
  
  - **`--pp-control-*` tokens.** Height, inline padding, gap, font size and
    radius for every control in the library, so a `Button` and an `Input` at
    `size="md"` are the same height by construction. Retune all controls at once
    by setting `--pp-control-height-md` rather than a per-component property.
  - **`--pp-tone-solid-active`**, a new semantic token for the pressed state of a
    solid fill, verified at 4.5:1 against its on-solid text in both themes and
    all five tones.
  
  `loading` sets `aria-disabled` rather than `disabled`, so the button keeps its
  place in the tab order — a browser blurs a focused element the instant it is
  disabled, which loses a keyboard user's place mid-submit. `type` defaults to
  `"button"`, not HTML's `"submit"`.
- 6d265e8: Add `Center` (2.5): centres its children in the box it was given, on either axis
  or both.
  
  It does not constrain a measure — that is `Container` — and it has no height
  prop. Block size comes from the parent or from `--pp-center-min-block-size`, the
  same answer `Skeleton` gives to the same problem.
- 6d265e8: Add `Cluster` (2.2): a horizontal row that wraps, with `gap`, `align`,
  `justify` and `wrap`.
  
  Wrapping is the default and needs no container query — flex resolves it
  continuously against the space available, so the same `Cluster` is correct in a
  240px sidebar and a 960px page without being told which it is in.
  
  `align` defaults to `center` rather than `Stack`'s `stretch`: a row of
  mixed-height things reads correctly centred, and that is nearly every row.
- 3b7edec: Add `Code` (1.11): inline code that tracks its surrounding text size, with `tone` and an opt-in fixed `size`.
- 6d265e8: Add `Container` (2.4) — the only component in the library permitted to set
  `max-inline-size`, which is its entire job.
  
  Takes `size` (`40rem` / `64rem` / `80rem`) and `gutter`. The gutter defaults to
  a non-zero step where `gap` defaults to zero: a zero gap is a legitimate design,
  a zero page gutter is text against the edge of a phone screen.
  
  Adds `--pp-measure-sm/md/lg` to the token layer — a third dimensional scale,
  answering how wide content may run rather than how far apart boxes sit or how
  big a box is (D-025).
  
  Building it also found that the raw-unit lint never covered `max-inline-size`,
  `block-size`, `min-block-size`, `max-block-size` or `flex-basis`. It does now,
  with fixtures so the rule is observed firing.
- 5de2407: Add `Label` (3.6): the visible name of a form control, and the first half of the
  `Field` foundation.
  
  It rides the control scale rather than the text scale — `size` resolves
  `--pp-control-font-size-*`, the same token the input beside it reads — so a
  label and its field agree by construction. That makes `sm` and `md` the same
  type size deliberately: a control gets small by losing height and padding, and a
  12px label is not a smaller label.
  
  `required` renders an `aria-hidden` asterisk rather than visually-hidden text,
  because the control already announces the state and two announcements are worse
  than one. It is presentational: `Label` has no control to mark, so set
  `required` on the input too, or let `Field` set both.
  
  `invalid` exposes `data-invalid` and changes nothing visually. A field in error
  already has a red border, a red message and `aria-invalid`; a red label is the
  fourth signal and the only one made of colour alone. Restyle it in one selector
  if you disagree.
- 6d265e8: Add `Grid` (2.3) in three modes: `columns={n}` for a fixed count,
  `minItemInlineSize` for an `auto-fit` track that reflows with no query at all,
  and `columns="<template>"` for the asymmetric cases neither covers.
  
  `columns` and `minItemInlineSize` are mutually exclusive in the type rather than
  by precedence. Every generated track is `minmax(0, 1fr)` — bare `1fr` carries a
  `min-content` floor that lets one long string push the grid past its container.
  
  Also exports `gridTracks`, the pure track-list function, and establishes D-024:
  a component writes a private custom property and the stylesheet reads the public
  one first, so a consumer's override still works from an ancestor.
- 3b7edec: Add `Heading` (1.2): `h1`–`h6` by required `level`, with a visual `size` decoupled from it.
- f3bcbfa: Add `IconButton` (3.2): a square `Button` whose accessible name is required by
  the type. `label: string` is non-optional, so an unnamed icon button does not
  compile — which is why it is a separate component rather than a `Button` prop.
  
  Pass the raw SVG as children; it is wrapped in `<Icon decorative>` so the
  control is never named twice. `size` sets the box from `--pp-control-height-*`
  and passes through to `Icon`, so a 32px button holds a 16px icon with no second
  scale to keep in step.
  
  `variant` defaults to `"ghost"` rather than `Button`'s `"solid"`. It takes no
  `asChild`: `children` is already the SVG, so there is no slot for a delegate.
- 3b7edec: Add `Icon` (1.3): an SVG wrapper with `1em` sizing, `currentColor`, and a required `label` or `decorative` at the type level. Adds the `--pp-size-*` element-size scale to the token layer.
- 3b7edec: Add `Kbd` (1.10): a keycap with `size`.
- f3bcbfa: Add `Link` (3.3): a text link with `tone`, `underline` and `asChild`. Server
  component.
  
  `underline` defaults to `"always"` — colour alone fails WCAG 1.4.1, so a link
  in running text is underlined unless you opt out with `underline="hover"` for
  navigation lists. It takes no `variant` and no `size`: neither vocabulary has a
  word a link needs, and a link takes the size of the text around it.
  
  It declares no `display`, so it wraps across lines like any other inline text.
  
  Also extends the rule lint: `text-underline-offset` and
  `text-decoration-thickness` are length-valued properties that were not covered
  by the raw-unit ban, so component CSS could have hardcoded a pixel value in
  either without anything objecting.
- 5de2407: Add `Field` (3.7): a labelled control with its description, its error, and the
  ARIA relationships between them — wired once instead of at every call site.
  
  `Field` owns the ids, associates the label, points `aria-describedby` at
  whichever of the description and the error actually rendered, and passes `size`,
  `required`, `disabled` and the invalid state to both the label and the control.
  `error` is the invalid state; there is no `invalid` prop to contradict it, and an
  empty string is a valid field rather than an empty message.
  
  Controls read their wiring from the exported `useField()` hook rather than being
  cloned, so a control still works standalone, keeps working when you wrap it in
  something, and can be one of your own. Precedence is the same everywhere:
  an explicit prop beats the field, which beats the default.
  
  For a control the library does not own, `children` may be a render prop —
  `{(control) => <input {...control} />}`. Note that a function cannot cross the
  server/client boundary, so that form requires the calling component to be a
  Client Component; passing an element works from anywhere.
  
  Also adds `orientation="horizontal"` for the checkbox arrangement, `group` for
  controls that are not labelable, `labelHidden`, and `controlId` for when the
  control's id has to be a known value.
- 6d265e8: Add `Scroller` (2.8), completing Tier 2. An overflow container that reports
  which edge has content beyond it, as `data-overflow` in the DOM and as a
  gradient shadow.
  
  `label` is required: a scrollable region a keyboard user can reach is WCAG
  2.1.1, and a focusable region with no accessible name is a 4.1.2 failure.
  
  The only client component in the tier — scroll position is a browser fact.
  It uses `ResizeObserver` unguarded, so jsdom test suites need a stub; the
  Scroller docs page has one.
- 3b7edec: Add `Separator` (1.5): a horizontal or vertical rule, decorative by default, drawn with a single logical border.
- 3b7edec: Add `Skeleton` (1.7): text, block and circle placeholders with a reduced-motion-safe shimmer and no height prop.
- 3b7edec: Add `Spinner` (1.6): an indeterminate busy indicator with a required `label` or `decorative`, and a reduced-motion pulse.
- 6d265e8: Add `Split` (2.6): a fixed pane beside a flexible one, collapsing to stacked
  when the container — not the viewport — gets narrow.
  
  Compound: `Split.Sidebar` and `Split.Main`, each taking `asChild` so they can be
  landmarks. There is no `side` prop; a right-hand sidebar is `Split.Main` written
  first, because `order` would desynchronise reading order from visual order.
  
  `collapseBelow` is named (`sm` / `md` / `lg` / `never`) rather than a free
  length, because a container query condition cannot read a custom property.
- 6d265e8: Add `Stack` (2.1), the first Tier 2 layout primitive, and the shared `gap` scale
  the rest of the tier is built on.
  
  `Stack` is a flex column with a gap and a cross-axis `align`. `gap` is a new
  fixed-vocabulary prop taking a step of the space scale as a string —
  `gap="4"` resolves to `--pp-space-4` (D-020). It defaults to `"0"`, which is
  load-bearing: the scale is mapped onto an inheriting custom property, so the
  attribute must always be emitted or a nested layout silently inherits its
  parent's rhythm.
  
  Also exports the `Space`, `Align` and `Justify` vocabulary types, and adds a
  `--pp-color-shadow-edge` semantic token for the fading gradients `Scroller`
  (2.8) will need (D-023).
- 3b7edec: Add `Text` (1.1): body copy with `size`, `tone`, `weight`, `align`, `truncate` and `asChild`.
- a39117e: Foundations: OKLCH design tokens with contrast solved rather than eyeballed,
  cascade layers, a minimal non-invasive reset, and the rule lint that enforces
  the sizing contract.
  
  Consumers import one stylesheet:
  
  ```ts
  import "pixel-perfect/styles.css";
  ```
  
  Themes bind to any element via `data-pp-theme`, so a dark sidebar in a light
  page works. Tone is a CSS context via `data-pp-tone`. No components yet.
- f3bcbfa: Add `Toggle` (3.5): a button that stays pressed, with
  `pressed` / `defaultPressed` / `onPressedChange` — controlled and uncontrolled,
  both, always. Switching between the two mid-life now warns in development
  rather than going silently inert.
  
  It is `aria-pressed`, not `aria-checked`, and exposes `data-state="on" | "off"`.
  That vocabulary is reserved for pressed controls; `checked` / `unchecked` stays
  with `Switch` and `Checkbox`, so what a control *is* reads off the DOM.
  
  Takes no `loading`: a toggle's effect is immediate by definition.
- 3b7edec: Add `VisuallyHidden` (1.4): content for assistive technology only, with `asChild`.
