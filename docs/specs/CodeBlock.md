# 5.12 `CodeBlock`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-089; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — the copy button's state |
| **Depends on** | 1.11 `Code` (`done`): the inline atom's typography, in a block |
| **APG pattern** | None. A `<pre>` in a named region that scrolls (Table's device, D-081 §1), a button |

Block code: several lines in a frame, numbered if asked, one or two
lines pointed at, a button that copies it. Highlighting is the
consumer's — a peer, not a dependency (roadmap 5.12) — and this is the
frame it goes in.

## Purpose

A snippet in docs, a config file, a stack trace, a diff. The reader
needs to see it in a monospace block that keeps its lines, scroll a
long line sideways without the page scrolling, know which line the
prose is talking about, and take it with one press. What they do not
need from a component library is a syntax highlighter: those are
large, opinionated about grammars and themes, and best run at build
time (Shiki) or the consumer's choice at runtime (Prism). So the
component takes either plain text (`code`) or the consumer's
highlighted nodes (`CodeBlockLine`s), and draws the frame, the gutter,
the pointing and the button around either.

It deliberately does **not**: highlight; theme tokens (a highlighter's
output carries its own colours, and a consumer maps them to
`--pp-*` in their own stylesheet if they want the library's ramp);
or fold, diff or edit.

---

## Decisions this spec asks you to approve

### 1. Two parts; `code` for text, `CodeBlockLine` children for highlighted output

```tsx
<CodeBlock title="pixel.config.ts" language="ts" lineNumbers highlightLines={[2]} code={`export default {\n  theme: 'dark',\n};`} />

<CodeBlock title="app.tsx" lineNumbers>
  <CodeBlockLine>{/* tokens from the consumer's highlighter */}</CodeBlockLine>
  <CodeBlockLine highlighted>…</CodeBlockLine>
</CodeBlock>
```

`CodeBlock` and `CodeBlockLine`, named exports. With `code`, the
component splits it into lines and renders a `CodeBlockLine` per line,
so the gutter and the pointing work on plain text; with children, the
consumer renders the lines themselves (one `CodeBlockLine` per line,
holding whatever their highlighter produced), and `highlighted` on a
line points at it. `highlightLines` (1-based) is the `code` form's way
to point. The two forms are exclusive: `children` wins if both are
given, with a development warning.

### 2. The `<pre>` is a named region that scrolls; `wrap` wraps instead

A long line does not push the page: the `<pre>` scrolls on the inline
axis inside its frame, and it is a `role="region"` with `tabindex="0"`
named by the title (or `label`), Table's reasoning (D-081 §1) — a
keyboard user must be able to scroll it, and a Server Component cannot
know whether it overflows (this one is client, but the answer is the
same: an always-present tab stop is predictable). `wrap` makes long
lines wrap (`white-space: pre-wrap`) for prose-like code, a shell
one-liner in a sidebar, and the region keeps its stop.

### 3. The frame, the gutter, the pointing and the button

The block is `Code`'s typography — the mono family, the `sm` size,
`--pp-line-height-normal` — on the sunken surface, in Card's hairline
frame and radius; a header carries the `title` (mono, muted), the
`language` (a `Badge`, `sm`) and the copy button (an `IconButton`,
`plain`, `sm`) when any is given; with none, the button floats in the
block's top end corner. Line numbers are a CSS counter in a gutter
that is `user-select: none`, so copying the text by hand never takes
the numbers. A highlighted line is `--pp-tone-bg` in the accent scope
across the full width with an inset accent bar at its start (D-089 §3).

The copy button writes the block's text (`code`, or the lines'
`textContent`) with the Clipboard API, says "Copied" for two seconds in
its label and a `role="status"` line, then returns; when the API is
missing it stays "Copy code" and does nothing, and the consumer who
needs a fallback owns it.

---

## Sizing contract justification

`fill`: a block that takes its parent's width, `min-inline-size: 0`;
the `<pre>` inside scrolls or wraps.

## Anatomy

```
<div class="pp-code-block" data-wrap? data-line-numbers?>
  ├── <div class="pp-code-block__header">?
  │     ├── <span class="pp-code-block__title">pixel.config.ts
  │     ├── <span class="pp-badge pp-code-block__language">ts
  │     └── <button class="pp-button pp-icon-button pp-code-block__copy" aria-label="Copy code">
  ├── <pre class="pp-code-block__pre" role="region" tabindex="0" aria-label="pixel.config.ts">
  │     └── <code class="pp-code-block__code">
  │           └── <span class="pp-code-block__line" data-highlighted?>   (one per line)
  └── <span class="pp-visually-hidden" role="status">Copied
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| CodeBlock | `pp-code-block` | `<div>` | The frame |
| header | `pp-code-block__header` | `<div>` | Title, language, copy |
| pre | `pp-code-block__pre` | `<pre role="region">` | Scrolls; the tab stop |
| code | `pp-code-block__code` | `<code>` | The lines |
| CodeBlockLine | `pp-code-block__line` | `<span>` | The counter's step; `data-highlighted` |
| copy | `pp-icon-button pp-code-block__copy` | `IconButton` | "Copy code" / "Copied" |

## Props

**`CodeBlock`**: `code?: string`, `title?: ReactNode`, `language?:
string`, `lineNumbers?: boolean`, `highlightLines?: number[]`, `wrap?:
boolean`, `copy?: boolean` (`true`), `label?: string` (the region's name
when there is no title; `'Code'`), `children?` (`CodeBlockLine`s),
…`<'div'>`. **`CodeBlockLine`**: `highlighted?: boolean`, …`<'span'>`.

Exported types: `CodeBlockProps`, `CodeBlockLineProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| copied | the button's label, the status line | "Copied", a check |
| highlighted line | `data-highlighted` on the line | Accent surface, the bar |
| wrap | `data-wrap` on the root | Lines wrap |
| line numbers | `data-line-numbers` on the root | The gutter |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-code-block-bg` | `--pp-color-bg-sunken` | The block |
| `--pp-code-block-border-color` | `--pp-color-border-subtle` | The frame |
| `--pp-code-block-radius` | `--pp-radius-3` | The corners |
| `--pp-code-block-padding` | `--pp-space-4` | Inside the pre |
| `--pp-code-block-highlight-bg` | `--pp-tone-bg` (accent) | A pointed line |
| `--pp-code-block-font-size` | `--pp-font-size-2` | The code |

**Contrast, computed at the gate (D-048 §1).** The code is the page's
text on `bg-sunken`, an asserted pairing; the gutter is muted text on
it, asserted; a highlighted line's text is the page's on the accent
`bg` step, the ghost pairing. A highlighter's own colours are its
consumer's to check.

## Keyboard interaction

Tab to the copy button, then to the region; arrows scroll a long line.

## Accessibility notes

- The `<pre>` is a named, focusable region; the gutter is generated
  content, out of the tree, and the numbers are not copied.
- The copy button is named "Copy code" and, for two seconds after,
  "Copied"; a visually hidden `role="status"` says it too.
- A highlighted line is visual; prose that points at it says the
  number.
- **Manual walkthrough:** Tab to "Copy code", press it, hear "Copied";
  Tab to the region "pixel.config.ts", Arrow Right scrolls.

## Container behavior

`fill`; a long line scrolls inside the frame, or wraps with `wrap`.

## Usage

```tsx
<CodeBlock title="install.sh" language="sh" code="npm install pixel-perfect" />

// With Shiki at build time:
<CodeBlock title="app.tsx" lineNumbers>
  {lines.map((tokens, i) => (
    <CodeBlockLine key={i}>{tokens.map((t, j) => <span key={j} style={{ color: t.color }}>{t.content}</span>)}</CodeBlockLine>
  ))}
</CodeBlock>
```

## Don't

- Don't expect it to colour anything; bring a highlighter.
- Don't put a `Code` inside it; it is the block form.
- Don't wrap it in a `Scroller`; the pre scrolls.

## Testing notes

- **Unit:** the frame, the region named by the title and by `label`;
  `code` split into lines, a trailing newline not a line; `lineNumbers`
  and `highlightLines` on the root and the lines; children lines and
  `highlighted`; both given warns and children win; the header only
  when something is in it; the copy button writing the text, saying
  "Copied" and returning after two seconds (fake timers), absent with
  `copy={false}`, present and inert without a clipboard, and hydrating
  server HTML rendered without one in a client that has one, with no
  mismatch (D-093 §1); `wrap`; refs, `className`,
  `style`; axe both themes.
- **Browser:** the surface, frame and mono family; the gutter's
  counters and its `user-select`; the highlighted line's surface and
  bar across the full width; a long line scrolling inside the region
  with nothing spilling, and wrapping with `wrap`; the ring on the
  region and on the button; the header's layout.
- **Break checks (D-035 §3):** drop the highlight surface; drop the
  counter; drop the pre's `overflow`; drop `pre-wrap`.
- **Screenshot:** a numbered block with a highlighted line and a long
  line per cell, plus wrap, a bare block and a highlighted-children one
  outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **Bundle a highlighter behind a flag?** No: peer, by the roadmap.
2. **A `maxLines` with "show more"?** Not now; a consumer's `Scroller`
   with a height around it.
3. **A diff mode (`+`/`-` lines)?** Not now; `highlighted` on lines and
   the consumer's tone tokens on a wrapper cover the common case.
