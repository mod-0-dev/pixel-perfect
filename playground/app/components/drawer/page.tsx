/*
 * A Server Component; every demo lives in Demos.tsx. NOTHING HERE WRITES AN
 * ID (D-035 §1).
 */
import { Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Gallery, Navigation, Sheet, Sides, Tall, ThemeCrossing } from './Demos';

export default function DrawerPage() {
  return (
    <>
      <h1>4.6 Drawer</h1>
      <p>
        A modal panel that slides in from an edge of the viewport and stays the full height (or
        width) of it. <code>Dialog</code> with a different placement: the scrim is Dialog&rsquo;s,
        the panel is anchored to an edge by the scrim&rsquo;s grid, and its anchored axis is a token
        rather than its content&rsquo;s width — a navigation list would otherwise be as wide as its
        longest label.
      </p>

      <section>
        <h2>A cell is a viewport</h2>
        <p>
          Three <code>end</code> drawers, open from the start, contained in their cells: at 240 the
          panel is the full width (the token is 20rem), at 480 and 960 it is 20rem at the right
          edge. <strong>Press Escape three times</strong> to get the page back.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>A navigation drawer</h2>
        <Text>
          <code>side=&quot;start&quot;</code>: on the left here, on the right in a right-to-left
          page, with nothing said by the caller. Focus lands on the first link and loops.
        </Text>
        <Navigation />
      </section>

      <section>
        <h2>Four sides</h2>
        <Text>
          <code>start</code> and <code>end</code> take 20rem on the inline axis and the full
          height; <code>top</code> and <code>bottom</code> take half the viewport and the full
          width. The corners away from the edge are rounded; the edge is flush.
        </Text>
        <Sides />
      </section>

      <section>
        <h2>A bottom sheet</h2>
        <Sheet />
      </section>

      <section>
        <h2>Taller than the viewport: the panel scrolls</h2>
        <Text>The page behind does not move; the sheet is the viewport&rsquo;s height and scrolls inside.</Text>
        <Tall />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <ThemeCrossing />
      </section>
    </>
  );
}
