/*
 * A Server Component. `ContextMenu` is `'use client'` and every demo lives
 * in Demos.tsx — the gallery opens its lists with an effect, which only a
 * client component can run.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Stack, Text } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Controlled, Disabled, Gallery, Region, ThemeCrossing } from './Demos';

export default function ContextMenuPage() {
  return (
    <>
      <h1>4.8 ContextMenu</h1>
      <p>
        The commands on a thing, opened where the pointer is. The list is <code>DropdownMenu</code>
        &rsquo;s &mdash; the same parts, drawn by the same stylesheet through two classes &mdash; and
        what differs is how it opens: a secondary press on a region, a long press on touch, or{' '}
        <code>Shift+F10</code> on a focused element inside it.
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          Each cell&rsquo;s list was opened at a point inside its region after the page loaded, the
          way a press would open it. Non-modal here, so the three can sit open together.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>A region, and its mirror</h2>
        <Text>
          The region is focusable, so <code>Shift+F10</code> opens the list from the keyboard; a
          press opens it at the pointer. In the right-to-left region the submenu opens on{' '}
          <code>ArrowLeft</code>, to the left, and its chevron points that way.
        </Text>
        <Stack gap="4">
          <Region />
          <Region dir="rtl" />
        </Stack>
      </section>

      <section>
        <h2>Disabled, and closed from outside</h2>
        <Text>
          A disabled region gives the browser its own menu back. A controlled one is closed by its
          owner when the thing it was about is gone.
        </Text>
        <Stack gap="4">
          <Disabled />
          <Controlled />
        </Stack>
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>
          A dark region on this light page. The list opened from inside it is portalled to the body
          &mdash; outside the region &mdash; and paints dark.
        </Text>
        <ThemeCrossing />
      </section>
    </>
  );
}
