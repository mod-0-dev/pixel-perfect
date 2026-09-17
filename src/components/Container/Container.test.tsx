import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Container } from './Container';

describe('Container', () => {
  it('renders a div with defaults exposed as data attributes', () => {
    const { getByTestId } = renderWithTheme(<Container data-testid="c">child</Container>);
    const el = getByTestId('c');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-container');
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-pp-gutter', '5');
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes size %s', (size) => {
    const { getByTestId } = renderWithTheme(
      <Container size={size} data-testid="c">
        x
      </Container>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-size', size);
  });

  it.each(['0', '3', '5', '9'] as const)('exposes gutter %s', (gutter) => {
    const { getByTestId } = renderWithTheme(
      <Container gutter={gutter} data-testid="c">
        x
      </Container>,
    );
    expect(getByTestId('c')).toHaveAttribute('data-pp-gutter', gutter);
  });

  /**
   * D-022 §6. The asymmetry with `gap` is deliberate and easy to "fix" by
   * mistake: a zero gap is a legitimate design, a zero page gutter is text
   * against the edge of a phone screen.
   */
  it('defaults the gutter to a non-zero step, unlike gap', () => {
    const { getByTestId } = renderWithTheme(<Container data-testid="c">x</Container>);
    expect(getByTestId('c').getAttribute('data-pp-gutter')).not.toBe('0');
  });

  it('uses its own gutter attribute, never the shared gap one — a Container is not a Stack', () => {
    const { getByTestId } = renderWithTheme(<Container data-testid="c">x</Container>);
    expect(getByTestId('c')).not.toHaveAttribute('data-pp-gap');
  });

  describe('asChild', () => {
    it('renders a main landmark instead of a nested div', () => {
      const { getByRole } = renderWithTheme(
        <Container size="md" asChild>
          <main>content</main>
        </Container>,
      );
      const main = getByRole('main');
      expect(main.tagName).toBe('MAIN');
      expect(main).toHaveClass('pp-container');
      expect(main).toHaveAttribute('data-size', 'md');
    });
  });

  describe('API conventions (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(<Container ref={ref}>x</Container>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-container');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByTestId } = renderWithTheme(
        <Container className="mine" style={{ opacity: 0.5 }} data-testid="c">
          x
        </Container>,
      );
      const el = getByTestId('c');
      expect(el).toHaveClass('pp-container');
      expect(el).toHaveClass('mine');
      expect(el.style.opacity).toBe('0.5');
    });

    it('spreads remaining props onto the root', () => {
      const { getByRole } = renderWithTheme(
        <Container role="region" aria-label="Page" id="page">
          x
        </Container>,
      );
      expect(getByRole('region', { name: 'Page' })).toHaveAttribute('id', 'page');
    });

    it('takes no gap prop — it constrains, it does not space', () => {
      // @ts-expect-error `gap` is not part of ContainerProps.
      renderWithTheme(<Container gap="4">x</Container>);
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <Container asChild>
        <main>
          <h1>Launch overview</h1>
        </main>
      </Container>,
    );
    await expectNoA11yViolations(container);
  });
});
