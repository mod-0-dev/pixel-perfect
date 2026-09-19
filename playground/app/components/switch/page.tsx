/*
 * A Server Component, like the rest of Tier 3C — and here it is also a claim
 * being tested. `Switch` is `'use client'`, and an RSC page renders it by
 * passing ELEMENTS to `Field` rather than a render prop, because elements
 * serialize across the boundary and functions do not (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID. The harness renders its subtree six
 * times, so an id inside a cell exists six times and `for` binds to whichever
 * copy is first in the document — five of six labels would then name a control
 * in another cell (D-035 §1). Appearance goes in the matrices; association goes
 * below them, once.
 */
import { Cluster, Field, Stack, Switch, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function SwitchPage() {
  return (
    <>
      <h1>3.12 Switch</h1>
      <p>
        An on/off control whose effect is <strong>immediate</strong>. That is the whole boundary
        against <code>Checkbox</code>: a checkbox states a value that a submit button applies, a
        switch does the thing when you flip it. If there is a Save button, it is a checkbox. And it
        is not <code>Toggle</code>, which is <code>aria-pressed</code> — a button that stays down;
        this is <code>aria-checked</code>, a setting that is on.
      </p>
      <p>
        The native <code>&lt;input type=&quot;checkbox&quot; role=&quot;switch&quot;&gt;</code>{' '}
        <em>is</em> the painted track: <code>appearance: none</code> and styled directly, with the
        thumb as an <code>aria-hidden</code> sibling stacked over it. <code>role=&quot;switch&quot;</code>{' '}
        on a native checkbox is the APG construction — the semantics, the keyboard and the form
        participation stay, and only the announced role changes.
      </p>

      <section>
        <h2>Sizes — 32×16 / 40×20 / 48×24</h2>
        <p>
          A 2:1 track at the checkable block sizes, so a <code>md</code> switch is 20px tall and
          lines up with a <code>md</code> checkbox in the same form. Every other length is derived
          from that one: the thumb is the track minus two insets, the inset is half the difference
          between the track and the size step below it, and the travel is the track&rsquo;s inline
          size minus its block size — which is the same distance whatever the inset is.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Cluster key={size} gap="3" align="center">
                <Field label={`${size} — off`} size={size} orientation="horizontal">
                  <Switch />
                </Field>
                <Field label={`${size} — on`} size={size} orientation="horizontal">
                  <Switch defaultChecked />
                </Field>
              </Cluster>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The thumb is the state indicator</h2>
        <p>
          Off is the library&rsquo;s resting control surface — the same fill and edge an unchecked{' '}
          <code>Checkbox</code> takes — with a <code>--pp-color-text-muted</code> thumb at the
          start. On fills the track with <code>--pp-tone-solid</code> and the thumb becomes{' '}
          <code>--pp-tone-on-solid</code>, at the end. Both thumb-on-track pairings are ones the
          token layer verifies in every hue and both themes; the specified{' '}
          <code>--pp-color-border-strong</code> track was not, and measured 1.97:1.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Off" orientation="horizontal">
              <Switch />
            </Field>
            <Field label="On" orientation="horizontal">
              <Switch defaultChecked />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          All three come from <code>Field</code>, and an invalid switch sets{' '}
          <code>data-pp-tone=&quot;danger&quot;</code> on its root rather than naming a red: the
          edge reads <code>--pp-tone-border</code> and resolves in the danger ramp. The border
          stays in the danger tone while the control is focused, so the error state does not vanish
          the moment the user goes to fix it.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field
              label="Ship on merge"
              description="Deploys to production as soon as a PR lands."
              orientation="horizontal"
            >
              <Switch />
            </Field>
            <Field
              label="Accept the terms"
              error="You have to accept the terms to continue."
              orientation="horizontal"
              required
            >
              <Switch />
            </Field>
            <Field
              label="On, and still wrong"
              error="This option is locked for your plan."
              orientation="horizontal"
            >
              <Switch defaultChecked />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled</h2>
        <p>
          A disabled switch that is <em>on</em> is washed out rather than solid: the state the user
          can do nothing about should not be the loudest thing in the form. That is also what keeps{' '}
          <strong>off</strong> and <strong>disabled</strong> apart, which is the thing a switch is
          easiest to get wrong — a live off switch has a clearly visible thumb, a disabled one has
          a faint one, and WCAG exempts inactive components from the contrast the first one meets.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled, off" orientation="horizontal" disabled>
              <Switch />
            </Field>
            <Field label="Disabled, on" orientation="horizontal" disabled>
              <Switch defaultChecked />
            </Field>
            <Field label="Live, off — compare" orientation="horizontal">
              <Switch />
            </Field>
            <Field label="Live, on — compare" orientation="horizontal">
              <Switch defaultChecked />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It hugs at every width</h2>
        <p>
          The track is the same 40×20 in a 240px sidebar and a 960px page. A <code>fill</code>{' '}
          control would stretch into the column and become a very long pill — which is what a
          switch that declared its own width would do in a narrow container, in the opposite
          direction.
        </p>
        <Matrix>
          <Field
            label="A label long enough to take the whole column and then wrap onto a second line"
            orientation="horizontal"
          >
            <Switch />
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>Spacing is how an undersized target passes WCAG 2.5.8</h2>
        <p>
          The tracks are 16 / 20 / 24 tall, so <code>sm</code> and <code>md</code> are under SC
          2.5.8&rsquo;s 24×24 minimum on the block axis. They conform through the{' '}
          <strong>spacing exception</strong> — a 24px circle centred on each target does not
          intersect its neighbour&rsquo;s. A column of <code>sm</code> switches at{' '}
          <code>gap=&quot;3&quot;</code> puts centres 28px apart; at <code>&quot;2&quot;</code> it
          would be exactly 24, which is tangent circles and an argument with an auditor rather than
          a pass.
        </p>
        <Matrix>
          <Stack gap="3">
            <Switch size="sm" aria-label="First" />
            <Switch size="sm" aria-label="Second" />
            <Switch size="sm" aria-label="Third" />
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The styling API is six custom properties</h2>
        <p>
          <code>--pp-switch-track-inline-size</code>, <code>--pp-switch-track-block-size</code>,{' '}
          <code>--pp-switch-track-bg</code>, <code>--pp-switch-track-bg-checked</code>,{' '}
          <code>--pp-switch-thumb-bg</code> and <code>--pp-switch-thumb-inset</code>. The two track
          fills are separate properties because the states are: setting one leaves the other alone.
          The switch below overrides the block size only, and the thumb, the inset and the travel
          all follow it.
        </p>
        <Matrix>
          <Cluster gap="4" align="center">
            <Field label="Default md" orientation="horizontal">
              <Switch />
            </Field>
            <Field label="Track block size 2rem" orientation="horizontal">
              <Switch style={{ '--pp-switch-track-block-size': '2rem' } as CSSProperties} />
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
        <h2>Controlled — and the effect is immediate</h2>
        <Text>
          There is no Save button here, and that is the point. The line under the switch changes as
          you flip it. A switch inside a form whose value is applied by a submit is a checkbox
          wearing the wrong control: the user flips it, nothing happens, and they have no way to
          know why.
        </Text>
        <div data-testid="switch-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>The thumb is not a hole in the middle of the track</h2>
        <Text>
          The thumb sits over the input in the same grid cell, so without{' '}
          <code>pointer-events: none</code> a click landing on it would hit a <code>&lt;span&gt;</code>{' '}
          and the control would only work where the thumb is not — which reads as flakiness rather
          than as a bug. Click the thumb.
        </Text>
        <div data-testid="switch-thumb-target">
          <Field label="Click the thumb itself" orientation="horizontal" controlId="thumb-target">
            <Switch defaultChecked />
          </Field>
        </div>
      </section>
    </>
  );
}
