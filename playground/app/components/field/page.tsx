'use client';

/*
 * 'use client' is REQUIRED on this page, and it is a finding rather than a
 * formality. Every control here uses Field's render prop, and a function cannot
 * cross the server/client boundary: a Server Component passing `children` as a
 * function to a Client Component fails the build outright with "Functions
 * cannot be passed directly to Client Components".
 *
 * The ordinary path is unaffected — <Field label="…"><Input /></Field> passes
 * an ELEMENT, which serializes fine, and that is exactly why controls read
 * their wiring from context instead of being handed it.
 */
import { Container, Field, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function FieldPage() {
  return (
    <>
      <h1>3.7 Field</h1>
      <p>
        A labelled control with its description, its error, and the ARIA relationships between them
        — wired once here instead of eleven times by hand. Eleven components compose into it, so
        every API mistake here is made eleven more times.
      </p>
      <p>
        Every control on this page is a bare <code>&lt;input&gt;</code> spread with the render prop
        — on purpose, even though <code>Input</code> (3.8) exists. This page demonstrates the
        escape hatch: a control the library does not own gets exactly the wiring the library&rsquo;s
        own controls get. The <code>Input</code>, <code>Textarea</code> and <code>Checkbox</code>{' '}
        pages show the ordinary path.
      </p>
      <p>
        <strong>And it is why this page is a Client Component.</strong> A function cannot cross the
        server/client boundary, so a Server Component passing a render prop to <code>Field</code>{' '}
        fails the build with <em>&ldquo;Functions cannot be passed directly to Client
        Components&rdquo;</em>. The ordinary path is unaffected: <code>&lt;Field
        label=&quot;…&quot;&gt;&lt;Input /&gt;&lt;/Field&gt;</code> passes an <em>element</em>, which
        serializes fine — and that is precisely why controls read their wiring from context rather
        than being handed it.
      </p>
      <p>
        <strong>Note what is not needed here.</strong> The <code>Label</code> page had to
        demonstrate association outside the Matrix, because six copies of one <code>id</code> break
        five of them (D-035). <code>Field</code> renders inside the Matrix safely: it derives every
        id from its own <code>useId()</code>, so six copies are six distinct fields. Pass{' '}
        <code>controlId</code> explicitly and the collision comes back — which is the price of
        naming an id by hand, and the reason it is not the default.
      </p>

      <section>
        <h2>Label, description, control</h2>
        <p>
          The description sits above the control: it is the instruction you need before you type.
          The control is a grid cell, so a <code>fill</code> control fills the column it is given.
        </p>
        <Matrix>
          <Field label="Email address" description="We only use this for receipts.">
            {(control) => <input className="demo-input" type="email" {...control} />}
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>Required, and invalid</h2>
        <p>
          One prop marks the label and the control. The error node is both the message and the
          state: there is no <code>invalid</code> prop to contradict it, and{' '}
          <code>error=&quot;&quot;</code> is a valid field rather than an empty message. The error
          carries <code>data-pp-tone=&quot;danger&quot;</code>, so its colour comes from the tone
          ramp rather than from this stylesheet naming a hue.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field label="Email address" required description="We only use this for receipts.">
              {(control) => <input className="demo-input" type="email" {...control} />}
            </Field>
            <Field
              label="Email address"
              required
              description="We only use this for receipts."
              error="Enter an email address in the format name@example.com"
            >
              {(control) => <input className="demo-input" type="email" {...control} />}
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The description and the error are the label&rsquo;s type size</h2>
        <p>
          Distinguished by colour and weight, never by shrinking (D-034 continued). The control
          scale has no step below <code>--pp-font-size-2</code> on purpose, and an error message is
          the single most important string in a failed form — setting it in the smallest type on the
          page is exactly backwards. The visual regression asserts all three are equal.
        </p>
        <Matrix>
          <Stack gap="5">
            {SIZES.map((size) => (
              <Field
                key={size}
                size={size}
                label={`Size ${size}`}
                description="Description text."
                error="Error text."
              >
                {(control) => <input className="demo-input" {...control} />}
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Horizontal — the checkbox arrangement</h2>
        <p>
          The control comes first in the <em>DOM</em>, not only in the layout, so reading order
          matches visual order without relying on <code>order</code> to fix it up. The description
          and the error sit under both, in the label&rsquo;s column.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field
              label="Email me about new releases"
              orientation="horizontal"
              description="About once a month. Unsubscribe any time."
            >
              {(control) => <input type="checkbox" {...control} />}
            </Field>
            <Field
              label="I accept the terms"
              orientation="horizontal"
              required
              error="You must accept the terms to continue"
            >
              {(control) => <input type="checkbox" {...control} />}
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>A group, for controls that are not labelable</h2>
        <p>
          A <code>role=&quot;radiogroup&quot;</code> cannot be the target of <code>for</code>, so{' '}
          <code>group</code> switches the wiring to <code>aria-labelledby</code>. The label element
          does not change — it is still a <code>&lt;label&gt;</code>, just without a{' '}
          <code>for</code>, which axe accepts and which is a perfectly good name source.{' '}
          <code>&lt;fieldset&gt;</code>/<code>&lt;legend&gt;</code> was rejected as a layout trap.
        </p>
        <Matrix>
          <Field label="Delivery speed" group description="Express is not available everywhere.">
            {(control) => (
              <div role="radiogroup" className="stack-tight" {...control}>
                <label className="row-tight">
                  <input type="radio" name="speed" defaultChecked /> Standard
                </label>
                <label className="row-tight">
                  <input type="radio" name="speed" /> Express
                </label>
              </div>
            )}
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>labelHidden hides the label. It does not remove it</h2>
        <p>
          The <code>Label</code> is wrapped in <code>VisuallyHidden</code> with{' '}
          <code>asChild</code>, so the label element itself is hidden rather than a wrapper around
          it. The element, its <code>for</code> and the accessible name are all still there — which
          is the entire difference between a hidden label and a missing one.
        </p>
        <Matrix>
          <Field label="Search orders" labelHidden>
            {(control) => (
              <input className="demo-input" type="search" placeholder="Search orders" {...control} />
            )}
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>Long text wraps. Nothing is truncated</h2>
        <p>
          A message the user cannot read in full is a message that did not arrive. Watch the 240px
          cell.
        </p>
        <Matrix>
          <Field
            label="Registered business address, including any unit or suite number"
            description="We check this against your incorporation record, so it has to match exactly."
            error="This address could not be verified. Check the unit number and try again."
          >
            {(control) => <input className="demo-input" {...control} />}
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>A form is a Stack of Fields in a Container</h2>
        <p>
          <code>Field</code> sizes nothing. The measure is <code>Container</code>&rsquo;s job one
          level up, and the rhythm between fields is the <code>Stack</code>&rsquo;s — exactly as
          RULES §1 and §2 require. There is no <code>gap</code> prop on <code>Field</code> and no
          width anywhere in this markup.
        </p>
        <Matrix>
          <Container size="sm">
            <Stack gap="5">
              <Field label="Full name">
                {(control) => <input className="demo-input" {...control} />}
              </Field>
              <Field label="Email address" required description="We only use this for receipts.">
                {(control) => <input className="demo-input" type="email" {...control} />}
              </Field>
              <Field label="Tax ID" disabled description="Only for business accounts.">
                {(control) => <input className="demo-input" {...control} />}
              </Field>
            </Stack>
          </Container>
        </Matrix>
        <Text size="sm" tone="muted">
          The disabled field dims its label and disables its control from one prop. A control that
          sets its own <code>disabled</code> wins over the field either way — explicit beats
          context, for size, required and disabled alike.
        </Text>
      </section>
    </>
  );
}
