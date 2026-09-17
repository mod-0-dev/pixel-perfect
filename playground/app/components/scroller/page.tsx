import { Badge, Cluster, Scroller, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const ROWS = [
  'Privacy policy v4',
  'Store listing copy',
  'Launch email',
  'Pricing page',
  'Support macros',
  'Release notes',
  'Press kit',
  'Onboarding tour',
];

export default function ScrollerPage() {
  return (
    <>
      <h1>2.8 Scroller</h1>
      <p>
        An overflow container that says, visually and in the DOM, that there is more content past
        the edge. The affordance is the entire point: an overflowing region with no shadow and no
        scrollbar is content users never find.
      </p>
      <p>
        The tier&apos;s only client component, and its only accessibility surface. Scroll position
        is a browser fact &mdash; there is no server-side answer to &ldquo;is this
        overflowing&rdquo;.
      </p>

      <section>
        <h2>Vertical, with a max block size</h2>
        <p>
          <code>data-overflow</code> is in the DOM, so the shadow is never the only signal. It
          names the edge that has content <em>beyond</em> it, and it is logical &mdash;{' '}
          <code>start</code> is the top here, and the left in a horizontal LTR region.
        </p>
        <Matrix>
          <Scroller
            label="Assets"
            style={{ '--pp-scroller-max-block-size': 'var(--pp-space-9)' } as React.CSSProperties}
          >
            <Stack gap="2">
              {ROWS.map((row) => (
                <Text key={row} size="sm">
                  {row}
                </Text>
              ))}
            </Stack>
          </Scroller>
        </Matrix>
      </section>

      <section>
        <h2>Horizontal</h2>
        <p>
          The row below does not wrap, which is the one case where{' '}
          <code>Cluster wrap={'{false}'}</code> is correct: inside a scroll region, overflow is the
          design rather than the bug.
        </p>
        <Matrix>
          <Scroller label="Workstream filters" orientation="horizontal">
            <Cluster gap="2" wrap={false}>
              {['Engineering', 'Legal', 'Marketing', 'Support', 'Design', 'Data'].map((name) => (
                <Badge key={name} tone="accent">
                  {name}
                </Badge>
              ))}
            </Cluster>
          </Scroller>
        </Matrix>
      </section>

      <section>
        <h2>Content that fits gets no shadow</h2>
        <p>
          <code>data-overflow=&quot;none&quot;</code>. A shadow on a region with nothing past its
          edge is worse than no shadow at all &mdash; it is a promise of content that does not
          exist.
        </p>
        <Matrix>
          <Scroller label="Short list">
            <Text size="sm">One row, nothing to scroll.</Text>
          </Scroller>
        </Matrix>
      </section>

      <section>
        <h2>Focus</h2>
        <p>
          <code>tabIndex={'{0}'}</code> and <code>role=&quot;region&quot;</code> with a required{' '}
          <code>label</code>. A scrollable region a keyboard user can reach is WCAG 2.1.1; a
          focusable region with no accessible name is a 4.1.2 failure. The focus ring is the token
          set&apos;s, never removed.
        </p>
      </section>
    </>
  );
}
