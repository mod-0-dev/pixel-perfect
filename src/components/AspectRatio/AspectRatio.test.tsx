import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { AspectRatio } from './AspectRatio';

const shape = (el: HTMLElement) => el.style.getPropertyValue('--_pp-aspect-ratio');

describe('AspectRatio', () => {
  it('renders a div carrying the ratio as a private custom property', () => {
    const { getByTestId } = renderWithTheme(
      <AspectRatio ratio={16 / 9} data-testid="a">
        <img alt="" src="/x.png" />
      </AspectRatio>,
    );
    const el = getByTestId('a');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-aspect-ratio');
    expect(Number(shape(el))).toBeCloseTo(16 / 9, 5);
  });

  it.each([1, 4 / 3, 21 / 9, 0.5])('carries ratio %s', (ratio) => {
    const { getByTestId } = renderWithTheme(
      <AspectRatio ratio={ratio} data-testid="a">
        <span />
      </AspectRatio>,
    );
    expect(Number(shape(getByTestId('a')))).toBeCloseTo(ratio, 5);
  });

  it('leaves the public override property alone for the consumer (D-024)', () => {
    const { getByTestId } = renderWithTheme(
      <AspectRatio
        ratio={1}
        style={{ '--pp-aspect-ratio': '16 / 9' } as React.CSSProperties}
        data-testid="a"
      >
        <span />
      </AspectRatio>,
    );
    const el = getByTestId('a');
    expect(shape(el)).toBe('1');
    expect(el.style.getPropertyValue('--pp-aspect-ratio')).toBe('16 / 9');
  });

  it('always writes the ratio, so a nested AspectRatio does not inherit a shape', () => {
    const { getByTestId } = renderWithTheme(
      <AspectRatio ratio={21 / 9} data-testid="outer">
        <AspectRatio ratio={1} data-testid="inner">
          <span />
        </AspectRatio>
      </AspectRatio>,
    );
    expect(Number(shape(getByTestId('outer')))).toBeCloseTo(21 / 9, 5);
    expect(shape(getByTestId('inner'))).toBe('1');
  });

  it('requires a ratio — there is no default that is right', () => {
    // @ts-expect-error `ratio` is required.
    renderWithTheme(<AspectRatio><span /></AspectRatio>);
  });

  it('takes no asChild — a substituted root would lose the shape', () => {
    renderWithTheme(
      // @ts-expect-error `asChild` is not part of AspectRatioProps.
      <AspectRatio ratio={1} asChild>
        <img alt="" src="/x.png" />
      </AspectRatio>,
    );
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(
        <AspectRatio ratio={1} ref={ref}>
          <span />
        </AspectRatio>,
      );
      expect(ref.current).toHaveClass('pp-aspect-ratio');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByTestId } = renderWithTheme(
        <AspectRatio ratio={1} className="mine" style={{ opacity: 0.5 }} data-testid="a">
          <span />
        </AspectRatio>,
      );
      const el = getByTestId('a');
      expect(el).toHaveClass('pp-aspect-ratio');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
      expect(shape(el)).not.toBe('');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <AspectRatio ratio={1} role="presentation" id="thumb">
          <span />
        </AspectRatio>,
      );
      expect(getByRole('presentation')).toHaveAttribute('id', 'thumb');
    });
  });

  it('does not describe its own contents — the child keeps its semantics', async () => {
    const { container, getByAltText } = renderWithTheme(
      <AspectRatio ratio={16 / 9}>
        <img src="/asset.png" alt="Launch banner, final revision" />
      </AspectRatio>,
    );
    expect(getByAltText('Launch banner, final revision')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
