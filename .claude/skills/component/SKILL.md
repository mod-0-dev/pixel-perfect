---
name: component
description: Drive the Pixel Perfect component library roadmap — pick the next component, write its spec, implement it, run the Definition of Done gate, and keep ROADMAP.md status in sync. Use when asked to work on the component library, start/continue/finish a component, check roadmap status, add or defer a component, or when the user says "next component", "/component", or names a component from ROADMAP.md.
---

# Component Roadmap Driver

You are building **Pixel Perfect**, a React/TypeScript component library for
Next.js, styled with plain CSS and design tokens. This skill governs *how* work
moves through the roadmap so that state stays accurate across sessions and no
component is ever half-finished.

## Before anything else

Read, every time this skill runs:

1. `ROADMAP.md` — the single source of truth for status.
2. `docs/RULES.md` — the constitution. Non-negotiable.
3. `docs/DECISIONS.md` — prior rulings. Do not re-litigate them; extend them.

Never infer status from the filesystem. If `ROADMAP.md` says `planned` but code
exists, that is a **bug in tracking** — surface it to the user, do not silently
reconcile.

## Modes

Dispatch on what the user asked for. With no argument, run `status`.

| Invocation | Action |
| --- | --- |
| `status` | Report current state; recommend the next eligible item |
| `next` | Pick the next eligible item and enter **Spec** |
| `start <Name>` | Enter **Spec** for a named item |
| `spec <Name>` | Write/revise the spec only, stop at the approval gate |
| `build <Name>` | Resume implementation for an item already in `build` |
| `done <Name>` | Run the DoD gate and close out |
| `add <Name> --tier N` | Add a new item to the roadmap as `planned` |
| `defer <Name> "<reason>"` | Move to `deferred`, record the reason in DECISIONS |

## Gates

Each gate is a hard stop. Do not proceed past a failing gate; report it.

**Gate A — WIP limit.** At most one item may be in `spec`, `build`, or `review`.
If one already is, refuse to start another and offer to continue the in-flight
one instead. Breadth is how component libraries die.

**Gate B — Dependencies.** Every item in the target's **Deps** column must be
`done`. Tier 0 must be fully `done` before any component starts.

**Gate C — Spec approval.** After writing the spec, **stop and ask the user to
approve the API.** Do not write implementation code in the same turn. API
mistakes are the expensive kind — they are cheap on paper and permanent in code.

**Gate D — Definition of Done.** Walk
`references/definition-of-done.md` item by item before marking anything `done`.
Report each as pass/fail with evidence (command output, file path). Never mark
`done` with an unchecked box; if something genuinely cannot be done, it goes to
`blocked` with a reason, not `done`.

## Workflow

### 1. Spec

Set status to `spec` in `ROADMAP.md`. Create `docs/specs/<Name>.md` from
`templates/spec.md`. Fill in every section — especially:

- **Sizing contract** (`fill` or `hug`) and the justification. If you want an
  exception, it needs a DECISIONS entry, not a shrug.
- **Full props table** with types and defaults, using the fixed vocabulary
  (`variant` / `tone` / `size`) from RULES §5.
- **Anatomy** — every DOM part and its `pp-` class name.
- **States** and the `data-*` attributes exposing them.
- **Keyboard interaction** cross-checked against the WAI-ARIA APG pattern.
- **RSC compatibility** and whether `'use client'` is required.

Then **stop** (Gate C).

### 2. Build

On approval, set status to `build` and implement:

- Component, CSS, and types
- Unit tests + axe test
- Playground entry rendering the component at 3 container widths; the
  screenshot suite captures it in both themes through the playground's theme
  switcher (D-063)
- Docs page with usage plus at least one explicit "don't"
- Changeset

Check your own work against RULES before claiming completion. Run the rule lint
(Tier 0.7) — a component that fails it is not finished.

### 3. Review

Set status to `review`. Run Gate D. Report the checklist to the user with
evidence. Fix anything failing; do not negotiate the checklist down.

### 4. Done

Set status to `done` in `ROADMAP.md`, update the **Current state** block
(in-flight, next up, done count), tick the spec's status line, commit, and push.

## Tracking discipline

- **One commit per status transition**, and the status change ships in the same
  commit as the work that caused it. `ROADMAP.md` and the code never disagree.
- Commit subject: `feat(button): implement Button` /
  `docs(button): spec` / `chore(roadmap): defer Tree`.
- Refresh the **Current state** block in `ROADMAP.md` on every transition. It is
  what a future session reads first.
- When a rule is bent, a convention is set, or a component is deferred, append an
  entry to `docs/DECISIONS.md`. That file is how consistency survives across
  sessions — an undocumented precedent is not a precedent.
- If the user asks for something that violates RULES, say so plainly, explain the
  consequence, and offer the compliant alternative. If they confirm anyway, do
  it *and* record it in DECISIONS as an explicit exception. Silent violations are
  the only unacceptable outcome.

## Reporting format

Always close with:

```
In flight : <Name> (<status>)
Next up   : <Name> (tier N)
Done      : X / N
Blocked   : <items or none>
```

Both numbers in `Done` are read from `ROADMAP.md`'s **Current state** block.
Never hardcode the denominator here: it was `75` until 2026-09-18 and had been
wrong since the roadmap was written, which shipped at 77 and is now 78.
