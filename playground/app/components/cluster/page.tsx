import { Avatar, Badge, Cluster, Separator, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const JUSTIFY = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;

export default function ClusterPage() {
  return (
    <>
      <h1>2.2 Cluster</h1>
      <p>
        A horizontal row that wraps. It is called Cluster and not Row because wrapping is the
        default &mdash; a flex row that cannot wrap is an overflow bug waiting for a narrow
        container, and under RULES §1 the component never gets to know how narrow that is.
      </p>

      <section>
        <h2>Wrapping is the container behaviour, and it needs no query</h2>
        <p>
          The same row in a 240px sidebar, a 480px column and a 960px page. Nothing measured
          anything; flex resolved it continuously, which is strictly better than a breakpoint.
        </p>
        <Matrix>
          <Cluster gap="2">
            <Badge tone="danger">Blocked</Badge>
            <Badge tone="warning">Overdue</Badge>
            <Badge tone="accent">Engineering</Badge>
            <Badge tone="success">Approved</Badge>
            <Badge>Unassigned</Badge>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>justify</h2>
        <p>
          <code>between</code>, <code>around</code> and <code>evenly</code> drop CSS&apos;s{' '}
          <code>space-</code> prefix. At narrow widths the row has wrapped, so distribution
          applies per line &mdash; which is flex behaving correctly, not a bug.
        </p>
        <Matrix>
          <Stack gap="4">
            {JUSTIFY.map((justify) => (
              <Stack key={justify} gap="1">
                <Text size="xs" tone="muted">
                  justify=&quot;{justify}&quot;
                </Text>
                <Cluster gap="2" justify={justify}>
                  <Badge tone="accent">One</Badge>
                  <Badge>Two</Badge>
                  <Badge tone="success">Three</Badge>
                </Cluster>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>align defaults to center</h2>
        <p>
          A row of mixed-height things &mdash; an avatar, a badge, a line of text &mdash; reads
          correctly centred, and that is nearly every row. <code>baseline</code> is the one worth
          reaching for when the text matters more than the boxes.
        </p>
        <Matrix>
          <Stack gap="4">
            {(['center', 'start', 'end', 'baseline', 'stretch'] as const).map((align) => (
              <Stack key={align} gap="1">
                <Text size="xs" tone="muted">
                  align=&quot;{align}&quot;
                </Text>
                <Cluster gap="2" align={align}>
                  <Avatar name="Ada Lovelace" size="sm" tone="accent" />
                  <Text size="sm">Ada Lovelace</Text>
                  <Badge tone="success">Owner</Badge>
                </Cluster>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>With a vertical Separator</h2>
        <p>
          A vertical rule stretches to its row even when the row centres its items &mdash; that is{' '}
          <code>align-self: stretch</code> in Separator, and this is the row it was written for.
        </p>
        <Matrix>
          <Cluster gap="3">
            <Text size="sm">Draft</Text>
            <Separator orientation="vertical" />
            <Text size="sm" tone="muted">
              12 KB
            </Text>
            <Separator orientation="vertical" />
            <Text size="sm" tone="muted">
              2h ago
            </Text>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>wrap={'{false}'} is the overflow you asked for</h2>
        <p>
          The narrow cell is flagged in red, which is the harness doing its job. This is why
          wrapping is the default and turning it off is a decision you make about a container you
          control.
        </p>
        <Matrix>
          <Cluster gap="2" wrap={false}>
            <Badge tone="danger">Blocked</Badge>
            <Badge tone="warning">Overdue</Badge>
            <Badge tone="accent">Engineering</Badge>
            <Badge tone="success">Approved</Badge>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Nested gaps stay independent</h2>
        <p>
          A Cluster inside a Stack inside a Cluster. Each redeclares its own step, so the shared
          scale never leaks down the tree (D-020).
        </p>
        <Matrix>
          <Cluster gap="5" align="start">
            <Avatar name="Grace Hopper" size="sm" tone="success" />
            <Stack gap="1">
              <Text size="sm">Grace Hopper approved the privacy policy</Text>
              <Cluster gap="2">
                <Badge tone="success">Approved</Badge>
                <Text size="xs" tone="muted">
                  2 hours ago
                </Text>
              </Cluster>
            </Stack>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Styling API</h2>
        <p>
          <code>--pp-cluster-gap</code> beats the <code>gap</code> prop, set on any ancestor.
        </p>
        <Matrix>
          <Cluster
            gap="1"
            style={{ '--pp-cluster-gap': 'var(--pp-space-5)' } as React.CSSProperties}
          >
            <Badge>gap=&quot;1&quot;</Badge>
            <Badge>overridden</Badge>
            <Badge>to space-5</Badge>
          </Cluster>
        </Matrix>
      </section>
    </>
  );
}
