/*
 * A Server Component, like the Input and Textarea pages — and here it is also a
 * claim being tested. `Checkbox` is `'use client'`, and an RSC page renders it
 * by passing ELEMENTS to `Field` rather than a render prop, because elements
 * serialize across the boundary and functions do not (D-037 §2).
 *
 * The one interactive demo is a client island in `SelectAll.tsx`, so this page
 * never becomes a client component to get it.
 */
import { Checkbox, Cluster, Field, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { SelectAll } from './SelectAll';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function CheckboxPage() {
  return (
    <>
      <h1>3.10 Checkbox</h1>
      <p>
        A binary or tri-state checkbox, painted by us and operated by the browser. The native{' '}
        <code>&lt;input type=&quot;checkbox&quot;&gt;</code> <em>is</em> the painted box —{' '}
        <code>appearance: none</code> and styled directly, with the mark as an{' '}
        <code>aria-hidden</code> sibling stacked over it. Not a hidden input behind a{' '}
        <code>div role=&quot;checkbox&quot;</code>, which has to rebuild <code>:checked</code>,{' '}
        <code>:indeterminate</code>, label-click, Space, form reset, autofill and the accessibility
        tree — and rebuilds them incompletely.
      </p>
      <p>
        It renders no label of its own. That is <code>Field</code>&rsquo;s job, and a{' '}
        <code>Checkbox</code> with a <code>label</code> prop would be a second, worse{' '}
        <code>Field</code> — one that owns no description, no error and no{' '}
        <code>aria-describedby</code>.
      </p>

      <section>
        <h2>Sizes — 16 / 20 / 24</h2>
        <p>
          The <code>--pp-size-*</code> scale, not <code>--pp-control-height-*</code>. A checkbox is
          not a control surface with a height; it is a box, and it is square at every size. Its{' '}
          <code>inline-size</code> is a restatement of its block size rather than a decision about
          the parent, which is the D-019 exemption <code>Icon</code> and <code>Spinner</code>{' '}
          already hold.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size} orientation="horizontal">
                <Checkbox defaultChecked />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Three states, and only two a user can reach</h2>
        <p>
          <code>data-state</code> is <code>unchecked</code>, <code>checked</code> or{' '}
          <code>indeterminate</code> — the RULES §4 vocabulary, tracking <code>aria-checked</code>,
          which is the boundary D-030 §5 drew against <code>Toggle</code>&rsquo;s{' '}
          <code>on</code> / <code>off</code>. Clicking an indeterminate box produces{' '}
          <code>true</code>, never <code>&apos;indeterminate&apos;</code>: the third state is a
          summary of other checkboxes, not a value anyone picks.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Unchecked" orientation="horizontal">
              <Checkbox />
            </Field>
            <Field label="Checked" orientation="horizontal">
              <Checkbox defaultChecked />
            </Field>
            <Field label="Indeterminate" orientation="horizontal">
              <Checkbox defaultChecked="indeterminate" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns all three. Focus draws two things: one ring colour library-wide outside
          the box, and a tone-shifted border inside it — so an invalid checkbox stays visibly
          invalid while the user is fixing it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field
              label="Email me about releases"
              description="About once a month."
              orientation="horizontal"
              required
            >
              <Checkbox />
            </Field>
            <Field
              label="I accept the terms"
              error="You have to accept the terms to continue."
              orientation="horizontal"
            >
              <Checkbox />
            </Field>
            <Field label="Accepted, and still wrong" error="Re-accept the new terms." orientation="horizontal">
              <Checkbox defaultChecked />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled</h2>
        <p>
          A disabled checked box is grey rather than solid: the state the user can do nothing about
          should not be the loudest thing in the form. The <code>cursor</code> says so too, and{' '}
          <code>pointer-events: none</code> is deliberately not used — it would kill{' '}
          <code>title</code> and break a <code>Tooltip</code> wrapping the control.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled, unchecked" orientation="horizontal" disabled>
              <Checkbox />
            </Field>
            <Field label="Disabled, checked" orientation="horizontal" disabled>
              <Checkbox defaultChecked />
            </Field>
            <Field label="Disabled, indeterminate" orientation="horizontal" disabled>
              <Checkbox defaultChecked="indeterminate" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It hugs, at every container width</h2>
        <p>
          The box is the same 20px in a 240px sidebar and a 960px page. A <code>fill</code> control
          would stretch into the <code>Field</code> column and become an oblong; this one is
          intrinsically sized. It does not shrink in a non-wrapping <code>Cluster</code> either,
          and that comes free: a flex item&rsquo;s automatic minimum size is its content&rsquo;s,
          and this one&rsquo;s content is an <code>&lt;input&gt;</code> with a definite{' '}
          <code>inline-size</code>. <code>Icon</code> needs a <code>flex-shrink: 0</code> here and{' '}
          <code>Checkbox</code> does not, because an SVG at <code>100%</code> contributes nothing
          to a min-content measurement and a real length contributes all of it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="A label long enough to take the whole column and then wrap onto a second line" orientation="horizontal">
              <Checkbox defaultChecked />
            </Field>
            {/* wrap={false} on purpose: a WRAPPING Cluster never squeezes
                anything — it just puts the neighbour on the next line — so a
                demo built on the default would be a squeeze test with no
                squeeze in it. */}
            <Cluster gap="1" align="center" wrap={false}>
              <Checkbox aria-label="In a tight cluster" defaultChecked />
              <Text size="sm">
                An unbreakable neighbour: a-very-long-value-string-that-squeezes-the-row
              </Text>
            </Cluster>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Spacing is how an undersized target passes WCAG 2.5.8</h2>
        <p>
          The boxes are 16 / 20 / 24, so <code>sm</code> and <code>md</code> are under SC
          2.5.8&rsquo;s 24×24 minimum. They conform through the <strong>spacing exception</strong> —
          a 24px circle centred on each target does not intersect its neighbour&rsquo;s — which,
          unlike the &ldquo;the label is part of the target&rdquo; argument, does not depend on a
          label existing. Stacked at <code>gap=&quot;3&quot;</code> the centres are 28px apart at{' '}
          <code>sm</code>; at <code>gap=&quot;2&quot;</code> they would be exactly 24px, which is
          tangent circles and an argument with an auditor rather than a pass. This is the same
          geometry that makes <code>RadioGroup</code>&rsquo;s <code>gap</code> default{' '}
          <code>&quot;3&quot;</code> (D-039 §4).
        </p>
        <Matrix>
          <Stack gap="3">
            <Checkbox size="sm" aria-label="First" defaultChecked />
            <Checkbox size="sm" aria-label="Second" />
            <Checkbox size="sm" aria-label="Third" />
          </Stack>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1, spec §12).
       *
       * Everything below writes an id by hand. The harness renders its subtree
       * six times, so an id inside a cell exists six times and `for` binds to
       * whichever copy is first in the document — five of six labels would then
       * name a control in another cell. Appearance goes in the matrices;
       * association goes here.
       */}
      <section>
        <h2>Select all — what the third state is for</h2>
        <Text>
          The parent computes <code>&apos;indeterminate&apos;</code> from its children and hands it
          down; the checkbox never produces it. Clicking the mixed box selects everything, because
          that is what the platform does and what this UI wants.
        </Text>
        <div data-testid="checkbox-select-all">
          <SelectAll />
        </div>
      </section>

      <section>
        <h2>The mark is not a hole in the target</h2>
        <Text>
          The indicator is <code>pointer-events: none</code>, so a click landing on the check hits
          the input beneath it. Without that, the middle of a checked box is dead and the control
          only works at its edges — which reads as flakiness rather than as a bug.
        </Text>
        <div data-testid="checkbox-mark-target">
          <Field label="Click the check itself" orientation="horizontal" controlId="mark-target">
            <Checkbox defaultChecked size="lg" />
          </Field>
        </div>
      </section>
    </>
  );
}
