import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from './SegmentedControl';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE: the checked fill, the seams, the
 * ring and the arrow keys. The first three are computed styles, and jsdom
 * implements neither cascade layers nor `:has()`; the arrows are the
 * browser's (D-039 §5) and jsdom implements none of them. All four are in
 * tests/visual/harness.spec.ts. What is asserted here is who owns the
 * selection and what the DOM says.
 */

function Theme(props: Partial<SegmentedControlProps>) {
  return (
    <SegmentedControl label="Theme" {...props}>
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  );
}

const items = () => [...document.querySelectorAll<HTMLElement>('.pp-segmented-control__item')];

describe('SegmentedControl', () => {
  it('is a named radiogroup of radios that share one generated name; ButtonGroup and Button by the two-class contract (spec §1, §3)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Theme defaultValue="light" />);
    const group = getByRole('radiogroup', { name: 'Theme' });
    expect(group).toHaveClass('pp-button-group', 'pp-segmented-control');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).toHaveAttribute('data-pp-tone', 'neutral');
    expect(group).not.toHaveAttribute('aria-orientation');

    const radios = getAllByRole('radio') as HTMLInputElement[];
    expect(radios.map((r) => r.value)).toEqual(['system', 'light', 'dark']);
    expect(radios[0]!.name).toBeTruthy();
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    expect(getByRole('radio', { name: 'Light' })).toBeChecked();

    for (const item of items()) {
      expect(item.tagName).toBe('LABEL');
      expect(item).toHaveClass('pp-button', 'pp-segmented-control__item');
      expect(item).toHaveAttribute('data-variant', 'outline');
      expect(item.querySelector('.pp-button__content')).not.toBeNull();
    }
    expect(items().map((i) => i.getAttribute('data-state'))).toEqual(['unchecked', 'checked', 'unchecked']);
  });

  it('gives two unnamed groups two names, and takes an explicit one', () => {
    renderWithTheme(
      <>
        <Theme />
        <Theme name="appearance" />
        <Theme />
      </>,
    );
    const names = [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((r) => r.name);
    expect(names[0]).not.toBe(names[6]);
    expect(names.slice(3, 6)).toEqual(['appearance', 'appearance', 'appearance']);
  });

  it('is uncontrolled: seeds from defaultValue, follows the user, and reports each change once', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole } = renderWithTheme(<Theme defaultValue="system" onValueChange={onValueChange} />);
    await user.click(getByRole('radio', { name: 'Dark' }));
    expect(getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('dark');
    // A checked radio clicked again changes nothing and reports nothing.
    await user.click(getByRole('radio', { name: 'Dark' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('selects when the segment\'s text is clicked — the label activates the radio', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithTheme(<Theme defaultValue="system" />);
    await user.click(getByText('Light'));
    expect(getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(items()[1]).toHaveAttribute('data-state', 'checked');
  });

  it('is controlled: a pinned group does not move, and follows its owner', async () => {
    const user = userEvent.setup();
    const pinned = renderWithTheme(<Theme value="light" />);
    await user.click(pinned.getByRole('radio', { name: 'Dark' }));
    expect(pinned.getByRole('radio', { name: 'Light' })).toBeChecked();
    pinned.unmount();

    function Owner() {
      const [value, setValue] = useState('system');
      return (
        <>
          <Theme value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const owned = renderWithTheme(<Owner />);
    await user.click(owned.getByRole('radio', { name: 'Dark' }));
    expect(owned.getByRole('status')).toHaveTextContent('dark');
    expect(owned.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('selects nothing by default, and data-state is omitted outside a group', () => {
    const { getAllByRole } = renderWithTheme(<Theme />);
    expect((getAllByRole('radio') as HTMLInputElement[]).some((r) => r.checked)).toBe(false);
    document.body.innerHTML = '';
    renderWithTheme(<SegmentedControlItem value="lone">Lone</SegmentedControlItem>);
    expect(items()[0]).not.toHaveAttribute('data-state');
  });

  it('disables the group or one segment; an explicit item prop beats the group', () => {
    const { getAllByRole, getByRole } = renderWithTheme(
      <SegmentedControl label="View" disabled>
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week" disabled={false}>
          Week
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    const [day, week] = getAllByRole('radio');
    expect(day).toBeDisabled();
    expect(week).toBeEnabled();
    expect(getByRole('radiogroup')).toHaveAttribute('data-disabled');
    expect(items()[0]).toHaveAttribute('data-disabled');
    expect(items()[1]).not.toHaveAttribute('data-disabled');
  });

  it('marks every radio required, and the group aria-required', () => {
    const { getAllByRole, getByRole } = renderWithTheme(<Theme required />);
    for (const radio of getAllByRole('radio')) expect(radio).toBeRequired();
    expect(getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
  });

  it('writes size on the group and every segment; vertical sets aria-orientation', () => {
    const { getByRole } = renderWithTheme(<Theme size="sm" orientation="vertical" />);
    expect(getByRole('radiogroup')).toHaveAttribute('data-size', 'sm');
    expect(getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'vertical');
    expect(items().map((i) => i.getAttribute('data-size'))).toEqual(['sm', 'sm', 'sm']);
  });

  it('is named and described by the Field around it, and takes its size, disabled and required (spec §4)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(
      <Field label="Billing period" description="Change it any time." error="Pick one." size="lg" required group>
        <SegmentedControl>
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
      </Field>,
    );
    const group = getByRole('radiogroup', { name: 'Billing period' });
    expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('data-size', 'lg');
    for (const radio of getAllByRole('radio')) expect(radio).toBeRequired();
  });

  it('lets an explicit label win inside a field, and warns with no name at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole, unmount } = renderWithTheme(
      <Field label="Outer" group>
        <SegmentedControl label="Inner">
          <SegmentedControlItem value="a">A</SegmentedControlItem>
        </SegmentedControl>
      </Field>,
    );
    expect(getByRole('radiogroup', { name: 'Inner' })).not.toHaveAttribute('aria-labelledby');
    expect(warn).not.toHaveBeenCalled();
    unmount();
    renderWithTheme(
      <SegmentedControl>
        <SegmentedControlItem value="a">A</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a name'));
    warn.mockRestore();
  });

  it('splits like a native control: ref and the rest to the radio, className and style to the label; the root takes ref, className and rest (D-039 §1)', () => {
    const root = createRef<HTMLDivElement>();
    const input = createRef<HTMLInputElement>();
    renderWithTheme(
      <SegmentedControl ref={root} label="L" className="mine" style={{ opacity: 0.5 }} data-testid="sc">
        <SegmentedControlItem ref={input} value="a" className="seg" style={{ order: 2 }} data-testid="radio" aria-describedby="hint">
          A
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(root.current).toHaveClass('pp-segmented-control', 'mine');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'sc');
    expect(input.current).toHaveAttribute('type', 'radio');
    expect(input.current).toHaveAttribute('data-testid', 'radio');
    expect(input.current).toHaveAttribute('aria-describedby', 'hint');
    expect(items()[0]).toHaveClass('seg');
    expect(items()[0]).toHaveStyle({ order: '2' });
    expect(input.current).not.toHaveClass('seg');
  });

  it('keeps its role and its radios, whatever an untyped caller passes (D-031)', () => {
    const untyped = { role: 'group' } as unknown as SegmentedControlProps;
    const item = { type: 'checkbox', checked: true } as unknown as { value: string };
    const { getByRole } = renderWithTheme(
      <SegmentedControl label="L" {...untyped}>
        <SegmentedControlItem {...item} value="a">
          A
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(getByRole('radiogroup')).toBeInTheDocument();
    expect(getByRole('radio', { name: 'A' })).not.toBeChecked();
  });

  it('chains a native onChange, which may veto with preventDefault (D-039 §6)', async () => {
    const user = userEvent.setup();
    const seen = vi.fn();
    const { getByRole } = renderWithTheme(
      <SegmentedControl label="L" defaultValue="a">
        <SegmentedControlItem value="a">A</SegmentedControlItem>
        <SegmentedControlItem value="b" onChange={(event) => seen(event.target.value)}>
          B
        </SegmentedControlItem>
        <SegmentedControlItem value="c" onChange={(event) => event.preventDefault()}>
          C
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    await user.click(getByRole('radio', { name: 'B' }));
    expect(seen).toHaveBeenCalledWith('b');
    expect(getByRole('radio', { name: 'B' })).toBeChecked();
    await user.click(getByRole('radio', { name: 'C' }));
    expect(getByRole('radio', { name: 'B' })).toBeChecked();
  });

  it('submits its value with a form', async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    const { getByRole } = renderWithTheme(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget).get('period') as string | null;
        }}
      >
        <SegmentedControl label="Period" name="period" defaultValue="monthly">
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(getByRole('radio', { name: 'Yearly' }));
    await user.click(getByRole('button', { name: 'Save' }));
    expect(submitted).toBe('yearly');
  });

  it('has no axe violations in both themes, standalone and in a field', async () => {
    const light = renderWithTheme(<Theme defaultValue="light" size="sm" />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(
      <Field label="Billing period" error="Pick one." group>
        <SegmentedControl disabled>
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
      </Field>,
      { theme: 'dark' },
    );
    await expectNoA11yViolations(dark.container);
  });
});
