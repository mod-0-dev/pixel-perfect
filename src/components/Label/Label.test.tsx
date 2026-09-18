import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Label } from './Label';

describe('Label', () => {
  it('renders a <label> and names the control it points at', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <>
        <Label htmlFor="email">Email address</Label>
        <input id="email" />
      </>,
    );

    const label = getByText('Email address');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveClass('pp-label');
    expect(label).toHaveAttribute('for', 'email');
    expect(getByLabelText('Email address')).toBe(document.getElementById('email'));
  });

  it('moves focus to its control when clicked', async () => {
    const user = userEvent.setup();
    const { getByText } = renderWithTheme(
      <>
        <Label htmlFor="email">Email address</Label>
        <input id="email" />
      </>,
    );

    await user.click(getByText('Email address'));
    expect(document.getElementById('email')).toHaveFocus();
  });

  it('defaults to size md and exposes it', () => {
    const { getByText } = renderWithTheme(<Label>Email</Label>);
    expect(getByText('Email')).toHaveAttribute('data-size', 'md');
  });

  it.each(['sm', 'md', 'lg'] as const)('mirrors size=%s', (size) => {
    const { getByText } = renderWithTheme(<Label size={size}>Email</Label>);
    expect(getByText('Email')).toHaveAttribute('data-size', size);
  });

  describe('required', () => {
    it('renders an aria-hidden indicator and sets data-required', () => {
      const { container } = renderWithTheme(<Label required>Email address</Label>);
      const indicator = container.querySelector('.pp-label__required');

      expect(indicator).not.toBeNull();
      expect(indicator).toHaveTextContent('*');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.pp-label')).toHaveAttribute('data-required', 'true');
    });

    it('renders nothing extra when not required', () => {
      const { container } = renderWithTheme(<Label>Email address</Label>);
      expect(container.querySelector('.pp-label__required')).toBeNull();
      expect(container.querySelector('.pp-label')).not.toHaveAttribute('data-required');
    });

    it('keeps the asterisk out of the control\'s accessible name', () => {
      const { getByRole } = renderWithTheme(
        <>
          <Label htmlFor="email" required>
            Email address
          </Label>
          <input id="email" required />
        </>,
      );

      // The glyph is aria-hidden and the control carries `required`, so the
      // state is announced once, by the control. Asserted again in a real
      // browser in tests/visual/harness.spec.ts — D-030 §2 is the reason:
      // jsdom's accessibility tree is a model of one, not the one a screen
      // reader reads.
      expect(getByRole('textbox')).toHaveAccessibleName('Email address');
    });

    it('glues the indicator to the text with no space character', () => {
      // The gap is padding on the span. A space here would also be a break
      // opportunity, which orphans the asterisk onto its own line when the
      // label wraps.
      const { container } = renderWithTheme(<Label required>Email address</Label>);
      expect(container.querySelector('.pp-label')).toHaveTextContent(/^Email address\*$/);
    });
  });

  describe('disabled', () => {
    it('exposes data-disabled and no ARIA disabled state', () => {
      const { getByText } = renderWithTheme(<Label disabled>Email</Label>);
      const label = getByText('Email');

      expect(label).toHaveAttribute('data-disabled', 'true');
      // A <label> is not a widget. aria-disabled on a non-interactive element
      // is noise at best and a lie about focusability at worst.
      expect(label).not.toHaveAttribute('aria-disabled');
      expect(label).not.toHaveAttribute('disabled');
    });
  });

  describe('invalid', () => {
    it('exposes data-invalid for consumers to style, and changes nothing itself', () => {
      const { getByText } = renderWithTheme(<Label invalid>Email</Label>);
      const label = getByText('Email');

      expect(label).toHaveAttribute('data-invalid', 'true');
      // No aria-invalid: that belongs on the control, with aria-describedby
      // pointing at the message. Field wires both.
      expect(label).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('API surface', () => {
    it('forwards ref to the root <label>', () => {
      const ref = createRef<HTMLLabelElement>();
      renderWithTheme(<Label ref={ref}>Email</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
      expect(ref.current).toHaveClass('pp-label');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByText } = renderWithTheme(
        <Label className="app-label" style={{ opacity: 0.5 }}>
          Email
        </Label>,
      );
      const label = getByText('Email');

      expect(label).toHaveClass('pp-label', 'app-label');
      expect(label).toHaveStyle({ opacity: '0.5' });
    });

    it('spreads the rest onto the root', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const { getByTestId } = renderWithTheme(
        <Label data-testid="label" aria-describedby="hint" onClick={onClick}>
          Email
        </Label>,
      );
      const label = getByTestId('label');

      expect(label).toHaveAttribute('aria-describedby', 'hint');
      await user.click(label);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('requires children at the type level', () => {
      // @ts-expect-error children is not optional — a label with no content
      // names nothing, and the type is where that is enforced.
      renderWithTheme(<Label />);
    });

    it('has no asChild: the root stays a <label> whatever is passed', () => {
      const { getByText } = renderWithTheme(
        // @ts-expect-error asChild is not part of LabelProps (spec §7)
        <Label asChild>
          <span>Email</span>
        </Label>,
      );
      // Delegating would destroy click-to-focus and the accessible name, which
      // is the entire component. The element is still a <label>.
      expect(getByText('Email').closest('label')).toHaveClass('pp-label');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations paired with a control', async () => {
      const { container } = renderWithTheme(
        <>
          <Label htmlFor="email">Email address</Label>
          <input id="email" />
        </>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when required or disabled', async () => {
      const { container } = renderWithTheme(
        <>
          <Label htmlFor="name" required>
            Full name
          </Label>
          <input id="name" required />
          <Label htmlFor="ssn" disabled>
            Tax ID
          </Label>
          <input id="ssn" disabled />
        </>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
