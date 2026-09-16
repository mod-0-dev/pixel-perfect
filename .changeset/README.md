# Changesets

Every change that affects a consumer needs a changeset. Run:

```bash
npx changeset
```

Pick a bump and describe the change **as a consumer experiences it** — not as a
diff summary. "Button no longer stretches inside a flex row" is useful;
"refactor Button CSS" is not.

Changes with no consumer-visible effect (CI, internal refactors, the playground)
need no changeset.

Until 1.0.0, treat any change to a component's props or rendered DOM as a minor
bump. Token renames are minor too — they are the library's most permanent API
and a rename breaks every consumer override.
