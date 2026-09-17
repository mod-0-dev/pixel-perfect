import { Badge, Center, Heading, Spinner, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const TALL = { '--pp-center-min-block-size': 'var(--pp-space-9)' } as React.CSSProperties;

export default function CenterPage() {
  return (
    <>
      <h1>2.5 Center</h1>
      <p>
        Centres its children in the box it was given. It does <strong>not</strong> constrain a
        measure &mdash; centring a column of text by giving it a max-width is{' '}
        <code>Container</code>&apos;s job, and conflating the two is why &ldquo;Center&rdquo; means
        three different things across the ecosystem.
      </p>

      <section>
        <h2>The case it exists for</h2>
        <p>An empty state, a loading screen, a 404. Content in the middle of whatever space there is.</p>
        <Matrix>
          <Center gap="3" style={TALL}>
            <Spinner size="lg" tone="accent" decorative />
            <Text size="sm" tone="muted">
              Loading the task board&hellip;
            </Text>
          </Center>
        </Matrix>
      </section>

      <section>
        <h2>axis</h2>
        <p>
          <code>both</code> by default. <code>inline</code> centres horizontally only;{' '}
          <code>block</code> vertically only, which needs a block size to centre within.
        </p>
        <Matrix>
          <Stack gap="4">
            {(['both', 'inline', 'block'] as const).map((axis) => (
              <Stack key={axis} gap="1">
                <Text size="xs" tone="muted">
                  axis=&quot;{axis}&quot;
                </Text>
                <Center
                  axis={axis}
                  gap="2"
                  style={{
                    ...TALL,
                    background: 'var(--pp-color-bg-sunken)',
                    borderRadius: 'var(--pp-radius-2)',
                  }}
                >
                  <Badge tone="accent">Centred</Badge>
                </Center>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>There is no height prop</h2>
        <p>
          Block size comes from the parent or from <code>--pp-center-min-block-size</code> &mdash;
          the same answer <code>Skeleton</code> gives to the same problem (D-016 §4). The sizing
          contract wins over the convenience.
        </p>
        <Matrix>
          <Center
            gap="2"
            style={
              {
                '--pp-center-min-block-size': 'var(--pp-space-8)',
                background: 'var(--pp-color-bg-sunken)',
                borderRadius: 'var(--pp-radius-2)',
              } as React.CSSProperties
            }
          >
            <Heading level={2} size="sm">
              No assets yet
            </Heading>
            <Text size="sm" tone="muted" align="center">
              Upload a file to get started.
            </Text>
          </Center>
        </Matrix>
      </section>
    </>
  );
}
