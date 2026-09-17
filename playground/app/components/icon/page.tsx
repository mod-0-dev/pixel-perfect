import { Heading, Icon, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

/** A stroke icon, drawn with currentColor, the way most icon sets ship. */
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** A filled icon, also currentColor. */
function Alert() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 1 21h22L12 2zm0 6 6.5 11h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
    </svg>
  );
}

export default function IconPage() {
  return (
    <>
      <h1>1.3 Icon</h1>
      <p>
        A wrapper, not an icon set. Sized to the text beside it unless told otherwise, coloured
        by <code>currentColor</code>, and impossible to render without saying whether it means
        something.
      </p>

      <section>
        <h2>Inherits the text size</h2>
        <p>The same glyph at 1em inside four sizes of Text and a Heading.</p>
        <Matrix>
          <div className="stack-tight">
            <Text size="xs">
              <Icon decorative><Check /></Icon> xs — approved
            </Text>
            <Text size="sm">
              <Icon decorative><Check /></Icon> sm — approved
            </Text>
            <Text size="md">
              <Icon decorative><Check /></Icon> md — approved
            </Text>
            <Text size="lg">
              <Icon decorative><Check /></Icon> lg — approved
            </Text>
            <Heading level={3}>
              <Icon decorative><Alert /></Icon> A heading with an icon
            </Heading>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Fixed sizes</h2>
        <Matrix>
          <div className="row-tight">
            <Icon label="Small" size="sm"><Alert /></Icon>
            <Icon label="Medium" size="md"><Alert /></Icon>
            <Icon label="Large" size="lg"><Alert /></Icon>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Colour follows the text</h2>
        <p>Nothing here sets a colour on the icon. The tone comes from the Text it sits in.</p>
        <Matrix>
          <div className="stack-tight">
            <Text tone="danger"><Icon decorative><Alert /></Icon> Blocked — legal has not cleared it</Text>
            <Text tone="success"><Icon decorative><Check /></Icon> Approved</Text>
            <Text tone="muted"><Icon decorative><Check /></Icon> Muted, still readable</Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Does not shrink</h2>
        <p>A long label in a narrow flex row. The icon keeps its size; the text wraps.</p>
        <Matrix>
          <div className="row-tight">
            <Icon label="Warning" size="md"><Alert /></Icon>
            <Text size="sm">Store screenshots (6).zip is not approved yet and the listing cannot be submitted until it is.</Text>
          </div>
        </Matrix>
      </section>
    </>
  );
}
