import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Cluster,
  Grid,
  Heading,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  Progress,
  Stack,
  Text,
} from '@mod-0-dev/pixel-perfect';
import NextLink from 'next/link';

import { Stage } from '../harness/Stage';
import { COMPONENTS, TIERS } from './components/registry';

/**
 * The front door (0.10, D-104). A Server Component: the cards are links, the
 * stage is the one client island, and the composition on it is rendered here
 * and handed to it as children.
 *
 * It leads with the claim a screenshot cannot make — drag the stage and every
 * part answers to the box it was given — then the three places that show the
 * library's opinions rather than describe them, then every component by tier.
 * Grouped by tier because the tiers are the argument: atoms, then the only
 * components allowed to size others, then the controls that share one scale,
 * then the overlays.
 */

const START = [
  {
    href: '/examples',
    name: 'Examples',
    summary: 'Three screens built from the library and nothing else, on stages you can resize.',
  },
  {
    href: '/theme',
    name: 'Your accent, solved',
    summary: 'Pick a brand colour; the generator solves the palette and the contrast checks prove it.',
  },
  {
    href: '/rules',
    name: 'The rules',
    summary: 'The constitution: one sizing contract, no outer margins, and what is banned outright.',
  },
] as const;

const STATS = [
  { title: 'Deploys this week', value: '128', trend: '+12%', tone: 'success', progress: 82 },
  { title: 'Median build', value: '3m 41s', trend: '−18s', tone: 'success', progress: 64 },
  { title: 'Open incidents', value: '2', trend: '1 new', tone: 'warning', progress: 20 },
] as const;

function Composition() {
  return (
    <div className="hero__composition">
      <Stack gap="5">
        <PageHeader>
          <PageHeaderTitle level={2}>
            Launchpad <Badge tone="accent">Live</Badge>
          </PageHeaderTitle>
          <PageHeaderDescription>Everything shipping this sprint, at a glance.</PageHeaderDescription>
          <PageHeaderActions>
            <Button variant="outline">Export</Button>
            <Button tone="accent">New release</Button>
          </PageHeaderActions>
        </PageHeader>
        <Grid minItemInlineSize="13rem" gap="3">
          {STATS.map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <Cluster justify="between" align="center" gap="2">
                  <Heading level={3} size="sm">
                    {stat.title}
                  </Heading>
                  <Badge tone={stat.tone}>{stat.trend}</Badge>
                </Cluster>
              </CardHeader>
              <CardBody>
                <Stack gap="2">
                  <Text size="lg" weight="semibold">
                    {stat.value}
                  </Text>
                  <Progress label={`${stat.title} against target`} value={stat.progress} />
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <Heading level={1} size="3xl">
          pixel-perfect
        </Heading>
        <Text size="lg" tone="muted" className="hero__lede">
          A React component library with opinions, and the proofs. No component sets its own width or
          margin, so every one answers to the box it is given and never to the window. Every colour is
          a token solved for its contrast in both themes and checked on every build. Every control is
          the native element underneath. Drag the stage below and watch the first claim hold.
        </Text>
        <Stage label="Dashboard preview">
          <Composition />
        </Stage>
        <dl className="hero__facts">
          <div>
            <dt>Components</dt>
            <dd>{COMPONENTS.length}</dd>
          </div>
          <div>
            <dt>Widths</dt>
            <dd>any — drag a stage</dd>
          </div>
          <div>
            <dt>Themes</dt>
            <dd>light · dark · system · yours</dd>
          </div>
          <div>
            <dt>Runtime dependencies</dt>
            <dd>Tier 4 only</dd>
          </div>
        </dl>
      </section>

      <section className="tier" aria-labelledby="start">
        <div className="tier__head">
          <Heading level={2} size="lg" id="start">
            Start here
          </Heading>
          <Text tone="muted">The library&rsquo;s opinions, shown rather than described.</Text>
        </div>
        <ul className="cards">
          {START.map((place) => (
            <li key={place.href}>
              <NextLink href={place.href} className="card">
                <span className="card__name">{place.name}</span>
                <span className="card__summary">{place.summary}</span>
              </NextLink>
            </li>
          ))}
        </ul>
      </section>

      {TIERS.map((tier) => {
        const entries = COMPONENTS.filter((entry) => entry.tier.split('.')[0] === tier.id);
        if (entries.length === 0) return null;
        return (
          <section key={tier.id} className="tier" aria-labelledby={`tier-${tier.id}`}>
            <div className="tier__head">
              <Heading level={2} size="lg" id={`tier-${tier.id}`}>
                <span className="tier__number">Tier {tier.id}</span> {tier.name}
              </Heading>
              <Text tone="muted">{tier.blurb}</Text>
            </div>
            <ul className="cards">
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <NextLink href={`/docs/${entry.slug}`} className="card">
                    <span className="card__tier">{entry.tier}</span>
                    <span className="card__name">{entry.name}</span>
                    <span className="card__summary">{entry.summary}</span>
                  </NextLink>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="tier" aria-labelledby="foundations">
        <div className="tier__head">
          <Heading level={2} size="lg" id="foundations">
            <span className="tier__number">Tier 0</span> Foundations
          </Heading>
          <Text tone="muted">What the components stand on, drawn rather than described.</Text>
        </div>
        <ul className="cards">
          <li>
            <NextLink href="/tokens" className="card">
              <span className="card__tier">0.2</span>
              <span className="card__name">Tokens</span>
              <span className="card__summary">
                Every ramp, the three solved off-ramp steps, and the dimensional scales.
              </span>
            </NextLink>
          </li>
          <li>
            <NextLink href="/harness" className="card">
              <span className="card__tier">0.6</span>
              <span className="card__name">Harness self-check</span>
              <span className="card__summary">
                Proves the overflow flag fires before any result from it is trusted.
              </span>
            </NextLink>
          </li>
        </ul>
      </section>
    </>
  );
}
