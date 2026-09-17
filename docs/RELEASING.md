# Releasing and consuming

## You do not need a registry to use this

The package builds itself on install (`prepare`), so a git dependency works with
no registry, no auth, and no publish step:

```json
{
  "dependencies": {
    "pixel-perfect": "github:mod-0-dev/pixel-perfect#v0.1.0"
  }
}
```

npm clones the repo, runs `prepare`, and `dist/` is produced on the consumer
machine — which is why `dist/` is gitignored rather than committed. This works
on Vercel for a public repo.

Pin a tag, not a branch. Tags come from the release workflow (below).

### The routes, ranked for a single consuming app

| | Route | When |
| --- | --- | --- |
| 1 | **npm workspace** — app and library in one repo | Fastest iteration. No publish step; one PR changes both. Costs a repo merge |
| 2 | **Git dependency** | Works today. No registry, no auth for a public repo |
| 3 | **npm publish** | Once there is a second consumer or a second person. Public is free |
| 4 | **GitHub Packages** | Free private registry, but every consumer including CI needs `.npmrc` auth |

Publishing early inserts a version-bump-publish-install cycle between every
change and seeing it in the app. Do it when someone other than you consumes the
library, not before.

## Making a release

Every consumer-visible change carries a changeset:

```bash
npx changeset
```

On merge to `main`, the release workflow opens a **Version Packages** PR that
applies pending changesets, bumps the version and writes `CHANGELOG.md`. Merging
that PR cuts the release.

**By default** the workflow versions, changelogs and tags. That is everything a
git dependency needs.

**To publish to npm as well**, set the repository variable `PUBLISH_TO_NPM=true`
and add an `NPM_TOKEN` secret. Nothing else changes; the same workflow starts
publishing.

## Versioning

Pre-1.0, a minor bump covers any change to a component's props or rendered DOM.

**Token renames are minor too.** Token names are the most permanent API here —
consumers style against them, and a rename breaks every override they wrote.
Treat `--pp-*` names with more care than component props, not less.
