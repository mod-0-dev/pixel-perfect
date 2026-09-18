import { Cluster, IconButton, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const VARIANTS = ['solid', 'outline', 'ghost', 'plain'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

function X() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Clipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

function Trash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
    </svg>
  );
}

export default function IconButtonPage() {
  return (
    <>
      <h1>3.2 IconButton</h1>
      <p>
        A square <code>Button</code> that cannot be constructed without an accessible name.{' '}
        <code>label</code> is a required <code>string</code>, so{' '}
        <code>&lt;IconButton&gt;&lt;X /&gt;&lt;/IconButton&gt;</code> does not typecheck — which is
        the whole reason it is a separate component rather than a <code>Button</code> prop.
      </p>

      <section>
        <h2>Square at every size — 32 / 40 / 48</h2>
        <p>
          Both axes come from <code>--pp-control-height-*</code>, so an IconButton lines up in a row
          of Buttons and Inputs. The icon rides the same step: <code>sm</code> is a 16px icon in a
          32px box, <code>lg</code> a 24px icon in a 48px box.
        </p>
        <Matrix>
          <Cluster gap="2" align="center">
            {SIZES.map((size) => (
              <IconButton key={size} label={`Close (${size})`} size={size} variant="outline">
                <X />
              </IconButton>
            ))}
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Variant × tone</h2>
        <p>
          Defaults to <code>ghost</code>, not Button&rsquo;s <code>solid</code> — an icon button is
          almost always a secondary affordance, and a grid of solid squares is noise.
        </p>
        <Matrix>
          <div className="stack-tight">
            {VARIANTS.map((variant) => (
              <div className="row-wrap" key={variant}>
                {TONES.map((tone) => (
                  <IconButton key={tone} label={`${variant} ${tone}`} variant={variant} tone={tone}>
                    <Trash />
                  </IconButton>
                ))}
              </div>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Loading and disabled</h2>
        <p>
          Inherited wholesale from Button. The box is square by height, so it does not resize when
          the spinner appears — and the name survives, because the icon is hidden with opacity
          rather than removed.
        </p>
        <Matrix>
          <Cluster gap="2" align="center">
            <IconButton label="Deleting row" tone="danger" loading>
              <Trash />
            </IconButton>
            <IconButton label="Copy to clipboard" disabled>
              <Clipboard />
            </IconButton>
            <Text size="sm" tone="muted">
              loading · disabled
            </Text>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>A row action</h2>
        <Matrix>
          <Stack gap="2">
            <Cluster gap="2" align="center" justify="between">
              <Text>Q3 revenue model.xlsx</Text>
              <Cluster gap="1">
                <IconButton label="Copy link to Q3 revenue model" size="sm" variant="plain">
                  <Clipboard />
                </IconButton>
                <IconButton
                  label="Delete Q3 revenue model"
                  size="sm"
                  variant="plain"
                  tone="danger"
                >
                  <Trash />
                </IconButton>
              </Cluster>
            </Cluster>
            <Text size="sm" tone="muted">
              Each name says what it does to what. &ldquo;Trash icon&rdquo; would name the picture,
              not the action.
            </Text>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}
