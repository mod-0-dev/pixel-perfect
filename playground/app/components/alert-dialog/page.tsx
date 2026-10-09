/*
 * A Server Component; every demo lives in Demos.tsx (the gallery needs a
 * handler, and a Server Component cannot pass one to a client component).
 * NOTHING HERE WRITES AN ID (D-035 §1).
 */
import { Text } from '@mod-0-dev/pixel-perfect';

import { galleryOpen, type GalleryParams } from '../../../harness/gallery';
import { Matrix } from '../../../harness/Matrix';
import { Delete, Gallery, NoCancel, ThemeCrossing } from './Demos';

export default async function AlertDialogPage({ searchParams }: { searchParams: Promise<GalleryParams> }) {
  const open = galleryOpen(await searchParams);
  return (
    <>
      <h1>4.5 AlertDialog</h1>
      <p>
        A modal that interrupts the user with a decision and does not let go until they make it. It
        is <code>Dialog</code> with two rules changed: a press on the scrim does not close it, and
        focus lands on the safe button. Dialog&rsquo;s stylesheet draws it — every part carries both
        classes — and only the ceiling differs: 20rem, a sentence and two buttons.
      </p>

      <section>
        <h2>A cell is a viewport</h2>
        <p>
          One per cell, contained in its cell (Dialog §10). Open one from its cell; Escape or either
          button closes it &mdash; the scrim will not. The screenshot suite opens all three at load
          with <code className="nowrap">?gallery=open</code>.
        </p>
        <Matrix>
          <Gallery open={open} />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Delete, with a way to decline</h2>
        <Text>
          Focus opens on <em>Keep it</em>. Press the scrim: nothing. Escape or either button closes it;
          the counter says which. The destructive action is <code>tone=&quot;danger&quot;</code> by
          the caller&rsquo;s choice, not the component&rsquo;s.
        </Text>
        <Delete />
      </section>

      <section>
        <h2>No Cancel: the panel takes focus, and development warns</h2>
        <Text>
          Radix alone would leave focus on the trigger, outside the trap. The panel takes it instead,
          and the console says a Cancel is missing — a decision the user cannot decline is not a
          decision.
        </Text>
        <NoCancel />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <ThemeCrossing />
      </section>
    </>
  );
}
