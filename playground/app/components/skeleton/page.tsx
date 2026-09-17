import { Skeleton, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const sized = (size: string) => ({ '--pp-skeleton-block-size': size }) as React.CSSProperties;

export default function SkeletonPage() {
  return (
    <>
      <h1>1.7 Skeleton</h1>
      <p>
        Holds layout still while content arrives. Inline size is the parent&apos;s; block size comes
        from <code>lines</code>, from the parent&apos;s layout, or from{' '}
        <code>--pp-skeleton-block-size</code>. There is no height prop. Screenshots are taken with
        reduced motion, so the baseline shows the static tint.
      </p>

      <section>
        <h2>Text</h2>
        <p>One line per <code>lines</code>, spaced to the type scale; the last of several is shorter.</p>
        <Matrix>
          <div className="stack-tight" aria-busy="true">
            <Skeleton shape="text" />
            <Skeleton shape="text" lines={3} />
            <Text size="sm" tone="muted">
              real text at the same size, for comparison
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Block and circle</h2>
        <p>A block is sized by its parent or the custom property. A circle defaults to 40px.</p>
        <Matrix>
          <div className="stack-tight" aria-busy="true">
            <Skeleton style={sized('var(--pp-size-12)')} />
            <Skeleton radius="lg" style={sized('4rem')} />
            <div className="row-tight">
              <Skeleton shape="circle" />
              <Skeleton shape="circle" style={sized('var(--pp-size-6)')} />
              <Skeleton shape="circle" style={sized('var(--pp-size-12)')} />
            </div>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Composed: a card while it loads</h2>
        <Matrix>
          <div className="demo-box" aria-busy="true">
            <div className="row-tight">
              <Skeleton shape="circle" />
              <div className="stack-tight" style={{ flex: 1 }}>
                <Skeleton shape="text" />
                <Skeleton shape="text" lines={2} />
              </div>
            </div>
          </div>
        </Matrix>
      </section>
    </>
  );
}
