/*
 * A Server Component, like the rest of Tier 3C, and here that is a claim being
 * tested. `Select` is `'use client'`, and an RSC page renders it by passing
 * ELEMENTS to `Field` rather than a render prop, because elements serialize
 * across the boundary and functions do not (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID. The harness renders its subtree six
 * times, so an id inside a cell exists six times and `for` binds to whichever
 * copy is first in the document — five of six labels would then name a control
 * in another cell (D-035 §1). Appearance goes in the matrices; association goes
 * below them, once.
 */
import { Cluster, Field, Select, Stack, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

const ENVIRONMENTS = (
  <>
    <option value="preview">Preview</option>
    <option value="staging">Staging</option>
    <option value="production">Production</option>
  </>
);

export default function SelectPage() {
  return (
    <>
      <h1>3.13 Select</h1>
      <p>
        The native <code>&lt;select&gt;</code> on the shared control surface, with our chevron. It
        is the whole of single-select until <code>Combobox</code> (4.11) — a different control with
        typeahead, async options and a custom listbox, built on the overlay foundation rather than
        on this.
      </p>
      <p>
        <strong>The platform popup is kept, and that is the component&rsquo;s whole argument.</strong>{' '}
        <code>appearance: none</code> repaints the closed box and nothing else, so the open list
        stays the operating system&rsquo;s: a wheel on iOS, a listbox on desktop, correct with a
        screen reader and in a right-to-left locale without us writing a line. There is no{' '}
        <code>data-state=&quot;open&quot;</code>, because the native popup&rsquo;s openness is not
        observable from script and an attribute that is wrong half the time is worse than none.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          Height, inline padding and type all come from <code>--pp-control-*</code>, so a{' '}
          <code>Select</code> and an <code>Input</code> and a <code>Button</code> at the same{' '}
          <code>size</code> are the same height by construction (D-028). The chevron is{' '}
          <code>1em</code> of the control&rsquo;s own font size, so it scales with the step without
          the stylesheet naming the step.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <Select>{ENVIRONMENTS}</Select>
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The placeholder is disabled, hidden, and selected anyway</h2>
        <p>
          Three attributes of which only two are attributes. The HTML{' '}
          <em>ask for a reset</em> algorithm selects the first option{' '}
          <strong>that is not disabled</strong>, so a disabled placeholder is skipped and the
          caller silently sees option two. The component seeds{' '}
          <code>defaultValue=&quot;&quot;</code> when you have given neither{' '}
          <code>value</code> nor <code>defaultValue</code>, which selects it through the{' '}
          <code>value</code> setter, where no such exclusion exists.
        </p>
        <p>
          Its text is muted, and it is painted from{' '}
          <code>:has(option[data-pp-placeholder]:checked)</code> rather than from an attribute —
          the platform&rsquo;s own state, so it stays right after a change, a{' '}
          <code>form.reset()</code> and a write through the ref alike. None of the three tells
          React anything.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Nothing chosen yet">
              <Select placeholder="Choose an environment…">{ENVIRONMENTS}</Select>
            </Field>
            <Field label="Something chosen">
              <Select placeholder="Choose an environment…" defaultValue="staging">
                {ENVIRONMENTS}
              </Select>
            </Field>
            <Field label="No placeholder at all">
              <Select>{ENVIRONMENTS}</Select>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns all three. <code>error</code> is the invalid state — there is no{' '}
          <code>invalid</code> prop on <code>Field</code> to contradict it — and an invalid select
          sets <code>data-pp-tone=&quot;danger&quot;</code> on its root rather than naming a red.
          The border stays in the danger tone while the control is focused, so the error does not
          vanish the moment the user goes to fix it.
        </p>
        <p>
          A <code>required</code> select whose placeholder is still selected fails constraint
          validation on submit, because the placeholder&rsquo;s value is the empty string. That is
          the browser&rsquo;s mechanism, not ours.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Environment" description="Where this deploys." required>
              <Select placeholder="Choose one…">{ENVIRONMENTS}</Select>
            </Field>
            <Field label="Environment" error="Pick an environment to deploy to.">
              <Select placeholder="Choose one…">{ENVIRONMENTS}</Select>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled, and no read-only</h2>
        <p>
          The fill sinks, the text dims and the chevron dims with it — one object rather than a box
          that fades and a glyph that does not. There is no read-only state: HTML has no{' '}
          <code>readonly</code> for <code>&lt;select&gt;</code>, and faking one with{' '}
          <code>pointer-events</code> leaves the control fully operable from the keyboard.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled" disabled>
              <Select defaultValue="production">{ENVIRONMENTS}</Select>
            </Field>
            <Field label="Live — compare">
              <Select defaultValue="production">{ENVIRONMENTS}</Select>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Optgroups and disabled options, because they are children</h2>
        <p>
          Options are <code>children</code>, not an <code>options={'{[…]}'}</code> prop. That is
          RULES §5.6, and it is the only form that lets you render an <code>&lt;optgroup&gt;</code>{' '}
          or a disabled option without us inventing a schema for them.
        </p>
        <Matrix>
          <Field label="Region">
            <Select placeholder="Choose a region…">
              <optgroup label="Europe">
                <option value="eu-west">eu-west-1</option>
                <option value="eu-north">eu-north-1</option>
              </optgroup>
              <optgroup label="North America">
                <option value="us-east">us-east-1</option>
                <option value="us-west" disabled>
                  us-west-2 — at capacity
                </option>
              </optgroup>
            </Select>
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>It fills, at every container width</h2>
        <p>
          The whole point of the grid root, and a native <code>&lt;select&gt;</code> is the worst of
          the three surfaces: it sizes to its <em>longest option</em>, which measured 52px inside a
          600px parent as a block element. A long option now truncates rather than pushing the
          container wide, because the control declares <code>min-inline-size: 0</code> and nothing
          declares a width.
        </p>
        <Matrix>
          <Field label="Long options" description="Nothing here overflows its cell.">
            <Select defaultValue="long">
              <option value="long">
                eu-west-1 · production · a deliberately long option label that would set the box
              </option>
              <option value="short">eu-west-1</option>
            </Select>
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>The chevron has its own room</h2>
        <p>
          <code>padding-inline-end</code> reserves the edge gap plus the chevron plus the gap
          between them, all from tokens, so a long value truncates <em>before</em> it reaches the
          glyph instead of running underneath it. Override{' '}
          <code>--pp-select-padding-inline</code> and all three move together — which is why it is
          resolved once on the root rather than twice at the point of use.
        </p>
        <Matrix>
          <Cluster gap="4" align="center">
            <Field label="Default">
              <Select defaultValue="long">
                <option value="long">A long value that truncates before the chevron</option>
              </Select>
            </Field>
            <Field label="Padding overridden">
              <Select
                defaultValue="long"
                style={{ '--pp-select-padding-inline': '1.5rem' } as CSSProperties}
              >
                <option value="long">A long value that truncates before the chevron</option>
              </Select>
            </Field>
          </Cluster>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1, spec §12).
       *
       * Everything below writes an id by hand. The harness renders its subtree
       * six times, so an id inside a cell exists six times and `for` binds to
       * whichever copy is first in the document.
       */}
      <section>
        <h2>Controlled — and the one place data-placeholder appears</h2>
        <Text>
          The attribute describes what React knows, and React only knows when the caller is
          controlled. An uncontrolled select&rsquo;s selection lives in the DOM and changes without
          this render being told, so the attribute is <strong>omitted rather than guessed</strong>{' '}
          — and the stylesheet paints from <code>:checked</code> instead, which is right in every
          case including the ones that fire no React event.
        </Text>
        <div data-testid="select-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>An uncontrolled placeholder, with no attribute on it</h2>
        <Text>
          This is the only demo that can tell the two mechanisms apart. The text below is muted and
          the root carries no <code>data-placeholder</code>; swap the{' '}
          <code>:has()</code> rule for the attribute and it goes black.
        </Text>
        <div data-testid="select-uncontrolled-placeholder">
          <Field label="Environment" controlId="uncontrolled-env">
            <Select placeholder="Choose an environment…">{ENVIRONMENTS}</Select>
          </Field>
        </div>
      </section>

      <section>
        <h2>The chevron is not a hole in the end of the box</h2>
        <Text>
          The chevron sits over the control in the same grid cell, so without{' '}
          <code>pointer-events: none</code> a click landing on it would hit a{' '}
          <code>&lt;span&gt;</code> and the popup would not open — which reads as flakiness rather
          than as a bug. It is also offset with <code>inset-inline-end</code> rather than{' '}
          <code>right</code>, so it moves to the other side of the box in an RTL layout instead of
          sitting on top of the text.
        </Text>
        <div data-testid="select-chevron-target">
          <Field label="Click the chevron itself" controlId="chevron-target">
            <Select defaultValue="production">{ENVIRONMENTS}</Select>
          </Field>
        </div>
      </section>

      <section>
        <h2>An explicit control id</h2>
        <Text>
          <code>controlId</code> wires both sides — the label&rsquo;s <code>for</code> and the
          control&rsquo;s <code>id</code> — which is why it exists rather than callers setting{' '}
          <code>id</code> on the control and silently unpointing the label (D-037 §1). It is
          outside the Matrix on purpose: a named id rendered six times names five wrong controls.
        </Text>
        <div data-testid="select-association">
          <Field label="Billing region" controlId="billing-region">
            <Select placeholder="Choose a region…">
              <option value="eu">Europe</option>
              <option value="us">North America</option>
            </Select>
          </Field>
        </div>
      </section>
    </>
  );
}
