import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Center } from './Center';

describe('Center', () => {
  it('renders a div with defaults exposed as data attributes', () => {
    const { getByTestId } = renderWithTheme(<Center data-testid="c">child</Center>);
    const el = getByTestId('c');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-center');
    expect(el).toHaveAttribute('data-axis', 'both');
    expect(el).toHaveAttribute('data-pp-gap', '0');
  });

  it.each(['inline', 'block', 'both'] as const)('exposes axis %s', (axis) => {
    const { getByTestId } = renderWithTheme(
      <Center axis={axis} data-testid="c">
        x
      </Center>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-axis', axis);
  });

  it.each(['0', '2', '5'] as const)('exposes gap %s', (gap) => {
    const { getByTestId } = renderWithTheme(
      <Center gap={gap} data-testid="c">
        x
      </Center>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-pp-gap', gap);
  });

  it('always emits data-pp-gap, including nested inside a gapped parent', () => {
    const { getByTestId } = renderWithTheme(
      <Center gap="6" data-testid="outer">
        <Center data-testid="inner">x</Center>
      </Center>,
    );
    expect(getByTestId('inner')).toHaveAttribute('data-pp-gap', '0');
  });

  /** D-016 §4, applied again. The sizing contract wins over convenience. */
  it('takes no height prop — block size comes from the parent or the custom property', () => {
    // @ts-expect-error `minHeight` is not part of CenterProps.
    renderWithTheme(<Center minHeight="50vh">x</Center>);
    // @ts-expect-error `height` is not part of CenterProps.
    renderWithTheme(<Center height={200}>x</Center>);
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(<Center ref={ref}>x</Center>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-center');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByTestId } = renderWithTheme(
        <Center className="mine" style={{ opacity: 0.5 }} data-testid="c">
          x
        </Center>,
      );
      const el = getByTestId('c');
      expect(el).toHaveClass('pp-center');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Center role="status" aria-label="Loading" id="l">
          x
        </Center>,
      );
      expect(getByRole('status', { name: 'Loading' })).toHaveAttribute('id', 'l');
    });
  });

  describe('asChild', () => {
    it('renders the child element instead of a div', () => {
      const { getByTestId } = renderWithTheme(
        <Center gap="3" asChild>
          <section data-testid="c">x</section>
        </Center>,
      );
      const el = getByTestId('c');
      expect(el.tagName).toBe('SECTION');
      expect(el).toHaveClass('pp-center');
      expect(el).toHaveAttribute('data-pp-gap', '3');
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Center gap="3">
        <p>Nothing here yet.</p>
      </Center>,
    );
    await expectNoA11yViolations(container);
  });
});
