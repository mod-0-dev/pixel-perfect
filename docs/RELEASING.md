# Releasing and consuming

## Installing

```bash
npm install @mod-0-dev/pixel-perfect
```

React 18 or later is a peer dependency. Import the stylesheet once at the app
root and the components from the package root:

```tsx
import '@mod-0-dev/pixel-perfect/styles.css';
import { Button } from '@mod-0-dev/pixel-perfect';
```

## You do not need a registry to use this

The package builds itself on install (`prepare`), so a git dependency works with
no registry, no auth, and no publish step:

```json
{
  "dependencies": {
    "@mod-0-dev/pixel-perfect": "github:mod-0-dev/pixel-perfect#v0.11.1"
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

> **Proven end to end on 2026-09-18, after five silent failures.** The workflow
> had failed at its final step on every merge to `main` since Tier 0, because
> the repository policy forbade GitHub Actions from opening the Version Packages
> PR — everything before that step worked, which is why nobody noticed. The
> setting was flipped, PR #6 was opened and merged, and `v0.1.0` was read back
> from `git ls-remote --tags`. `v0.2.0` and `v0.3.0` followed the same route.
> See [D-038](DECISIONS.md#d-038) for the whole episode, and for the standing
> rule it left: infrastructure is done when it has been observed producing its
> artifact, not when its config file exists.

**To publish to npm as well** (D-109):

1. **Create the scope.** On npmjs.com, sign in and create a free
   organization named `mod-0-dev` (Add Organization, "Unlimited public
   packages"). npm has no user or org by that name today, and a scoped name
   can only be published by its owner.
2. **Publish once by hand**, because a trusted publisher is configured on a
   package that already exists. From a clean checkout of `main`:

   ```bash
   npm login
   npm ci                 # also builds dist/ via prepare
   npm pack --dry-run     # read the file list: dist/, LICENSE, README.md, package.json
   npm publish            # prepare rebuilds; publishConfig makes it public
   ```

   npm asks for a one-time password if the account has 2FA on.
3. **Make the workflow the publisher.** On the package's page on npmjs.com,
   Settings → Trusted publishing → GitHub Actions: owner `mod-0-dev`,
   repository `@mod-0-dev/pixel-perfect`, workflow `release.yml`, no environment. Then,
   under Publishing access, require 2FA and disallow tokens.
4. **Switch it on.** In the repository, Settings → Secrets and variables →
   Actions → Variables, add `PUBLISH_TO_NPM` = `true`.

From then on, merging a Version Packages PR publishes that version with
provenance, using the workflow's OIDC identity — no `NPM_TOKEN` to create,
store or rotate. A repository secret named `NPM_TOKEN`, if one is added,
is used instead.

`@mod-0-dev/pixel-perfect` without a scope is somebody else's name on npm (an unrelated
SCSS stylesheet), which is why the package is scoped (D-106 §4). The release
workflow still fails at its first step, naming the reason, if the scope is
ever dropped.

## Versioning

Pre-1.0, a minor bump covers any change to a component's props or rendered DOM.

**Token renames are minor too.** Token names are the most permanent API here —
consumers style against them, and a rename breaks every override they wrote.
Treat `--pp-*` names with more care than component props, not less.
