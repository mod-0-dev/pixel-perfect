import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is a hidden block with a medium radius by default', () => {
    const { container } = renderWithTheme(<Skeleton />);
    const el = container.querySelector('.pp-skeleton')!;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveAttribute('data-shape', 'block');
    expect(el).toHaveAttribute('data-radius', 'md');
    expect(el).not.toHaveAttribute('data-lines');
    expect(el.children).toHaveLength(0);
  });

  it('text renders one line per `lines`, with a small radius', () => {
    const { container } = renderWithTheme(<Skeleton shape="text" lines={3} />);
    const el = container.querySelector('.pp-skeleton')!;
    expect(el).toHaveAttribute('data-shape', 'text');
    expect(el).toHaveAttribute('data-radius', 'sm');
    expect(el).toHaveAttribute('data-lines', '3');
    expect(el.querySelectorAll('.pp-skeleton__line')).toHaveLength(3);
  });

  it('text defaults to one line and never fewer', () => {
    const { container, rerender } = renderWithTheme(<Skeleton shape="text" />);
    expect(container.querySelectorAll('.pp-skeleton__line')).toHaveLength(1);
    rerender(<Skeleton shape="text" lines={0} />);
    expect(container.querySelectorAll('.pp-skeleton__line')).toHaveLength(1);
  });

  it('circle is fully rounded and has no lines even if asked', () => {
    const { container } = renderWithTheme(<Skeleton shape="circle" lines={4} />);
    const el = container.querySelector('.pp-skeleton')!;
    expect(el).toHaveAttribute('data-radius', 'full');
    expect(el).not.toHaveAttribute('data-lines');
    expect(el.children).toHaveLength(0);
  });

  it('radius can be overridden per shape', () => {
    const { container } = renderWithTheme(<Skeleton shape="block" radius="full" />);
    expect(container.querySelector('.pp-skeleton')).toHaveAttribute('data-radius', 'full');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderWithTheme(
      <Skeleton ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="sk" />,
    );
    const el = container.querySelector('.pp-skeleton')!;
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-skeleton', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'sk');
  });

  it('has no axe violations inside a busy region', async () => {
    const { container } = renderWithTheme(
      <div aria-busy="true">
        <Skeleton shape="circle" />
        <Skeleton shape="text" lines={3} />
        <Skeleton />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
