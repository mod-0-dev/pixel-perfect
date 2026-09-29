import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionProps } from './Accordion';

function Basic(props: Partial<AccordionProps> & { keepMounted?: boolean }) {
  const { keepMounted = false, ...rest } = props;
  return (
    <Accordion {...(rest as AccordionProps)}>
      <AccordionItem value="a">
        <AccordionTrigger>Alpha</AccordionTrigger>
        <AccordionContent keepMounted={keepMounted}>
          <input aria-label="Name" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Beta</AccordionTrigger>
        <AccordionContent>Beta body</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c" disabled>
        <AccordionTrigger>Gamma</AccordionTrigger>
        <AccordionContent>Gamma body</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a stack of headings holding buttons, each wired to a region, closed by default (spec §1, §6)', () => {
    const { getByRole, container, queryByRole } = renderWithTheme(<Basic />);
    expect(container.querySelector('.pp-accordion')).not.toBeNull();
    const heading = getByRole('heading', { name: 'Alpha', level: 3 });
    expect(heading.tagName).toBe('H3');
    expect(heading).toHaveClass('pp-accordion__header');
    const trigger = getByRole('button', { name: 'Alpha' });
    expect(trigger).toHaveClass('pp-accordion__trigger');
    expect(trigger.parentElement).toBe(heading);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(trigger.querySelector('.pp-accordion__chevron')).not.toBeNull();
    const item = trigger.closest('.pp-accordion__item');
    expect(item).toHaveAttribute('data-state', 'closed');
    // The region exists, empty and hidden, labelled by its trigger; Radix
    // points `aria-controls` at it only while it is open (D-075 §5).
    expect(trigger).not.toHaveAttribute('aria-controls');
    const region = item!.querySelector('.pp-accordion__content') as HTMLElement;
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-labelledby', trigger.id);
    expect(region).toHaveAttribute('data-state', 'closed');
    expect(region).toHaveAttribute('hidden');
    expect(region).toBeEmptyDOMElement();
    expect(queryByRole('region')).toBeNull();
    expect(getByRole('button', { name: 'Gamma' })).toBeDisabled();
    expect(getByRole('button', { name: 'Gamma' }).closest('.pp-accordion__item')).toHaveAttribute('data-disabled');
  });

  it('single: opening one closes the other, the open one closes on a second press, and the body carries the children', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole } = renderWithTheme(<Basic onValueChange={onValueChange} />);
    const alpha = getByRole('button', { name: 'Alpha' });
    const beta = getByRole('button', { name: 'Beta' });
    await user.click(alpha);
    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(alpha).toHaveAttribute('aria-expanded', 'true');
    const region = getByRole('region', { name: 'Alpha' });
    expect(region).toHaveAttribute('data-state', 'open');
    expect(alpha).toHaveAttribute('aria-controls', region.id);
    expect(region.firstElementChild).toHaveClass('pp-accordion__body');
    expect(getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    await user.click(beta);
    expect(beta).toHaveAttribute('aria-expanded', 'true');
    expect(alpha).toHaveAttribute('aria-expanded', 'false');
    await user.click(beta);
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(beta).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapsible={false} keeps the open item open and marks its trigger aria-disabled (spec §2)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic defaultValue="a" collapsible={false} />);
    const alpha = getByRole('button', { name: 'Alpha' });
    expect(alpha).toHaveAttribute('aria-expanded', 'true');
    expect(alpha).toHaveAttribute('aria-disabled', 'true');
    await user.click(alpha);
    expect(alpha).toHaveAttribute('aria-expanded', 'true');
  });

  it('multiple: any number open, with an array value (spec §2)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole } = renderWithTheme(<Basic multiple defaultValue={['a']} onValueChange={onValueChange} />);
    const alpha = getByRole('button', { name: 'Alpha' });
    const beta = getByRole('button', { name: 'Beta' });
    expect(alpha).toHaveAttribute('aria-expanded', 'true');
    await user.click(beta);
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
    expect(alpha).toHaveAttribute('aria-expanded', 'true');
    expect(beta).toHaveAttribute('aria-expanded', 'true');
    await user.click(alpha);
    expect(onValueChange).toHaveBeenLastCalledWith(['b']);
  });

  it('is controllable in both shapes', async () => {
    const user = userEvent.setup();
    function Single() {
      const [value, setValue] = useState('b');
      return (
        <>
          <Basic value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const single = renderWithTheme(<Single />);
    expect(single.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(single.getByRole('button', { name: 'Alpha' }));
    expect(single.container.querySelector('output')).toHaveTextContent('a');
    single.unmount();

    function Many() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <>
          <Basic multiple value={value} onValueChange={setValue} />
          <output>{value.join(',')}</output>
        </>
      );
    }
    const many = renderWithTheme(<Many />);
    await user.click(many.getByRole('button', { name: 'Alpha' }));
    await user.click(many.getByRole('button', { name: 'Beta' }));
    expect(many.container.querySelector('output')).toHaveTextContent('a,b');
  });

  it('the arrows move between the triggers, skipping a disabled one, and Home / End go to the ends', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>Alpha</AccordionTrigger>
          <AccordionContent>A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b" disabled>
          <AccordionTrigger>Beta</AccordionTrigger>
          <AccordionContent>B</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger>Gamma</AccordionTrigger>
          <AccordionContent>C</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    getByRole('button', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(getByRole('button', { name: 'Gamma' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(getByRole('button', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(getByRole('button', { name: 'Gamma' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(getByRole('button', { name: 'Alpha' })).toHaveFocus();
  });

  it('headingLevel sets every heading, once, from the root (spec §1)', () => {
    const { getAllByRole } = renderWithTheme(<Basic headingLevel={2} />);
    const headings = getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
    headings.forEach((h) => expect(h.tagName).toBe('H2'));
  });

  it('disabled on the root disables every trigger', () => {
    const { getByRole } = renderWithTheme(<Basic disabled />);
    expect(getByRole('button', { name: 'Alpha' })).toBeDisabled();
    expect(getByRole('button', { name: 'Beta' })).toBeDisabled();
  });

  it('keepMounted keeps a closed panel\'s children, hidden, and its input keeps its value (spec §5)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic defaultValue="a" keepMounted />);
    await user.type(getByRole('textbox', { name: 'Name' }), 'Ada');
    await user.click(getByRole('button', { name: 'Beta' }));
    const kept = getByRole('textbox', { name: 'Name', hidden: true }).closest('.pp-accordion__content') as HTMLElement;
    expect(kept).toHaveAttribute('data-state', 'closed');
    expect(kept).toHaveAttribute('hidden');
    expect(getByRole('textbox', { name: 'Name', hidden: true })).toHaveValue('Ada');
    await user.click(getByRole('button', { name: 'Alpha' }));
    expect(kept).not.toHaveAttribute('hidden');
    expect(getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
  });

  it('forwards refs and merges className and style onto every part', () => {
    const root = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    const trigger = createRef<HTMLButtonElement>();
    const content = createRef<HTMLDivElement>();
    renderWithTheme(
      <Accordion ref={root} defaultValue="a" className="r" style={{ opacity: 0.5 }} data-testid="root">
        <AccordionItem ref={item} value="a" className="i" style={{ order: 1 }}>
          <AccordionTrigger ref={trigger} className="t" style={{ order: 2 }}>
            A
          </AccordionTrigger>
          <AccordionContent ref={content} className="c" style={{ order: 3 }}>
            A body
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(root.current).toHaveClass('pp-accordion', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(item.current).toHaveClass('pp-accordion__item', 'i');
    expect(trigger.current).toHaveClass('pp-accordion__trigger', 't');
    expect(trigger.current?.tagName).toBe('BUTTON');
    expect(content.current).toHaveClass('pp-accordion__content', 'c');
    expect(content.current).toHaveStyle({ order: '3' });
  });

  it('throws a readable error for a part outside the root, and for content outside an item', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<AccordionTrigger>Lost</AccordionTrigger>)).toThrow(/<AccordionTrigger> must be rendered inside <Accordion>/);
    expect(() =>
      renderWithTheme(
        <Accordion>
          <AccordionContent>Lost</AccordionContent>
        </Accordion>,
      ),
    ).toThrow(/<AccordionContent> must be rendered inside <AccordionItem>/);
    error.mockRestore();
  });

  it('has no axe violations, one open, in both themes', async () => {
    const light = renderWithTheme(<Basic defaultValue="a" />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Basic multiple defaultValue={['a', 'b']} />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
    dark.unmount();
  });
});
