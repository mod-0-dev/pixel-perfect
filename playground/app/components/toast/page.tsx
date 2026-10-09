/*
 * A Server Component. `ToastProvider` and `useToast` are `'use client'`, and
 * every demo needs the hook, so they live in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its sections
 * by `data-testid`.
 */
import { Text } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Corner, Gallery, Placements, Rtl } from './Demos';

export default function ToastPage() {
  return (
    <>
      <h1>4.12 Toast</h1>
      <p>
        A brief message about something that just happened, at a corner of the viewport, announced,
        gone after a moment unless you are reading it. One provider, one hook, no element: a toast
        is an event. Every toast is an <code>Alert</code> that floats &mdash; Alert&rsquo;s stylesheet
        draws it &mdash; and Radix&rsquo;s primitive announces it, pauses it under the pointer, and
        lets it be swiped away.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          A provider per cell, its region fixed inside the cell, holding one toast fired on load. The
          region is the measure token wide, or the cell, whichever is less.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>From a button</h2>
        <Text>
          These fire into this page&rsquo;s own region at the bottom end of the viewport. Three show at
          once; the rest wait. A kept toast stays until dismissed; a polite one is announced when
          you are idle; an action comes with a text alternative for screen readers.
        </Text>
        <Corner />
      </section>

      <section>
        <h2>Four corners</h2>
        <Text>
          <code>placement</code> is logical. Bottom placements stack newest nearest the edge and slide
          up; top placements slide down.
        </Text>
        <Placements />
      </section>

      <section>
        <h2>Right-to-left</h2>
        <Text>
          <code>bottom-end</code>, in a right-to-left stage: the bottom left, and a swipe to the left
          dismisses.
        </Text>
        <Rtl />
      </section>
    </>
  );
}
