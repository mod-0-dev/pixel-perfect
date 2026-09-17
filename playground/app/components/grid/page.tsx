import { Avatar, Badge, Cluster, Grid, Heading, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const WORKSTREAMS = ['Engineering', 'Legal', 'Marketing', 'Support'];

export default function GridPage() {
  return (
    <>
      <h1>2.3 Grid</h1>
      <p>
        Three modes: a fixed column count, an <code>auto-fit</code> track that reflows with no
        query at all, and a raw track template for the asymmetric cases neither covers.
      </p>

      <section>
        <h2>auto-fit is the container-native mode</h2>
        <p>
          <code>minItemInlineSize=&quot;12rem&quot;</code>. One column at 240px, two at 480px,
          four at 960px &mdash; resolved continuously against the grid&apos;s own inline size.
          There is no breakpoint here and no measurement; this is what RULES §1 bought.
        </p>
        <Matrix>
          <Grid minItemInlineSize="12rem" gap="3">
            {WORKSTREAMS.map((name) => (
              <Stack key={name} gap="1">
                <Text size="sm" weight="medium">
                  {name}
                </Text>
                <Text size="xs" tone="muted">
                  4 tasks
                </Text>
              </Stack>
            ))}
          </Grid>
        </Matrix>
      </section>

      <section>
        <h2>A fixed column count is honest about being fixed</h2>
        <p>
          <code>columns={'{3}'}</code>. Three columns in a 240px sidebar are three squashed
          columns. That is the caller&apos;s decision, and the component does not second-guess it
          &mdash; but it is why <code>auto-fit</code> is the one to reach for.
        </p>
        <Matrix>
          <Grid columns={3} gap="2">
            <Badge tone="accent">One</Badge>
            <Badge>Two</Badge>
            <Badge tone="success">Three</Badge>
          </Grid>
        </Matrix>
      </section>

      <section>
        <h2>minmax(0, 1fr), never bare 1fr</h2>
        <p>
          Every generated track carries a zero floor. <code>1fr</code> has a{' '}
          <code>min-content</code> floor instead, so the long token below would push the whole
          grid past its container &mdash; the exact failure the sizing contract exists to prevent,
          arriving through the back door.
        </p>
        <Matrix>
          <Grid columns={2} gap="2">
            <Text size="sm" truncate>
              privacy-policy-v4-final-REVIEWED-legal-signoff-pending.pdf
            </Text>
            <Text size="sm" tone="muted">
              Short
            </Text>
          </Grid>
        </Matrix>
      </section>

      <section>
        <h2>A raw track template</h2>
        <p>
          <code>columns=&quot;auto minmax(0, 1fr)&quot;</code>: an avatar beside text that
          truncates. Neither a column count nor <code>auto-fit</code> can express this, and the
          alternative was every app hand-rolling the same grid class in its own stylesheet
          (D-022 §4).
        </p>
        <Matrix>
          <Stack gap="2">
            {[
              ['Grace Hopper', 'approved the privacy policy'],
              ['Ada Lovelace', 'assigned launch-readiness-checklist-final-v4-REVIEWED to Legal'],
            ].map(([who, what]) => (
              <Grid key={who} columns="auto minmax(0, 1fr)" gap="3" align="start">
                <Avatar name={who} size="sm" tone="accent" />
                <Stack gap="1">
                  <Text size="sm" truncate>
                    <strong>{who}</strong> {what}
                  </Text>
                  <Text size="xs" tone="muted">
                    2 hours ago
                  </Text>
                </Stack>
              </Grid>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>align</h2>
        <p>
          No <code>baseline</code>: it is meaningless across grid tracks of different heights.
        </p>
        <Matrix>
          <Stack gap="4">
            {(['stretch', 'start', 'center', 'end'] as const).map((align) => (
              <Stack key={align} gap="1">
                <Text size="xs" tone="muted">
                  align=&quot;{align}&quot;
                </Text>
                <Grid columns={2} gap="2" align={align}>
                  <Cluster gap="1">
                    <Badge tone="accent">Short</Badge>
                  </Cluster>
                  <Text size="sm" tone="muted">
                    A taller cell, because this one wraps onto more than one line at every width.
                  </Text>
                </Grid>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Nested grids do not inherit their parent&apos;s tracks</h2>
        <p>
          The track list travels on an inheriting custom property, so the inner grid below writes
          its own <code>none</code> rather than laying itself out in three columns (D-024).
        </p>
        <Matrix>
          <Grid columns={3} gap="2">
            <Grid gap="1">
              <Text size="xs">Inner, no props</Text>
              <Text size="xs" tone="muted">
                One implicit column
              </Text>
            </Grid>
            <Badge>Two</Badge>
            <Badge>Three</Badge>
          </Grid>
        </Matrix>
      </section>

      <section>
        <h2>Styling API</h2>
        <p>
          <code>--pp-grid-template-columns</code> beats the props, from anywhere including an
          ancestor &mdash; which is only true because the component writes a private property
          rather than this one (D-024).
        </p>
        <Matrix>
          <div style={{ '--pp-grid-template-columns': '2fr 1fr' } as React.CSSProperties}>
            <Grid columns={3} gap="2">
              <Badge tone="accent">columns={'{3}'}</Badge>
              <Badge>overridden from an ancestor</Badge>
            </Grid>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Cards, the case it was built for</h2>
        <Matrix>
          <Grid minItemInlineSize="14rem" gap="3">
            {WORKSTREAMS.map((name) => (
              <Stack
                key={name}
                gap="2"
                style={{
                  padding: 'var(--pp-space-4)',
                  background: 'var(--pp-color-bg-surface)',
                  border: '1px solid var(--pp-color-border-subtle)',
                  borderRadius: 'var(--pp-radius-3)',
                }}
              >
                <Heading level={3} size="sm">
                  {name}
                </Heading>
                <Cluster gap="2">
                  <Badge tone="success">On track</Badge>
                  <Text size="xs" tone="muted">
                    4 tasks
                  </Text>
                </Cluster>
              </Stack>
            ))}
          </Grid>
        </Matrix>
      </section>
    </>
  );
}
