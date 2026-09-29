import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

function Basic(props: Partial<React.ComponentProps<typeof Tabs>> & { keepMounted?: boolean }) {
  const { keepMounted = false, ...rest } = props;
  return (
    <Tabs defaultValue="a" {...rest}>
      <TabsList>
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b">Beta</TabsTrigger>
        <TabsTrigger value="c" disabled>
          Gamma
        </TabsTrigger>
        <TabsTrigger value="d">Delta</TabsTrigger>
      </TabsList>
      <TabsContent value="a" keepMounted={keepMounted}>
        <input aria-label="Name" />
      </TabsContent>
      <TabsContent value="b">Beta panel</TabsContent>
      <TabsContent value="c">Gamma panel</TabsContent>
      <TabsContent value="d">Delta panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a tablist of tabs wired to their panels, with the state and orientation attributes (spec §1, §4)', () => {
    const { getByRole, container } = renderWithTheme(<Basic />);
    const list = getByRole('tablist');
    expect(list).toHaveClass('pp-tabs__list');
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    expect(list.parentElement).toHaveClass('pp-tabs__strip');
    expect(container.querySelector('.pp-tabs')).toHaveAttribute('data-orientation', 'horizontal');
    const alpha = getByRole('tab', { name: 'Alpha' });
    const beta = getByRole('tab', { name: 'Beta' });
    expect(alpha.tagName).toBe('BUTTON');
    expect(alpha).toHaveClass('pp-tabs__tab');
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(alpha).toHaveAttribute('data-state', 'active');
    expect(alpha).toHaveAttribute('data-pp-tone', 'accent');
    expect(beta).toHaveAttribute('aria-selected', 'false');
    expect(beta).toHaveAttribute('data-state', 'inactive');
    expect(beta).toHaveAttribute('tabindex', '-1');
    expect(getByRole('tab', { name: 'Gamma' })).toBeDisabled();
    const panel = getByRole('tabpanel');
    expect(panel).toHaveClass('pp-tabs__panel');
    expect(panel).toHaveAttribute('aria-labelledby', alpha.id);
    expect(alpha).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('data-state', 'active');
    expect(panel).toHaveAttribute('tabindex', '0');
    // An inactive panel is an empty, hidden element: its children are not rendered.
    expect(screen.queryByText('Beta panel')).toBeNull();
    const inactive = document.querySelectorAll('.pp-tabs__panel[data-state="inactive"]');
    expect(inactive).toHaveLength(3);
    inactive.forEach((n) => {
      expect(n).toHaveAttribute('hidden');
      expect(n).toBeEmptyDOMElement();
    });
  });

  it('selects on click, and is controllable', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole } = renderWithTheme(<Basic onValueChange={onValueChange} />);
    await user.click(getByRole('tab', { name: 'Beta' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(getByRole('tabpanel')).toHaveTextContent('Beta panel');

    function Owner() {
      const [value, setValue] = useState('d');
      return (
        <>
          <Basic value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const owner = renderWithTheme(<Owner />);
    expect(owner.getByRole('tab', { name: 'Delta' })).toHaveAttribute('aria-selected', 'true');
    await user.click(owner.getByRole('tab', { name: 'Alpha' }));
    expect(owner.container.querySelector('output')).toHaveTextContent('a');
  });

  it('the arrows select in automatic mode, skip a disabled tab, wrap, and Home / End go to the ends', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic />);
    getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Delta' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(getByRole('tab', { name: 'Delta' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('in manual mode the arrows only focus, and Enter selects (spec §6)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic activationMode="manual" />);
    getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('vertical: the arrows are up and down, and every part says so', async () => {
    const user = userEvent.setup();
    const { getByRole, container } = renderWithTheme(<Basic orientation="vertical" />);
    expect(container.querySelector('.pp-tabs')).toHaveAttribute('data-orientation', 'vertical');
    expect(getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveAttribute('data-orientation', 'vertical');
    expect(getByRole('tabpanel')).toHaveAttribute('data-orientation', 'vertical');
    getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(getByRole('tab', { name: 'Beta' })).toHaveFocus();
  });

  it('keepMounted keeps a panel in the DOM, hidden, and its input keeps its value (spec §7)', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(<Basic keepMounted />);
    await user.type(getByRole('textbox', { name: 'Name' }), 'Ada');
    await user.click(getByRole('tab', { name: 'Beta' }));
    const kept = getByRole('textbox', { name: 'Name', hidden: true }).closest('.pp-tabs__panel') as HTMLElement;
    expect(kept).toHaveAttribute('data-state', 'inactive');
    expect(kept).toHaveAttribute('hidden');
    expect((kept.querySelector('input') as HTMLInputElement).value).toBe('Ada');
    await user.click(getByRole('tab', { name: 'Alpha' }));
    expect(getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
  });

  it("carries no dir of its own, and reads the page's: ArrowLeft is next under dir=rtl (spec §5)", async () => {
    const user = userEvent.setup();
    const { getByRole, container } = renderWithTheme(
      <div dir="rtl">
        <Basic />
      </div>,
    );
    expect(container.querySelector('.pp-tabs')).not.toHaveAttribute('dir');
    getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(getByRole('tab', { name: 'Beta' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('forwards refs and merges className and style onto every part', () => {
    const root = createRef<HTMLDivElement>();
    const list = createRef<HTMLDivElement>();
    const tab = createRef<HTMLButtonElement>();
    const panel = createRef<HTMLDivElement>();
    renderWithTheme(
      <Tabs ref={root} defaultValue="a" className="r" style={{ opacity: 0.5 }} data-testid="root">
        <TabsList ref={list} className="l" style={{ order: 1 }}>
          <TabsTrigger ref={tab} value="a" className="t" style={{ order: 2 }}>
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent ref={panel} value="a" className="p" style={{ order: 3 }}>
          A panel
        </TabsContent>
      </Tabs>,
    );
    expect(root.current).toHaveClass('pp-tabs', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(list.current).toHaveClass('pp-tabs__list', 'l');
    expect(list.current).toHaveStyle({ order: '1' });
    expect(tab.current).toHaveClass('pp-tabs__tab', 't');
    expect(panel.current).toHaveClass('pp-tabs__panel', 'p');
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<TabsTrigger value="x">Lost</TabsTrigger>)).toThrow(/<TabsTrigger> must be rendered inside <Tabs>/);
    error.mockRestore();
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<Basic />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Basic orientation="vertical" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
    dark.unmount();
  });
});
