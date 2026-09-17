import { Badge, Icon, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const VARIANTS = ['solid', 'outline', 'ghost', 'plain'] as const;

function Clock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function BadgePage() {
  return (
    <>
      <h1>1.8 Badge</h1>
      <p>
        The canonical <code>hug</code> component. Watch the wide cell: nothing stretches. Tone
        comes entirely from the tone context, so every variant below is the same CSS.
      </p>

      <section>
        <h2>Variant × tone</h2>
        <Matrix>
          <div className="stack-tight">
            {VARIANTS.map((variant) => (
              <div className="row-wrap" key={variant}>
                {TONES.map((tone) => (
                  <Badge key={tone} variant={variant} tone={tone}>
                    {variant} {tone}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Size</h2>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Badge size="sm" tone="accent">
              sm
            </Badge>
            <Badge size="md" tone="accent">
              md
            </Badge>
            <Badge size="lg" tone="accent">
              lg
            </Badge>
            <Text size="sm" tone="muted">
              beside text
            </Text>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>With an icon</h2>
        <Matrix>
          <div className="row-wrap">
            <Badge tone="warning" variant="outline">
              <Icon decorative>
                <Clock />
              </Icon>
              In review
            </Badge>
            <Badge tone="success" variant="solid" size="sm">
              <Icon decorative>
                <Clock />
              </Icon>
              Approved
            </Badge>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Never wraps internally — the narrow cell is flagged on purpose</h2>
        <p>
          A label wider than its parent overflows visibly rather than becoming two lines of one
          word each. The harness marks the 240px cell red, which is the harness doing its job:
          this is the one situation where a <code>hug</code> component is allowed to be wider
          than the box it was given, and a 40-character badge is a misuse, not a layout.
        </p>
        <Matrix>
          <div className="row-wrap">
            <Badge tone="danger">Waiting on a named reviewer in Legal</Badge>
            <Badge>Short</Badge>
          </div>
        </Matrix>
      </section>
    </>
  );
}
