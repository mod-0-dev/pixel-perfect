import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { Link } from '../Link/Link';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders a div with the neutral tone and NO role by default', () => {
    const { container } = renderWithTheme(<Alert>Exports run overnight.</Alert>);
    const el = container.querySelector('.pp-alert')!;

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-pp-tone', 'neutral');
    // Spec §2. The component is called Alert and is not an ARIA alert until
    // the caller says so; a live region announces CHANGES to a region that
    // already existed, and this one was in the initial HTML.
    expect(el).not.toHaveAttribute('role');
    expect(el).not.toHaveAttribute('aria-live');
  });

  it.each(['neutral', 'accent', 'danger', 'success', 'warning'] as const)(
    'sets the tone context for %s',
    (tone) => {
      const { container } = renderWithTheme(<Alert tone={tone}>x</Alert>);
      expect(container.querySelector('.pp-alert')).toHaveAttribute('data-pp-tone', tone);
    },
  );

  it.each([
    ['off', null],
    ['polite', 'status'],
    ['assertive', 'alert'],
  ] as const)('live=%s maps to role %s', (live, role) => {
    const { container } = renderWithTheme(<Alert live={live}>x</Alert>);
    const el = container.querySelector('.pp-alert')!;
    if (role === null) expect(el).not.toHaveAttribute('role');
    else expect(el).toHaveAttribute('role', role);
  });

  it('lets a caller\'s own role win over live', () => {
    // `role` is written before the spread, so the explicit prop lands last.
    const { container } = renderWithTheme(
      <Alert live="assertive" role="region" aria-label="Billing">
        x
      </Alert>,
    );
    expect(container.querySelector('.pp-alert')).toHaveAttribute('role', 'region');
  });

  it('does NOT tone the Buttons and Links a caller puts inside it', () => {
    // D-059. The root's data-pp-tone is a context, and the nearest context
    // wins. Button and Link each write their own from a default, so a danger
    // alert holds a neutral Button and an accent Link unless the caller passes
    // a tone. This pins the behaviour the docs used to contradict: if it ever
    // changes, it changes every Button and Link in the library, and the docs
    // have to change with it.
    const { getByRole } = renderWithTheme(
      <Alert tone="danger">
        <Link href="#x">Details</Link>
        <Button>Retry</Button>
        <Button tone="danger">Delete</Button>
      </Alert>,
    );
    expect(getByRole('link', { name: 'Details' })).toHaveAttribute('data-pp-tone', 'accent');
    expect(getByRole('button', { name: 'Retry' })).toHaveAttribute('data-pp-tone', 'neutral');
    expect(getByRole('button', { name: 'Delete' })).toHaveAttribute('data-pp-tone', 'danger');
  });

  describe('title', () => {
    it('renders in its own part and is NOT a heading', () => {
      const { container, getByText, queryByRole } = renderWithTheme(
        <Alert title="Export failed">Try again in a few minutes.</Alert>,
      );
      expect(getByText('Export failed')).toHaveClass('pp-alert__title');
      // Spec §6: the right level is h2 in a banner and h3 inside a card, and
      // this component knows neither, so it guesses neither.
      expect(queryByRole('heading')).toBeNull();
      expect(container.querySelector('.pp-alert__body')).toHaveTextContent(
        'Try again in a few minutes.',
      );
    });

    it('is never written to the DOM as the HTML title attribute', () => {
      // The prop is `Omit`ed off the div's own props and redeclared. If it ever
      // reaches the element, every alert with a title grows a tooltip.
      const { container } = renderWithTheme(<Alert title="Export failed">x</Alert>);
      expect(container.querySelector('.pp-alert')).not.toHaveAttribute('title');
    });

    it('accepts an element, which is how heading semantics are opted into', () => {
      const { getByRole } = renderWithTheme(
        <Alert title={<h3>3 problems</h3>}>Fix them and submit again.</Alert>,
      );
      expect(getByRole('heading', { level: 3 })).toHaveTextContent('3 problems');
    });

    it('renders no title part when there is none', () => {
      const { container } = renderWithTheme(<Alert>x</Alert>);
      expect(container.querySelector('.pp-alert__title')).toBeNull();
    });
  });

  describe('icon', () => {
    it('wraps the SVG so it is decorative, and contributes no accessible name', () => {
      const { container } = renderWithTheme(
        <Alert icon={<svg data-testid="glyph" />} title="Saved">
          Your changes are live.
        </Alert>,
      );
      const wrapper = container.querySelector('.pp-alert__icon')!;
      const icon = wrapper.querySelector('.pp-icon')!;

      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role');
      expect(icon).not.toHaveAttribute('aria-label');
      expect(wrapper.querySelector('[data-testid="glyph"]')).not.toBeNull();
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['false', false],
    ] as const)('renders no icon slot for %s', (_name, value) => {
      // An empty slot is not free: it is a flex item, so it would pay a gap.
      const { container } = renderWithTheme(<Alert icon={value}>x</Alert>);
      expect(container.querySelector('.pp-alert__icon')).toBeNull();
    });
  });

  describe('dismissal', () => {
    it('renders no button without onDismiss', () => {
      const { queryByRole } = renderWithTheme(<Alert>x</Alert>);
      expect(queryByRole('button')).toBeNull();
    });

    it('reports the intent and does NOT hide itself', async () => {
      const onDismiss = vi.fn();
      const { container, getByRole } = renderWithTheme(<Alert onDismiss={onDismiss}>x</Alert>);

      await userEvent.click(getByRole('button', { name: 'Dismiss' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
      // Spec §4. The caller owns the unmount — and therefore owns where focus
      // goes afterwards. A component that hid itself would put the alert's
      // visibility somewhere the app cannot see.
      expect(container.querySelector('.pp-alert')).not.toBeNull();
    });

    it('takes a replaceable label and is passed the alert tone', () => {
      const { getByRole } = renderWithTheme(
        <Alert tone="danger" onDismiss={() => {}} dismissLabel="Close">
          x
        </Alert>,
      );
      const button = getByRole('button', { name: 'Close' });
      expect(button).toHaveClass('pp-alert__dismiss', 'pp-icon-button');
      expect(button).toHaveAttribute('data-pp-tone', 'danger');
      // `plain` so it is transparent over the alert's own surface rather than
      // drawing a bordered box; `sm` is 32px, clearing WCAG 2.5.8's 24px.
      expect(button).toHaveAttribute('data-variant', 'plain');
      expect(button).toHaveAttribute('data-size', 'sm');
    });
  });

  it('renders no content part when it has neither a title nor children', () => {
    const { container } = renderWithTheme(<Alert icon={<svg />} aria-label="Empty" />);
    expect(container.querySelector('.pp-alert__content')).toBeNull();
  });

  it('treats 0 and the empty string as content, not as an absent slot', () => {
    const { container } = renderWithTheme(<Alert title={0}>{0}</Alert>);
    expect(container.querySelector('.pp-alert__title')).toHaveTextContent('0');
    expect(container.querySelector('.pp-alert__body')).toHaveTextContent('0');
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderWithTheme(
      <Alert ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="a" id="banner">
        x
      </Alert>,
    );
    const el = container.querySelector('.pp-alert')!;

    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-alert', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'a');
    expect(el).toHaveAttribute('id', 'banner');
  });

  it('has no axe violations, live and dismissible', async () => {
    const { container } = renderWithTheme(
      <>
        <Alert tone="danger" live="assertive" title="Export failed" icon={<svg />}>
          The report could not be generated.
        </Alert>
        <Alert tone="accent" onDismiss={() => {}}>
          You are viewing test data.
        </Alert>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
