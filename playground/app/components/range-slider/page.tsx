/*
 * A Server Component, like the rest of Tier 3. `RangeSlider` is `'use client'`,
 * and an RSC page renders it by passing ELEMENTS to `Field` rather than a
 * render prop (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID (D-035 §1) — and nothing here does at
 * all: the two inputs carry `aria-label`s and the group is named by the field
 * through `aria-labelledby`, so there is no `controlId` to hand out. The
 * sections the browser suite drives are found by `data-testid` instead.
 */
import { Field, RangeSlider, Stack, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function RangeSliderPage() {
  return (
    <>
      <h1>3.17 RangeSlider</h1>
      <p>
        A two-thumb range control: two native <code>&lt;input type=&quot;range&quot;&gt;</code>{' '}
        elements stacked in one cell, each spanning the full range. The drag on a thumb, pointer
        capture, touch, every keyboard row, <code>role=&quot;slider&quot;</code> with its value
        attributes and right-to-left reversal are all still the platform&rsquo;s.
      </p>
      <p>
        <strong>The inputs are transparent and the thumbs you see are ours.</strong> That one move
        dissolves the blocker that deferred this from <code>Slider</code>: a transparent
        input&rsquo;s focus ring is transparent with it, nothing is suppressed, and the ring is
        drawn on the focused thumb alone by a sibling selector. It is also the first slider thumb in
        the library a test can measure.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          The thumbs are 16 / 20 / 24 and the control is <code>--pp-control-height-*</code> tall,
          exactly as <code>Slider</code>. The native thumbs beneath are sized to match, because they
          are the hit targets.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} group size={size}>
                <RangeSlider defaultValue={[30, 70]} />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The fill runs between the thumbs</h2>
        <p>
          Two unitless fractions reach CSS as private custom properties, always written (D-024). The
          fill is grid <em>column two</em> of <code>start (end − start) 1fr</code>, so it follows
          the inline axis and RTL needs nothing declared. A zero-width range is a meaningful
          selection — &ldquo;exactly 50&rdquo; — so the thumbs may meet.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="The whole range — the default" group>
              <RangeSlider />
            </Field>
            <Field label="A quarter to three quarters" group>
              <RangeSlider defaultValue={[25, 75]} />
            </Field>
            <Field label="The thumbs meet at 50" group>
              <RangeSlider defaultValue={[50, 50]} />
            </Field>
            <Field label="A step of 25" group>
              <RangeSlider defaultValue={[25, 50]} step={25} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, error, and disabled</h2>
        <p>
          The field owns the label, the description and the error, and it must be a{' '}
          <code>group</code>: the root is <code>role=&quot;group&quot;</code>, which a{' '}
          <code>&lt;label for&gt;</code> cannot name. Both thumbs are described by the description
          and the error, because both are about the range. An invalid range sets{' '}
          <code>data-pp-tone=&quot;danger&quot;</code> on its root rather than naming a red.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Price" group description="Per night, before fees.">
              <RangeSlider max={500} step={10} defaultValue={[80, 240]} />
            </Field>
            <Field label="Price" group error="That band is wider than the listing allows.">
              <RangeSlider max={500} step={10} defaultValue={[0, 500]} />
            </Field>
            <Field label="Disabled" group disabled>
              <RangeSlider defaultValue={[30, 70]} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It fills, at every container width</h2>
        <p>
          Two range inputs carry an intrinsic inline size like every form control, so the grid root
          is what makes them fill (D-040). No width is declared anywhere; the thumbs take{' '}
          <code>inline-size</code> from the size scale under the D-019 exemption, and nothing else
          does.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Default" group description="Nothing here overflows its cell.">
              <RangeSlider defaultValue={[20, 80]} />
            </Field>
            <Field label="Track and thumb overridden" group>
              <RangeSlider
                defaultValue={[20, 80]}
                style={
                  {
                    '--pp-range-slider-track-size': '0.5rem',
                    '--pp-range-slider-thumb-size': '1.75rem',
                  } as CSSProperties
                }
              />
            </Field>
          </Stack>
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX, ONCE (D-035 §1). */}
      <section>
        <h2>onValueChange fires per pixel; onValueCommit fires once</h2>
        <Text>
          As <code>Slider</code>: React maps <code>onChange</code> on a range input to the{' '}
          <em>input</em> event. A press on bare track that keeps dragging counts the same way — it
          is one gesture, and it commits once on release.
        </Text>
        <div data-testid="range-slider-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>The keyboard is the browser&rsquo;s, and the thumbs cannot cross</h2>
        <Text>
          Arrows step, <kbd>Home</kbd> and <kbd>End</kbd> go to the bounds — or to the other thumb,
          if that comes first. Each input keeps the <em>full</em> range; narrowing one&rsquo;s{' '}
          <code>max</code> to the other&rsquo;s value would rescale its thumb travel and break the
          alignment with our thumb. The clamp is on the value, and React restores an input whose
          change was clamped.
        </Text>
        <div data-testid="range-slider-keyboard">
          <Field label="Try End on the first thumb" group>
            <RangeSlider max={10} defaultValue={[3, 7]} />
          </Field>
        </div>
      </section>

      <section>
        <h2>A press on bare track moves the nearer thumb</h2>
        <Text>
          The <code>pointer-events</code> layering that makes both thumbs draggable takes a track
          press away from the inputs, so the root routes it: the pointer is mapped to a value, the
          nearer thumb takes it, its input is focused, and the pointer is captured so the drag
          continues. On a tie — the thumbs coincide — the press&rsquo;s side decides, which is what
          makes a pair pushed to the end separable.
        </Text>
        <div data-testid="range-slider-track">
          <Field label="Press either side, or between" group>
            <RangeSlider defaultValue={[40, 60]} />
          </Field>
        </div>
        <div data-testid="range-slider-stuck">
          <Field label="Both at the maximum — pull the start thumb back" group>
            <RangeSlider defaultValue={[100, 100]} />
          </Field>
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <Text>
          The native inputs reverse, the fill is a grid column so it reverses, and our thumbs are
          placed with <code>inset-inline-start</code> rather than <code>translate</code>, so they
          reverse too (D-048 §4). A track press is measured from the inline start.
        </Text>
        <div data-testid="range-slider-rtl" dir="rtl">
          <Field label="من ٢٠ إلى ٨٠" group>
            <RangeSlider defaultValue={[20, 80]} />
          </Field>
        </div>
      </section>

      <section>
        <h2>aria-valuetext, per thumb, and only when there is a locale</h2>
        <Text>
          The same <code>locale</code> and <code>formatOptions</code> pair as{' '}
          <code>NumberInput</code> and <code>Slider</code>, applied to each input. A screen reader
          hears &ldquo;Price, group — Minimum price, slider, £50&rdquo;.
        </Text>
        <div data-testid="range-slider-valuetext">
          <Field label="Price" group>
            <RangeSlider
              max={500}
              step={25}
              defaultValue={[50, 250]}
              locale="en-GB"
              formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
              thumbLabels={['Minimum price', 'Maximum price']}
              name="price"
            />
          </Field>
        </div>
      </section>
    </>
  );
}
