/*
 * A Server Component. `CommandPalette` is `'use client'`, and every demo
 * holds the text it filters by, so they live in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the ids come from `useId()`, and the
 * browser suite finds its sections by `data-testid`.
 */
import { Text } from 'pixel-perfect';

import { galleryOpen, type GalleryParams } from '../../../harness/gallery';
import { Matrix } from '../../../harness/Matrix';
import { Gallery, Launcher, Long, ThemeCrossing } from './Demos';

export default async function CommandPalettePage({ searchParams }: { searchParams: Promise<GalleryParams> }) {
  const open = galleryOpen(await searchParams);
  return (
    <>
      <h1>4.14 CommandPalette</h1>
      <p>
        Every command in an app, one keystroke away: a search field over a list of commands, in a
        modal. The last of Tier 4 and made of it &mdash; Dialog&rsquo;s modal, Combobox&rsquo;s highlight,
        DropdownMenu&rsquo;s row, Kbd&rsquo;s key caps &mdash; with no package added. You render the
        commands that match; the first is highlighted as you type, and Enter runs it.
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          A palette per cell, portalled into a contained stage, with &ldquo;go&rdquo; typed. The panel sits
          high, a token wide or the stage&rsquo;s width, whichever is less. Open one from its cell;
          Escape or the scrim closes it. The screenshot suite opens all three at load with{' '}
          <code className="nowrap">?gallery=open</code>.
        </p>
        <Matrix>
          <Gallery open={open} />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>From a button, or the keys</h2>
        <Text>
          <code>mod+k</code> toggles it &mdash; ⌘K on a Mac, Ctrl+K elsewhere &mdash; and so does the
          button. Type, arrow, Enter; the command runs and the palette closes. Escape closes it and
          clears the text. One command is disabled and skipped.
        </Text>
        <Launcher />
      </section>

      <section>
        <h2>A long list</h2>
        <Text>Thirty commands: the list scrolls inside its ceiling, and the highlight stays in view.</Text>
        <Long />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>A dark region on this light page; the palette opened from inside it paints dark.</Text>
        <ThemeCrossing />
      </section>
    </>
  );
}
