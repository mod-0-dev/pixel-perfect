import { Spinner, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

export default function SpinnerPage() {
  return (
    <>
      <h1>1.6 Spinner</h1>
      <p>
        Indeterminate busy. Under <code>prefers-reduced-motion</code> the rotation becomes a slow
        opacity pulse — never a frozen arc, which reads as a hung page. Screenshots are taken with
        reduced motion on, so the baseline shows the pulse variant.
      </p>

      <section>
        <h2>Size and tone</h2>
        <Matrix>
          <div className="stack-tight">
            <div className="row-wrap" style={{ alignItems: 'center' }}>
              <Spinner label="Loading, small" size="sm" />
              <Spinner label="Loading, medium" size="md" />
              <Spinner label="Loading, large" size="lg" />
              <Text size="sm" tone="muted">
                sm · md · lg
              </Text>
            </div>
            <div className="row-wrap" style={{ alignItems: 'center' }}>
              <Spinner label="neutral" tone="neutral" />
              <Spinner label="accent" tone="accent" />
              <Spinner label="danger" tone="danger" />
              <Spinner label="success" tone="success" />
              <Spinner label="warning" tone="warning" />
            </div>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Inside a control that already says what is happening</h2>
        <p>Decorative: the button text is the accessible name.</p>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <button type="button" className="demo-button" disabled style={{ gap: 'var(--pp-space-2)' }}>
              <Spinner decorative size="sm" />
              Saving…
            </button>
            <Text size="sm" tone="muted">
              <Spinner decorative size="sm" /> Syncing 3 assets
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Alone</h2>
        <p>Labelled: the label is announced as a status.</p>
        <Matrix>
          <div className="row-wrap" style={{ justifyContent: 'center' }}>
            <Spinner label="Loading the launch overview" size="lg" tone="accent" />
          </div>
        </Matrix>
      </section>
    </>
  );
}
