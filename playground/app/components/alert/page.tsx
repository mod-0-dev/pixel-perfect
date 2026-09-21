/*
 * A Server Component, and here that is a claim being tested: `Alert` has no
 * `'use client'` directive, so an RSC page must be able to render it directly.
 * Only the dismissible example is a client component, because `onDismiss` is a
 * function and functions do not cross the boundary.
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID — the harness renders its subtree six
 * times (D-035 §1).
 */
import { Alert, Button, Cluster, Heading, Link, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Dismissible } from './Dismissible';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;

/** Three caller-supplied glyphs. The library ships none of its own (spec §5). */
function InfoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function WarningGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default function AlertPage() {
  return (
    <>
      <h1>5.2 Alert</h1>
      <p>
        A bordered, tone-coloured block that says something happened, or something is true, about
        the region of the page it sits in. It does not float, stack, queue or time out — that is{' '}
        <code>Toast</code> (4.12) — and it does not hide itself.
      </p>
      <p>
        <strong>The name is the trap.</strong> <code>role=&quot;alert&quot;</code> is an assertive
        live region: it interrupts whatever the screen reader is saying. It is opt-in here, through{' '}
        <code>live</code>, and the default is no live region at all — a live region announces{' '}
        <em>changes</em> to a region that already existed, and an alert in the initial HTML has no
        change to announce.
      </p>

      <section>
        <h2>Tone — the only axis</h2>
        <p>
          There is no <code>variant</code>, and the rejections were measured rather than argued. An{' '}
          <code>Alert</code> is the only component whose children are arbitrary, so the tone context
          inherits into whatever the caller puts inside; a <code>solid</code> fill would put a{' '}
          <code>plain</code> <code>Button</code> and a <code>Link</code> at 1.04:1 in the light
          theme. The fill is <code>--pp-tone-bg</code> and the edge is{' '}
          <code>--pp-tone-border</code>, both pairings the token layer already asserts.
        </p>
        <Matrix>
          <Stack gap="3">
            {TONES.map((tone) => (
              <Alert key={tone} tone={tone} title={`Tone ${tone}`}>
                The sentence says what happened. The colour only agrees with it.
              </Alert>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Anatomy — every part is optional but the box</h2>
        <p>
          Icon, title, body and dismiss are four independent slots. An absent slot renders no
          element at all, so it costs no gap.
        </p>
        <Matrix>
          <Stack gap="3">
            <Alert tone="danger">Body only. The commonest alert there is.</Alert>
            <Alert tone="success" title="Saved" />
            <Alert tone="warning" icon={<WarningGlyph />} title="Payment method expires soon">
              Your card ending 4242 expires next month.
            </Alert>
            <Alert tone="accent" icon={<InfoGlyph />}>
              An icon with no title. The glyph sits on the first line of the body.
            </Alert>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>fill — it takes the column it is given</h2>
        <p>
          No <code>width</code> declaration anywhere in <code>Alert.css</code>, so the box is its
          parent&rsquo;s width in all three cells. Constraining it is <code>Container</code>&rsquo;s
          job, never a prop.
        </p>
        <Matrix>
          <Alert tone="neutral" icon={<InfoGlyph />} title="Same component, three widths">
            The text rewraps; the box does what its parent says.
          </Alert>
        </Matrix>
      </section>

      <section>
        <h2>Arbitrary children, and the tone they inherit</h2>
        <p>
          Actions are <code>children</code> spaced by a layout primitive, not an{' '}
          <code>actions</code> prop. The <code>Button</code>s below carry{' '}
          <code>tone=&quot;warning&quot;</code> deliberately: inside the inherited context that is
          the natural thing to write, and it is exactly the combination a <code>solid</code> alert
          would have made invisible.
        </p>
        <Matrix>
          <Alert tone="warning" icon={<WarningGlyph />} title="Payment method expires soon">
            <Stack gap="3">
              <Text>
                Your card ending 4242 expires next month.{' '}
                <Link href="#billing" tone="warning">
                  Review billing
                </Link>
                .
              </Text>
              <Cluster gap="2">
                <Button size="sm" tone="warning">
                  Update card
                </Button>
                <Button size="sm" variant="plain" tone="warning">
                  Remind me later
                </Button>
              </Cluster>
            </Stack>
          </Alert>
        </Matrix>
      </section>

      <section>
        <h2>Dismissal — the caller owns the unmount</h2>
        <p>
          <code>onDismiss</code> reports the intent; it does not hide anything. The component holds
          no state, which is what keeps it a Server Component and what keeps a dismissed banner
          something the app can remember.
        </p>
        <p>
          Both examples below live in a client component, and that is not incidental:{' '}
          <code>onDismiss</code> reaches <code>IconButton</code>, which is{' '}
          <code>&apos;use client&apos;</code>, and a function cannot cross that boundary.
          Everything else on this page is rendered by the Server Component page itself.
        </p>
        <Matrix>
          <Dismissible />
        </Matrix>
      </section>

      <section>
        <h2>Heading semantics are opted into</h2>
        <p>
          <code>title</code> renders a <code>&lt;div&gt;</code>: the right level is <code>h2</code>{' '}
          in a page banner and <code>h3</code> inside a card, and the component knows neither. Pass
          a <code>Heading</code> when the alert really is a section of the document.
        </p>
        <Matrix>
          <Alert tone="danger" title={<Heading level={3} size="sm">3 problems</Heading>}>
            Fix them and submit again.
          </Alert>
        </Matrix>
      </section>

      <section>
        <h2>min-inline-size: 0, and what it is for</h2>
        <p>
          The body is a flex item that may shrink to nothing, so an unbreakable string overflows
          the <em>text</em> rather than pushing the box past its parent. Watch the narrow cell.
        </p>
        <Matrix>
          <Alert tone="neutral" icon={<InfoGlyph />} title="A URL nobody can break">
            https://example.com/a/very/long/path/that/has/no/break/opportunity/anywhere/in/it
          </Alert>
        </Matrix>
      </section>

      <section>
        <h2>Live regions</h2>
        <p>
          <code>live=&quot;polite&quot;</code> is <code>role=&quot;status&quot;</code> and{' '}
          <code>live=&quot;assertive&quot;</code> is <code>role=&quot;alert&quot;</code>. Neither
          changes a pixel — they are assistive-technology affordances with no visual form, which is
          why they are in the same screenshot as everything else and look identical.
        </p>
        <Matrix>
          <Stack gap="3">
            <Alert tone="neutral" title="live=&quot;off&quot; (default)">
              No role. Anything present when the page renders.
            </Alert>
            <Alert tone="success" live="polite" title="live=&quot;polite&quot;">
              role=&quot;status&quot;. It waits for a pause.
            </Alert>
            <Alert tone="danger" live="assertive" title="live=&quot;assertive&quot;">
              role=&quot;alert&quot;. It interrupts.
            </Alert>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}
