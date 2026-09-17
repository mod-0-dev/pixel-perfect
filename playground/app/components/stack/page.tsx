import { Badge, Heading, Separator, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const ALIGNMENTS = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

export default function StackPage() {
  return (
    <>
      <h1>2.1 Stack</h1>
      <p>
        A flex column and a gap. It is the answer to &ldquo;how do I put space between two
        components&rdquo;, and it is the only answer &mdash; which is what lets RULES §2 forbid
        margins outright.
      </p>

      <section>
        <h2>The gap scale</h2>
        <p>
          <code>gap</code> is an index into the space scale: <code>gap=&quot;4&quot;</code> is{' '}
          <code>--pp-space-4</code>. Every step, at every width.
        </p>
        <Matrix>
          <Stack gap="4">
            {(['1', '3', '5', '7'] as const).map((gap) => (
              <Stack key={gap} gap="1">
                <Text size="xs" tone="muted">
                  gap=&quot;{gap}&quot;
                </Text>
                <Stack gap={gap}>
                  <Skeletonish />
                  <Skeletonish />
                  <Skeletonish />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Nested stacks do not inherit their parent&apos;s gap</h2>
        <p>
          The scale is mapped onto an inheriting custom property, so this would be a real bug if{' '}
          <code>gap</code> defaulted to nothing rather than to <code>&quot;0&quot;</code> (D-020).
          The inner stack below is tight inside a loose one.
        </p>
        <Matrix>
          <Stack gap="6">
            <Text size="sm">Outer, gap=&quot;6&quot;</Text>
            <Stack>
              <Text size="sm" tone="muted">
                Inner, no gap prop
              </Text>
              <Text size="sm" tone="muted">
                Still touching, as it should be
              </Text>
            </Stack>
            <Text size="sm">Outer again</Text>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>align</h2>
        <p>
          Cross axis only &mdash; the inline one. There is no <code>justify</code>: distributing
          along the block axis needs a block size a <code>fill</code> component does not have.
        </p>
        <Matrix>
          <Stack gap="4">
            {ALIGNMENTS.map((align) => (
              <Stack key={align} gap="1">
                <Text size="xs" tone="muted">
                  align=&quot;{align}&quot;
                </Text>
                <Stack gap="2" align={align}>
                  <Badge tone="accent">Short</Badge>
                  <Badge tone="neutral">A rather longer badge</Badge>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>With a Separator, and with truncating text</h2>
        <p>
          <code>min-inline-size: 0</code> on the root is what lets a long unbroken string
          truncate instead of pushing the column past its container. The narrow cell is the one
          that proves it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Heading level={2} size="md">
              Northwind Go 4.0
            </Heading>
            <Separator />
            <Text truncate>
              privacy-policy-v4-final-REVIEWED-legal-signoff-pending.pdf
            </Text>
            <Text size="sm" tone="muted" truncate={2}>
              Adds the analytics disclosure the store review flagged, plus the retention table
              legal asked for on Tuesday.
            </Text>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>asChild keeps the semantics</h2>
        <p>
          A stack of navigation links should be a <code>&lt;nav&gt;</code> around a list, not a
          pile of divs. <code>asChild</code> is why the layout primitive does not cost you the
          markup.
        </p>
        <Matrix>
          <Stack gap="2" asChild>
            <nav aria-label="Launch sections">
              <a href="#overview">Launch overview</a>
              <a href="#tasks">Task board</a>
              <a href="#assets">Asset library</a>
            </nav>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Styling API</h2>
        <p>
          <code>--pp-stack-gap</code> beats the <code>gap</code> prop, set on any ancestor.
        </p>
        <Matrix>
          <Stack gap="1" style={{ '--pp-stack-gap': 'var(--pp-space-5)' } as React.CSSProperties}>
            <Text size="sm">gap=&quot;1&quot;, overridden to space-5</Text>
            <Text size="sm">by the custom property</Text>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}

/** A plain box, so the gap is the only thing the eye has to measure. */
function Skeletonish() {
  return (
    <div
      style={{
        blockSize: 'var(--pp-size-6)',
        background: 'var(--pp-color-bg-sunken)',
        border: '1px solid var(--pp-color-border-subtle)',
        borderRadius: 'var(--pp-radius-2)',
      }}
    />
  );
}
