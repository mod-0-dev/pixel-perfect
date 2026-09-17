import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('with a label is a status region announcing that label', () => {
    const { getByRole } = renderWithTheme(<Spinner label="Loading tasks" />);
    const el = getByRole('status');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-spinner');
    expect(el).toHaveTextContent('Loading tasks');
    expect(el).not.toHaveAttribute('aria-hidden');
    expect(el.querySelector('.pp-visually-hidden')).toHaveTextContent('Loading tasks');
  });

  it('decorative is hidden and has no role', () => {
    const { container } = renderWithTheme(<Spinner decorative />);
    const el = container.querySelector('.pp-spinner')!;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).not.toHaveAttribute('role');
    expect(el.querySelector('.pp-visually-hidden')).toBeNull();
  });

  it('the SVG is always hidden from assistive technology', () => {
    const { getByRole } = renderWithTheme(<Spinner label="x" />);
    expect(getByRole('status').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('refuses neither label nor decorative, and both', () => {
    // @ts-expect-error — neither
    const neither = <Spinner />;
    // @ts-expect-error — both
    const both = <Spinner label="x" decorative />;
    expect(neither).toBeTruthy();
    expect(both).toBeTruthy();
  });

  it('defaults to md / neutral and exposes size and tone', () => {
    const { getByRole, rerender } = renderWithTheme(<Spinner label="x" />);
    expect(getByRole('status')).toHaveAttribute('data-size', 'md');
    expect(getByRole('status')).toHaveAttribute('data-pp-tone', 'neutral');
    rerender(<Spinner label="x" size="lg" tone="accent" />);
    expect(getByRole('status')).toHaveAttribute('data-size', 'lg');
    expect(getByRole('status')).toHaveAttribute('data-pp-tone', 'accent');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLSpanElement>();
    const { getByRole } = renderWithTheme(
      <Spinner label="x" ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="s" />,
    );
    const el = getByRole('status');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-spinner', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 's');
  });

  it('has no axe violations either way', async () => {
    const { container } = renderWithTheme(
      <>
        <Spinner label="Loading tasks" />
        <button type="button" disabled>
          <Spinner decorative size="sm" />
          Saving…
        </button>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
