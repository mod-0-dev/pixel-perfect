# Pixel Perfect

A component library with opinions.

- **Ground rules:** [`docs/RULES.md`](docs/RULES.md) — read these first
- **Roadmap & status:** [`ROADMAP.md`](ROADMAP.md)
- **Decisions:** [`docs/DECISIONS.md`](docs/DECISIONS.md)
- **Workflow:** the `/component` skill in [`.claude/skills/component/`](.claude/skills/component/)

React + TypeScript for Next.js. Plain CSS, two-tier design tokens, one
stylesheet. Zero runtime dependencies outside Tier 4 overlays.

## The one rule that shapes everything

No component declares its own `width`, `max-width`, or `margin`. Every component
declares a `fill` or `hug` sizing contract at design time — never as a prop.
Parents own placement and space. `Container` is the only component allowed to
set `max-width`.

## Deploying the playground

The library is not deployable; the playground is. On Vercel, set the project's
**Root Directory** to `playground` — everything else is in
[`playground/vercel.json`](playground/vercel.json).

The install command there does what CI does: installs the library at the repo
root (its `prepare` hook builds `dist/`), then installs the playground, whose
`pixel-perfect` dependency is a `file:..` link to that `dist/`.

`--include=dev` on both installs is not decoration. The first seven Vercel
deployments died inside the library's `prepare` hook with
`tsc: command not found`: the build toolchain lives in devDependencies, and
a production-style install omits them before the hook runs. Reproduced with
`NODE_ENV=production npm install` under npm 11, and fixed by the flag.
