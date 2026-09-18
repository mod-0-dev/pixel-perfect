import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * THE TWO LISTS THAT HAVE TO AGREE, AND THE REASON THIS FILE EXISTS.
 *
 * `playground/app/components/registry.ts` drives the playground's navigation.
 * `tests/visual/screenshots.spec.ts` drives the visual-regression baselines.
 * They cannot share a module: the playground is not a workspace member (D-012),
 * so it has its own lockfile and neither side can import the other.
 *
 * The screenshot spec therefore duplicates the list by hand, under a comment
 * saying "keep this list in step with registry.ts ... a component page without
 * a screenshot here is a Definition of Done miss."
 *
 * That comment was right and a comment could not enforce it. `Input` (3.8) was
 * added to the registry and not to the spec, so no screenshot test was
 * generated for it, the visual job compared 28 baselines that all still
 * matched, CI went green, and the Definition of Done's "visual regression
 * snapshots committed" box was silently unmet. A missing baseline normally
 * fails loudly — but only for a test that exists.
 *
 * So the invariant is asserted instead of requested. This is D-009's rule
 * ("rules that are not tested decay into rules that are not enforced") and
 * D-028's ("agree by construction rather than by vigilance") applied to the one
 * pair of files in the repository that genuinely cannot be deduplicated.
 */

/* Repo-relative, as tests/unit/tokens.test.ts already reads the token files. */
const slugsIn = (path: string, pattern: RegExp) => {
  const source = readFileSync(path, 'utf8');
  return new Set([...source.matchAll(pattern)].map((m) => m[1] as string));
};

describe('the playground registry and the screenshot spec', () => {
  const registry = slugsIn("playground/app/components/registry.ts", /slug:\s*'([^']+)'/g);
  const screenshots = slugsIn("tests/visual/screenshots.spec.ts", /path:\s*'\/components\/([^']+)'/g);

  it('gives every component page a screenshot baseline', () => {
    const missing = [...registry].filter((slug) => !screenshots.has(slug)).sort();
    expect(missing, 'component pages with no entry in screenshots.spec.ts').toEqual([]);
  });

  it('has no screenshot for a page that does not exist', () => {
    const orphaned = [...screenshots].filter((slug) => !registry.has(slug)).sort();
    expect(orphaned, 'screenshot entries with no page in registry.ts').toEqual([]);
  });

  it('actually finds both lists, rather than passing on two empty sets', () => {
    // Both assertions above are vacuously true if a regex stops matching —
    // which is exactly how a rewrite of either file would disable this test
    // without anyone noticing. The counts are a floor, not an exact number.
    expect(registry.size).toBeGreaterThan(20);
    expect(screenshots.size).toBeGreaterThan(20);
  });
});
