import { Avatar, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

/**
 * Inline SVG data URIs, not network images: a screenshot baseline that depends
 * on a third-party server is a baseline that flakes.
 */
const portrait = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 60% 55%)"/><circle cx="32" cy="24" r="12" fill="hsl(${hue} 60% 85%)"/><ellipse cx="32" cy="58" rx="20" ry="16" fill="hsl(${hue} 60% 85%)"/></svg>`,
  )}`;

const BROKEN = 'data:image/png;base64,not-an-image';

function UserGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="60%" height="60%" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0z" />
    </svg>
  );
}

export default function AvatarPage() {
  return (
    <>
      <h1>1.9 Avatar</h1>
      <p>
        The only client component in Tier 1. Initials until the image loads; initials for good if
        it fails or there is none.
      </p>

      <section>
        <h2>Image, initials, failure</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Avatar name="Mara Ellison" src={portrait(258)} />
            <Avatar name="Devika Rao" tone="success" />
            <Avatar name="Tobias Lind" src={BROKEN} tone="warning" />
            <Text size="sm" tone="muted">
              loaded · no image · broken URL
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Size</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Avatar name="Hana Kowalski" size="sm" tone="danger" />
            <Avatar name="Hana Kowalski" size="md" tone="danger" />
            <Avatar name="Hana Kowalski" size="lg" tone="danger" />
            <Avatar name="Hana Kowalski" size="sm" src={portrait(25)} />
            <Avatar name="Hana Kowalski" size="md" src={portrait(25)} />
            <Avatar name="Hana Kowalski" size="lg" src={portrait(25)} />
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Tone, mononyms, a custom fallback</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Avatar name="Samuel Okafor" tone="neutral" />
            <Avatar name="Samuel Okafor" tone="accent" />
            <Avatar name="Cher" tone="success" />
            <Avatar name="山田 太郎" tone="warning" />
            <Avatar name="Unassigned" fallback={<UserGlyph />} />
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Square, via the styling API</h2>
        <Matrix>
          <div className="row-wrap" style={{ '--pp-avatar-radius': 'var(--pp-radius-2)' } as React.CSSProperties}>
            <Avatar name="Yuki Tanaka" src={portrait(145)} size="lg" />
            <Avatar name="Yuki Tanaka" size="lg" tone="accent" />
          </div>
        </Matrix>
      </section>
    </>
  );
}
