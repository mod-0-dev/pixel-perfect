/*
 * NO 'use client' HERE, AND THAT IS THE POINT.
 *
 * The Field page had to be a Client Component because every control on it used
 * the render prop, and a function cannot cross the server/client boundary
 * (D-037 §2). This page passes ELEMENTS — <Field label="…"><Input /></Field> —
 * which serialize fine, so a Server Component renders the whole thing even
 * though both components are 'use client'.
 *
 * That is the ordinary path working as designed, and it is the strongest
 * argument for controls reading their wiring from context instead of being
 * handed it: context has no such restriction.
 */
import { Field, Input, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function InputPage() {
  return (
    <>
      <h1>3.8 Input</h1>
      <p>
        A single-line text control on the shared control surface, wired to whatever{' '}
        <code>Field</code> is above it. It is the first component of Tier 3C, and it establishes
        the surface that <code>Textarea</code> and <code>Select</code> copy.
      </p>
      <p>
        <strong>It renders two elements, and that is a finding rather than a preference.</strong>{' '}
        RULES §1 says a block element with no width declaration fills its parent &ldquo;in every
        layout context&rdquo;. That is false for <code>&lt;input&gt;</code>, which carries an
        intrinsic inline size from the HTML <code>size</code> attribute: measured at 185px inside a
        600px parent. A grid item with auto width <em>does</em> stretch, so the root is a one-cell
        grid and no width is declared anywhere. Flexbox was measured too and does not work — a flex
        item needs <code>flex-grow</code> to stretch on its main axis.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          Height, inline padding and type all come from <code>--pp-control-*</code>, so an{' '}
          <code>Input</code> and a <code>Button</code> at the same <code>size</code> are the same
          height by construction (D-028). <code>sm</code> and <code>md</code> share a font size
          deliberately: a control gets small by losing height and padding.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <Input placeholder="you@example.com" />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns all three. <code>error</code> is the invalid state — there is no{' '}
          <code>invalid</code> prop on <code>Field</code> to contradict it — and{' '}
          <code>aria-describedby</code> is built from whichever of the description and the error
          actually rendered.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Email address" description="We only use this to sign you in." required>
              <Input type="email" placeholder="you@example.com" />
            </Field>
            <Field label="Email address" error="Enter an address we can reach you at.">
              <Input type="email" defaultValue="not-an-address" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled and read-only are different states</h2>
        <p>
          Disabled dims the text and leaves the tab order; read-only keeps the value selectable,
          focusable and submitted, and only the fill says it is not yours to change. The border
          tells them apart too, and in the direction WCAG expects: a live control&rsquo;s edge
          meets 1.4.11&rsquo;s 3:1, and a disabled one drops to the decorative step because
          inactive components are exempt from it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled" disabled>
              <Input defaultValue="you@example.com" />
            </Field>
            <Field label="Read-only">
              <Input readOnly defaultValue="you@example.com" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The precedence rule</h2>
        <p>
          An explicit prop beats the field, which beats the default — for <code>size</code>,{' '}
          <code>required</code>, <code>disabled</code> and <code>invalid</code> alike. The second
          row is the awkward half: a control that opts out of a disabled field <em>is</em> enabled,
          because &ldquo;explicit wins&rdquo; is a rule you can hold in your head and
          &ldquo;explicit wins except for disabled&rdquo; is one you have to look up.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Field is lg, control is sm" size="lg">
              <Input size="sm" placeholder="sm" />
            </Field>
            <Field label="Field is disabled, control is not" disabled>
              <Input disabled={false} placeholder="still editable" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It fills, at every container width</h2>
        <p>
          The whole point of the grid root. A long unbreakable value shrinks the control rather
          than pushing the container wide, because the control declares{' '}
          <code>min-inline-size: 0</code> and nothing declares a width.
        </p>
        <Matrix>
          <Field label="Long value" description="Nothing here overflows its cell.">
            <Input defaultValue="a-very-long-unbreakable-value-string-that-would-overflow" />
          </Field>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1, spec §12).
       *
       * The Matrix renders its subtree six times, so any hardcoded id exists
       * six times and `for` binds to whichever copy is first in the document.
       * Field derives its ids from useId(), so the examples above are safe —
       * but `controlId` names an id by hand and brings the collision straight
       * back. This is the one place it is demonstrated, where the id is unique,
       * and it is what the browser assertion reads an accessible name from.
       */}
      <section>
        <h2>An explicit control id</h2>
        <Text>
          <code>controlId</code> wires both sides — the label&rsquo;s <code>for</code> and the
          control&rsquo;s <code>id</code> — which is why it exists rather than callers setting{' '}
          <code>id</code> on the control and silently unpointing the label (D-037 §1). It is
          outside the Matrix on purpose: a named id rendered six times names five wrong controls.
        </Text>
        <div data-testid="input-association">
          <Field label="Billing email" controlId="billing-email">
            <Input type="email" />
          </Field>
        </div>
      </section>
    </>
  );
}
