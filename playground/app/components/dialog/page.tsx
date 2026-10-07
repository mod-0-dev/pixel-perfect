/*
 * A Server Component. `Dialog` is `'use client'` and every demo lives in
 * Demos.tsx — including the Matrix gallery, whose dialogs are portalled into
 * a box in each cell and need a handler to sit open together (spec §10),
 * and a Server Component cannot pass an event handler to a client component.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the dialog's ids come from
 * `useId()`, and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from '@mod-0-dev/pixel-perfect';

import { galleryOpen, type GalleryParams } from '../../../harness/gallery';
import { Matrix } from '../../../harness/Matrix';
import { CornerClose, Gallery, Long, Nested, NoTrigger, Rename, ThemeCrossing, Veto } from './Demos';

export default async function DialogPage({ searchParams }: { searchParams: Promise<GalleryParams> }) {
  const open = galleryOpen(await searchParams);
  return (
    <>
      <h1>4.4 Dialog</h1>
      <p>
        A window over the page that the user must deal with before continuing. The page behind it is
        inert — no pointer, no scroll, no focus, nothing read — until it closes, and it closes on
        Escape, on a press on the scrim, or on any <code>DialogClose</code> inside it. The first
        modal, and the one <code>AlertDialog</code>, <code>Drawer</code> and{' '}
        <code>CommandPalette</code> gate on.
      </p>

      <section>
        <h2>A cell is a viewport</h2>
        <p>
          One dialog per cell, each portalled into a <code>contain: layout</code> box in its cell
          — so the box is the viewport and the three widths show what a real viewport gets: at
          240 and 480 the panel is narrower than its ceiling and every control in it fills; at 960
          it sits at its 40rem ceiling with scrim on either side. Open one from its cell; Escape,
          the scrim or either button closes it. The screenshot suite opens all three at load with{' '}
          <code>?gallery=open</code> — a gallery, not a use, which locks the page&rsquo;s scroll
          three times over until each is closed.
        </p>
        <Matrix>
          <Gallery open={open} />
        </Matrix>
      </section>

      <p>
        <strong>Two things over Radix, one thing less.</strong> The panel carries{' '}
        <code>aria-modal=&quot;true&quot;</code>; a dialog opened with no trigger returns focus to
        the element that had it, where Radix drops it to the body; and there is no{' '}
        <code>modal</code> prop — a dialog is its modality.
      </p>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>The usual: a short form</h2>
        <Text>
          A title, a description, a field, two buttons. Focus lands on the field; Tab loops inside;
          Escape or the scrim closes it and focus returns to the trigger. A press on the scrim
          closes the dialog and reaches nothing under it — count the outside clicks.
        </Text>
        <Rename />
      </section>

      <section>
        <h2>A corner close, composed</h2>
        <Text>
          No automatic ×. The close button is the end of the title row — a <code>Cluster</code>,
          not an absolute position — so it is in tab order where it is on screen.
        </Text>
        <CornerClose />
      </section>

      <section>
        <h2>Opened with no trigger</h2>
        <Text>
          A row&rsquo;s action button sets <code>open</code>; nothing is a <code>DialogTrigger</code>.
          On close, focus returns to that button. With Radix alone it would land on the body and
          the next Tab would start at the top of the page.
        </Text>
        <NoTrigger />
      </section>

      <section>
        <h2>Unsaved changes: veto the close, do not confirm it</h2>
        <Text>
          Type something, then press Escape or the scrim: the dialog stays. Discard closes it. The
          veto is <code>onEscapeKeyDown</code> and <code>onPointerDownOutside</code> with{' '}
          <code>preventDefault()</code>, not a <code>window.confirm</code> in{' '}
          <code>onOpenChange</code>.
        </Text>
        <Veto />
      </section>

      <section>
        <h2>Taller than the viewport: the scrim scrolls</h2>
        <Text>
          The panel keeps its full height and the gutter above and below; the scrim is the scroll
          container, and the page behind does not move. A footer held still is composition — a
          bounded <code>Scroller</code> inside the panel — not a mode.
        </Text>
        <Long />
      </section>

      <section>
        <h2>Nested: a popover and a second dialog from inside</h2>
        <Text>
          A <code>Popover</code> opened inside paints above the scrim at <code>--pp-z-popover</code>{' '}
          and is not hidden by the sweep. A second <code>Dialog</code> is a later sibling at the
          same <code>--pp-z-overlay</code> and paints above by DOM order; Escape closes only it.
        </Text>
        <Nested />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>
          A dark region on this light page. The dialog opened from inside it is portalled to the
          body — outside the region — and its scrim and panel paint dark, because the scrim carries
          the theme it was opened in.
        </Text>
        <ThemeCrossing />
      </section>

      <Stack gap="1">
        <Text size="sm" tone="muted">
          Set <code>dir=&quot;rtl&quot;</code> on the root and the panel is still centred: the scrim
          is a grid, not a transform. Shrink the window to 320px and the panel shrinks with the
          gutter kept.
        </Text>
      </Stack>
    </>
  );
}
