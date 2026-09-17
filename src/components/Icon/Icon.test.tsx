import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Icon } from './Icon';

function Glyph() {
  return (
    <svg viewBox="0 0 16 16" data-testid="glyph">
      <path d="M2 2h12v12H2z" />
    </svg>
  );
}

describe('Icon', () => {
  it('with a label is an image with that accessible name', () => {
    const { getByRole } = renderWithTheme(
      <Icon label="Blocked">
        <Glyph />
      </Icon>,
    );
    const el = getByRole('img', { name: 'Blocked' });
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-icon');
    expect(el).not.toHaveAttribute('aria-hidden');
  });

  it('decorative is hidden from assistive technology', () => {
    const { getByTestId } = renderWithTheme(
      <Icon decorative>
        <Glyph />
      </Icon>,
    );
    const el = getByTestId('glyph').parentElement!;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).not.toHaveAttribute('role');
    expect(el).not.toHaveAttribute('aria-label');
  });

  it('refuses an icon with neither label nor decorative, and one with both', () => {
    // These are type-level guarantees; tsc checks the expect-error lines.
    // @ts-expect-error — neither label nor decorative
    const neither = <Icon><Glyph /></Icon>;
    // @ts-expect-error — both at once
    const both = <Icon label="x" decorative><Glyph /></Icon>;
    expect(neither).toBeTruthy();
    expect(both).toBeTruthy();
  });

  it('defaults to inherit and exposes size', () => {
    const { getByRole, rerender } = renderWithTheme(
      <Icon label="a">
        <Glyph />
      </Icon>,
    );
    expect(getByRole('img')).toHaveAttribute('data-size', 'inherit');
    rerender(
      <Icon label="a" size="lg">
        <Glyph />
      </Icon>,
    );
    expect(getByRole('img')).toHaveAttribute('data-size', 'lg');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLSpanElement>();
    const { getByRole } = renderWithTheme(
      <Icon label="a" ref={ref} className="mine" style={{ color: 'red' }} data-testid="i" title="t">
        <Glyph />
      </Icon>,
    );
    const el = getByRole('img');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-icon', 'mine');
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(el).toHaveAttribute('data-testid', 'i');
    expect(el).toHaveAttribute('title', 't');
  });

  it('has no axe violations either way', async () => {
    const { container } = renderWithTheme(
      <>
        <Icon label="Blocked">
          <Glyph />
        </Icon>
        <button type="button">
          <Icon decorative>
            <Glyph />
          </Icon>
          Close
        </button>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
