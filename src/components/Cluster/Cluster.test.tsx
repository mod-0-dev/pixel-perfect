import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Cluster } from './Cluster';

describe('Cluster', () => {
  it('renders a div with defaults exposed as data attributes', () => {
    const { getByTestId } = renderWithTheme(<Cluster data-testid="c">child</Cluster>);
    const el = getByTestId('c');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-cluster');
    expect(el).toHaveAttribute('data-pp-gap', '0');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'start');
  });

  it.each(['0', '2', '5', '9'] as const)('exposes gap %s', (gap) => {
    const { getByTestId } = renderWithTheme(
      <Cluster gap={gap} data-testid="c">
        x
      </Cluster>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-pp-gap', gap);
  });

  it.each(['start', 'center', 'end', 'stretch', 'baseline'] as const)('exposes align %s', (align) => {
    const { getByTestId } = renderWithTheme(
      <Cluster align={align} data-testid="c">
        x
      </Cluster>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-align', align);
  });

  it.each(['start', 'center', 'end', 'between', 'around', 'evenly'] as const)(
    'exposes justify %s',
    (justify) => {
      const { getByTestId } = renderWithTheme(
        <Cluster justify={justify} data-testid="c">
          x
        </Cluster>,
      );
      expect(getByTestId('c')).toHaveAttribute('data-justify', justify);
    },
  );

  describe('wrap', () => {
    it('exposes nothing when wrapping — the default carries no information', () => {
      const { getByTestId } = renderWithTheme(<Cluster data-testid="c">x</Cluster>);
      expect(getByTestId('c')).not.toHaveAttribute('data-wrap');
    });

    it('exposes data-wrap="false" when wrapping is off', () => {
      const { getByTestId } = renderWithTheme(
        <Cluster wrap={false} data-testid="c">
          x
        </Cluster>,
      );
      expect(getByTestId('c')).toHaveAttribute('data-wrap', 'false');
    });
  });

  /** D-020. Same hazard as Stack, and the two share the scale. */
  it('always emits data-pp-gap, including nested inside a gapped parent', () => {
    const { getByTestId } = renderWithTheme(
      <Cluster gap="6" data-testid="outer">
        <Cluster data-testid="inner">x</Cluster>
      </Cluster>,
    );
    expect(getByTestId('outer')).toHaveAttribute('data-pp-gap', '6');
    expect(getByTestId('inner')).toHaveAttribute('data-pp-gap', '0');
  });

  describe('asChild', () => {
    it('renders the child element instead of a div', () => {
      const { getByRole } = renderWithTheme(
        <Cluster gap="2" asChild>
          <ul>
            <li>one</li>
          </ul>
        </Cluster>,
      );
      const list = getByRole('list');
      expect(list.tagName).toBe('UL');
      expect(list).toHaveClass('pp-cluster');
      expect(list).toHaveAttribute('data-pp-gap', '2');
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(<Cluster ref={ref}>x</Cluster>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-cluster');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByTestId } = renderWithTheme(
        <Cluster className="mine" style={{ opacity: 0.5 }} data-testid="c">
          x
        </Cluster>,
      );
      const el = getByTestId('c');
      expect(el).toHaveClass('pp-cluster');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Cluster role="group" aria-label="Filters" id="f" data-custom="x">
          x
        </Cluster>,
      );
      const el = getByRole('group', { name: 'Filters' });
      expect(el).toHaveAttribute('id', 'f');
      expect(el).toHaveAttribute('data-custom', 'x');
    });
  });

  it('has no role of its own — a row of buttons is not a toolbar', () => {
    const { getByTestId } = renderWithTheme(<Cluster data-testid="c">x</Cluster>);
    expect(getByTestId('c')).not.toHaveAttribute('role');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Cluster gap="2" justify="between">
        <span>Blocked</span>
        <span>Waiting on legal review</span>
      </Cluster>,
    );
    await expectNoA11yViolations(container);
  });
});
