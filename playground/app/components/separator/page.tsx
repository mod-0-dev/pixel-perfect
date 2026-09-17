import { Separator, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

export default function SeparatorPage() {
  return (
    <>
      <h1>1.5 Separator</h1>
      <p>
        A line, not a gap. The space around it belongs to the parent. Vertical rules stretch to
        their row even when the row centres its items.
      </p>

      <section>
        <h2>Horizontal, between stacked content</h2>
        <Matrix>
          <div className="stack-tight">
            <Text>Engineering</Text>
            <Separator />
            <Text>Design</Text>
            <Separator decorative={false} />
            <Text tone="muted" size="sm">
              The second rule is exposed to assistive technology; the first is not.
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Vertical, in a centred row</h2>
        <Matrix>
          <div className="row-tight" style={{ alignItems: 'center' }}>
            <Text size="sm">Draft</Text>
            <Separator orientation="vertical" />
            <Text size="sm" tone="muted">
              12 KB
            </Text>
            <Separator orientation="vertical" />
            <Text size="sm" tone="muted">
              2h ago
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Styling API</h2>
        <p>
          <code>--pp-separator-color</code> and <code>--pp-separator-thickness</code>, set on any
          ancestor.
        </p>
        <Matrix>
          <div
            className="stack-tight"
            style={
              {
                '--pp-separator-color': 'var(--pp-tone-solid)',
                '--pp-separator-thickness': 'var(--pp-border-width-2)',
              } as React.CSSProperties
            }
            data-pp-tone="accent"
          >
            <Text>Above</Text>
            <Separator />
            <Text>Below</Text>
          </div>
        </Matrix>
      </section>
    </>
  );
}
