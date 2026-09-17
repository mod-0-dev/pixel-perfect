import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Separator } from './Separator';

describe('Separator', () => {
  it('is a decorative horizontal <hr> by default', () => {
    const { container } = renderWithTheme(<Separator />);
    const el = container.querySelector('hr')!;
    expect(el).toHaveClass('pp-separator');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('decorative={false} exposes the native separator role', () => {
    const { getByRole } = renderWithTheme(<Separator decorative={false} />);
    const el = getByRole('separator');
    expect(el.tagName).toBe('HR');
    expect(el).not.toHaveAttribute('aria-hidden');
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('a non-decorative vertical separator declares its orientation', () => {
    const { getByRole } = renderWithTheme(<Separator decorative={false} orientation="vertical" />);
    const el = getByRole('separator');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('a decorative vertical separator is hidden and says nothing about orientation', () => {
    const { container } = renderWithTheme(<Separator orientation="vertical" />);
    const el = container.querySelector('hr')!;
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLHRElement>();
    const { container } = renderWithTheme(
      <Separator ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="s" id="rule" />,
    );
    const el = container.querySelector('hr')!;
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-separator', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 's');
    expect(el).toHaveAttribute('id', 'rule');
  });

  it('has no axe violations in either mode', async () => {
    const { container } = renderWithTheme(
      <div>
        <p>Engineering</p>
        <Separator />
        <p>Design</p>
        <Separator decorative={false} />
        <p>Legal</p>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
