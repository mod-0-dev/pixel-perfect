import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Step, Stepper } from './Stepper';

function Checkout(props: { orientation?: 'horizontal' | 'vertical' } = {}) {
  return (
    <Stepper {...props}>
      <Step status="complete">Account</Step>
      <Step status="current" description="Card or invoice">
        Payment
      </Step>
      <Step>Review</Step>
    </Stepper>
  );
}

describe('Stepper', () => {
  it('is a navigation landmark named Progress around an ordered list of steps, in the accent tone (spec §1, §3)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Checkout />);
    const nav = getByRole('navigation', { name: 'Progress' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('pp-stepper');
    expect(nav).toHaveAttribute('data-orientation', 'horizontal');
    expect(nav).toHaveAttribute('data-pp-tone', 'accent');
    expect(getByRole('list').tagName).toBe('OL');
    const steps = getAllByRole('listitem');
    expect(steps).toHaveLength(3);
    expect(steps.map((s) => s.getAttribute('data-state'))).toEqual(['complete', 'current', 'upcoming']);
  });

  it('marks the current step with aria-current="step" and no other', () => {
    const { getAllByRole } = renderWithTheme(<Checkout />);
    const steps = getAllByRole('listitem');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[0]).not.toHaveAttribute('aria-current');
    expect(steps[2]).not.toHaveAttribute('aria-current');
  });

  it('shows a check and says Completed on a completed step; a counter, not a number in the markup, elsewhere (spec §1)', () => {
    const { getAllByRole } = renderWithTheme(<Checkout />);
    const [done, current, next] = getAllByRole('listitem');
    const indicator = (li: HTMLElement) => li.querySelector('.pp-stepper__indicator')!;
    expect(indicator(done!)).toHaveAttribute('aria-hidden', 'true');
    expect(indicator(done!).querySelector('svg')).not.toBeNull();
    expect(indicator(current!).querySelector('svg')).toBeNull();
    expect(indicator(current!).textContent).toBe('');
    expect(indicator(next!).textContent).toBe('');
    expect(done!).toHaveTextContent(/Account\s*Completed/);
    expect(done!.querySelector('.pp-visually-hidden')).toHaveTextContent('Completed');
    expect(current!.querySelector('.pp-visually-hidden')).toBeNull();
    expect(current!.querySelector('.pp-stepper__description')).toHaveTextContent('Card or invoice');
    expect(next!.querySelector('.pp-stepper__description')).toBeNull();
  });

  it('is upcoming by default, and takes the orientation and a label', () => {
    const { getByRole } = renderWithTheme(
      <Stepper orientation="vertical" label="Setup">
        <Step>Only</Step>
      </Stepper>,
    );
    const nav = getByRole('navigation', { name: 'Setup' });
    expect(nav).toHaveAttribute('data-orientation', 'vertical');
    expect(getByRole('listitem')).toHaveAttribute('data-state', 'upcoming');
  });

  it('forwards refs and merges className and style on both parts', () => {
    const nav = createRef<HTMLElement>();
    const step = createRef<HTMLLIElement>();
    const { getByRole } = renderWithTheme(
      <Stepper ref={nav} className="n" style={{ opacity: 0.5 }} data-testid="s">
        <Step ref={step} className="st" style={{ order: 1 }} status="current">
          One
        </Step>
      </Stepper>,
    );
    expect(nav.current).toBe(getByRole('navigation'));
    expect(nav.current).toHaveClass('pp-stepper', 'n');
    expect(nav.current).toHaveStyle({ opacity: '0.5' });
    expect(nav.current).toHaveAttribute('data-testid', 's');
    expect(step.current).toHaveClass('pp-stepper__step', 'st');
    expect(step.current).toHaveStyle({ order: '1' });
  });

  it('has no axe violations in both themes and both orientations', async () => {
    const light = renderWithTheme(<Checkout />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Checkout orientation="vertical" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
