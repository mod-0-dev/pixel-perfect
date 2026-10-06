# CLAUDE.md

Project guidance for Claude Code sessions in this repository.

## Working agreements

- **Do not monitor pull requests unless explicitly asked.** After pushing and
  opening the PR, stop there. Do not subscribe to PR activity, do not watch CI,
  do not schedule check-ins, and do not respond to review comments or CI
  failures on your own initiative. Wait for the user to ask. (Recorded
  2026-09-19 at the user's request.)

## Roadmap work

`ROADMAP.md` is the single source of truth for component status, and the
`/component` skill (`.claude/skills/component/SKILL.md`) governs how work moves
through it. Before touching anything, read `ROADMAP.md`, `docs/RULES.md` and
`docs/DECISIONS-INDEX.md` — every ruling in `docs/DECISIONS.md`, one line each —
then open in full every entry whose title touches your work (D-106). After
appending an entry to the log, run `npm run decisions`; a unit test fails
until the index and the entry's anchor are current.
