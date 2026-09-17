import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Scroller, overflowState } from './Scroller';

describe('overflowState', () => {
  it('reports none when the content fits', () => {
    expect(overflowState(0, 100, 100)).toBe('none');
    expect(overflowState(0, 100, 200)).toBe('none');
  });

  it('reports end at the start of a longer scroll', () => {
    expect(overflowState(0, 500, 100)).toBe('end');
  });

  it('reports start at the end of it', () => {
    expect(overflowState(400, 500, 100)).toBe('start');
  });

  it('reports both in the middle', () => {
    expect(overflowState(200, 500, 100)).toBe('both');
  });

  /**
   * A fractional scroll position at the very end leaves sub-pixel slack that
   * reads as "still more to scroll" forever — a shadow on a fully scrolled
   * region, which is the bug this rounding exists to prevent.
   */
  it('treats a fractional end position as the end', () => {
    expect(overflowState(399.6, 500, 100)).toBe('start');
    expect(overflowState(400.4, 500, 100)).toBe('start');
  });

  /** scrollLeft is negative in RTL, which is why the arithmetic is absolute. */
  it('handles the negative scrollLeft of an RTL region', () => {
    expect(overflowState(-400, 500, 100)).toBe('start');
    expect(overflowState(-200, 500, 100)).toBe('both');
    expect(overflowState(-0, 500, 100)).toBe('end');
  });
});

describe('Scroller', () => {
  it('renders a labelled, focusable region', () => {
    const { getByRole } = renderWithTheme(<Scroller label="Task table">rows</Scroller>);
    const el = getByRole('region', { name: 'Task table' });
    expect(el).toHaveClass('pp-scroller');
    expect(el).toHaveAttribute('tabindex', '0');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el).toHaveAttribute('data-overflow', 'none');
  });

  it.each(['vertical', 'horizontal', 'both'] as const)('exposes orientation %s', (orientation) => {
    const { getByRole } = renderWithTheme(
      <Scroller label="x" orientation={orientation}>
        y
      </Scroller>,
    );
    expect(getByRole('region')).toHaveAttribute('data-orientation', orientation);
  });

  /**
   * D-022 §7. A scrollable region a keyboard user can reach is WCAG 2.1.1; a
   * focusable region with no accessible name is a 4.1.2 failure. RULES §6 says
   * the type system should make that impossible.
   */
  describe('the accessible name cannot be omitted', () => {
    it('is required at the type level', () => {
      // @ts-expect-error `label` is required on ScrollerProps.
      renderWithTheme(<Scroller>rows</Scroller>);
    });

    it('does not let a caller replace the region role', () => {
      // @ts-expect-error `role` is omitted from ScrollerProps.
      renderWithTheme(<Scroller label="x" role="presentation">rows</Scroller>);
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root while keeping its own internal ref', () => {
      const ref = createRef<HTMLDivElement>();
      const { getByRole } = renderWithTheme(
        <Scroller label="x" ref={ref}>
          y
        </Scroller>,
      );
      // mergeRefs: both the consumer's ref and the component's port ref get the
      // node, or the measurement never runs.
      expect(ref.current).toBe(getByRole('region'));
    });

    it('merges className and style rather than replacing them', () => {
      const { getByRole } = renderWithTheme(
        <Scroller label="x" className="mine" style={{ opacity: 0.5 }}>
          y
        </Scroller>,
      );
      const el = getByRole('region');
      expect(el).toHaveClass('pp-scroller');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Scroller label="x" id="scroll" data-custom="y">
          z
        </Scroller>,
      );
      const el = getByRole('region');
      expect(el).toHaveAttribute('id', 'scroll');
      expect(el).toHaveAttribute('data-custom', 'y');
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Scroller label="Task table" orientation="horizontal">
        <table>
          <caption>Tasks</caption>
          <tbody>
            <tr>
              <td>Privacy policy</td>
            </tr>
          </tbody>
        </table>
      </Scroller>,
    );
    await expectNoA11yViolations(container);
  });
});
