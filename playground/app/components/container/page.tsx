import { Badge, Cluster, Container, Grid, Heading, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const SIZES = [
  ['sm', '40rem', 'A reading measure — prose, a settings form, a login card'],
  ['md', '64rem', 'An app page'],
  ['lg', '80rem', 'A dashboard'],
] as const;

export default function ContainerPage() {
  return (
    <>
      <h1>2.4 Container</h1>
      <p>
        <strong>The only component in the library permitted to set</strong>{' '}
        <code>max-inline-size</code>. That is its entire job, and it is what makes RULES §1
        liveable: when you want to constrain something, you wrap it.
      </p>

      <section>
        <h2>The three measures</h2>
        <p>
          Every cell here is narrower than every measure, so all three fill &mdash; which is the
          point. A Container is <code>fill</code> up to its measure and constrained after it. The
          page you are reading is wider than the harness, so the outlines below show the gutter
          rather than the constraint.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map(([size, measure, what]) => (
              <Container
                key={size}
                size={size}
                gutter="3"
                style={{
                  background: 'var(--pp-color-bg-sunken)',
                  borderRadius: 'var(--pp-radius-2)',
                  paddingBlock: 'var(--pp-space-2)',
                }}
              >
                <Text size="sm" weight="medium">
                  size=&quot;{size}&quot; &middot; {measure}
                </Text>
                <Text size="xs" tone="muted">
                  {what}
                </Text>
              </Container>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The gutter defaults to a non-zero step</h2>
        <p>
          Unlike <code>gap</code>, which defaults to <code>&quot;0&quot;</code>. The asymmetry is
          deliberate: a zero gap is a legitimate design, and a zero page gutter is text against
          the edge of a phone screen &mdash; a bug every single time (D-022 §6).
        </p>
        <Matrix>
          <Stack gap="2">
            {(['0', '3', '5', '7'] as const).map((gutter) => (
              <Container
                key={gutter}
                gutter={gutter}
                style={{
                  background: 'var(--pp-color-bg-sunken)',
                  borderRadius: 'var(--pp-radius-2)',
                  paddingBlock: 'var(--pp-space-2)',
                }}
              >
                <Text size="xs" tone="muted">
                  gutter=&quot;{gutter}&quot;
                </Text>
              </Container>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It is a query container, and that is not incidental</h2>
        <p>
          <code>container-type: inline-size</code> on the root. Without a query container near the
          top of the tree, a component&apos;s <code>@container</code> rules resolve against
          whatever ancestor happens to have one &mdash; which in a page with none is the viewport,
          quietly reintroducing the thing RULES §1 removed. <code>Split</code> (2.6) is the first
          component to depend on this.
        </p>
      </section>

      <section>
        <h2>A page, assembled</h2>
        <p>
          Container wraps, Stack spaces, Cluster rows, Grid tiles. Four components, no app CSS,
          and not one of them knows how wide the page is.
        </p>
        <Matrix>
          <Container size="md" gutter="3" asChild>
            <main>
              <Stack gap="4">
                <Cluster gap="3" justify="between">
                  <Heading level={2} size="lg">
                    Northwind Go 4.0
                  </Heading>
                  <Badge tone="warning">12 days out</Badge>
                </Cluster>
                <Grid minItemInlineSize="10rem" gap="2">
                  {['Engineering', 'Legal', 'Marketing'].map((name) => (
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
              </Stack>
            </main>
          </Container>
        </Matrix>
      </section>

      <section>
        <h2>Styling API</h2>
        <p>
          <code>--pp-container-max-inline-size</code> beats <code>size</code>, from anywhere
          including an ancestor (D-024). This one is pinned to 20rem, which is narrower than every
          harness cell, so the constraint is finally visible.
        </p>
        <Matrix>
          <div style={{ '--pp-container-max-inline-size': '20rem' } as React.CSSProperties}>
            <Container
              size="lg"
              gutter="3"
              style={{
                background: 'var(--pp-color-bg-sunken)',
                borderRadius: 'var(--pp-radius-2)',
                paddingBlock: 'var(--pp-space-2)',
              }}
            >
              <Text size="sm">size=&quot;lg&quot;, pinned to 20rem and centred</Text>
            </Container>
          </div>
        </Matrix>
      </section>
    </>
  );
}
