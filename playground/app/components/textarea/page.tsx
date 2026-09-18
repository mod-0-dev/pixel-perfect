/*
 * A Server Component, like the Input page and for the same reason: this passes
 * ELEMENTS to Field rather than a render prop, and elements serialize across the
 * boundary where functions do not (D-037 §2). Both components are 'use client'
 * and neither forces this page to be.
 */
import { Field, Input, Stack, Text, Textarea } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const SIZES = ['sm', 'md', 'lg'] as const;

const LONG =
  'Auto-resize measures scrollHeight on every input and writes block-size, ' +
  'which means the control grows as this sentence wraps onto more and more ' +
  'lines instead of turning into a little scrolling window onto its own value.';

export default function TextareaPage() {
  return (
    <>
      <h1>3.9 Textarea</h1>
      <p>
        A multi-line text control on the same surface as <code>Input</code>, with opt-in
        auto-resize. Not a rich-text editor and not a code editor — 5.12 is <code>CodeBlock</code>,
        and it is read-only.
      </p>
      <p>
        It is two elements for the reason <code>Input</code> is two: a <code>&lt;textarea&gt;</code>{' '}
        measured 182px inside a 600px parent, because form controls carry an intrinsic inline size
        and RULES §1&rsquo;s &ldquo;a block element with no width declaration already fills its
        parent&rdquo; is false for them (D-040). The block axis is a different question, and RULES
        §1 does not govern it: <code>rows</code> stays, and <code>autoResize</code> writes{' '}
        <code>block-size</code> from JavaScript.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          Type and inline padding come from <code>--pp-control-*</code>. The vertical padding is{' '}
          <em>derived</em> from the same tokens — <code>(height − line box − borders) / 2</code> —
          rather than picked off the space scale, because the scale cannot express the 10.2px that{' '}
          <code>lg</code> needs, and approximating it would make the large control the one that
          visibly disagrees with the <code>Button</code> beside it.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <Textarea placeholder="Say something" />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>One row is exactly an Input</h2>
        <p>
          The payoff of deriving the padding, and the block-axis half of D-028: a{' '}
          <code>Textarea</code> with <code>rows=&#123;1&#125;</code> is the same height as an{' '}
          <code>Input</code> at the same size, by construction rather than by anyone checking.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Stack key={size} gap="2">
                <Field label={`Input ${size}`} size={size}>
                  <Input placeholder="input" />
                </Field>
                <Field label={`Textarea ${size}`} size={size}>
                  <Textarea rows={1} resize="none" placeholder="textarea" />
                </Field>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns all three, exactly as it does for <code>Input</code>. Focus draws two
          things: one ring colour library-wide outside the box, and a tone-shifted border inside it
          — so an invalid control stays visibly invalid while the user is fixing it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Release notes" description="Markdown is supported." required>
              <Textarea placeholder="What changed?" />
            </Field>
            <Field label="Release notes" error="Say what changed before publishing.">
              <Textarea defaultValue="wip" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled and read-only are different states</h2>
        <p>
          Disabled dims the text and leaves the tab order; read-only keeps the value selectable,
          focusable and submitted, and only the fill says it is not yours to change.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled" disabled>
              <Textarea defaultValue="Frozen while the form is saving." />
            </Field>
            <Field label="Read-only">
              <Textarea readOnly defaultValue="Published notes cannot be edited." />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Resize, and why there is no horizontal</h2>
        <p>
          <code>vertical</code> by default, <code>none</code> on request. There is no{' '}
          <code>horizontal</code> and no <code>both</code>: a user-widened textarea overflows the{' '}
          <code>Field</code> grid column and takes the layout with it, which is the one thing the
          sizing contract exists to prevent — handed to the end user as a drag handle.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Vertical (default)">
              <Textarea defaultValue="Drag the corner." />
            </Field>
            <Field label="None">
              <Textarea resize="none" defaultValue="No handle at all." />
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
            <Textarea defaultValue="a-very-long-unbreakable-value-string-that-would-overflow" />
          </Field>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1, spec §12).
       *
       * Two things live here rather than in a cell. `controlId` names an id by
       * hand, and the Matrix renders its subtree six times — six copies of one
       * id, with `for` binding to whichever is first, so five labels would name
       * a control in another cell.
       *
       * Auto-resize is here for a different reason: it is asserted by TYPING
       * into it and watching the height change, and a test that types needs one
       * unambiguous target rather than six identical ones.
       */}
      <section>
        <h2>Auto-resize</h2>
        <Text>
          Opt-in. It grows with the content and never shrinks below <code>rows</code>, because the
          measurement resets the height to <code>auto</code> first and <code>scrollHeight</code>{' '}
          cannot report less than the element&rsquo;s own <code>rows</code>-based height. It forces{' '}
          <code>resize: none</code>: a drag handle and a JS-written height fight each other, and
          the user loses.
        </Text>
        <div data-testid="textarea-auto-resize">
          <Field label="Release notes" controlId="release-notes" description="Grows as you type.">
            <Textarea autoResize rows={2} />
          </Field>
        </div>
      </section>

      <section>
        <h2>A fixed-height control for comparison</h2>
        <Text>
          The same field without <code>autoResize</code>. Its height is <code>rows</code> and stays
          there; the value scrolls inside it.
        </Text>
        <div data-testid="textarea-fixed">
          <Field label="Fixed notes" controlId="fixed-notes">
            <Textarea rows={2} defaultValue={LONG} />
          </Field>
        </div>
      </section>
    </>
  );
}
