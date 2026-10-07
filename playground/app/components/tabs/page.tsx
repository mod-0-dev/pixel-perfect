/*
 * A Server Component. `Tabs` is `'use client'` (Radix state), and the demos
 * that hold state live in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the tabs' ids come from Radix's
 * `useId()`, and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Gallery, KeptForm, Rtl, Settings, Vertical } from './Demos';

export default function TabsPage() {
  return (
    <>
      <h1>4.9 Tabs</h1>
      <p>
        One panel of several, chosen by its tab. The first component of the tier that is not an
        overlay: nothing is portalled, and the page&rsquo;s direction is the component&rsquo;s.
        Behaviour is Radix&rsquo;s &mdash; the roving focus, the activation modes &mdash; and every
        node, class and pixel is ours.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          Five tabs. At 240px the strip scrolls and the hairline runs under every tab, including
          the ones past the edge; the selected tab&rsquo;s bar sits on the line, not above it.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Automatic, and manual</h2>
        <Text>
          Tab to the strip and press the arrows. In the first, the arrows select; in the second,
          they only move focus, and <code>Enter</code> selects &mdash; for a panel that loads
          something when it is chosen. The disabled tab is skipped.
        </Text>
        <Stack gap="4">
          <Settings />
          <Settings activationMode="manual" />
        </Stack>
      </section>

      <section>
        <h2>Vertical</h2>
        <Text>
          The strip is a column beside its panel, the hairline and the bar on its inline-end edge,
          and the arrows are up and down.
        </Text>
        <Vertical />
      </section>

      <section>
        <h2>A panel that keeps what was typed</h2>
        <Text>
          Panels unmount when another tab is selected, which is right for a heavy panel and wrong
          for a form. <code>keepMounted</code> keeps one in the DOM, hidden.
        </Text>
        <KeptForm />
      </section>

      <section>
        <h2>Right-to-left</h2>
        <Text>
          Nothing passed. The tabs read right to left because the page does, and{' '}
          <code>ArrowLeft</code> moves to the next tab, which is the one on the left.
        </Text>
        <Rtl />
      </section>
    </>
  );
}
