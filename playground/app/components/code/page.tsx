import { Code, Heading, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

export default function CodePage() {
  return (
    <>
      <h1>1.11 Code</h1>
      <p>
        Inline code. Sized relative to the text it sits in unless told otherwise, and it never
        forces the page to scroll sideways.
      </p>

      <section>
        <h2>Tracks the surrounding text</h2>
        <Matrix>
          <div className="stack-tight">
            <Text size="xs">
              xs: run <Code>npm run tokens</Code> after editing
            </Text>
            <Text size="md">
              md: run <Code>npm run tokens</Code> after editing
            </Text>
            <Text size="lg">
              lg: run <Code>npm run tokens</Code> after editing
            </Text>
            <Heading level={3}>
              The <Code>--pp-size-*</Code> scale
            </Heading>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Tone</h2>
        <Matrix>
          <div className="stack-tight">
            <Text tone="danger">
              <Code tone="danger">launchDate</Code> must be an ISO date.
            </Text>
            <Text tone="success">
              <Code tone="success">requireAssetApproval</Code> is on.
            </Text>
            <Text>
              Set <Code tone="accent">--pp-text-color</Code> on any ancestor.
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Fixed sizes, standalone</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Code size="sm">sm</Code>
            <Code size="md">md</Code>
            <Code size="lg">lg</Code>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Long identifiers wrap</h2>
        <p>A path that would overflow the narrow cell breaks instead, keeping its chip on every line.</p>
        <Matrix>
          <Text size="sm">
            Baselines live in <Code>tests/visual/__screenshots__/components/visually-hidden.png</Code> and are
            authored by CI.
          </Text>
        </Matrix>
      </section>
    </>
  );
}
