'use client';

import { Cluster, Icon, Stack, Text, Toggle } from 'pixel-perfect';
import { useState } from 'react';

import { Matrix } from '../../../harness/Matrix';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const VARIANTS = ['solid', 'outline', 'ghost', 'plain'] as const;

function Bold() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7 5h6a4 4 0 0 1 0 8H7zM7 13h7a4 4 0 0 1 0 8H7z" />
    </svg>
  );
}

function Controlled() {
  const [on, setOn] = useState(false);
  return (
    <Cluster gap="3" align="center">
      <Toggle pressed={on} onPressedChange={setOn}>
        Show archived
      </Toggle>
      <Text size="sm" tone="muted">
        pressed = {String(on)} — the parent owns it
      </Text>
    </Cluster>
  );
}

export default function TogglePage() {
  return (
    <>
      <h1>3.5 Toggle</h1>
      <p>
        A button that stays pressed. It is <strong>not</strong> <code>Switch</code> (3.12): a Toggle
        is <code>aria-pressed</code>, a button whose effect is immediate and which carries no value
        in a form. A Switch is <code>role=&quot;switch&quot;</code> with <code>aria-checked</code>,
        a form control that submits. Toolbar with an icon → Toggle. Settings row with a label to its
        left → Switch.
      </p>

      <section>
        <h2>Off and on, across variants</h2>
        <p>
          Pressed sits at the filled end of the background ramp, so there is no darker step to move
          to on hover — the fill holds and the border carries the feedback. Hover the pressed row.
        </p>
        <Matrix>
          <div className="stack-tight">
            {VARIANTS.map((variant) => (
              <div className="row-wrap" key={variant}>
                <Toggle variant={variant} tone="accent">
                  {variant} off
                </Toggle>
                <Toggle variant={variant} tone="accent" defaultPressed>
                  {variant} on
                </Toggle>
              </div>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>tone</h2>
        <Matrix>
          <div className="row-wrap">
            {TONES.map((tone) => (
              <Toggle key={tone} tone={tone} defaultPressed>
                {tone}
              </Toggle>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Controlled and uncontrolled, both always</h2>
        <p>
          RULES §5.5 — no exceptions. The first is owned by this page; the second owns itself and
          only reports.
        </p>
        <Matrix>
          <Stack gap="3">
            <Controlled />
            <Cluster gap="3" align="center">
              <Toggle defaultPressed>Wrap long lines</Toggle>
              <Text size="sm" tone="muted">
                defaultPressed — uncontrolled
              </Text>
            </Cluster>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Icon-only, in a toolbar</h2>
        <p>
          An icon-only Toggle needs an <code>aria-label</code>, and the name must not change with
          the state: a name that flips between &ldquo;Bold&rdquo; and &ldquo;Unbold&rdquo; is
          announced as a <em>different control appearing</em>. The pressed state is announced
          separately.
        </p>
        <Matrix>
          <Cluster gap="1">
            <Toggle aria-label="Bold" defaultPressed>
              <Icon decorative>
                <Bold />
              </Icon>
            </Toggle>
            <Toggle aria-label="Italic">
              <Icon decorative>
                <Bold />
              </Icon>
            </Toggle>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Disabled</h2>
        <Matrix>
          <div className="row-wrap">
            <Toggle disabled>Off and disabled</Toggle>
            <Toggle disabled defaultPressed>
              On and disabled
            </Toggle>
          </div>
        </Matrix>
      </section>
    </>
  );
}
