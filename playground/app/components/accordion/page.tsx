/*
 * A Server Component. `Accordion` is `'use client'` (Radix state), and the
 * demos that hold state live in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the ids come from Radix's
 * `useId()`, and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Gallery, KeptForm, Multiple, Single } from './Demos';

export default function AccordionPage() {
  return (
    <>
      <h1>4.10 Accordion</h1>
      <p>
        A vertical stack of sections, each with a heading that shows or hides its content. In flow,
        like Tabs: nothing floats, and the page&rsquo;s direction is the component&rsquo;s. Behaviour is
        Radix&rsquo;s &mdash; the state, the roving focus, the measured height for the motion &mdash;
        and every node, class and pixel is ours.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          Three sections, the second open. A long question wraps inside its heading; the hairlines run
          edge to edge; the chevron turns.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>One at a time, and strictly one</h2>
        <Text>
          Opening a section closes the open one. In the first, pressing the open heading closes it
          too; in the second, <code>collapsible=&#123;false&#125;</code> keeps one open always and marks
          its heading <code>aria-disabled</code>. Press the arrows to move between headings.
        </Text>
        <Stack gap="4">
          <Single />
          <Single collapsible={false} />
        </Stack>
      </section>

      <section>
        <h2>Any number, under level-four headings</h2>
        <Text>
          <code>multiple</code>: the value is an array. <code>headingLevel=&#123;4&#125;</code> on the
          root sets every heading, once. The last section is disabled.
        </Text>
        <Multiple />
      </section>

      <section>
        <h2>A panel that keeps what was typed</h2>
        <Text>
          A closed panel is an empty, hidden element. <code>keepMounted</code> keeps its children
          rendered, hidden, so a form does not lose what was typed.
        </Text>
        <KeptForm />
      </section>
    </>
  );
}
