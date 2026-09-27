/*
 * A Server Component. `Tooltip` is `'use client'` and every demo lives in
 * Demos.tsx, so the page stays on the server side of the boundary — which is
 * also why the parts are named exports and not `Tooltip.Trigger` (D-062 §1).
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the tooltip's ids come from
 * `useId()`, and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Controlled, Disabled, Gallery, Long, Shortcut, Sides, ThemeCrossing, Toolbar } from './Demos';

export default function TooltipPage() {
  return (
    <>
      <h1>4.3 Tooltip</h1>
      <p>
        A short label that appears beside a control when the pointer rests on it or keyboard focus
        lands on it. It <em>describes</em> its trigger — <code>aria-describedby</code>, never the
        name — and it is gone the moment the user does anything else. The first component built on
        the overlay foundation alone.
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          One tooltip per cell, open from the start, on an <code>IconButton</code> whose label it
          repeats. The surface is the page&rsquo;s inverse — near-black here, near-white in dark —
          so it is never mistaken for a panel you can act on. Three <code>defaultOpen</code>{' '}
          tooltips sit open together because a default open dispatches no &ldquo;another tooltip
          opened&rdquo; event (D-064 §7).
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      <p>
        <strong>Three things the foundation adds.</strong> The <em>theme</em> crosses the portal
        (the panel carries <code>data-pp-theme</code>, read from its trigger&rsquo;s scope, and
        paints that theme&rsquo;s inverse); <code>side</code> is <em>logical</em>; and offsets are{' '}
        <em>steps of the space scale</em>, not pixel numbers.
      </p>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>A toolbar: one provider, no waiting between neighbours</h2>
        <Text>
          Rest on the first button and its tooltip opens after 700ms. Move to the next and its
          tooltip opens at once, with no entry animation — <code>data-state=&quot;instant-open&quot;</code>
          , which is why Radix&rsquo;s three values are kept (D-064 §3). Wrap a toolbar in{' '}
          <code>TooltipProvider</code> once to get this; a lone tooltip needs no provider.
        </Text>
        <Toolbar />
      </section>

      <section>
        <h2>A shortcut beside a labelled control</h2>
        <Text>
          The tooltip adds something the button&rsquo;s own text does not say. A <code>Kbd</code>{' '}
          keeps its own surface on the inverse, so the key reads as a key.
        </Text>
        <Shortcut />
      </section>

      <section>
        <h2>Sides are logical</h2>
        <Text>
          <code>start</code> is on the left of its trigger here and on the right in the
          right-to-left row below, with nothing said about direction by the caller. Focus a button
          to open its tooltip at once; the gap is <code>sideOffset=&quot;1&quot;</code>, a quarter
          rem.
        </Text>
        <Stack gap="4">
          <Sides />
          <Sides dir="rtl" />
        </Stack>
      </section>

      <section>
        <h2>The theme crosses the portal, and the tooltip is its inverse</h2>
        <Text>
          A dark region on this light page. The tooltip opened from inside it is portalled to the
          body — outside the region — and paints <em>light</em>: it carries the region&rsquo;s theme
          and is the inverse of it, because it is read against the region, not against the body.
        </Text>
        <ThemeCrossing />
      </section>

      <section>
        <h2>Controlled</h2>
        <Text>
          <code>open</code> and <code>onOpenChange</code>, as every stateful component. A controlled
          open ran no delay, so it is <code>instant-open</code>.
        </Text>
        <Controlled />
      </section>

      <section>
        <h2>Long content wraps at the measure</h2>
        <Text>
          The one exception to the no-<code>max-width</code> rule, shared by every overlay: a
          tooltip has no parent in flow, so its ceiling is <code>--pp-measure-xs</code> (20rem) or
          the space available, whichever is less. Focus the button.
        </Text>
        <Long />
      </section>

      <section>
        <h2>A disabled trigger, best-effort</h2>
        <Text>
          Whether a natively disabled button fires the pointer events a tooltip opens on is the
          browser&rsquo;s decision. The library keeps the pointer on a disabled control so a tooltip{' '}
          <em>can</em> wrap one; what the browser then does is measured, not promised (D-064 §7).
        </Text>
        <Disabled />
      </section>
    </>
  );
}
