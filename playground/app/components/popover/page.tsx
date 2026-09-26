/*
 * A Server Component. `Popover` is `'use client'` and every demo lives in
 * Demos.tsx — including the Matrix gallery, whose popovers need three event
 * handlers to sit open together (D-062 §2), and a Server Component cannot
 * pass an event handler to a client component.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the popover's ids come from
 * `useId()`, and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Controlled, FilterPopover, Gallery, Modal, Sides, ThemeCrossing } from './Demos';

export default function PopoverPage() {
  return (
    <>
      <h1>4.2 Popover</h1>
      <p>
        A small panel of interactive content anchored to the control that opened it. The first Tier 4
        component: behaviour is Radix Primitives&rsquo; — the portal, the dismissable layer, the focus
        scope, the positioning — and every DOM node, class name and pixel is ours (D-061).
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          Each cell&rsquo;s popover is portalled to the body and paints in the theme the page
          loaded with, read from its trigger — flip the switcher and reload to see it follow. The
          panel hugs its content up to{' '}
          <code>--pp-measure-xs</code> or the space available, whichever is less, so it never
          overflows the viewport (D-061 §3).
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      <p>
        <strong>Three things the foundation adds.</strong> The <em>theme</em> crosses the portal
        (the panel carries <code>data-pp-theme</code>, read from its trigger&rsquo;s scope) and the
        tone does not; <code>side</code> is <em>logical</em> — <code>start</code> and{' '}
        <code>end</code> follow the layout&rsquo;s direction; and offsets are <em>steps of the
        space scale</em>, not pixel numbers.
      </p>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>A form in a popover</h2>
        <Text>
          The case the ceiling exists for: every control in this library fills, so without a{' '}
          <code>max-inline-size</code> a popover holding a <code>Field</code> would grow to the
          viewport. Apply and Cancel both close it.
        </Text>
        <FilterPopover />
      </section>

      <section>
        <h2>Sides are logical</h2>
        <Text>
          <code>start</code> is on the left of its trigger here and on the right in the
          right-to-left row below, with nothing said about direction by the caller. The offset
          between trigger and panel is <code>sideOffset=&quot;2&quot;</code>: half a rem, the gap
          a <code>Stack</code> would leave.
        </Text>
        <Stack gap="4">
          <Sides />
          <Sides dir="rtl" />
        </Stack>
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>
          A dark region on this light page. The popover opened from inside it is portalled to the
          body — outside the region — and paints dark, because the panel carries the theme it was
          opened in. The tone would not cross: a popover from a danger button is not a danger
          popover.
        </Text>
        <ThemeCrossing />
      </section>

      <section>
        <h2>Controlled, and an outside press lands</h2>
        <Text>
          Non-modal: the page behind remains live. A press outside closes the popover <em>and</em>{' '}
          reaches what was pressed — count the outside clicks.
        </Text>
        <Controlled />
      </section>

      <section>
        <h2>Modal, for the popover a flow cannot proceed past</h2>
        <Text>
          Focus is trapped, scroll is locked, and an outside press closes it without landing. Usually this is a{' '}
          <code>Dialog</code>; it exists here for the required choice that belongs beside its
          trigger.
        </Text>
        <Modal />
      </section>
    </>
  );
}
