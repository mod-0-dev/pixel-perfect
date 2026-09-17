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
