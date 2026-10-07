# pixel-perfect — for the coding agent in your app

You are writing UI in an app that uses **pixel-perfect**, a React component
library for Next.js with strict opinions. Code that ignores them still
renders, and is still wrong: it fights the library's layout model, its tokens
or its accessibility wiring. Read this file before writing UI code, and open
the component's own doc (linked below) before using a component for the
first time.

This file ships inside the package (`node_modules/@mod-0-dev/pixel-perfect/dist/AGENTS.md`)
and is regenerated with every release, so it describes the version installed.

## Setup, once per app

```tsx
// app/layout.tsx
import '@mod-0-dev/pixel-perfect/styles.css'; // the one stylesheet, imported once
import { ThemeProvider } from '@mod-0-dev/pixel-perfect';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>  {/* first thing in <body> */}
      </body>
    </html>
  );
}
```

Everything is a named export of `@mod-0-dev/pixel-perfect`. A brand colour comes from
`npx pixel-perfect theme --accent "#7c3aed" --out src/brand.css`: import that
file after `@mod-0-dev/pixel-perfect/styles.css` and never hand-edit it.

A responsive app should also put `text-size-adjust: 100%` on `html` in its
own stylesheet. Without it iOS Safari enlarges text in anything that runs
wider than the screen. The library's own scrolling regions (`CodeBlock`,
`Table`, `Scroller`) already opt out; your content needs the root rule. The
stylesheet doesn't set it for you because it styles your document as little
as it can.

## The rules that change what you write

1. **Never size or space a component from the outside with its own props, and
   never give it `width`, `max-width`, `min-width` or `margin` in your CSS.**
   Every component is either `fill` (takes the width its parent gives it) or
   `hug` (sizes to its content). There is no `fullWidth` prop and there never
   will be. Place and space things with the layout primitives: `Stack`
   (vertical, `gap`), `Cluster` (a wrapping row, `gap`, `justify`, `align`),
   `Grid` (`columns` or `minItemInlineSize`), `Split` (a sidebar and a main
   column), `Center`, `AspectRatio`. `Container` is the only thing that sets a
   max width: wrap content in it to constrain a measure.
2. **`gap` is a space-scale index, not a length**: `gap="4"`, not
   `gap="16px"`. The scale is `0`–`9` (`--pp-space-*`).
3. **Responsive means the container, not the viewport.** Components answer to
   the width of the box they are in (`@container`). Do not wrap them in
   viewport media queries; put them in the box that should decide.
4. **One vocabulary for every component**: `variant` is
   `solid | outline | ghost | plain`; `tone` is
   `neutral | accent | danger | success | warning`; `size` is `sm | md | lg`
   (default `md`). There are no `color`, `kind`, `type` (for styling) or
   `appearance` props. Hierarchy is `tone`: the default is neutral, and one
   action per view opts into `tone="accent"`.
5. **Compound parts are named exports**: `<Card><CardHeader/></Card>`,
   `<Dialog><DialogTrigger/><DialogContent/></Dialog>`. Never `Card.Header` —
   it fails in a Server Component.
6. **No polymorphic `as` prop.** To render a component as something else, use
   `asChild`: `<Link asChild><NextLink href="/x">…</NextLink></Link>`,
   `<Button asChild><a href="…">…</a></Button>`.
7. **Every stateful component is controlled or uncontrolled, by the same
   names**: `value` / `defaultValue` / `onValueChange`, `open` /
   `defaultOpen` / `onOpenChange` (and `checked` / `pressed` where the
   platform says so). Pick one mode per instance.
8. **Forms go through `Field`**: it wires the label, description and error
   to the control. Pass `error` to make a field invalid; there is no
   `invalid` prop on `Field`. Validation is your app's job; `Form` only
   summarises the errors you found.
9. **Icon-only controls need a name**, and the types enforce it: `IconButton`
   requires `label`.
10. **Style through the library's hooks, never around them**: state is on the
    DOM as `data-state`, `data-disabled`, `data-invalid` and friends;
    each component exposes `--pp-<component>-*` custom properties for
    one-off overrides; colours come from semantic tokens (`--pp-color-*`,
    and `--pp-tone-*` inside a toned element). Everything the library ships
    is in `@layer pp.*`, so your plain CSS already wins — `!important` and
    deep selectors into `pp-` classes are never needed.
11. **`'use client'` only where needed.** Purely presentational components
    are Server Components; overlays and stateful controls are client
    components. Do not add `'use client'` to a page just to use a `Stack`.

## Banned

| Do not write | Write instead |
| --- | --- |
| `width`, `max-width`, `min-width` on a component | nothing (it fills), or wrap it in `Container` |
| `margin` on a component, a `spacing` prop, a `Spacer` | `gap` on a layout primitive |
| `fullWidth`, `width`, `maxWidth`, `m`/`mt`/`mb` props | the sizing contract: put it in the right box |
| hardcoded colours, spacing or radii | semantic tokens and the scales |
| viewport media queries around a component | the right container |
| `outline: none` without a replacement | the library's focus ring, which is already there |
| `<Card as="section">` | `asChild` |
| `!important` | the cascade: your CSS is unlayered and wins |
| `color` / `kind` / `appearance` props | `tone` / `variant` |

The full constitution, with the reasons, is [`docs/RULES.md`](docs/RULES.md).

## Components

Open a component's doc before using it: usage first, then every prop, then at
least one thing not to do.

<!-- COMPONENT INDEX: generated by scripts/build-agent-docs.mjs from docs/components/*.md -->
