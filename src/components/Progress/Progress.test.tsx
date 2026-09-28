import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Progress } from './Progress';

const bar = () => document.querySelector('.pp-progress') as HTMLElement;

describe('Progress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a progressbar named by `label`, determinate with a value, and tells the values (spec §1, §2)', () => {
    const { getByRole } = renderWithTheme(<Progress label="Uploading" value={40} />);
    const el = getByRole('progressbar', { name: 'Uploading' });
    expect(el).toBe(bar());
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-state', 'determinate');
    expect(el).toHaveAttribute('aria-valuemin', '0');
    expect(el).toHaveAttribute('aria-valuemax', '100');
    expect(el).toHaveAttribute('aria-valuenow', '40');
    expect(el.style.getPropertyValue('--_pp-progress-fill')).toBe('40%');
    expect(el.querySelector('.pp-progress__fill')).not.toBeNull();
  });

  it('is named by `aria-labelledby`, and says nothing visually hidden', () => {
    const { getByRole, container } = renderWithTheme(
      <>
        <span id="l">Copying files</span>
        <Progress aria-labelledby="l" value={10} />
      </>,
    );
    expect(getByRole('progressbar', { name: 'Copying files' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');
    expect(container.querySelector('.pp-visually-hidden')).toBeNull();
  });

  it('is indeterminate without a value: no aria-valuenow, the state says so, the fill at 0 (spec §1)', () => {
    renderWithTheme(<Progress label="Connecting" />);
    expect(bar()).toHaveAttribute('data-state', 'indeterminate');
    expect(bar()).not.toHaveAttribute('aria-valuenow');
    expect(bar()).toHaveAttribute('aria-valuemin', '0');
    expect(bar()).toHaveAttribute('aria-valuemax', '100');
    expect(bar().style.getPropertyValue('--_pp-progress-fill')).toBe('0%');
  });

  it('clamps the value to [0, max], and scales the fill by max (spec §1)', () => {
    const { rerender } = renderWithTheme(<Progress label="x" value={3} max={5} />);
    expect(bar()).toHaveAttribute('aria-valuemax', '5');
    expect(bar()).toHaveAttribute('aria-valuenow', '3');
    expect(bar().style.getPropertyValue('--_pp-progress-fill')).toBe('60%');
    rerender(<Progress label="x" value={9} max={5} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '5');
    expect(bar().style.getPropertyValue('--_pp-progress-fill')).toBe('100%');
    rerender(<Progress label="x" value={-2} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
    expect(bar().style.getPropertyValue('--_pp-progress-fill')).toBe('0%');
  });

  it('falls back to 100 for a max that is not a positive finite number, and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(<Progress label="x" value={50} max={0} />);
    expect(bar()).toHaveAttribute('aria-valuemax', '100');
    expect(bar()).toHaveAttribute('aria-valuenow', '50');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`max` must be a positive finite number'));
  });

  it('passes aria-valuetext through, and size and tone onto the root, accent by default (spec §5)', () => {
    const { rerender } = renderWithTheme(<Progress label="Steps" value={3} max={5} aria-valuetext="Step 3 of 5" />);
    expect(bar()).toHaveAttribute('aria-valuetext', 'Step 3 of 5');
    expect(bar()).toHaveAttribute('data-size', 'md');
    expect(bar()).toHaveAttribute('data-pp-tone', 'accent');
    rerender(<Progress label="Steps" value={5} max={5} size="lg" tone="success" />);
    expect(bar()).toHaveAttribute('data-size', 'lg');
    expect(bar()).toHaveAttribute('data-pp-tone', 'success');
  });

  it('forwards the ref and merges className and a consumer style with the fill variable', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithTheme(<Progress ref={ref} label="x" value={25} className="mine" style={{ opacity: 0.5 }} data-testid="p" />);
    expect(ref.current).toBe(bar());
    expect(bar()).toHaveClass('pp-progress', 'mine');
    expect(bar()).toHaveStyle({ opacity: '0.5' });
    expect(bar().style.getPropertyValue('--_pp-progress-fill')).toBe('25%');
    expect(bar()).toHaveAttribute('data-testid', 'p');
  });

  it('rejects a nameless bar, and a bar named twice, at the type level (spec §2)', () => {
    // @ts-expect-error — one of `label` / `aria-labelledby` is required.
    const nameless = <Progress value={1} />;
    // @ts-expect-error — not both.
    const twice = <Progress label="a" aria-labelledby="b" value={1} />;
    expect(nameless).toBeTruthy();
    expect(twice).toBeTruthy();
  });

  it('has no axe violations, determinate and indeterminate, in both themes', async () => {
    const light = renderWithTheme(
      <>
        <span id="l">Uploading</span>
        <Progress aria-labelledby="l" value={40} />
        <Progress label="Connecting" />
        <Progress label="Done" value={100} tone="success" size="sm" />
      </>,
    );
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Progress label="Uploading" value={40} />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
