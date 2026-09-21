/*
 * A Server Component, like the rest of Tier 3. `NumberInput` is `'use client'`,
 * and an RSC page renders it by passing ELEMENTS to `Field` rather than a
 * render prop, because elements serialize across the boundary and functions do
 * not (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID. The harness renders its subtree six
 * times, so an id inside a cell exists six times and `for` binds to whichever
 * copy is first in the document — five of six labels would then name a control
 * in another cell (D-035 §1). Appearance goes in the matrices; association goes
 * below them, once.
 */
import { Cluster, Field, NumberInput, Stack, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function NumberInputPage() {
  return (
    <>
      <h1>3.14 NumberInput</h1>
      <p>
        A numeric text field with steppers, bounds, a step, and formatting that is correct outside
        en-US. It is <code>type=&quot;text&quot;</code> under the hood and never{' '}
        <code>type=&quot;number&quot;</code>: that input mutates its value on a scroll wheel over a
        focused field, rejects a locale decimal comma, and reports <code>value === &apos;&apos;</code>{' '}
        for anything it cannot parse — so <code>1,5</code> typed in a German locale is silently
        lost.
      </p>
      <p>
        <strong>The root is the surface, and that is where it differs from <code>Input</code>.</strong>{' '}
        The steppers sit inside the box, so the border, the fill and the radius live on the wrapper
        and the <code>&lt;input&gt;</code> is transparent. The focus ring follows them, drawn with{' '}
        <code>:has()</code> on the root — a ring around the borderless input would surround two
        thirds of the control with the steppers outside it.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          Height, inline padding and type all come from <code>--pp-control-*</code>, so a{' '}
          <code>NumberInput</code>, an <code>Input</code>, a <code>Select</code> and a{' '}
          <code>Button</code> at the same <code>size</code> are the same height by construction
          (D-028). That is now four components reading one definition, which is why{' '}
          <code>3C §1</code>&rsquo;s rejected shared base class stays rejected.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <NumberInput min={0} max={100} defaultValue={12} />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The steppers disable at the bound they reach</h2>
        <p>
          A bound reached in silence reads as a broken button, so the stepper says stepping has
          stopped working. They are <code>type=&quot;button&quot;</code> — a{' '}
          <code>&lt;button&gt;</code> inside a <code>&lt;form&gt;</code> defaults to{' '}
          <code>submit</code>, which is a one-word bug with a spectacular symptom — and they are
          not tab stops, because <kbd>↑</kbd> and <kbd>↓</kbd> already do the same job and six
          number fields would otherwise carry eighteen tab stops.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="At the maximum">
              <NumberInput min={0} max={10} defaultValue={10} />
            </Field>
            <Field label="At the minimum">
              <NumberInput min={0} max={10} defaultValue={0} />
            </Field>
            <Field label="Empty — the first press commits the bound">
              <NumberInput min={5} max={9} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Formatting is opt-in, because an ambient locale cannot hydrate</h2>
        <p>
          <code>new Intl.NumberFormat()</code> with no locale resolves the <em>runtime&rsquo;s</em>{' '}
          — Node&rsquo;s on the server, the user&rsquo;s in the browser — so{' '}
          <code>1234.5</code> would render <code>1,234.5</code> from a container in en-US and{' '}
          <code>1.234,5</code> in a German browser. That is RULES §7&rsquo;s last line broken by a
          component that never mentions the viewport. Without <code>locale</code> the display is{' '}
          <code>String(value)</code>, which is the same string everywhere.
        </p>
        <p>
          Parsing is the mirror of formatting and comes from the same{' '}
          <code>Intl.NumberFormat</code>: the separators and the digits are discovered with{' '}
          <code>formatToParts</code>, never hardcoded, so a numbering system that is not Latin
          round-trips too.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="No locale" description="String(value). Hydration-safe by construction.">
              <NumberInput defaultValue={1234.5} step={0.1} />
            </Field>
            <Field label="de-DE" description="A decimal comma, and a dot that groups.">
              <NumberInput
                locale="de-DE"
                formatOptions={{ minimumFractionDigits: 1 }}
                defaultValue={1234.5}
                step={0.1}
              />
            </Field>
            <Field label="Currency" description="Intl does this in every locale; we add no prop.">
              <NumberInput
                locale="de-DE"
                formatOptions={{ style: 'currency', currency: 'EUR' }}
                min={0}
                step={0.5}
                defaultValue={12.5}
              />
            </Field>
            <Field label="Percent" description="format applies the scale, so parse undoes it.">
              <NumberInput
                locale="en-US"
                formatOptions={{ style: 'percent' }}
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.25}
              />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns all three. <code>error</code> is the invalid state — there is no{' '}
          <code>invalid</code> prop on <code>Field</code> to contradict it — and an invalid control
          sets <code>data-pp-tone=&quot;danger&quot;</code> on its root rather than naming a red.
          The border stays in the danger tone while the control is focused, because{' '}
          <code>--pp-tone-focus</code> resolves in that ramp: the error does not vanish the moment
          the user goes to fix it.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Seats" description="Between one and ten." required>
              <NumberInput min={1} max={10} defaultValue={1} />
            </Field>
            <Field label="Seats" error="Pick at least one seat.">
              <NumberInput min={1} max={10} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled and read-only</h2>
        <p>
          Read-only is not disabled: the value is still selectable, focusable and submitted, so only
          the fill says &ldquo;not yours to change&rdquo; and the border stays put. A disabled
          control drops to <code>--pp-color-border-subtle</code>, because WCAG 1.4.11 exempts
          inactive components from the 3:1 the live edge carries and leaving them on it erases the
          difference the exemption exists to allow (D-050).
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled" disabled>
              <NumberInput defaultValue={3} />
            </Field>
            <Field label="Read-only">
              <NumberInput defaultValue={3} readOnly />
            </Field>
            <Field label="Live — compare">
              <NumberInput defaultValue={3} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It fills, at every container width</h2>
        <p>
          The whole point of the grid root. The control stretches into the first track and the
          steppers hug the second, so a long value truncates rather than pushing the container wide
          — and no width is declared anywhere.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="A long value" description="Nothing here overflows its cell.">
              <NumberInput locale="en-US" defaultValue={123456789012} />
            </Field>
            <Field label="Padding overridden">
              <NumberInput
                defaultValue={42}
                style={{ '--pp-number-input-padding-inline': '1.5rem' } as CSSProperties}
              />
            </Field>
          </Stack>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1). Everything below writes an id by
       * hand, and the harness renders its subtree six times.
       */}
      <section>
        <h2>Controlled — and why the empty value is null</h2>
        <Text>
          <code>value={'{undefined}'}</code> already means &ldquo;uncontrolled&rdquo; to the shared
          state hook, so an empty <em>controlled</em> field spelled that way switches modes
          silently and stops answering to its owner. <code>null</code> is empty; the type makes{' '}
          <code>undefined</code> an error at the call site rather than a behaviour change at
          runtime.
        </Text>
        <div data-testid="number-input-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>Typing is never clamped or snapped</h2>
        <Text>
          This field is <code>step={'{10}'}</code> with <code>min={'{0}'}</code>. Type{' '}
          <code>15</code>: snapping per keystroke would turn the <code>1</code> into{' '}
          <code>10</code> before the <code>5</code> arrived, so <code>15</code> could not be typed
          at all. The clamp and the snap happen on blur, on a stepper, on an arrow key and on{' '}
          <kbd>Enter</kbd> — never on a keystroke.
        </Text>
        <div data-testid="number-input-commit">
          <Field label="Step of ten" controlId="commit-demo">
            <NumberInput step={10} min={0} max={100} />
          </Field>
        </div>
      </section>

      <section>
        <h2>An explicit control id</h2>
        <Text>
          <code>controlId</code> wires both sides — the label&rsquo;s <code>for</code> and the
          control&rsquo;s <code>id</code> — which is why it exists rather than callers setting{' '}
          <code>id</code> on the control and silently unpointing the label (D-037 §1).
        </Text>
        <div data-testid="number-input-association">
          <Cluster gap="4" align="center">
            <Field label="Nights" controlId="nights">
              <NumberInput min={1} max={30} defaultValue={2} />
            </Field>
            <Field label="Guests" controlId="guests">
              <NumberInput min={1} max={8} defaultValue={2} />
            </Field>
          </Cluster>
        </div>
      </section>
    </>
  );
}
