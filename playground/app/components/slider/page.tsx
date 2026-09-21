/*
 * A Server Component, like the rest of Tier 3. `Slider` is `'use client'`, and
 * an RSC page renders it by passing ELEMENTS to `Field` rather than a render
 * prop, because elements serialize across the boundary and functions do not
 * (D-037 §2).
 *
 * NOTHING INSIDE A MATRIX WRITES AN ID (D-035 §1). Appearance goes in the
 * matrices; association goes below them, once.
 */
import { Field, Slider, Stack, Text } from 'pixel-perfect';
import type { CSSProperties } from 'react';

import { Matrix } from '../../../harness/Matrix';
import { Controlled } from './Controlled';

const SIZES = ['sm', 'md', 'lg'] as const;

export default function SliderPage() {
  return (
    <>
      <h1>3.15 Slider</h1>
      <p>
        A single-thumb range control built on <code>&lt;input type=&quot;range&quot;&gt;</code>.
        Every keyboard row, pointer capture, touch behaviour and right-to-left reversal in the
        WAI-ARIA Slider pattern comes from the platform, and none of it is in our source — which is
        the whole argument for the component, and what keeps Tier 3 at zero runtime dependencies.
      </p>
      <p>
        <strong>The track is ours and the thumb is the platform&rsquo;s.</strong> The filled portion
        is a <em>grid column</em> rather than a <code>linear-gradient</code>: a gradient needs{' '}
        <code>to right</code>, which fills from the wrong end in an RTL layout where the native
        control reverses, and it would have to be written twice because the WebKit and Firefox
        track pseudo-elements cannot share a selector list. Grid columns follow the inline axis, so
        RTL is right with nothing declared about it.
      </p>

      <section>
        <h2>Sizes</h2>
        <p>
          The thumb is 16 / 20 / 24 — the same scale the checkable three use — and the control is{' '}
          <code>--pp-control-height-*</code> tall, so a <code>Slider</code> in a row with an{' '}
          <code>Input</code> or a <code>Button</code> lines up, and the pointer target is the full
          height of the control rather than the height of the line it draws.
        </p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <Slider defaultValue={40} />
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The fill tracks the value</h2>
        <p>
          The percentage reaches CSS as a <em>private</em> custom property written inline, so the
          public <code>--pp-slider-fill-color</code> stays overridable from an ancestor (D-024) —
          and it is <strong>always written, never conditionally</strong>, because custom properties
          inherit and a nested slider would otherwise draw its ancestor&rsquo;s fill.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="At the minimum">
              <Slider defaultValue={0} />
            </Field>
            <Field label="A quarter">
              <Slider defaultValue={25} />
            </Field>
            <Field label="At the maximum">
              <Slider defaultValue={100} />
            </Field>
            <Field label="A step of 25">
              <Slider defaultValue={50} step={25} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Description, required, and error</h2>
        <p>
          The field owns the label, the description and the error. An invalid slider sets{' '}
          <code>data-pp-tone=&quot;danger&quot;</code> on its root rather than naming a red, so the
          fill and the thumb&rsquo;s edge resolve in the danger ramp. There is no{' '}
          <code>required</code> prop: a slider always has a value, so it can never be empty and the
          attribute would gate nothing.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Volume" description="Anything above 8 is unkind.">
              <Slider max={11} defaultValue={7} />
            </Field>
            <Field label="Volume" error="That is louder than the venue allows.">
              <Slider max={11} defaultValue={11} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Disabled, and no read-only</h2>
        <p>
          There is no <code>readOnly</code> prop, and that is HTML&rsquo;s ruling rather than ours:
          the attribute is defined for text-like controls and the browser ignores it on a range, so
          offering it would be a promise the platform refuses to keep. A slider that must not move
          is <code>disabled</code>. The same shape as <code>Select</code>&rsquo;s missing{' '}
          <code>readOnly</code> (D-049 §4).
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Disabled" disabled>
              <Slider defaultValue={60} />
            </Field>
            <Field label="Live — compare">
              <Slider defaultValue={60} />
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>It fills, at every container width</h2>
        <p>
          A range input carries an intrinsic inline size like every other form control, so the grid
          root is what makes it fill (D-040). No width is declared anywhere, and the track stretches
          rather than being sized.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Default" description="Nothing here overflows its cell.">
              <Slider defaultValue={70} />
            </Field>
            <Field label="Track and thumb overridden">
              <Slider
                defaultValue={70}
                style={
                  {
                    '--pp-slider-track-size': '0.5rem',
                    '--pp-slider-thumb-size': '1.75rem',
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
          React maps <code>onChange</code> on a range input to the <em>input</em> event, so it fires
          on every pixel of a drag; the native <code>change</code> event — the one that means
          &ldquo;the user let go&rdquo; — is not separately exposed. Without{' '}
          <code>onValueCommit</code> the only way to avoid a request per pixel is to reimplement
          pointer and key release handling, which is the work this component exists to absorb. A
          commit fires only when the value actually changed, so tabbing past a slider sends nothing.
        </Text>
        <div data-testid="slider-controlled">
          <Controlled />
        </div>
      </section>

      <section>
        <h2>The keyboard is entirely the browser&rsquo;s</h2>
        <Text>
          Arrows step, <kbd>Home</kbd> and <kbd>End</kbd> go to the bounds, and{' '}
          <kbd>Page Up</kbd> / <kbd>Page Down</kbd> take a larger step whose multiplier is the
          platform&rsquo;s rather than ours. In a right-to-left context the browser reverses{' '}
          <kbd>←</kbd> and <kbd>→</kbd> and leaves <kbd>↑</kbd> and <kbd>↓</kbd> alone — the detail
          a hand-built slider almost always misses. This component adds no key handler at all.
        </Text>
        <div data-testid="slider-keyboard">
          <Field label="Try the arrow keys" controlId="keyboard-slider">
            <Slider max={10} defaultValue={5} />
          </Field>
        </div>
      </section>

      <section>
        <h2>aria-valuetext, and only when there is a locale</h2>
        <Text>
          A slider labelled &ldquo;Budget&rdquo; that announces &ldquo;50&rdquo; when it means
          &ldquo;£50&rdquo; is the case the attribute exists for. It takes the same{' '}
          <code>locale</code> and <code>formatOptions</code> pair <code>NumberInput</code> takes,
          rather than a callback of its own, because two spellings of one idea inside one gate is
          what group review exists to catch.
        </Text>
        <div data-testid="slider-valuetext">
          <Field label="Budget" controlId="valuetext-slider">
            <Slider
              max={500}
              step={25}
              defaultValue={250}
              locale="en-GB"
              formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
            />
          </Field>
        </div>
      </section>
    </>
  );
}
