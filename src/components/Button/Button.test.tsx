import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from './Button';

const VARIANTS = ['solid', 'outline', 'ghost', 'plain'] as const;
const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

describe('Button', () => {
  it('renders a real button with the documented defaults', () => {
    const { getByRole } = renderWithTheme(<Button>Save</Button>);
    const el = getByRole('button', { name: 'Save' });

    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveClass('pp-button');
    expect(el).toHaveAttribute('data-variant', 'solid');
    expect(el).toHaveAttribute('data-pp-tone', 'neutral');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).not.toHaveAttribute('data-loading');
    expect(el).not.toHaveAttribute('data-disabled');
    expect(el.querySelector('.pp-button__content')).toHaveTextContent('Save');
  });

  it.each(VARIANTS)('mirrors variant=%s', (variant) => {
    const { getByRole } = renderWithTheme(<Button variant={variant}>Go</Button>);
    expect(getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it.each(TONES)('mirrors tone=%s onto the tone context attribute', (tone) => {
    const { getByRole } = renderWithTheme(<Button tone={tone}>Go</Button>);
    expect(getByRole('button')).toHaveAttribute('data-pp-tone', tone);
  });

  it.each(SIZES)('mirrors size=%s', (size) => {
    const { getByRole } = renderWithTheme(<Button size={size}>Go</Button>);
    expect(getByRole('button')).toHaveAttribute('data-size', size);
  });

  describe('type', () => {
    it('defaults to "button", not HTML\'s "submit"', () => {
      const { getByRole } = renderWithTheme(<Button>Go</Button>);
      expect(getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('does not submit the form it sits in', async () => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <form onSubmit={onSubmit}>
          <Button>Add a row</Button>
        </form>,
      );
      await userEvent.click(getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits when asked to', async () => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <form onSubmit={onSubmit}>
          <Button type="submit">Save</Button>
        </form>,
      );
      await userEvent.click(getByRole('button'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading', () => {
    it('is aria-disabled but NOT disabled, so it keeps its place in the tab order', () => {
      const { getByRole } = renderWithTheme(<Button loading>Save</Button>);
      const el = getByRole('button');

      expect(el).toHaveAttribute('data-loading', 'true');
      expect(el).toHaveAttribute('aria-disabled', 'true');
      expect(el).not.toBeDisabled();
      expect(el).not.toHaveAttribute('data-disabled');
    });

    /*
     * The behaviour this guards is a BROWSER behaviour: a browser blurs a
     * focused element the instant it becomes disabled, which is why `loading`
     * must not use `disabled`. jsdom does not implement that blur, so asserting
     * `document.activeElement` after a rerender passes whether or not the
     * component is correct — it was written that way first and verified to pass
     * against a deliberately broken component, which makes it a rule that never
     * fires (the same objection src/test/a11y.ts raises about colour-contrast
     * in jsdom).
     *
     * So the assertion is on the mechanism jsdom CAN observe: the element stays
     * focusable and stays in the tab order. The rendered result is checked in a
     * real browser by tests/visual/harness.spec.ts.
     */
    it('stays focusable and in the tab order while loading', async () => {
      const { getByRole } = renderWithTheme(<Button loading>Save</Button>);
      const el = getByRole('button');

      expect(el).not.toBeDisabled();
      expect(el).not.toHaveAttribute('tabindex', '-1');

      await userEvent.tab();
      expect(document.activeElement).toBe(el);
    });

    it('keeps the label in the DOM, so the accessible name does not change', () => {
      const { getByRole } = renderWithTheme(<Button loading>Save</Button>);
      expect(getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders a decorative spinner that does not add a second name', () => {
      const { getByRole, container } = renderWithTheme(<Button loading>Save</Button>);
      const spinner = container.querySelector('.pp-button__spinner .pp-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
      expect(getByRole('button')).toHaveAccessibleName('Save');
    });

    it('swallows the click', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );
      await userEvent.click(getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('swallows keyboard activation via %s', async (key) => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );
      getByRole('button').focus();
      await userEvent.keyboard(key);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not submit its form', async () => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading>
            Save
          </Button>
        </form>,
      );
      await userEvent.click(getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('fires normally once loading clears', async () => {
      const onClick = vi.fn();
      const { getByRole, rerender } = renderWithTheme(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );
      rerender(
        <Button onClick={onClick}>
          Save
        </Button>,
      );
      await userEvent.click(getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled', () => {
    it('uses the native attribute and exposes data-disabled', () => {
      const { getByRole } = renderWithTheme(<Button disabled>Save</Button>);
      const el = getByRole('button');
      expect(el).toBeDisabled();
      expect(el).toHaveAttribute('data-disabled', 'true');
    });

    it('does not fire onClick', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );
      await userEvent.click(getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild', () => {
    it('renders the child element and merges the class onto it', () => {
      const { getByRole } = renderWithTheme(
        <Button asChild>
          <a href="/settings" className="app-link">
            Settings
          </a>
        </Button>,
      );
      const el = getByRole('link', { name: 'Settings' });
      expect(el.tagName).toBe('A');
      expect(el).toHaveClass('pp-button', 'app-link');
      expect(el).toHaveAttribute('href', '/settings');
    });

    it('wraps the child’s own children in the content element', () => {
      const { getByRole } = renderWithTheme(
        <Button asChild>
          <a href="/x">Settings</a>
        </Button>,
      );
      const content = getByRole('link').querySelector('.pp-button__content');
      expect(content).toHaveTextContent('Settings');
    });

    it('emits no `type` attribute on an anchor', () => {
      const { getByRole } = renderWithTheme(
        <Button asChild>
          <a href="/x">Settings</a>
        </Button>,
      );
      expect(getByRole('link')).not.toHaveAttribute('type');
    });

    it('still shows the spinner while loading', () => {
      const { getByRole } = renderWithTheme(
        <Button asChild loading>
          <a href="/x">Settings</a>
        </Button>,
      );
      expect(getByRole('link').querySelector('.pp-spinner')).toBeInTheDocument();
    });

    it('degrades `disabled` to ARIA, since an anchor has no disabled attribute', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <Button asChild disabled onClick={onClick}>
          <a href="/x">Settings</a>
        </Button>,
      );
      const el = getByRole('link');

      expect(el).not.toHaveAttribute('disabled');
      expect(el).toHaveAttribute('aria-disabled', 'true');
      expect(el).toHaveAttribute('data-disabled', 'true');
      expect(el).toHaveAttribute('tabindex', '-1');

      await userEvent.click(el);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('lets an explicit tabIndex win over the disabled default', () => {
      const { getByRole } = renderWithTheme(
        <Button asChild disabled tabIndex={0}>
          <a href="/x">Settings</a>
        </Button>,
      );
      expect(getByRole('link')).toHaveAttribute('tabindex', '0');
    });

    it('throws on a non-element child rather than rendering something wrong', () => {
      expect(() => renderWithTheme(<Button asChild>Settings</Button>)).toThrow(/exactly one React element/);
    });
  });

  describe('API surface (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLButtonElement>();
      renderWithTheme(<Button ref={ref}>Save</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveClass('pp-button');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByRole } = renderWithTheme(
        <Button className="app-cta" style={{ opacity: 0.5 }}>
          Save
        </Button>,
      );
      const el = getByRole('button');
      expect(el).toHaveClass('pp-button', 'app-cta');
      expect(el).toHaveStyle({ opacity: '0.5' });
    });

    it('spreads the remaining props onto the root', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <Button aria-describedby="hint" data-testid="cta" onClick={onClick}>
          Save
        </Button>,
      );
      const el = getByRole('button');
      expect(el).toHaveAttribute('aria-describedby', 'hint');
      expect(el).toHaveAttribute('data-testid', 'cta');

      await userEvent.click(el);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('still calls a consumer onKeyDown when not blocked', async () => {
      const onKeyDown = vi.fn();
      const { getByRole } = renderWithTheme(<Button onKeyDown={onKeyDown}>Save</Button>);
      getByRole('button').focus();
      await userEvent.keyboard('{Enter}');
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it.each(VARIANTS)('has no axe violations — variant=%s', async (variant) => {
      const { container } = renderWithTheme(<Button variant={variant}>Save</Button>);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations while loading', async () => {
      const { container } = renderWithTheme(<Button loading>Save</Button>);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations while disabled', async () => {
      const { container } = renderWithTheme(<Button disabled>Save</Button>);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations as a link', async () => {
      const { container } = renderWithTheme(
        <Button asChild>
          <a href="/settings">Settings</a>
        </Button>,
      );
      await expectNoA11yViolations(container);
    });

    it('is reachable by keyboard and activates on Enter and Space', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(<Button onClick={onClick}>Save</Button>);

      await userEvent.tab();
      expect(document.activeElement).toBe(getByRole('button'));

      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });
});
