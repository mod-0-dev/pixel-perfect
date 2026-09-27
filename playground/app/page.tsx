import { Heading, Text } from 'pixel-perfect';
import NextLink from 'next/link';

import { COMPONENTS, TIERS } from './components/registry';

/**
 * The index. A Server Component: the cards are links, the chrome above them
 * carries the theme switcher, and nothing here needs the client.
 *
 * Grouped by tier because the tiers are the argument: atoms, then the only
 * components allowed to size others, then the controls that share one scale,
 * then the overlays. A flat list of 38 names hides that.
 */
export default function Home() {
  return (
    <>
      <section className="hero">
        <Heading level={1} size="3xl">
          pixel-perfect
        </Heading>
        <Text size="lg" tone="muted" className="hero__lede">
          A component library with opinions. No component sets its own width or margin, every
          colour is a solved token, and a control is the native element underneath. This
          playground renders each one at three container widths in the theme you pick above; a
          component that outgrows the box it was given is flagged, because under the sizing
          contract that is always the component&rsquo;s bug.
        </Text>
        <dl className="hero__facts">
          <div>
            <dt>Components</dt>
            <dd>{COMPONENTS.length}</dd>
          </div>
          <div>
            <dt>Widths</dt>
            <dd>240 · 480 · 960</dd>
          </div>
          <div>
            <dt>Themes</dt>
            <dd>light · dark · system</dd>
          </div>
          <div>
            <dt>Runtime dependencies</dt>
            <dd>Tier 4 only</dd>
          </div>
        </dl>
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
                  <NextLink href={`/components/${entry.slug}`} className="card">
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
