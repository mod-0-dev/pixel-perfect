import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Grid, gridTracks } from './Grid';

/** What the props wrote. The public --pp-grid-template-columns is the consumer's, not ours. */
const tracks = (el: HTMLElement) => el.style.getPropertyValue('--_pp-grid-tracks');

describe('Grid', () => {
  it('renders a div with defaults exposed as data attributes', () => {
    const { getByTestId } = renderWithTheme(<Grid data-testid="g">child</Grid>);
    const el = getByTestId('g');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-grid');
    expect(el).toHaveAttribute('data-pp-gap', '0');
    expect(el).toHaveAttribute('data-align', 'stretch');
    expect(el).toHaveAttribute('data-mode', 'none');
    expect(tracks(el)).toBe('none');
  });

  describe('track generation', () => {
    /**
     * minmax(0, 1fr), never 1fr. `1fr` carries a min-content floor, so one long
     * unbreakable string in one cell pushes the whole grid past its container —
     * the exact failure RULES §1 exists to prevent, arriving via the back door.
     */
    it('generates minmax(0, 1fr) tracks from a column count, never bare 1fr', () => {
      const { getByTestId } = renderWithTheme(
        <Grid columns={3} data-testid="g">
          x
        </Grid>,
      );
      const el = getByTestId('g');
      expect(tracks(el)).toBe('repeat(3, minmax(0, 1fr))');
      expect(tracks(el).replaceAll('minmax(0, 1fr)', '')).not.toContain('1fr');
      expect(el).toHaveAttribute('data-mode', 'fixed');
    });

    it('generates an auto-fit track from minItemInlineSize', () => {
      const { getByTestId } = renderWithTheme(
        <Grid minItemInlineSize="16rem" data-testid="g">
          x
        </Grid>,
      );
      const el = getByTestId('g');
      expect(tracks(el)).toBe('repeat(auto-fit, minmax(16rem, 1fr))');
      expect(el).toHaveAttribute('data-mode', 'auto');
    });

    it('passes a string columns through unchanged (D-022 §4)', () => {
      const { getByTestId } = renderWithTheme(
        <Grid columns="auto minmax(0, 1fr)" data-testid="g">
          x
        </Grid>,
      );
      const el = getByTestId('g');
      expect(tracks(el)).toBe('auto minmax(0, 1fr)');
      expect(el).toHaveAttribute('data-mode', 'template');
    });

    it.each([
      [undefined, undefined, 'none'],
      [2, undefined, 'fixed'],
      ['1fr auto', undefined, 'template'],
      [undefined, '20rem', 'auto'],
    ] as const)('gridTracks(%s, %s) is mode %s', (columns, min, mode) => {
      expect(gridTracks(columns, min).mode).toBe(mode);
    });
  });

  it.each(['0', '3', '6'] as const)('exposes gap %s', (gap) => {
    const { getByTestId } = renderWithTheme(
      <Grid gap={gap} data-testid="g">
        x
      </Grid>,
    );
    expect(getByTestId('g')).toHaveAttribute('data-pp-gap', gap);
  });

  it.each(['start', 'center', 'end', 'stretch'] as const)('exposes align %s', (align) => {
    const { getByTestId } = renderWithTheme(
      <Grid align={align} data-testid="g">
        x
      </Grid>,
    );
    expect(getByTestId('g')).toHaveAttribute('data-align', align);
  });

  describe('nothing leaks into a nested Grid', () => {
    it('always emits data-pp-gap', () => {
      const { getByTestId } = renderWithTheme(
        <Grid gap="6" data-testid="outer">
          <Grid data-testid="inner">x</Grid>
        </Grid>,
      );
      expect(getByTestId('outer')).toHaveAttribute('data-pp-gap', '6');
      expect(getByTestId('inner')).toHaveAttribute('data-pp-gap', '0');
    });

    /** Same hazard as the gap scale: the track property inherits too. */
    it('always writes the track property, so a propless Grid is not laid out by its parent', () => {
      const { getByTestId } = renderWithTheme(
        <Grid columns={3} data-testid="outer">
          <Grid data-testid="inner">x</Grid>
        </Grid>,
      );
      expect(tracks(getByTestId('outer'))).toBe('repeat(3, minmax(0, 1fr))');
      expect(tracks(getByTestId('inner'))).toBe('none');
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(<Grid ref={ref}>x</Grid>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-grid');
    });

    it('merges style rather than replacing it, and keeps the track custom property', () => {
      const { getByTestId } = renderWithTheme(
        <Grid columns={2} style={{ opacity: 0.5 }} className="mine" data-testid="g">
          x
        </Grid>,
      );
      const el = getByTestId('g');
      expect(el.style.opacity).toBe('0.5');
      expect(tracks(el)).toBe('repeat(2, minmax(0, 1fr))');
      expect(el).toHaveClass('pp-grid');
      expect(el).toHaveClass('mine');
    });

    it('leaves the public override property alone for the consumer', () => {
      const { getByTestId } = renderWithTheme(
        <Grid
          columns={2}
          style={{ '--pp-grid-template-columns': '1fr 2fr' } as React.CSSProperties}
          data-testid="g"
        >
          x
        </Grid>,
      );
      const el = getByTestId('g');
      // The component writes only the private property; the consumer's public
      // one survives and, per the stylesheet, wins. If these two were the same
      // name, the escape hatch would be dead for any Grid that took a prop.
      expect(tracks(el)).toBe('repeat(2, minmax(0, 1fr))');
      expect(el.style.getPropertyValue('--pp-grid-template-columns')).toBe('1fr 2fr');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Grid role="group" aria-label="Cards" id="cards">
          x
        </Grid>,
      );
      expect(getByRole('group', { name: 'Cards' })).toHaveAttribute('id', 'cards');
    });
  });

  describe('asChild', () => {
    it('renders the child element instead of a div', () => {
      const { getByRole } = renderWithTheme(
        <Grid minItemInlineSize="16rem" gap="4" asChild>
          <ul>
            <li>one</li>
          </ul>
        </Grid>,
      );
      const list = getByRole('list');
      expect(list.tagName).toBe('UL');
      expect(list).toHaveClass('pp-grid');
      expect(tracks(list)).toBe('repeat(auto-fit, minmax(16rem, 1fr))');
    });
  });

  it('has no role of its own — display:grid is not role="grid"', () => {
    const { getByTestId } = renderWithTheme(<Grid data-testid="g">x</Grid>);
    expect(getByTestId('g')).not.toHaveAttribute('role');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Grid minItemInlineSize="16rem" gap="4">
        <section>
          <h2>Engineering</h2>
        </section>
        <section>
          <h2>Legal</h2>
        </section>
      </Grid>,
    );
    await expectNoA11yViolations(container);
  });
});
