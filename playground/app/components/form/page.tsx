/*
 * `Form` is a client component (spec §5: a ref and an effect move focus), and
 * this page is a Server Component rendering it directly — `errors` is plain
 * data, so it crosses the boundary. The two interactive demos are client
 * components because their callers hold state.
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID — the harness renders its subtree six
 * times (D-035 §1). So the Matrix forms' summaries point at targets that do not
 * exist, which is the honest state of a summary with nothing to link to; the
 * links that must work are in the demos below the matrices, which are rendered
 * once.
 *
 * EVERY FORM HERE THAT MOUNTS WITH ERRORS FOCUSES ITS SUMMARY (spec §5, third
 * row) — so on load, focus is on the last one. That is the behaviour being
 * demonstrated, not an accident of the page.
 */
import { Button, Cluster, Field, Form, Heading, Input, type FormError } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { SignUp } from './SignUp';
import { WithAction } from './WithAction';

const MATRIX_ERRORS: FormError[] = [
  { target: 'matrix-name', message: 'Enter your name' },
  { target: 'matrix-email', message: 'Enter an email address, like name@example.com' },
];

const ROUND_TRIP_ERRORS: FormError[] = [
  { target: 'roundtrip-email', message: 'Enter an email address' },
];

export default function FormPage() {
  return (
    <>
      <h1>3.16 Form</h1>
      <p>
        A <code>&lt;form&gt;</code> that summarises the errors the app already found, as links that
        move focus to each field, and refuses a second submission while the first is pending. It
        does not validate and it holds no values.
      </p>

      <section>
        <h2>fill — the summary, the fields, the gap</h2>
        <p>
          A flex column with <code>gap=&quot;5&quot;</code>. The summary is an <code>Alert</code>{' '}
          in the danger tone and is always the first child. Its links are{' '}
          <code>tone=&quot;danger&quot;</code>, because <code>Link</code> defaults to accent and
          accent text on danger&apos;s step 3 is a pairing nothing asserts.
        </p>
        <Matrix>
          <Form errors={MATRIX_ERRORS} aria-label="Matrix form">
            <Field label="Name" error="Enter your name" required>
              <Input />
            </Field>
            <Field label="Email" error="Enter an email address, like name@example.com" required>
              <Input type="email" />
            </Field>
            <Cluster>
              <Button type="submit">Continue</Button>
            </Cluster>
          </Form>
        </Matrix>
      </section>

      <section>
        <h2>A title with heading semantics</h2>
        <p>
          <code>errorTitle</code> is a <code>ReactNode</code>, so a <code>Heading</code> makes the
          summary a section of the document. The default is a <code>&lt;div&gt;</code>.
        </p>
        <Matrix>
          <Form
            errors={MATRIX_ERRORS.slice(0, 1)}
            errorTitle={
              <Heading level={2} size="sm">
                1 problem
              </Heading>
            }
            aria-label="Titled form"
          >
            <Field label="Name" error="Enter your name">
              <Input />
            </Field>
          </Form>
        </Matrix>
      </section>

      <section>
        <h2>Demo — validate on submit, on blur, and slowly</h2>
        <p>
          Submit it empty: focus moves to the summary. Follow a link: focus moves to the control,
          with its field scrolled into view. Leave <em>Nickname</em> with one letter in it: an error
          appears and focus stays where you put it. Tick <em>Slow server</em> and press Enter twice:
          one submission.
        </p>
        <SignUp />
      </section>

      <section>
        <h2>Demo — a React 19 action</h2>
        <p>
          <code>pending</code> comes from <code>useActionState</code>. React does not dispatch an
          action for a submit whose default was prevented, so pressing Enter twice calls it once.
        </p>
        <WithAction />
      </section>

      <section>
        <h2>Round trip — mounted with errors</h2>
        <p>
          What a no-JavaScript submission, or a server action&apos;s full-page response, comes back
          as. The link is a real <code>href</code>, so it works before hydration and without
          JavaScript at all.
        </p>
        <Form errors={ROUND_TRIP_ERRORS} aria-label="Round trip" data-demo="roundtrip">
          <Field label="Email" controlId="roundtrip-email" error="Enter an email address">
            <Input type="email" />
          </Field>
        </Form>
      </section>
    </>
  );
}
