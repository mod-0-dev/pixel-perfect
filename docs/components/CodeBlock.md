# CodeBlock

Block code in a frame: numbered if asked, a line pointed at, a button
that copies it. Spec: [`CodeBlock.md`](../specs/CodeBlock.md).

```tsx
import { CodeBlock, CodeBlockLine } from 'pixel-perfect';
```

A client component, for its copy button. **Highlighting is yours**: the
library ships no highlighter. Give it plain text, or the lines your
highlighter produced.

## Usage

```tsx
<CodeBlock title="pixel.config.ts" language="ts" lineNumbers highlightLines={[2]} code={source} />
```

`code` is split into lines; `highlightLines` (1-based) points at some.
`title` names the block and its scroll region; `language` is a small
badge. The copy button copies the text and says "Copied" for two
seconds.

With a highlighter — Shiki at build time, say — render one
`CodeBlockLine` per line and put the tokens inside:

```tsx
<CodeBlock title="app.tsx" lineNumbers>
  {lines.map((tokens, i) => (
    <CodeBlockLine key={i} highlighted={i === 3}>
      {tokens.map((t, j) => <span key={j} style={{ color: t.color }}>{t.content}</span>)}
    </CodeBlockLine>
  ))}
</CodeBlock>
```

A long line scrolls inside the frame, never the page; the `<pre>` is a
focusable, named region so a keyboard can scroll it. `wrap` makes lines
wrap instead, for a shell one-liner in a sidebar.

## Props

**`CodeBlock`**: `code`, `title` or `label` (**one is required**),
`language`, `lineNumbers`, `highlightLines`, `wrap`, `copy` (`true`), or
`CodeBlockLine` children. `title` is shown in the header and names the
region; `label` names it without a header line. The type refuses
neither, and refuses both: a page of regions all named "Code" — the
default this had until D-107 §4 — is a page nobody can tell apart.
**`CodeBlockLine`**: `highlighted`.

## Accessibility

The `<pre>` is `role="region"`, focusable, named by the title or
`label` — say what the code is, not that it is code: "Install
command", not "Code". Line numbers are generated content: out of the tree and never
copied. The copy button is named "Copy code", then "Copied", and a
hidden status line says so. A highlighted line is visual; say the
number in your prose.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-code-block-bg` | `--pp-color-bg-sunken` | The block |
| `--pp-code-block-border-color` | `--pp-color-border-subtle` | The frame |
| `--pp-code-block-radius` | `--pp-radius-3` | The corners |
| `--pp-code-block-padding` | `--pp-space-4` | Inside |
| `--pp-code-block-highlight-bg` | `--pp-tone-bg` | A pointed line |
| `--pp-code-block-font-size` | `--pp-font-size-2` | The code |

## Anatomy

```
<div class="pp-code-block" data-line-numbers>
  ├── <div class="pp-code-block__header"> title · language · copy
  ├── <pre class="pp-code-block__pre" role="region" tabindex="0">
  │     └── <code class="pp-code-block__code">
  │           └── <span class="pp-code-block__line" data-highlighted>   (one per line)
  └── (a hidden status line)
```

## Don't

```tsx
// ✗ Expecting colour. Bring a highlighter.
<CodeBlock code={source} language="ts" label="Config" />  // plain, on purpose

// ✗ No name. It does not typecheck; untyped, it warns and is called
//   "Code", like every other unnamed block on the page.
<CodeBlock code={source} />
// ✓
<CodeBlock code={source} label="Install command" />

// ✗ A Code inside it. This is the block form.
<CodeBlock><Code>…</Code></CodeBlock>

// ✗ A Scroller around it. The pre scrolls.
<Scroller label="Snippet"><CodeBlock code={source} label="Snippet" /></Scroller>
```
