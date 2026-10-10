# Pixel Perfect

[![npm](https://img.shields.io/npm/v/@mod-0-dev/pixel-perfect)](https://www.npmjs.com/package/@mod-0-dev/pixel-perfect)
[![license](https://img.shields.io/npm/l/@mod-0-dev/pixel-perfect)](LICENSE)

A component library with opinions.

- **Ground rules:** [`docs/RULES.md`](docs/RULES.md) — read these first
- **Roadmap & status:** [`ROADMAP.md`](ROADMAP.md)
- **Decisions:** [`docs/DECISIONS.md`](docs/DECISIONS.md)
- **Workflow:** the `/component` skill in [`.claude/skills/component/`](.claude/skills/component/)

React + TypeScript for Next.js. Plain CSS, two-tier design tokens, one
stylesheet. Zero runtime dependencies outside Tier 4 overlays.

## Install

Published on npm as
[`@mod-0-dev/pixel-perfect`](https://www.npmjs.com/package/@mod-0-dev/pixel-perfect).

```bash
npm install @mod-0-dev/pixel-perfect
```

```tsx
// app/layout.tsx
import '@mod-0-dev/pixel-perfect/styles.css';
import { ThemeProvider } from '@mod-0-dev/pixel-perfect';
```

React 18 or later is a peer dependency. Releasing, and installing from git
instead of npm: [`docs/RELEASING.md`](docs/RELEASING.md).

## The one rule that shapes everything

No component declares its own `width`, `max-width`, or `margin`. Every component
declares a `fill` or `hug` sizing contract at design time — never as a prop.
Parents own placement and space. `Container` is the only component allowed to
set `max-width`.

## Your brand colour

```bash
npx pixel-perfect theme --accent "#7c3aed" --out src/brand.css
```

Solves the whole palette around your accent with the library's own generator
and checks the result with its own contrast checks — text, fills, control
edges and the focus ring, in both themes — then writes a stylesheet to import
after `@mod-0-dev/pixel-perfect/styles.css`. A palette that fails a check is reported and
not written. The playground's `/theme` page runs the same code as you drag.
`import { createTheme } from '@mod-0-dev/pixel-perfect/theme'` is the same thing as a
function.

## For your app's coding agent

The package ships `dist/AGENTS.md` — the rules that change what you write,
the banned list, an index of every component — with every component's doc
beside it. Point your agent at it. For Claude Code, one line in your app's
`CLAUDE.md`:

```md
@node_modules/@mod-0-dev/pixel-perfect/dist/AGENTS.md
```

Other agents: reference the same path from your `AGENTS.md`.

## Deploying the playground

The library is not deployable; the playground is. On Vercel, set the project's
**Root Directory** to `playground` — everything else is in
[`playground/vercel.json`](playground/vercel.json).

The install command there does what CI does: installs the library at the repo
root (its `prepare` hook builds `dist/`), then installs the playground, whose
`@mod-0-dev/pixel-perfect` dependency is a `file:..` link to that `dist/`.

`--include=dev` on both installs is not decoration. The first seven Vercel
deployments died inside the library's `prepare` hook with
`tsc: command not found`: the build toolchain lives in devDependencies, and
a production-style install omits them before the hook runs. Reproduced with
`NODE_ENV=production npm install` under npm 11, and fixed by the flag.
