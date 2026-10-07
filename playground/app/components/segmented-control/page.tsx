/*
 * A Server Component; SegmentedControl is client for its state, and every
 * demo here is uncontrolled, so nothing crosses the boundary but elements.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`, and every group generates its own `name` — the
 * Matrix renders each demo three times, and three groups sharing a name
 * would be one group.
 */
import { Button, Cluster, Field, Icon, SegmentedControl, SegmentedControlItem, Stack } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function AlignGlyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d={d} />
    </svg>
  );
}

function Theme({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <SegmentedControl label="Theme" defaultValue="light" {...(size ? { size } : {})}>
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  );
}

export default function SegmentedControlPage() {
  return (
    <>
      <h1>3.18 SegmentedControl</h1>
      <p>
        Exactly one of a few options, drawn as attached buttons. Underneath it is a radio group —
        one tab stop, arrows that move and select, a value that submits — so a screen reader hears
        &ldquo;Light, radio button, checked, 2 of 3&rdquo;. The checked segment is solid: a pressed
        Toggle&rsquo;s fill is 1.26:1 against the page, too faint to tell a choice from its neighbour.
      </p>

      <section>
        <h2>At every width</h2>
        <p>It hugs, and never wraps. Tab in, then use the arrows.</p>
        <Matrix>
          <Theme />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes, beside a Button of each</h2>
        <p>The control scale: as tall as a Button, as an Input, as a Select.</p>
        <Stack gap="3" data-testid="segmented-sizes">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Cluster key={size} gap="3" align="center">
              <Theme size={size} />
              <Button size={size} variant="outline">
                Button
              </Button>
            </Cluster>
          ))}
        </Stack>
      </section>

      <section>
        <h2>In a Field</h2>
        <p>The field&rsquo;s label names the group and its description describes it, as for a RadioGroup.</p>
        <div data-testid="segmented-field">
          <Field label="Billing period" description="Yearly is two months free." group>
            <SegmentedControl defaultValue="monthly" name="period">
              <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
              <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
            </SegmentedControl>
          </Field>
        </div>
      </section>

      <section>
        <h2>Icons</h2>
        <p>An icon-only segment is named by its Icon&rsquo;s label, which the Icon&rsquo;s type requires.</p>
        <div data-testid="segmented-icons">
          <SegmentedControl label="Text alignment" defaultValue="left">
            <SegmentedControlItem value="left">
              <Icon label="Align left">
                <AlignGlyph d="M3 6h18M3 12h12M3 18h16" />
              </Icon>
            </SegmentedControlItem>
            <SegmentedControlItem value="center">
              <Icon label="Align centre">
                <AlignGlyph d="M3 6h18M6 12h12M4 18h16" />
              </Icon>
            </SegmentedControlItem>
            <SegmentedControlItem value="right">
              <Icon label="Align right">
                <AlignGlyph d="M3 6h18M9 12h12M5 18h16" />
              </Icon>
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </section>

      <section>
        <h2>Vertical, and disabled</h2>
        <p>
          ButtonGroup&rsquo;s column. A disabled group still says which option is chosen; one disabled
          segment is skipped by the arrows.
        </p>
        <Cluster gap="6" align="start" data-testid="segmented-states">
          <SegmentedControl label="Density" orientation="vertical" defaultValue="comfortable">
            <SegmentedControlItem value="compact">Compact</SegmentedControlItem>
            <SegmentedControlItem value="comfortable">Comfortable</SegmentedControlItem>
            <SegmentedControlItem value="spacious">Spacious</SegmentedControlItem>
          </SegmentedControl>
          <SegmentedControl label="Plan" disabled defaultValue="team">
            <SegmentedControlItem value="solo">Solo</SegmentedControlItem>
            <SegmentedControlItem value="team">Team</SegmentedControlItem>
          </SegmentedControl>
          <SegmentedControl label="Range" defaultValue="week">
            <SegmentedControlItem value="day">Day</SegmentedControlItem>
            <SegmentedControlItem value="week">Week</SegmentedControlItem>
            <SegmentedControlItem value="month" disabled>
              Month
            </SegmentedControlItem>
            <SegmentedControlItem value="year">Year</SegmentedControlItem>
          </SegmentedControl>
        </Cluster>
      </section>

      <section>
        <h2>A form, and its reset</h2>
        <p>
          The radios submit their value. Choose another, then Reset: the browser puts the radio back,
          behind React, and the fill follows because it is painted from <code>:checked</code>.
        </p>
        <form data-testid="segmented-form">
          <Cluster gap="3" align="center">
            <SegmentedControl label="Shipping" name="shipping" defaultValue="standard">
              <SegmentedControlItem value="standard">Standard</SegmentedControlItem>
              <SegmentedControlItem value="express">Express</SegmentedControlItem>
            </SegmentedControl>
            <Button type="reset" variant="ghost">
              Reset
            </Button>
          </Cluster>
        </form>
      </section>

      <section>
        <h2>Right to left</h2>
        <div dir="rtl" data-testid="segmented-rtl">
          <SegmentedControl label="المظهر" defaultValue="light">
            <SegmentedControlItem value="system">النظام</SegmentedControlItem>
            <SegmentedControlItem value="light">فاتح</SegmentedControlItem>
            <SegmentedControlItem value="dark">داكن</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </section>
    </>
  );
}
