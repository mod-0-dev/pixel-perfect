/*
 * How many components the playground's index page lists.
 *
 * The index draws one card per entry in playground/app/components/registry.ts,
 * so its screenshot baseline changes whenever a component is added — and
 * nothing else about a component's PR touches that page. `npm run dimensions`
 * records this count beside the index baseline's geometry, and
 * tests/unit/screenshot-dimensions.test.ts fails when the registry has moved
 * on from the count the baseline was authored with (D-066 §2).
 *
 * Read by regex rather than imported: the playground is not a workspace
 * member (D-012), and a module import of it from a script or a unit test
 * would pull its tsconfig along. One line per entry, `{ slug:` at the start
 * of it, is the shape the registry has always had.
 */
import { readFileSync } from 'node:fs';

export const REGISTRY = 'playground/app/components/registry.ts';

export function countRegistryEntries(source = readFileSync(REGISTRY, 'utf8')) {
  return (source.match(/^\s*\{\s*slug:/gm) ?? []).length;
}
