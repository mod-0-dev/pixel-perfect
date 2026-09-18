import { Button, Cluster, Container, Label, Stack, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';

const SIZES = ['sm', 'md', 'lg'] as const;

/** What Checkbox (3.10) will set on its own root. Custom properties inherit. */
const clickableRow = { '--pp-label-cursor': 'pointer' } as CSSProperties;

/**
 * Input (3.8) does not exist yet, so the association demo below uses bare
 * <input>s. It is rendered ONCE, outside the Matrix, and that is not an
 * oversight: the Matrix renders the same subtree six times, so any `id` inside
 * it appears six times, and `for` resolves to the first match in the document —
 * which would silently associate five of the six labels with a control in
 * another cell. Appearance is demonstrated in the matrices; association is
 * demonstrated here, where the ids are unique.
 */

export default function LabelPage() {
  return (
    <>
      <h1>3.6 Label</h1>
      <p>
        The visible name of a form control. It is the smallest component in Tier 3 and the one with
        the most callers: every input in 3C reaches it through <code>Field</code> (3.7). It does not
        generate ids — <code>useId</code> is <code>Field</code>&rsquo;s job — and it is not a
        caption. A <code>&lt;label&gt;</code> pointing at nothing claims a relationship the page
        does not have; that is <code>Text</code>.
      </p>

      <section>
        <h2>The label rides the control scale, not the text scale</h2>
        <p>
          <code>size</code> reads <code>--pp-control-font-size-*</code>, the same token the control
          beside it reads, so a label and its input agree by construction rather than by vigilance
          (D-034). Each row pairs a <code>Label</code> with a <code>Button</code> of the same size:
          the two type sizes are identical, and the visual regression checks exactly that.
        </p>
        <Matrix>
          <Stack gap="4">
            {SIZES.map((size) => (
              <Stack key={size} gap="1">
                <Label size={size}>Email address</Label>
                <Cluster gap="2" align="center">
                  <Button size={size}>{size}</Button>
                </Cluster>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>sm and md are the same size, deliberately</h2>
        <p>
          <code>--pp-control-font-size-sm</code> and <code>-md</code> are both{' '}
          <code>--pp-font-size-2</code>. A control gets small by losing height and padding, which is
          what &ldquo;small&rdquo; means for a control; a 12px label is not a smaller label, it is a
          worse one. <code>lg</code> is the only step that moves.
        </p>
        <Matrix>
          <Stack gap="2">
            <Label size="sm">Small — Port</Label>
            <Label size="md">Medium — Port</Label>
            <Label size="lg">Large — Port</Label>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Required: one asterisk, announced once</h2>
        <p>
          The indicator is a real <code>&lt;span aria-hidden&gt;</code>, not a pseudo-element and
          not visually-hidden text. The control carries <code>required</code>, so assistive tech
          hears the state from the control and the glyph is visual reinforcement — the accessible
          name of the field below is &ldquo;Postal address for delivery confirmation&rdquo;, with no
          star in it. The indicator is separated by <code>padding-inline-start</code> rather than a
          space character, so there is no break opportunity and a wrapping label cannot orphan its
          asterisk onto a line of its own. Watch the 240px cell.
        </p>
        <Matrix>
          <Stack gap="3">
            <Label required>Email address</Label>
            <Label required>Postal address for delivery confirmation</Label>
            <Label size="sm" required>
              Port
            </Label>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled dims; invalid changes nothing</h2>
        <p>
          <code>invalid</code> sets <code>data-invalid</code> and is styled by nobody. A field in
          error already has a red border, a red message and <code>aria-invalid</code> on the
          control. A red label is the fourth shout and the only one that is pure colour. The
          attribute is there so you can disagree in one selector.
        </p>
        <Matrix>
          <Stack gap="3">
            <Label>Resting</Label>
            <Label disabled>Disabled — the control carries the real state</Label>
            <Label invalid>Invalid — identical, on purpose</Label>
            <Label disabled required>
              Disabled and required
            </Label>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>A long label wraps. It is never truncated</h2>
        <p>
          <code>fill</code>: block-level, no width declaration, <code>min-inline-size: 0</code>,
          with <code>overflow-wrap: anywhere</code> so a single long token cannot force its
          container to scroll. A <em>button</em> label that needs wrapping needs to be shorter; a
          form label often cannot be shorter without becoming wrong, and one the user cannot read in
          full is a field they cannot fill in correctly.
        </p>
        <Matrix>
          <Label>Registered business address, including any unit or suite number</Label>
        </Matrix>
      </section>

      <section>
        <h2>Association, click-to-focus, and the cursor</h2>
        <p>
          Rendered once, with unique ids — see the note in the source. The{' '}
          <code>&lt;label&gt;</code> element is the whole component: clicking anywhere on it moves
          focus to its control, and the accessible name of the second field is &ldquo;Postal address
          for delivery confirmation&rdquo;, with no star in it, because the glyph is{' '}
          <code>aria-hidden</code> and the <code>required</code> state is announced by the control.
        </p>
        <p>
          <code>Label</code> declares <code>cursor: var(--pp-label-cursor, inherit)</code> and
          nothing else. Pointer is right for a checkbox row and wrong for a block label above a text
          input, so <code>Checkbox</code>, <code>Radio</code> and <code>Switch</code> will set{' '}
          <code>--pp-label-cursor: pointer</code> on their own root and let it inherit — the same
          mechanism as the tone context (D-007), and no <code>.pp-checkbox .pp-label</code> selector
          ever has to exist. The first row below sets it by hand, standing in for the component that
          does not exist yet.
        </p>
        <Stack gap="4">
          <Cluster gap="2" align="center" style={clickableRow}>
            <input id="terms" type="checkbox" />
            <Label htmlFor="terms">I accept the terms — pointer, set by the row</Label>
          </Cluster>

          <Stack gap="1">
            <Label htmlFor="assoc-email">Email address — no pointer</Label>
            <input id="assoc-email" type="email" />
            <Text size="sm" tone="muted">
              A block label spans the row, so clicking the empty space to its right still focuses
              the control. Correct for a field, and the reason Checkbox puts its label in a row
              beside the box rather than letting it span.
            </Text>
          </Stack>

          <Stack gap="1">
            <Label htmlFor="assoc-long" required>
              Postal address for delivery confirmation
            </Label>
            <input id="assoc-long" required />
          </Stack>

          <Stack gap="1">
            <Label htmlFor="assoc-disabled" disabled>
              Tax ID — disabled
            </Label>
            <input id="assoc-disabled" disabled />
            <Text size="sm" tone="muted">
              The label is dimmed but carries no ARIA state. A <code>&lt;label&gt;</code> is not a
              widget, and a disabled control cannot take focus, so clicking this already does
              nothing.
            </Text>
          </Stack>
        </Stack>
      </section>

      <section>
        <h2>It has no opinion about its own width</h2>
        <p>
          To constrain one, wrap it — <code>Container</code> is the only component in the library
          allowed to set a maximum inline size.
        </p>
        <Matrix>
          <Container size="sm">
            <Label>Constrained by its parent, not by itself</Label>
          </Container>
        </Matrix>
      </section>
    </>
  );
}
