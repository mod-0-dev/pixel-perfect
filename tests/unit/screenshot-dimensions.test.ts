import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { countRegistryEntries } from '../../scripts/registry-count.mjs';

/**
 * A GEOMETRY GUARD FOR THE WINDOW IN WHICH THERE ARE NO BASELINES (D-050).
 *
 * `toHaveScreenshot` already catches a size change once a baseline exists — it
 * reports "expected an image 1280×2593, received 1280×2601". The problem is the
 * re-baseline itself: a token-layer change alters every pixel of all 34 pages,
 * so every baseline is deleted and CI AUTHORS the replacements with nothing to
 * compare against. For that one commit the visual suite verifies nothing, and a
 * layout regression riding along with the colour change is committed as the new
 * truth, silently.
 *
 * This is what still says no. `dimensions.json` is recorded BEFORE the
 * baselines are deleted, so the authored replacements are checked against the
 * page geometry that existed beforehand. A pure colour change moves no pixel
 * boundary; if a page got taller, something other than colour moved.
 *
 * It reads the PNG header directly — width and height are the two big-endian
 * uint32s at byte 16, in the IHDR chunk, which is always first — so this needs
 * no image library and no browser.
 *
 * A page with no entry is SKIPPED rather than failed: a newly added component
 * has no prior geometry to be compared with, and its first baseline is its
 * first truth. Regenerate the manifest deliberately, the same way a baseline is
 * re-authored deliberately.
 */
const DIR = 'tests/visual/__screenshots__';

interface Size {
  width: number;
  height: number;
  /** Index baselines only: how many registry entries the page listed when authored. */
  components?: number;
}

function pngSize(file: string): Size {
  const bytes = readFileSync(`${DIR}/${file}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('screenshot baselines keep their geometry', () => {
  const recorded: Record<string, Size> = JSON.parse(
    readFileSync(`${DIR}/dimensions.json`, 'utf8'),
  ) as Record<string, Size>;
  const present = readdirSync(DIR).filter((f) => f.endsWith('.png'));

  it('has a manifest to check against', () => {
    expect(Object.keys(recorded).length).toBeGreaterThan(20);
  });

  it('matches every baseline that has a recorded size', () => {
    const drifted = present
      .filter((f) => recorded[f])
      .map((f) => ({ file: f, now: pngSize(f), was: recorded[f] as Size }))
      .filter(({ now, was }) => now.width !== was.width || now.height !== was.height)
      .map(({ file, now, was }) => `${file}: ${was.width}×${was.height} → ${now.width}×${now.height}`);

    expect(
      drifted,
      'a baseline was re-authored at a different size — something other than colour moved',
    ).toEqual([]);
  });

  /*
   * THE ONE VISUAL CHANGE NO COMPONENT'S OWN BASELINE CAN CATCH (D-066 §2).
   *
   * The index page draws one card per registry entry, so adding a component
   * changes ITS baseline — and the PR that adds a component never touches
   * that page, so nothing reminded anyone. `Tooltip` shipped its registry
   * entry with the index baselines untouched; CI reported the 19px, then
   * authored the new component's baselines over the report (D-066 §1). The
   * recorder writes the registry count beside the index entry's geometry;
   * this compares it to the registry now. Absent baselines are skipped: that
   * is the window `npm run dimensions -- --rebaseline index` opens on
   * purpose, and CI closes it by authoring.
   */
  it('was authored with the components the index lists today', () => {
    const listed = countRegistryEntries();
    const stale = present
      .filter((f) => /^index-(light|dark)\.png$/.test(f) && recorded[f])
      .map((f) => ({ file: f, with: recorded[f]?.components }))
      .filter(({ with: authored }) => authored !== listed)
      .map(({ file, with: authored }) => `${file}: authored with ${authored ?? 'no count recorded'}, the registry lists ${listed}`);

    expect(
      stale,
      'the index page lists a different set of components than its baseline shows — run `npm run dimensions -- --rebaseline index`, push, let CI author, then `npm run dimensions`',
    ).toEqual([]);
  });

  /* An unrecorded page is unguarded, and the count going up silently is how
     a guard stops guarding. Since D-092 the authoring commit records what it
     authors, so on any commit this should read zero: the limit is for a
     baseline that arrived some other way. */
  it('reports how many baselines are unguarded', () => {
    const unguarded = present.filter((f) => !recorded[f]);
    expect(unguarded.length, `unguarded baselines: ${unguarded.join(', ') || 'none'}`).toBeLessThan(
      3,
    );
  });
});
