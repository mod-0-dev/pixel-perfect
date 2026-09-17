import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Link } from './Link';

const TONES = ['neutral', 'accent', 'danger', 'success', 'warning'] as const;
const UNDERLINES = ['always', 'hover', 'none'] as const;

describe('Link', () => {
  it('renders an anchor with the documented defaults', () => {
    const { getByRole } = renderWithTheme(<Link href="/docs">Ground rules</Link>);
    const el = getByRole('link', { name: 'Ground rules' });

    expect(el.tagName).toBe('A');
    expect(el).toHaveClass('pp-link');
    expect(el).toHaveAttribute('href', '/docs');
    // Accent, because this is the one component where accent is the sane default.
    expect(el).toHaveAttribute('data-pp-tone', 'accent');
    // Always, because colour alone fails WCAG 1.4.1.
    expect(el).toHaveAttribute('data-underline', 'always');
  });

  it.each(TONES)('mirrors tone=%s onto the tone context attribute', (tone) => {
    const { getByRole } = renderWithTheme(
      <Link href="/x" tone={tone}>
        Go
      </Link>,
    );
    expect(getByRole('link')).toHaveAttribute('data-pp-tone', tone);
  });

  it.each(UNDERLINES)('mirrors underline=%s', (underline) => {
    const { getByRole } = renderWithTheme(
      <Link href="/x" underline={underline}>
        Go
      </Link>,
    );
    expect(getByRole('link')).toHaveAttribute('data-underline', underline);
  });

  it('takes no `variant` or `size` — the vocabulary has no word a link needs', () => {
    // A compile-time guarantee; asserted here so the intent survives a refactor
    // that "helpfully" adds them back. @ts-expect-error fails the build if the
    // prop ever becomes valid.
    const { getByRole } = renderWithTheme(
      // @ts-expect-error `variant` is not part of LinkProps (D-030 §6)
      <Link href="/x" variant="solid">
        Go
      </Link>,
    );
    expect(getByRole('link')).toBeInTheDocument();
  });

  describe('asChild', () => {
    it('renders the child element and merges the class onto it', () => {
      const { getByRole } = renderWithTheme(
        <Link asChild tone="neutral">
          <a href="/settings" className="app-nav__link">
            Settings
          </a>
        </Link>,
      );
      const el = getByRole('link', { name: 'Settings' });
      expect(el).toHaveClass('pp-link', 'app-nav__link');
      expect(el).toHaveAttribute('data-pp-tone', 'neutral');
      expect(el).toHaveAttribute('href', '/settings');
    });

    it('lets the child keep its own props', () => {
      const { getByRole } = renderWithTheme(
        <Link asChild>
          <a href="/x" target="_blank" rel="noreferrer">
            Docs
          </a>
        </Link>,
      );
      expect(getByRole('link')).toHaveAttribute('target', '_blank');
      expect(getByRole('link')).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('API surface (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLAnchorElement>();
      renderWithTheme(
        <Link ref={ref} href="/x">
          Go
        </Link>,
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current).toHaveClass('pp-link');
    });

    it('merges className and style rather than replacing them', () => {
      const { getByRole } = renderWithTheme(
        <Link href="/x" className="app-link" style={{ opacity: 0.5 }}>
          Go
        </Link>,
      );
      const el = getByRole('link');
      expect(el).toHaveClass('pp-link', 'app-link');
      expect(el).toHaveStyle({ opacity: '0.5' });
    });

    it('spreads the remaining props onto the root', async () => {
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <Link href="/x" target="_blank" rel="noreferrer" data-testid="nav" onClick={onClick}>
          Go
        </Link>,
      );
      const el = getByRole('link');
      expect(el).toHaveAttribute('target', '_blank');
      expect(el).toHaveAttribute('data-testid', 'nav');

      await userEvent.click(el);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it.each(TONES)('has no axe violations — tone=%s', async (tone) => {
      const { container } = renderWithTheme(
        <p>
          See the{' '}
          <Link href="/docs" tone={tone}>
            ground rules
          </Link>
          .
        </p>,
      );
      await expectNoA11yViolations(container);
    });

    it('is reachable by Tab and activated by Enter', async () => {
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <Link href="/x" onClick={onClick}>
          Go
        </Link>,
      );

      await userEvent.tab();
      expect(document.activeElement).toBe(getByRole('link'));

      await userEvent.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('is NOT activated by Space — that is the link/button distinction, per the APG', async () => {
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      const { getByRole } = renderWithTheme(
        <Link href="/x" onClick={onClick}>
          Go
        </Link>,
      );
      getByRole('link').focus();
      await userEvent.keyboard(' ');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('is not focusable without an href, and is not made so', async () => {
      const { getByText } = renderWithTheme(
        <>
          <Link>Nowhere</Link>
          <button type="button">After</button>
        </>,
      );
      await userEvent.tab();
      // Tab skips straight past it. A link with nowhere to go is a <span>, and
      // adding tabIndex to fake it would announce a link that cannot be followed.
      expect(document.activeElement).not.toBe(getByText('Nowhere'));
      expect(document.activeElement?.tagName).toBe('BUTTON');
    });
  });
});
