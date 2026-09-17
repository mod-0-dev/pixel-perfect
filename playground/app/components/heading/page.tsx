import { Heading, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

export default function HeadingPage() {
  return (
    <>
      <h1>1.2 Heading</h1>
      <p>
        Visual size decoupled from semantic level. The narrow cell is where balanced wrapping
        and truncation earn their keep.
      </p>

      <section>
        <h2>Levels with their default sizes</h2>
        <Matrix>
          <div className="stack-tight">
            <Heading level={1}>h1 — 3xl</Heading>
            <Heading level={2}>h2 — 2xl</Heading>
            <Heading level={3}>h3 — xl</Heading>
            <Heading level={4}>h4 — lg</Heading>
            <Heading level={5}>h5 — md</Heading>
            <Heading level={6}>h6 — sm</Heading>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Decoupled</h2>
        <p>Same outline position, different emphasis. Both are h3.</p>
        <Matrix>
          <div className="stack-tight">
            <Heading level={3} size="3xl">
              An h3 at 3xl
            </Heading>
            <Heading level={3} size="sm" tone="muted" weight="medium">
              An h3 at sm, muted
            </Heading>
            <Text size="sm" tone="muted">
              Body copy under a section heading, for scale.
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Tone and weight</h2>
        <Matrix>
          <div className="stack-tight">
            <Heading level={4} tone="accent">
              accent
            </Heading>
            <Heading level={4} tone="danger">
              danger
            </Heading>
            <Heading level={4} tone="success">
              success
            </Heading>
            <Heading level={4} tone="warning">
              warning
            </Heading>
            <Heading level={4} weight="regular">
              regular weight
            </Heading>
            <Heading level={4} weight="bold" align="center">
              bold, centred
            </Heading>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Long headings</h2>
        <p>Balanced wrapping by default; clamped when asked. The full text stays in the DOM.</p>
        <Matrix>
          <div className="stack-tight">
            <Heading level={3}>Sign off the privacy policy before the store review deadline</Heading>
            <Heading level={3} truncate>
              Sign off the privacy policy before the store review deadline
            </Heading>
            <Heading level={3} truncate={2} tone="muted">
              Sign off the privacy policy before the store review deadline
            </Heading>
          </div>
        </Matrix>
      </section>
    </>
  );
}
