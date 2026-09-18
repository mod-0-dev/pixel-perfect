import { Cluster, Link, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const UNDERLINES = ['always', 'hover', 'none'] as const;

export default function LinkPage() {
  return (
    <>
      <h1>3.3 Link</h1>
      <p>
        Navigation, and only navigation. A link declares no <code>display</code> of its own, so it
        flows and wraps with the text around it — watch the narrow cell in the first section, where
        the link breaks across two lines mid-sentence the way an <code>&lt;a&gt;</code> should.
        An <code>inline-flex</code> link cannot do that, which is why several well-known libraries
        ship links that are unusable mid-paragraph.
      </p>

      <section>
        <h2>In running text, it wraps</h2>
        <Matrix>
          <Text>
            The sizing contract is the reason layout primitives land in Tier 2 rather than Tier 5 —
            see the{' '}
            <Link href="#wrapping">ground rules on component sizing and spacing</Link> for the
            argument, which is longer than it looks.
          </Text>
        </Matrix>
      </section>

      <section>
        <h2>underline</h2>
        <p>
          <code>always</code> is the default because colour alone fails WCAG 1.4.1 — a link that
          differs from its surroundings only in hue is not a link for a substantial number of
          readers. <code>hover</code> is the opt-out for nav lists, where position already says
          &ldquo;link&rdquo;. Hover each one.
        </p>
        <Matrix>
          <Stack gap="2">
            {UNDERLINES.map((underline) => (
              <Cluster key={underline} gap="2" align="baseline">
                <Text size="sm" tone="muted">
                  {underline}
                </Text>
                <Link href="#underline" underline={underline}>
                  Read the pricing page
                </Link>
              </Cluster>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>tone</h2>
        <p>
          Every tone reads the tone context, neutral included — so a neutral link is muted until
          hover, which is the standard navigation treatment, and accent is the standard body-text
          one.
        </p>
        <Matrix>
          <Stack gap="2">
            {TONES.map((tone) => (
              <Link key={tone} href="#tone" tone={tone}>
                {tone}
              </Link>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>A nav list — underline=&quot;hover&quot;, tone=&quot;neutral&quot;</h2>
        <Matrix>
          <Cluster gap="4">
            <Link href="#nav" tone="neutral" underline="hover">
              About
            </Link>
            <Link href="#nav" tone="neutral" underline="hover">
              Pricing
            </Link>
            <Link href="#nav" tone="neutral" underline="hover">
              Changelog
            </Link>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Focus — the same ring as every other control</h2>
        <p>
          Tab through these. The ring is <code>--pp-color-focus-ring</code> on every tone, not a
          per-tone colour: it is the only ring pairing <code>lint:contrast</code> verifies, and one
          ring colour is easier to find than five.
        </p>
        <Matrix>
          <Cluster gap="3">
            <Link href="#focus" tone="accent">
              Accent
            </Link>
            <Link href="#focus" tone="danger">
              Danger
            </Link>
            <Link href="#focus" tone="success">
              Success
            </Link>
          </Cluster>
        </Matrix>
      </section>
    </>
  );
}
