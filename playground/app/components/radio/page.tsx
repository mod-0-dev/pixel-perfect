/*
 * A Server Component, like the rest of Tier 3C — and here it is also a claim
 * being tested. `Radio` and `RadioGroup` are both `'use client'`, and an RSC
 * page renders them by passing ELEMENTS to `Field` rather than a render prop,
 * because elements serialize across the boundary and functions do not
 * (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX PASSES `name`. The harness renders its subtree six
 * times, so a shared name would make six cells one group and selecting in one
 * would clear the other five. `RadioGroup` generates a name per instance
 * (D-039 §5), which is what keeps the six cells independent — asserted in the
 * browser suite rather than left to look right.
 */
import { Field, Radio, RadioGroup, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

const TARGETS = [
  { value: 'preview', label: 'Preview' },
  { value: 'production', label: 'Production' },
] as const;

export default function RadioPage() {
  return (
    <>
      <h1>3.11 Radio / RadioGroup</h1>
      <p>
        One choice from a visible set. <code>RadioGroup</code> owns the <code>name</code>, the
        value and the grouping semantics; <code>Radio</code> is one option — the same box as{' '}
        <code>Checkbox</code> with a round edge and a dot. The native{' '}
        <code>&lt;input type=&quot;radio&quot;&gt;</code> <em>is</em> the painted control:{' '}
        <code>appearance: none</code> and styled directly, with the dot as an{' '}
        <code>aria-hidden</code> sibling stacked over it.
      </p>
      <p>
        <strong>There is no roving tabindex, and that is the whole ruling.</strong> Radios sharing
        a <code>name</code> already implement the WAI-ARIA Radio Group pattern in every browser —
        one tab stop, arrows that move <em>and</em> select, wrapping at both ends, disabled members
        skipped. Writing our own means deleting that and rebuilding it, and the rebuild is what has
        the edge cases.
      </p>

      <section>
        <h2>Sizes — 16 / 20 / 24</h2>
        <p>
          The <code>--pp-size-*</code> scale, not <code>--pp-control-height-*</code> — the same box
          a <code>Checkbox</code> takes, so a form mixing the two lines up. The dot is half the
          box, a ratio rather than a length someone picked, so it tracks{' '}
          <code>--pp-radio-size</code> when you override it.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size} group>
                <RadioGroup defaultValue="preview" orientation="horizontal">
                  {TARGETS.map((target) => (
                    <Field key={target.value} label={target.label} orientation="horizontal">
                      <Radio value={target.value} />
                    </Field>
                  ))}
                </RadioGroup>
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Vertical and horizontal</h2>
        <p>
          The group composes <code>Stack</code> or <code>Cluster</code> rather than declaring flow
          of its own — a layout primitive may size the boxes it creates, and this one creates none.{' '}
          <code>horizontal</code> wraps, and it needs no container query to decide when: flex
          resolves it continuously against the space actually available, which is the same finding
          Tier 2 recorded for <code>Cluster</code>.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field label="Vertical (default)" group>
              <RadioGroup defaultValue="preview">
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
            <Field label="Horizontal — wraps when it runs out of room" group>
              <RadioGroup defaultValue="production" orientation="horizontal">
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The outer field owns all three, and names the group through{' '}
          <code>aria-labelledby</code> — a <code>&lt;div&gt;</code> is not a labelable element, so{' '}
          <code>for</code> has nothing to point at. That is the exact path{' '}
          <code>Field</code>&rsquo;s <code>group</code> prop exists for. <code>required</code> goes
          on <em>every</em> radio, not just the first: HTML treats the group as satisfied if any
          radio with that name is checked, and browsers differ on whether an unmarked member
          counts.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field
              label="Deployment target"
              description="Changes take effect on the next push."
              group
              required
            >
              <RadioGroup>
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
            <Field label="Pick a target" error="You have to pick a target to deploy." group>
              <RadioGroup>
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
            <Field label="Picked, and still wrong" error="That target is locked this week." group>
              <RadioGroup defaultValue="production">
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled</h2>
        <p>
          A disabled selected radio is grey rather than solid: the state the user can do nothing
          about should not be the loudest thing in the form. <strong>Per-option state goes on the{' '}
          <code>Radio</code></strong>, never on its inner <code>Field</code> — the group has
          already resolved the outer field, and a per-option field cannot say &ldquo;not
          set&rdquo;.
        </p>
        <Matrix>
          <Stack gap="4">
            <Field label="Whole group disabled" group disabled>
              <RadioGroup defaultValue="preview">
                {TARGETS.map((target) => (
                  <Field key={target.value} label={target.label} orientation="horizontal">
                    <Radio value={target.value} />
                  </Field>
                ))}
              </RadioGroup>
            </Field>
            <Field label="One option disabled" group>
              <RadioGroup defaultValue="preview">
                <Field label="Preview" orientation="horizontal">
                  <Radio value="preview" />
                </Field>
                <Field label="Production — locked" orientation="horizontal">
                  <Radio value="production" disabled />
                </Field>
              </RadioGroup>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The group fills, the radio hugs</h2>
        <p>
          Two contracts in one component pair. The group is a layout and occupies the field&rsquo;s
          inline space; the box is the same 20px in a 240px sidebar and a 960px page. A{' '}
          <code>fill</code> control would stretch into the column and become an oblong.
        </p>
        <Matrix>
          <Field label="A label long enough to take the whole column and then wrap onto a second line" group>
            <RadioGroup defaultValue="preview">
              {TARGETS.map((target) => (
                <Field key={target.value} label={target.label} orientation="horizontal">
                  <Radio value={target.value} />
                </Field>
              ))}
            </RadioGroup>
          </Field>
        </Matrix>
      </section>

      <section>
        <h2>Spacing is how an undersized target passes WCAG 2.5.8</h2>
        <p>
          The boxes are 16 / 20 / 24, so <code>sm</code> and <code>md</code> are under SC
          2.5.8&rsquo;s 24×24 minimum. They conform through the <strong>spacing exception</strong> —
          a 24px circle centred on each target does not intersect its neighbour&rsquo;s. This is
          why <code>gap</code> defaults to <code>&quot;3&quot;</code> and not{' '}
          <code>&quot;2&quot;</code>: at 8px a column of <code>sm</code> radios puts centres
          exactly 24px apart, which is tangent circles and an argument with an auditor rather than
          a pass. The group below passes no <code>gap</code> at all.
        </p>
        <Matrix>
          <RadioGroup size="sm" defaultValue="a">
            <Radio value="a" aria-label="First" />
            <Radio value="b" aria-label="Second" />
            <Radio value="c" aria-label="Third" />
          </RadioGroup>
        </Matrix>
      </section>

      {/*
       * OUTSIDE THE MATRIX, ONCE (D-035 §1, spec §12).
       *
       * Everything below writes an id or a name by hand. The harness renders
       * its subtree six times, so an id inside a cell exists six times and
       * `for` binds to whichever copy is first in the document — and a shared
       * `name` would make all six cells one radio group.
       */}
      <section>
        <h2>Controlled — the group owns the value</h2>
        <Text>
          A radio is deselected when a <em>sibling</em> is selected, and the deselected radio is
          told nothing: no change event, no anything. So per-radio state could only ever be right
          about selection and wrong about deselection, which is the one case radios exist for. The
          group is the element that knows both.
        </Text>
        <div data-testid="radio-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>One tab stop, and the arrows do the rest</h2>
        <Text>
          Tab enters at the selected radio, or the first if none is selected. Arrow keys move{' '}
          <em>and</em> select, wrap at both ends, and skip the disabled member — all of it native,
          none of it ours. Native radios also answer all four arrow keys regardless of orientation,
          which is a superset of the APG pattern rather than a deviation from it.
        </Text>
        <div data-testid="radio-keyboard">
          <Field label="Region" group>
            <RadioGroup name="region" defaultValue="eu">
              <Field label="EU" orientation="horizontal" controlId="region-eu">
                <Radio value="eu" />
              </Field>
              <Field label="US — unavailable" orientation="horizontal" controlId="region-us">
                <Radio value="us" disabled />
              </Field>
              <Field label="APAC" orientation="horizontal" controlId="region-apac">
                <Radio value="apac" />
              </Field>
            </RadioGroup>
          </Field>
        </div>
      </section>

      <section>
        <h2>Two unnamed groups are two groups</h2>
        <Text>
          Grouping <em>is</em> the <code>name</code> attribute, so two unnamed groups on one page
          would be one group and selecting in either would clear the other — silently, and exactly
          the kind of thing that ships. <code>RadioGroup</code> generates a name from{' '}
          <code>useId()</code> when you do not give it one. Neither group below has a{' '}
          <code>name</code>.
        </Text>
        <div data-testid="radio-two-groups">
          <Stack gap="4">
            <RadioGroup defaultValue="a" orientation="horizontal">
              <Radio value="a" aria-label="Group one, first" />
              <Radio value="b" aria-label="Group one, second" />
            </RadioGroup>
            <RadioGroup defaultValue="a" orientation="horizontal">
              <Radio value="a" aria-label="Group two, first" />
              <Radio value="b" aria-label="Group two, second" />
            </RadioGroup>
          </Stack>
        </div>
      </section>

      <section>
        <h2>A radio you wire yourself</h2>
        <Text>
          Without a group nothing owns the selection, so <code>data-state</code> is{' '}
          <strong>omitted rather than guessed</strong> — and the box is still painted correctly,
          because the stylesheet reads <code>:checked</code> rather than the attribute. That is a
          deliberate deviation from RULES §4: <code>:checked</code> is not one of our private
          booleans, it is the platform&rsquo;s own state, and it is right in exactly the cases
          React is not. Click it.
        </Text>
        <div data-testid="radio-bare">
          <Field label="Wired by hand" orientation="horizontal" controlId="bare-radio">
            <Radio value="solo" name="bare" />
          </Field>
        </div>
      </section>
    </>
  );
}
