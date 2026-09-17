import { Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const LONG =
  'Adds the analytics disclosure the store review flagged, and rewrites the data-retention paragraph so it stops contradicting the terms of service.';

export default function TextPage() {
  return (
    <>
      <h1>1.1 Text</h1>
      <p>
        Body copy. Fills the box it is given and wraps; the narrow cell is where truncation
        proves itself. Every cell below is a query container, so what you see is what a real
        parent gets.
      </p>

      <section>
        <h2>Size</h2>
        <Matrix>
          <div className="stack-tight">
            <Text size="xs">xs — caption and metadata</Text>
            <Text size="sm">sm — the default UI size in dense screens</Text>
            <Text size="md">md — body copy, the default</Text>
            <Text size="lg">lg — a lead paragraph</Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Tone</h2>
        <p>
          <code>neutral</code> and <code>muted</code> read the page palette; the other four
          come from the tone context, so a consumer&apos;s own tone works too.
        </p>
        <Matrix>
          <div className="stack-tight">
            <Text tone="neutral">neutral — the page text colour</Text>
            <Text tone="muted">muted — secondary, still ≥ 4.5:1</Text>
            <Text tone="accent">accent — draws the eye</Text>
            <Text tone="danger">danger — say what is wrong in words too</Text>
            <Text tone="success">success — confirmed</Text>
            <Text tone="warning">warning — needs attention</Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Weight and alignment</h2>
        <Matrix>
          <div className="stack-tight">
            <Text weight="regular">regular</Text>
            <Text weight="medium">medium</Text>
            <Text weight="semibold">semibold</Text>
            <Text weight="bold">bold</Text>
            <Text align="center" tone="muted">
              centred
            </Text>
            <Text align="end" tone="muted">
              end-aligned
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Truncation</h2>
        <p>
          The full text stays in the DOM and in the accessible name. Only the paint is clipped.
        </p>
        <Matrix>
          <div className="stack-tight">
            <Text weight="medium">One line, ellipsis:</Text>
            <Text truncate>{LONG}</Text>
            <Text weight="medium">Three lines, clamped:</Text>
            <Text truncate={3} tone="muted">
              {LONG}
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>asChild</h2>
        <p>Same styling, different element — here an inline span inside a sentence.</p>
        <Matrix>
          <div className="demo-box">
            Owner:{' '}
            <Text asChild weight="semibold">
              <span>Samuel Okafor</span>
            </Text>{' '}
            <Text asChild tone="muted" size="sm">
              <span>(Legal)</span>
            </Text>
          </div>
        </Matrix>
      </section>
    </>
  );
}
