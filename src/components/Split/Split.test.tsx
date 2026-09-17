import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Split } from './Split';

const basis = (el: HTMLElement) => el.style.getPropertyValue('--_pp-split-sidebar');

describe('Split', () => {
  it('renders a root with both slots and the defaults exposed', () => {
    const { getByTestId } = renderWithTheme(
      <Split data-testid="s">
        <Split.Sidebar data-testid="side">nav</Split.Sidebar>
        <Split.Main data-testid="main">content</Split.Main>
      </Split>,
    );
    const root = getByTestId('s');
    expect(root).toHaveClass('pp-split');
    expect(root).toHaveAttribute('data-collapse-below', 'md');
    expect(root).toHaveAttribute('data-pp-gap', '0');
    expect(basis(root)).toBe('16rem');
    expect(getByTestId('side')).toHaveClass('pp-split__sidebar');
    expect(getByTestId('main')).toHaveClass('pp-split__main');
  });

  it.each(['sm', 'md', 'lg', 'never'] as const)('exposes collapseBelow %s', (collapseBelow) => {
    const { getByTestId } = renderWithTheme(
      <Split collapseBelow={collapseBelow} data-testid="s">
        <Split.Sidebar>a</Split.Sidebar>
        <Split.Main>b</Split.Main>
      </Split>,
    );
    expect(getByTestId('s')).toHaveAttribute('data-collapse-below', collapseBelow);
  });

  it('writes sidebarInlineSize to a private property, leaving the public one to consumers', () => {
    const { getByTestId } = renderWithTheme(
      <Split
        sidebarInlineSize="15rem"
        style={{ '--pp-split-sidebar-inline-size': '20rem' } as React.CSSProperties}
        data-testid="s"
      >
        <Split.Sidebar>a</Split.Sidebar>
        <Split.Main>b</Split.Main>
      </Split>,
    );
    const root = getByTestId('s');
    // D-024: writing the public name inline would make the override
    // unreachable from an ancestor.
    expect(basis(root)).toBe('15rem');
    expect(root.style.getPropertyValue('--pp-split-sidebar-inline-size')).toBe('20rem');
  });

  it('always writes the sidebar property, so a nested Split does not inherit it', () => {
    const { getByTestId } = renderWithTheme(
      <Split sidebarInlineSize="24rem" data-testid="outer">
        <Split.Sidebar>a</Split.Sidebar>
        <Split.Main>
          <Split data-testid="inner">
            <Split.Sidebar>a</Split.Sidebar>
            <Split.Main>b</Split.Main>
          </Split>
        </Split.Main>
      </Split>,
    );
    expect(basis(getByTestId('outer'))).toBe('24rem');
    expect(basis(getByTestId('inner'))).toBe('16rem');
  });

  /** D-022 §3. Reading order is DOM order, in both the split and collapsed layouts. */
  describe('there is no side prop', () => {
    it('rejects one at the type level', () => {
      renderWithTheme(
        // @ts-expect-error `side` is not part of SplitProps — put Split.Main first instead.
        <Split side="end">
          <Split.Sidebar>a</Split.Sidebar>
          <Split.Main>b</Split.Main>
        </Split>,
      );
    });

    it('renders the slots in DOM order, whichever comes first', () => {
      const { getByTestId } = renderWithTheme(
        <Split data-testid="s">
          <Split.Main data-testid="main">content</Split.Main>
          <Split.Sidebar data-testid="side">nav</Split.Sidebar>
        </Split>,
      );
      const children = Array.from(getByTestId('s').children);
      expect(children[0]).toBe(getByTestId('main'));
      expect(children[1]).toBe(getByTestId('side'));
    });
  });

  describe('slots', () => {
    it('take asChild, so the sidebar and main can be landmarks', () => {
      const { getByRole } = renderWithTheme(
        <Split>
          <Split.Sidebar asChild>
            <nav aria-label="Main">nav</nav>
          </Split.Sidebar>
          <Split.Main asChild>
            <main>content</main>
          </Split.Main>
        </Split>,
      );
      expect(getByRole('navigation', { name: 'Main' })).toHaveClass('pp-split__sidebar');
      expect(getByRole('main')).toHaveClass('pp-split__main');
    });

    it('forward refs and merge className', () => {
      const side = createRef<HTMLDivElement>();
      const main = createRef<HTMLDivElement>();
      renderWithTheme(
        <Split>
          <Split.Sidebar ref={side} className="mine">
            a
          </Split.Sidebar>
          <Split.Main ref={main}>b</Split.Main>
        </Split>,
      );
      expect(side.current).toHaveClass('pp-split__sidebar');
      expect(side.current).toHaveClass('mine');
      expect(main.current).toHaveClass('pp-split__main');
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(
        <Split ref={ref}>
          <Split.Sidebar>a</Split.Sidebar>
          <Split.Main>b</Split.Main>
        </Split>,
      );
      expect(ref.current).toHaveClass('pp-split');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Split role="group" aria-label="Shell" id="shell">
          <Split.Sidebar>a</Split.Sidebar>
          <Split.Main>b</Split.Main>
        </Split>,
      );
      expect(getByRole('group', { name: 'Shell' })).toHaveAttribute('id', 'shell');
    });

    it('puts no role on the root — Split does not guess at landmarks', () => {
      const { getByTestId } = renderWithTheme(
        <Split data-testid="s">
          <Split.Sidebar>a</Split.Sidebar>
          <Split.Main>b</Split.Main>
        </Split>,
      );
      expect(getByTestId('s')).not.toHaveAttribute('role');
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Split>
        <Split.Sidebar asChild>
          <nav aria-label="Sections">
            <a href="/tasks">Tasks</a>
          </nav>
        </Split.Sidebar>
        <Split.Main asChild>
          <main>
            <h1>Task board</h1>
          </main>
        </Split.Main>
      </Split>,
    );
    await expectNoA11yViolations(container);
  });
});
