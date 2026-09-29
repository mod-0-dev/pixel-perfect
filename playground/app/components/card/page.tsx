/*
 * A Server Component, like the Card: nothing here needs a handler.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its sections
 * by `data-testid`.
 */
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Cluster, Grid, Heading, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Full() {
  return (
    <Card>
      <CardHeader>
        <Cluster justify="between" align="center">
          <Heading level={3} size="sm">
            Billing
          </Heading>
          <Badge tone="success">Active</Badge>
        </Cluster>
      </CardHeader>
      <CardBody>
        <Stack gap="2">
          <Text size="sm">Next invoice on the first of the month, to the card ending 4242.</Text>
          {/* A BARE paragraph, not a Text: Text wraps on its own, and the
              test is whether the CARD wraps a string it is given (D-079 §3). */}
          <p>https://example.com/billing/invoices/2026/september/very-long-invoice-identifier-that-does-not-wrap</p>
        </Stack>
      </CardBody>
      <CardFooter>
        <Cluster gap="2" justify="end">
          <Button variant="ghost" size="sm">
            Cancel plan
          </Button>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </Cluster>
      </CardFooter>
    </Card>
  );
}

export default function CardPage() {
  return (
    <>
      <h1>5.1 Card</h1>
      <p>
        A bounded surface for one thing: a header, a body and a foot, any of which may be absent, and a
        hairline between the ones that are present. The raised surface, a hairline edge, no shadow; the
        foot on the sunken surface. The first of Tier 5, and a Server Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>
          All three sections. A long URL in the body wraps inside the card at 240px rather than pushing
          it past its cell.
        </p>
        <Matrix>
          <Full />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sections, any of them</h2>
        <Text>A body alone has no hairline; a header and a body have one; all three have two.</Text>
        <div data-testid="card-sections">
          <Grid columns="repeat(auto-fill, minmax(14rem, 1fr))" gap="4">
            <Card data-testid="card-body-only">
              <CardBody>
                <Text size="sm">A body alone.</Text>
              </CardBody>
            </Card>
            <Card data-testid="card-header-body">
              <CardHeader>
                <Heading level={3} size="sm">
                  Header and body
                </Heading>
              </CardHeader>
              <CardBody>
                <Text size="sm">One hairline.</Text>
              </CardBody>
            </Card>
            <Card data-testid="card-all">
              <CardHeader>
                <Heading level={3} size="sm">
                  All three
                </Heading>
              </CardHeader>
              <CardBody>
                <Text size="sm">Two hairlines, and a sunken foot.</Text>
              </CardBody>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </Grid>
        </div>
      </section>

      <section>
        <h2>An interactive card</h2>
        <Text>
          <code>asChild</code> makes the consumer&rsquo;s link the card: it lifts on hover, rings on
          focus, and its text is not underlined. It holds no other interactive content.
        </Text>
        <div data-testid="card-links">
          <Grid columns="repeat(auto-fill, minmax(14rem, 1fr))" gap="4">
            {['Design system', 'Billing service', 'Mobile app'].map((name) => (
              <Card key={name} asChild>
                <a href="#projects">
                  <CardHeader>
                    <Heading level={3} size="sm">
                      {name}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Text size="sm" tone="muted">
                      Updated yesterday. Twelve open issues.
                    </Text>
                  </CardBody>
                </a>
              </Card>
            ))}
          </Grid>
        </div>
      </section>

      <section>
        <h2>Lifted</h2>
        <Text>
          No shadow by default — a shadow is for what floats. <code>--pp-card-shadow</code> lifts one.
        </Text>
        <div data-testid="card-lifted" style={{ maxWidth: '24rem' }}>
          <Card style={{ '--pp-card-shadow': 'var(--pp-shadow-1)' } as React.CSSProperties}>
            <CardBody>
              <Text size="sm">A card with the first shadow step.</Text>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
