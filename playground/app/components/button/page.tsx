'use client';

import { Button, Cluster, Icon, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

import { Matrix } from '../../../harness/Matrix';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const VARIANTS = ['solid', 'outline', 'ghost', 'plain'] as const;

function Save() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Cluster gap="2" align="center">
      <Button
        tone="accent"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        {loading ? 'Saving…' : 'Save'}
      </Button>
      <Text size="sm" tone="muted">
        Tab to it first. Focus stays put when it starts.
      </Text>
    </Cluster>
  );
}

export default function ButtonPage() {
  return (
    <>
      <h1>3.1 Button</h1>
      <p>
        The first focusable component in the library. Watch the wide cell: nothing stretches, because
        a button is <code>hug</code> and there is no <code>fullWidth</code> prop. Watch the narrow
        cell for the same reason <code>Badge</code> is watched there — a long label overflows
        visibly rather than becoming four lines of one word.
      </p>

      <section>
        <h2>Variant × tone</h2>
        <p>
          Hierarchy lives in <code>tone</code>, not <code>variant</code>. The default is a neutral
          solid; one action per view opts into <code>tone=&quot;accent&quot;</code>.
        </p>
        <Matrix>
          <div className="stack-tight">
            {VARIANTS.map((variant) => (
              <div className="row-wrap" key={variant}>
                {TONES.map((tone) => (
                  <Button key={tone} variant={variant} tone={tone}>
                    {variant} {tone}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Size — the shared control scale</h2>
        <p>
          32 / 40 / 48px, from <code>--pp-control-height-*</code>. Every Tier 3 control reads the
          same three values, so a Button and an Input at <code>size=&quot;md&quot;</code> line up.
        </p>
        <Matrix>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <Button size="sm" tone="accent">
              sm
            </Button>
            <Button size="md" tone="accent">
              md
            </Button>
            <Button size="lg" tone="accent">
              lg
            </Button>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Icons compose — there is no iconStart prop</h2>
        <p>
          An <code>Icon</code> in children is spaced by <code>--pp-control-gap-*</code> and sized at
          1em, so it tracks the button&rsquo;s font size with no API at all.
        </p>
        <Matrix>
          <div className="row-wrap">
            <Button tone="accent">
              <Icon decorative>
                <Save />
              </Icon>
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Icon decorative>
                <Save />
              </Icon>
              Save
            </Button>
            <Button variant="ghost" size="lg">
              <Icon decorative>
                <Save />
              </Icon>
              Save
            </Button>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Loading — aria-disabled, not disabled</h2>
        <p>
          The button stays focusable and keeps its size; the label is hidden with{' '}
          <code>visibility</code> rather than removed, so the accessible name never changes and the
          box never shrinks under the cursor. A <code>disabled</code> button would be blurred by the
          browser the instant it disabled, which is the bug this avoids.
        </p>
        <Matrix>
          <Stack gap="3">
            <div className="row-wrap">
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} tone="accent" loading>
                  {variant}
                </Button>
              ))}
            </div>
            <LoadingDemo />
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled</h2>
        <p>
          Native <code>disabled</code>, so it leaves the tab order. No <code>pointer-events: none</code>
          {' '}— that would kill a Tooltip and make <code>cursor: not-allowed</code> impossible.
        </p>
        <Matrix>
          <div className="row-wrap">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} tone="accent" disabled>
                {variant}
              </Button>
            ))}
          </div>
        </Matrix>
      </section>

      <section>
        <h2>asChild — a link that looks like a button</h2>
        <p>
          The anchor keeps its semantics: it is announced as a link, it middle-clicks, and the
          status bar shows where it goes. Only the styling comes from Button.
        </p>
        <Matrix>
          <div className="row-wrap">
            <Button asChild tone="accent">
              <a href="#asChild">Settings</a>
            </Button>
            <Button asChild variant="outline">
              <a href="#asChild">Docs</a>
            </Button>
          </div>
        </Matrix>
      </section>

      <section>
        <h2>hug means hug — the wide cell proves it</h2>
        <p>
          Making a button fill its row is the parent&rsquo;s job, and the second row is a{' '}
          <code>Stack</code> doing it. Note that <code>Stack</code> defaults to{' '}
          <code>align=&quot;stretch&quot;</code> — the CSS default for a flex column — so the first
          row has to ask for <code>align=&quot;start&quot;</code> to show the button at its own
          width. That is the sizing contract working as written: the button declares nothing and
          the parent decides, including when the parent decides by default.
        </p>
        <Matrix>
          <Stack gap="3">
            <Stack gap="2" align="start">
              <Button tone="accent">Default — hugs its label</Button>
            </Stack>
            <Stack gap="2" align="stretch">
              <Button tone="accent">The parent stretched this one</Button>
            </Stack>
            <div className="row-wrap">
              <Button tone="danger">Waiting on a named reviewer in Legal</Button>
            </div>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}
