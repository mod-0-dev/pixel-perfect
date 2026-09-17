import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders a div with defaults exposed as data attributes', () => {
    const { getByTestId } = renderWithTheme(<Stack data-testid="s">child</Stack>);
    const el = getByTestId('s');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-stack');
    expect(el).toHaveAttribute('data-pp-gap', '0');
    expect(el).toHaveAttribute('data-align', 'stretch');
  });

  it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const)('exposes gap %s', (gap) => {
    const { getByTestId } = renderWithTheme(
      <Stack gap={gap} data-testid="s">
        x
      </Stack>,
    );
    expect(getByTestId('s')).toHaveAttribute('data-pp-gap', gap);
  });

  it.each(['start', 'center', 'end', 'stretch', 'baseline'] as const)('exposes align %s', (align) => {
    const { getByTestId } = renderWithTheme(
      <Stack align={align} data-testid="s">
        x
      </Stack>,
    );
    expect(getByTestId('s')).toHaveAttribute('data-align', align);
  });

  /**
   * D-020. The shared scale in _shared/layout.css sets an INHERITING custom
   * property, so a nested Stack that omitted the attribute would silently take
   * its parent's rhythm. The zero default is what makes that impossible, and it
   * is the kind of thing a well-meaning cleanup deletes.
   */
  describe('the gap attribute is never omitted', () => {
    it('is present at the default', () => {
      const { getByTestId } = renderWithTheme(<Stack data-testid="s">x</Stack>);
      expect(getByTestId('s').hasAttribute('data-pp-gap')).toBe(true);
    });

    it('is present on a nested Stack inside a gapped parent', () => {
      const { getByTestId } = renderWithTheme(
        <Stack gap="6" data-testid="outer">
          <Stack data-testid="inner">x</Stack>
        </Stack>,
      );
      expect(getByTestId('outer')).toHaveAttribute('data-pp-gap', '6');
      expect(getByTestId('inner')).toHaveAttribute('data-pp-gap', '0');
    });
  });

  describe('asChild', () => {
    it('renders the child element instead of a div', () => {
      const { getByRole } = renderWithTheme(
        <Stack gap="2" asChild>
          <nav aria-label="Main">
            <a href="/tasks">Tasks</a>
          </nav>
        </Stack>,
      );
      const nav = getByRole('navigation', { name: 'Main' });
      expect(nav.tagName).toBe('NAV');
      expect(nav).toHaveClass('pp-stack');
      expect(nav).toHaveAttribute('data-pp-gap', '2');
    });

    it('keeps a semantic list a list', () => {
      const { getByRole } = renderWithTheme(
        <Stack gap="2" asChild>
          <ul>
            <li>one</li>
            <li>two</li>
          </ul>
        </Stack>,
      );
      expect(getByRole('list')).toHaveClass('pp-stack');
      expect(getByRole('list').children).toHaveLength(2);
    });

    it('merges className rather than replacing it', () => {
      const { getByTestId } = renderWithTheme(
        <Stack className="outer" asChild>
          <section className="inner" data-testid="s" />
        </Stack>,
      );
      const el = getByTestId('s');
      expect(el).toHaveClass('pp-stack');
      expect(el).toHaveClass('outer');
      expect(el).toHaveClass('inner');
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(
        <Stack ref={ref} data-testid="s">
          x
        </Stack>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-stack');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByTestId } = renderWithTheme(
        <Stack className="mine" style={{ opacity: 0.5 }} data-testid="s">
          x
        </Stack>,
      );
      const el = getByTestId('s');
      expect(el).toHaveClass('pp-stack');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Stack role="group" aria-label="Filters" id="filters" data-custom="x">
          x
        </Stack>,
      );
      const el = getByRole('group', { name: 'Filters' });
      expect(el).toHaveAttribute('id', 'filters');
      expect(el).toHaveAttribute('data-custom', 'x');
    });
  });

  it('has no role of its own — it is layout and must stay invisible to AT', () => {
    const { getByTestId } = renderWithTheme(<Stack data-testid="s">x</Stack>);
    expect(getByTestId('s')).not.toHaveAttribute('role');
    expect(getByTestId('s')).not.toHaveAttribute('aria-label');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Stack gap="4">
        <h2>Launch readiness</h2>
        <p>12 days out.</p>
      </Stack>,
    );
    await expectNoA11yViolations(container);
  });
});
