import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { RangeSlider } from './RangeSlider';

/** A `group` needs an accessible name, so every standalone render has one. */
const label = { 'aria-label': 'Price' } as const;

const rootOf = (container: HTMLElement) =>
  container.querySelector('.pp-range-slider') as HTMLElement;

const fractionsOf = (container: HTMLElement) => {
  const root = rootOf(container);
  return [
    root.style.getPropertyValue('--_pp-range-slider-start'),
    root.style.getPropertyValue('--_pp-range-slider-end'),
  ];
};

const thumbs = (getAllByRole: (role: string) => HTMLElement[]) => {
  const [start, end] = getAllByRole('slider') as HTMLInputElement[];
  return { start: start as HTMLInputElement, end: end as HTMLInputElement };
};

describe('RangeSlider', () => {
  describe('the precedence rule', () => {
    it('takes size, disabled and invalid from the field', () => {
      const { getAllByRole, container } = renderWithTheme(
        <Field label="Price" group size="lg" disabled error="Too wide">
          <RangeSlider />
        </Field>,
      );
      const root = rootOf(container);

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      for (const control of getAllByRole('slider')) {
        expect(control).toBeDisabled();
        expect(control).toHaveAttribute('aria-invalid', 'true');
      }
    });

    it('lets an explicit prop beat the field', () => {
      const { container } = renderWithTheme(
        <Field label="Price" group size="lg" disabled error="Too wide">
          <RangeSlider size="sm" disabled={false} invalid={false} />
        </Field>,
      );
      const root = rootOf(container);

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
    });

    it('works standalone, with no field anywhere above it', () => {
      const { container } = renderWithTheme(<RangeSlider {...label} invalid />);
      expect(rootOf(container)).toHaveAttribute('data-invalid');
      expect(rootOf(container)).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('the numeric contract (3D §1, spec §4)', () => {
    it('defaults to 0–100 step 1 on both inputs, and seeds at [min, max]', () => {
      const { getAllByRole } = renderWithTheme(<RangeSlider {...label} />);
      const { start, end } = thumbs(getAllByRole);

      for (const control of [start, end]) {
        expect(control).toHaveAttribute('min', '0');
        expect(control).toHaveAttribute('max', '100');
        expect(control).toHaveAttribute('step', '1');
      }
      expect(start).toHaveValue('0');
      expect(end).toHaveValue('100');
    });

    it('keeps the FULL min and max on each input — the clamp is on the value (spec §3)', () => {
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} min={10} max={90} defaultValue={[20, 30]} />,
      );
      const { start, end } = thumbs(getAllByRole);
      // Narrowing start's max to 30 would rescale its thumb travel and break
      // the alignment with our thumb. Both stay at the range's own bounds.
      expect(start).toHaveAttribute('max', '90');
      expect(end).toHaveAttribute('min', '10');
    });

    it('snaps and clamps a defaultValue, and orders a reversed one', () => {
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} min={0} max={100} step={25} defaultValue={[140, 40]} />,
      );
      const { start, end } = thumbs(getAllByRole);
      // 40 snaps to 50; 140 clamps to 100; then ordered.
      expect(start).toHaveValue('50');
      expect(end).toHaveValue('100');
    });

    it('takes its stepping base from min, the way HTML does', () => {
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} min={1} max={9} step={2} defaultValue={[4, 6]} />,
      );
      const { start, end } = thumbs(getAllByRole);
      // The grid is 1, 3, 5, 7, 9 — not 0, 2, 4, 6.
      expect(start).toHaveValue('5');
      expect(end).toHaveValue('7');
    });

    it('orders a controlled value the caller handed over backwards', () => {
      const { getAllByRole } = renderWithTheme(<RangeSlider {...label} value={[80, 20]} />);
      const { start, end } = thumbs(getAllByRole);
      expect(start).toHaveValue('20');
      expect(end).toHaveValue('80');
    });
  });

  describe('the two fractions (D-024)', () => {
    /*
     * ALWAYS WRITTEN, NEVER CONDITIONALLY. Custom properties inherit, so a
     * nested RangeSlider would otherwise draw its ancestor's range. Break it by
     * emitting a fraction only when it is non-zero and the `[0, 0]` case fails.
     */
    it('are written at every value, including zero and one', () => {
      const atMin = renderWithTheme(<RangeSlider {...label} defaultValue={[0, 0]} />);
      expect(fractionsOf(atMin.container)).toEqual(['0', '0']);

      const full = renderWithTheme(<RangeSlider {...label} defaultValue={[0, 100]} />);
      expect(fractionsOf(full.container)).toEqual(['0', '1']);
    });

    it('are the position within the range, not the raw values', () => {
      const { container } = renderWithTheme(
        <RangeSlider {...label} min={100} max={200} defaultValue={[125, 175]} />,
      );
      expect(fractionsOf(container)).toEqual(['0.25', '0.75']);
    });

    it('survive a zero-width range without dividing by zero', () => {
      const { container } = renderWithTheme(
        <RangeSlider {...label} min={5} max={5} defaultValue={[5, 5]} />,
      );
      expect(fractionsOf(container)).toEqual(['0', '0']);
    });

    it('do not overwrite a caller style, and are not overwritten by one', () => {
      const { container } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} style={{ opacity: 0.5 }} />,
      );
      const root = rootOf(container);
      expect(root).toHaveStyle({ opacity: '0.5' });
      expect(fractionsOf(container)).toEqual(['0.2', '0.8']);
    });
  });

  describe('the thumbs cannot cross (spec §3)', () => {
    it('clamps a start change to the end value, and the input is restored to it', () => {
      const onValueChange = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 50]} onValueChange={onValueChange} />,
      );
      const { start, end } = thumbs(getAllByRole);

      fireInput(start, '90');
      expect(onValueChange).toHaveBeenLastCalledWith([50, 50]);
      expect(start).toHaveValue('50');
      expect(end).toHaveValue('50');
    });

    it('clamps an end change to the start value', () => {
      const onValueChange = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[40, 60]} onValueChange={onValueChange} />,
      );
      const { end } = thumbs(getAllByRole);

      fireInput(end, '5');
      expect(onValueChange).toHaveBeenLastCalledWith([40, 40]);
      expect(end).toHaveValue('40');
    });

    /*
     * The case D-058's addendum measured: a change that clamps to the value
     * already held produces NO state update, and React still restores the
     * input. Without the restore, the DOM would read 95 while the state — and
     * the fill — read 50.
     */
    it('restores an input whose change clamped to the value it already had', () => {
      const onValueChange = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[50, 50]} onValueChange={onValueChange} />,
      );
      const { start } = thumbs(getAllByRole);

      fireInput(start, '95');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(start).toHaveValue('50');
    });

    it('puts the input on top that can move toward the open side', () => {
      const high = renderWithTheme(<RangeSlider {...label} defaultValue={[90, 90]} />);
      expect(rootOf(high.container)).toHaveAttribute('data-thumb-top', 'start');

      const low = renderWithTheme(<RangeSlider {...label} defaultValue={[10, 10]} />);
      expect(rootOf(low.container)).toHaveAttribute('data-thumb-top', 'end');

      // At max, the pair can only be pulled apart by moving the start down.
      const atMax = renderWithTheme(<RangeSlider {...label} defaultValue={[100, 100]} />);
      expect(rootOf(atMax.container)).toHaveAttribute('data-thumb-top', 'start');
    });
  });

  describe('controlled and uncontrolled (RULES §5.5)', () => {
    it('keeps its own value when uncontrolled', () => {
      const { getAllByRole, container } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} />,
      );
      const { start, end } = thumbs(getAllByRole);

      fireInput(start, '30');
      fireInput(end, '70');
      expect(start).toHaveValue('30');
      expect(end).toHaveValue('70');
      expect(fractionsOf(container)).toEqual(['0.3', '0.7']);
    });

    it('obeys a controlled value and never stores one of its own', () => {
      const onValueChange = vi.fn();
      const { getAllByRole, container } = renderWithTheme(
        <RangeSlider {...label} value={[20, 80]} onValueChange={onValueChange} />,
      );
      const { start } = thumbs(getAllByRole);

      fireInput(start, '30');
      expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
      // The owner never updated `value`, so the control goes back to what it
      // was told. A component that stored the value too would show 30.
      expect(start).toHaveValue('20');
      expect(fractionsOf(container)).toEqual(['0.2', '0.8']);
    });

    function Owner() {
      const [value, setValue] = useState<[number, number]>([20, 80]);
      return (
        <>
          <RangeSlider {...label} value={value} onValueChange={setValue} />
          <output>{value.join('–')}</output>
        </>
      );
    }

    it('round-trips through an owner', () => {
      const { getAllByRole, getByRole } = renderWithTheme(<Owner />);
      const { start, end } = thumbs(getAllByRole);
      fireInput(start, '25');
      fireInput(end, '75');
      expect(getByRole('status')).toHaveTextContent('25–75');
      expect(start).toHaveValue('25');
      expect(end).toHaveValue('75');
    });

    it('hands every callback a fresh, ordered, mutable tuple', () => {
      const onValueChange = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} onValueChange={onValueChange} />,
      );
      fireInput(thumbs(getAllByRole).start, '30');
      const first = onValueChange.mock.calls[0]?.[0] as [number, number];
      fireInput(thumbs(getAllByRole).start, '35');
      const second = onValueChange.mock.calls[1]?.[0] as [number, number];
      expect(first).toEqual([30, 80]);
      expect(second).toEqual([35, 80]);
      expect(first).not.toBe(second);
    });
  });

  describe('onValueChange fires continuously; onValueCommit fires once', () => {
    it('reports every input, and commits on pointer release of either thumb', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider
          {...label}
          defaultValue={[10, 90]}
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />,
      );
      const { end } = thumbs(getAllByRole);

      fireInput(end, '80');
      fireInput(end, '70');
      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueCommit).not.toHaveBeenCalled();

      await user.pointer({ target: end, keys: '[MouseLeft]' });
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenLastCalledWith([10, 70]);
    });

    it('does not commit when the user only tabbed through both thumbs', async () => {
      const user = userEvent.setup();
      const onValueCommit = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[10, 90]} onValueCommit={onValueCommit} />,
      );
      const { start, end } = thumbs(getAllByRole);

      await user.tab();
      expect(start).toHaveFocus();
      await user.tab();
      expect(end).toHaveFocus();
      await user.tab();
      expect(end).not.toHaveFocus();
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('commits once on blur after a change, not twice', async () => {
      const user = userEvent.setup();
      const onValueCommit = vi.fn();
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[10, 90]} onValueCommit={onValueCommit} />,
      );
      const { start } = thumbs(getAllByRole);

      start.focus();
      fireInput(start, '55');
      await user.tab();
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenLastCalledWith([55, 90]);
    });
  });

  describe('a track press (spec §2)', () => {
    /*
     * jsdom has no layout, so the geometry is stubbed: a 220px root and a
     * 20px thumb give a 200px travel, and a press at x = 10 + 200p reads as
     * the fraction p. The mapping, the nearer-thumb choice and the focus move
     * are what is under test here; that the press lands on the pixel the
     * native thumb sits at is asserted in the browser suite.
     */
    function layOut(container: HTMLElement) {
      const root = rootOf(container);
      const thumb = container.querySelector('.pp-range-slider__thumb') as HTMLElement;
      root.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 220, height: 40, right: 220, bottom: 40, x: 0, y: 0, toJSON() {} }) as DOMRect;
      thumb.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 20, height: 20, right: 20, bottom: 20, x: 0, y: 0, toJSON() {} }) as DOMRect;
      root.setPointerCapture = vi.fn();
      root.releasePointerCapture = vi.fn();
      return root;
    }

    /*
     * Through fireEvent, which wraps the dispatch in act(): a discrete event's
     * state update flushes in a microtask in a browser, and a bare
     * dispatchEvent here would run the next press against the last render.
     */
    const press = (root: HTMLElement, clientX: number) =>
      fireEvent.pointerDown(root, { clientX, button: 0, pointerId: 1 });
    const move = (root: HTMLElement, clientX: number) =>
      fireEvent.pointerMove(root, { clientX, pointerId: 1 });

    it('moves the nearer thumb to the pressed value and focuses its input', () => {
      const onValueChange = vi.fn();
      const { container, getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} onValueChange={onValueChange} />,
      );
      const root = layOut(container);
      const { start, end } = thumbs(getAllByRole);

      press(root, 10 + 200 * 0.3); // 30 — nearer the start
      expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
      expect(start).toHaveFocus();
      expect(root.setPointerCapture).toHaveBeenCalledTimes(1);

      press(root, 10 + 200 * 0.9); // 90 — nearer the end
      expect(onValueChange).toHaveBeenLastCalledWith([30, 90]);
      expect(end).toHaveFocus();
    });

    it('keeps dragging the thumb it picked, and commits once on release', () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { container } = renderWithTheme(
        <RangeSlider
          {...label}
          defaultValue={[20, 80]}
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
        />,
      );
      const root = layOut(container);

      press(root, 10 + 200 * 0.3);
      for (const p of [0.4, 0.5, 0.6]) move(root, 10 + 200 * p);
      expect(onValueChange).toHaveBeenLastCalledWith([60, 80]);
      expect(onValueCommit).not.toHaveBeenCalled();

      fireEvent.pointerUp(root, { pointerId: 1 });
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenLastCalledWith([60, 80]);

      // Released: a move now moves nothing.
      const calls = onValueChange.mock.calls.length;
      move(root, 10 + 200 * 0.1);
      expect(onValueChange).toHaveBeenCalledTimes(calls);
    });

    it('separates a coincident pair by the side of the press', () => {
      const onValueChange = vi.fn();
      const { container, getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[50, 50]} onValueChange={onValueChange} />,
      );
      const root = layOut(container);
      const { start, end } = thumbs(getAllByRole);

      press(root, 10 + 200 * 0.2);
      expect(onValueChange).toHaveBeenLastCalledWith([20, 50]);
      expect(start).toHaveFocus();

      press(root, 10 + 200 * 0.8);
      expect(onValueChange).toHaveBeenLastCalledWith([20, 80]);
      expect(end).toHaveFocus();
    });

    it('snaps the pressed value to the step grid', () => {
      const onValueChange = vi.fn();
      const { container } = renderWithTheme(
        <RangeSlider {...label} step={25} defaultValue={[0, 100]} onValueChange={onValueChange} />,
      );
      press(layOut(container), 10 + 200 * 0.3);
      expect(onValueChange).toHaveBeenLastCalledWith([25, 100]);
    });

    it('ignores a press when disabled, and a press that landed on a thumb', () => {
      const onValueChange = vi.fn();
      const disabled = renderWithTheme(
        <RangeSlider {...label} disabled defaultValue={[20, 80]} onValueChange={onValueChange} />,
      );
      press(layOut(disabled.container), 10 + 200 * 0.3);
      expect(onValueChange).not.toHaveBeenCalled();

      const live = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} onValueChange={onValueChange} />,
      );
      const root = layOut(live.container);
      // A press on a native thumb has the input as its target: the platform's
      // drag takes it, and the root must not fight it.
      fireEvent.pointerDown(thumbs(live.getAllByRole).start, {
        clientX: 10 + 200 * 0.6,
        button: 0,
        pointerId: 1,
      });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(root.setPointerCapture).not.toHaveBeenCalled();
    });

    it('still calls a caller\'s onPointerDown, and stands down if it prevented the default', () => {
      const onPointerDown = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
      const onValueChange = vi.fn();
      const { container } = renderWithTheme(
        <RangeSlider
          {...label}
          defaultValue={[20, 80]}
          onPointerDown={onPointerDown}
          onValueChange={onValueChange}
        />,
      );
      press(layOut(container), 10 + 200 * 0.3);
      expect(onPointerDown).toHaveBeenCalledTimes(1);
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility (spec §5)', () => {
    it('is a group of two native sliders, named Minimum and Maximum by default', () => {
      const { getByRole, getAllByRole } = renderWithTheme(
        <RangeSlider {...label} defaultValue={[20, 80]} />,
      );
      expect(getByRole('group')).toHaveAccessibleName('Price');
      const { start, end } = thumbs(getAllByRole);
      expect(start).toHaveAccessibleName('Minimum');
      expect(end).toHaveAccessibleName('Maximum');
      // Not set by us: ARIA requires aria-valuenow for `slider` and the
      // element supplies it.
      expect(start).not.toHaveAttribute('aria-valuenow');
      expect(start).toHaveAttribute('type', 'range');
    });

    it('takes thumb names from thumbLabels', () => {
      const { getAllByRole } = renderWithTheme(
        <RangeSlider {...label} thumbLabels={['Lowest price', 'Highest price']} />,
      );
      const { start, end } = thumbs(getAllByRole);
      expect(start).toHaveAccessibleName('Lowest price');
      expect(end).toHaveAccessibleName('Highest price');
    });

    it('is named as a group by a group Field, and both thumbs hear its description and error', () => {
      const { getByRole, getAllByRole } = renderWithTheme(
        <Field label="Price" group description="Per night." error="Too wide.">
          <RangeSlider defaultValue={[20, 80]} />
        </Field>,
      );
      expect(getByRole('group')).toHaveAccessibleName('Price');
      for (const control of getAllByRole('slider')) {
        expect(control).toHaveAccessibleDescription('Per night. Too wide.');
        expect(control).not.toHaveAttribute('id');
      }
    });

    it('announces a formatted value per thumb only when a locale is given', () => {
      const withLocale = renderWithTheme(
        <RangeSlider
          {...label}
          max={500}
          defaultValue={[50, 250]}
          locale="en-GB"
          formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
        />,
      );
      const { start, end } = thumbs(withLocale.getAllByRole);
      expect(start).toHaveAttribute('aria-valuetext', '£50');
      expect(end).toHaveAttribute('aria-valuetext', '£250');

      const without = renderWithTheme(<RangeSlider aria-label="Plain" max={500} defaultValue={[50, 250]} />);
      expect(thumbs(without.getAllByRole).start).not.toHaveAttribute('aria-valuetext');
    });

    it('hides the track and the visible thumbs from the accessibility tree', () => {
      const { container } = renderWithTheme(<RangeSlider {...label} />);
      expect(container.querySelector('.pp-range-slider__track')).toHaveAttribute('aria-hidden', 'true');
      for (const thumb of container.querySelectorAll('.pp-range-slider__thumb')) {
        expect(thumb).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('puts the inputs before the thumbs in source order, for the ring\'s sibling selector', () => {
      const { container } = renderWithTheme(<RangeSlider {...label} />);
      const children = Array.from(rootOf(container).children).map((el) => el.className);
      expect(children).toEqual([
        'pp-range-slider__track',
        'pp-range-slider__control',
        'pp-range-slider__control',
        'pp-range-slider__thumb',
        'pp-range-slider__thumb',
      ]);
    });

    it('has no axe violations, in a group field and standalone', async () => {
      const inField = renderWithTheme(
        <Field label="Price" group description="Per night.">
          <RangeSlider defaultValue={[20, 80]} />
        </Field>,
      );
      await expectNoA11yViolations(inField.container);

      const standalone = renderWithTheme(<RangeSlider {...label} defaultValue={[20, 80]} />);
      await expectNoA11yViolations(standalone.container);
    });
  });

  describe('structure and the API surface (RULES §5)', () => {
    it('forwards the ref to the root, which is the group', () => {
      const ref = createRef<HTMLSpanElement>();
      renderWithTheme(<RangeSlider {...label} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current).toHaveClass('pp-range-slider');
      expect(ref.current).toHaveAttribute('role', 'group');
    });

    it('merges className onto the root', () => {
      const { container } = renderWithTheme(<RangeSlider {...label} className="mine" />);
      expect(rootOf(container)).toHaveClass('pp-range-slider', 'mine');
    });

    it('spreads the rest onto the root, and name onto both inputs (spec §7)', () => {
      const { getAllByRole, container } = renderWithTheme(
        <RangeSlider {...label} name="price" data-testid="range" />,
      );
      expect(rootOf(container)).toHaveAttribute('data-testid', 'range');
      for (const control of getAllByRole('slider')) {
        expect(control).toHaveAttribute('name', 'price');
      }
    });

    it('submits start then end under one name', () => {
      const { container } = renderWithTheme(
        <form>
          <RangeSlider {...label} name="price" defaultValue={[20, 80]} />
        </form>,
      );
      const data = new FormData(container.querySelector('form') as HTMLFormElement);
      expect(data.getAll('price')).toEqual(['20', '80']);
    });

    it('never sets the HTML size attribute from the size prop', () => {
      const { getAllByRole } = renderWithTheme(<RangeSlider {...label} size="lg" />);
      for (const control of getAllByRole('slider')) {
        expect(control).not.toHaveAttribute('size');
      }
    });
  });
});

/**
 * React installs its own value setter on the input, so assigning `.value` and
 * dispatching `input` is ignored — the native setter has to be called through
 * the prototype for React to see the change. As in Slider.test.tsx.
 */
function fireInput(control: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(control, value);
  control.dispatchEvent(new Event('input', { bubbles: true }));
}
