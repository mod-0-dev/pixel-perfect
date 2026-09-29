/*
 * A Server Component. `Combobox` is `'use client'`, and every demo holds
 * the text it filters by, so they all live in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the ids come from `useId()`, and the
 * browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Async, Gallery, Multiple, Single, ThemeCrossing, Widths } from './Demos';

export default function ComboboxPage() {
  return (
    <>
      <h1>4.11 Combobox</h1>
      <p>
        A text input that offers a list of options as the user types, and takes one &mdash; or
        several. The one Tier 4 component whose behaviour is the library&rsquo;s own: the list&rsquo;s
        portal and placement are Popover&rsquo;s primitive, its look is DropdownMenu&rsquo;s stylesheet,
        the control is Input&rsquo;s box; the keyboard, the highlight, the selection and the tokens are
        written here. The component does not filter: you render the options that match.
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          Two of seventeen cities match &ldquo;os&rdquo;; Oslo is selected. The list is never narrower
          than its control: at 240px it is the control&rsquo;s width, and at 960px it is too.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>One city</h2>
        <Text>
          Type, arrow down, Enter. Focus never leaves the field; the highlighted option is{' '}
          <code>aria-activedescendant</code>. Prague is disabled and skipped. Escape closes; Tab
          closes and keeps what was typed; a click outside does the same.
        </Text>
        <Single />
      </section>

      <section>
        <h2>Several cities, as tokens</h2>
        <Text>
          <code>multiple</code>: taking an option adds a token and keeps the list open; a selected
          option carries the mark; Backspace on an empty field removes the last token, and each
          token has its own remove button. The options are grouped by region.
        </Text>
        <Multiple />
      </section>

      <section>
        <h2>Options from a server</h2>
        <Text>
          Nothing special: the consumer fetches and renders. <code>loading</code> puts a spinner in
          the end slot and marks the list busy while the results are on their way.
        </Text>
        <Async />
      </section>

      <section>
        <h2>Never narrower than the control</h2>
        <Text>
          A narrow field and a wide one, the same options. The list takes the control&rsquo;s width
          as its floor.
        </Text>
        <Widths />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>A dark region on this light page; the list opened from inside it paints dark.</Text>
        <ThemeCrossing />
      </section>

      <Stack gap="1">
        <Text size="sm" tone="muted">
          Every field above filters seventeen cities by the text you type.
        </Text>
      </Stack>
    </>
  );
}
