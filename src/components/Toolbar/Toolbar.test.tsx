import userEvent from '@testing-library/user-event';
import { createRef, useState, type Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl/SegmentedControl';
import { Separator } from '../Separator/Separator';
import { Toggle } from '../Toggle/Toggle';
import { Toolbar, type ToolbarProps } from './Toolbar';

const Glyph = () => <svg viewBox="0 0 24 24" />;

function Formatting(props: Partial<ToolbarProps> & { ref?: Ref<HTMLDivElement> } = {}) {
  return (
    <Toolbar label="Formatting" {...props}>
      <ButtonGroup label="Style">
        <Toggle aria-label="Bold">B</Toggle>
        <Toggle aria-label="Italic">I</Toggle>
      </ButtonGroup>
      <Separator orientation="vertical" />
      <IconButton label="Link">
        <Glyph />
      </IconButton>
      <IconButton label="Image" disabled>
        <Glyph />
      </IconButton>
      <Button>Publish</Button>
    </Toolbar>
  );
}

const toolbar = () => document.querySelector('[role="toolbar"]') as HTMLElement;
const control = (name: string) => toolbar().querySelector(`[aria-label="${name}"]`) ?? toolbar().querySelector(`button:not([aria-label])`);
const stops = () => Array.from(toolbar().querySelectorAll('[tabindex="0"]')).map((n) => n.getAttribute('aria-label') ?? n.textContent);
const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent;

describe('Toolbar', () => {
  it('is a named toolbar with data-orientation; aria-orientation only when vertical; the first control is the stop and the rest are -1; a Separator is not a control; a ButtonGroup keeps its group (spec §1, §5, §7)', () => {
    const { getByRole, unmount } = renderWithTheme(<Formatting />);
    const root = getByRole('toolbar', { name: 'Formatting' });
    expect(root).toHaveClass('pp-toolbar');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(root).not.toHaveAttribute('aria-orientation');
    expect(root).toHaveAttribute('data-pp-gap', '2');
    expect(stops()).toEqual(['Bold']);
    expect(control('Italic')).toHaveAttribute('tabindex', '-1');
    expect(control('Link')).toHaveAttribute('tabindex', '-1');
    expect(control('Publish')).toHaveAttribute('tabindex', '-1');
    /* Disabled: not a control, nothing written. */
    expect(control('Image')).not.toHaveAttribute('tabindex');
    expect(root.querySelector('.pp-separator')).not.toHaveAttribute('tabindex');
    expect(getByRole('group', { name: 'Style' })).toHaveClass('pp-button-group');
    unmount();
    renderWithTheme(<Formatting orientation="vertical" />);
    expect(toolbar()).toHaveAttribute('aria-orientation', 'vertical');
    expect(toolbar()).toHaveAttribute('data-orientation', 'vertical');
  });

  it('walks the controls with the arrows, into and out of the group, skipping the disabled one, wrapping at the ends; Home and End jump; the stop follows focus (spec §2, §3, §5)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Formatting />);
    await user.tab();
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Italic');
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Link');
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Publish');
    expect(stops()).toEqual(['Publish']);
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowLeft}');
    expect(focusedName()).toBe('Publish');
    await user.keyboard('{Home}');
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('Publish');
    /* Vertical arrows do nothing in a row. */
    await user.keyboard('{ArrowDown}');
    expect(focusedName()).toBe('Publish');
  });

  it('stops at the ends with loop={false}; vertical answers Down and Up and ignores Left and Right (spec §3)', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithTheme(<Formatting loop={false} />);
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{End}{ArrowRight}');
    expect(focusedName()).toBe('Publish');
    unmount();
    renderWithTheme(<Formatting orientation="vertical" />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowDown}');
    expect(focusedName()).toBe('Italic');
    await user.keyboard('{ArrowUp}');
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowUp}');
    expect(focusedName()).toBe('Publish');
  });

  it('mirrors Left and Right under direction: rtl (spec §3)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Formatting style={{ direction: 'rtl' }} />);
    await user.tab();
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowLeft}');
    expect(focusedName()).toBe('Italic');
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Bold');
  });

  it('remembers the last control focused as the stop, and Tab leaves past the rest; a click makes its control the stop (spec §2)', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <>
        <button>Before</button>
        <Formatting />
        <button>After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(focusedName()).toBe('Link');
    await user.tab();
    expect(focusedName()).toBe('After');
    await user.tab({ shift: true });
    expect(focusedName()).toBe('Link');
    expect(stops()).toEqual(['Link']);
    await user.click(control('Publish') as HTMLElement);
    expect(stops()).toEqual(['Publish']);
  });

  it('hands the stop to the first control when the stop unmounts, and picks up a control that mounts or is enabled later (spec §1)', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [more, setMore] = useState(true);
      const [off, setOff] = useState(true);
      return (
        <>
          <Toolbar label="Editing">
            <Button>Cut</Button>
            {more ? <Button>Copy</Button> : null}
            <Button disabled={off}>Paste</Button>
          </Toolbar>
          <button onClick={() => setMore(false)}>Drop Copy</button>
          <button onClick={() => setOff(false)}>Enable Paste</button>
        </>
      );
    }
    const { getByRole } = renderWithTheme(<Owner />);
    const paste = () => getByRole('button', { name: 'Paste' });
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(stops()).toEqual(['Copy']);
    await user.click(getByRole('button', { name: 'Drop Copy' }));
    expect(stops()).toEqual(['Cut']);
    expect(paste()).not.toHaveAttribute('tabindex');
    await user.click(getByRole('button', { name: 'Enable Paste' }));
    await vi.waitFor(() => expect(paste()).toHaveAttribute('tabindex', '-1'));
    await user.click(getByRole('button', { name: 'Cut' }));
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Paste');
  });

  it('leaves the arrows and Home/End to a text field; the field is never the stop, so Tab out and back lands on a button the arrows work from (spec §4, D-098 §1)', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <>
        <Toolbar label="Table">
          <Button>Filter</Button>
          <Input type="search" aria-label="Find" defaultValue="abc" />
          <Button>Export</Button>
        </Toolbar>
        <button>After</button>
      </>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('Find');
    /* Focused, but not the stop. */
    expect(stops()).toEqual(['Filter']);
    const field = document.activeElement as HTMLInputElement;
    field.setSelectionRange(1, 1);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(2);
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(field);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(field);
    /* Out past the rest, and back onto the remembered button, from which End reaches the control after the field. */
    await user.tab();
    expect(focusedName()).toBe('After');
    await user.tab({ shift: true });
    expect(focusedName()).toBe('Filter');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('Export');
    /* A click in the field does not make it the stop either. */
    await user.click(field);
    expect(stops()).toEqual(['Export']);
  });

  it('calls the consumer\'s onKeyDown first and stands down when it prevented; gap writes data-pp-gap; ref, className, style and rest; label is required (RULES §5)', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight') event.preventDefault();
    });
    const ref = createRef<HTMLDivElement>();
    renderWithTheme(<Formatting ref={ref} gap="4" className="mine" style={{ opacity: 0.5 }} data-testid="tb" onKeyDown={onKeyDown} />);
    expect(ref.current).toBe(toolbar());
    expect(toolbar()).toHaveClass('pp-toolbar', 'mine');
    expect(toolbar()).toHaveStyle({ opacity: '0.5' });
    expect(toolbar()).toHaveAttribute('data-testid', 'tb');
    expect(toolbar()).toHaveAttribute('data-pp-gap', '4');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onKeyDown).toHaveBeenCalled();
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('Publish');
    // @ts-expect-error label is required
    void (<Toolbar />);
  });

  it('walks a SegmentedControl\'s segments as controls of its own, focus without selection, as the APG toolbar walks its radio group; Space selects; Tab out and back lands on the segment focused last (spec §5, D-108 §2)', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <>
        <Button>Before</Button>
        <Toolbar label="Formatting">
          <Toggle aria-label="Bold">B</Toggle>
          <SegmentedControl label="Alignment" defaultValue="left">
            <SegmentedControlItem value="left">Left</SegmentedControlItem>
            <SegmentedControlItem value="center">Center</SegmentedControlItem>
            <SegmentedControlItem value="right">Right</SegmentedControlItem>
          </SegmentedControl>
          <Button>Publish</Button>
        </Toolbar>
        <Button>After</Button>
      </>,
    );
    const radio = (name: string) => toolbar().querySelector(`input[value="${name}"]`) as HTMLInputElement;
    const checked = () => Array.from(toolbar().querySelectorAll<HTMLInputElement>('input:checked')).map((n) => n.value);
    /* Every radio is a control: one stop over five. */
    expect(toolbar().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(radio('center')).toHaveAttribute('tabindex', '-1');

    await user.tab();
    await user.tab();
    expect(focusedName()).toBe('Bold');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radio('left'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radio('center'));
    /* The arrow moved focus and nothing else. */
    expect(checked()).toEqual(['left']);
    await user.keyboard(' ');
    expect(checked()).toEqual(['center']);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(focusedName()).toBe('Publish');
    expect(checked()).toEqual(['center']);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(radio('right'));
    await user.tab();
    expect(focusedName()).toBe('After');
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(radio('right'));
    expect(checked()).toEqual(['center']);
  });

  it('renders on the server with the role and no tabindex written', () => {
    const html = renderToString(<Formatting />);
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Formatting"');
    expect(html).not.toContain('tabindex');
  });

  it('passes axe in both themes', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(<Formatting />, { theme });
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
