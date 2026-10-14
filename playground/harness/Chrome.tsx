'use client';

import { Link } from '@mod-0-dev/pixel-perfect';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { COMPONENTS } from '../app/components/registry';
import { QuickFind } from './QuickFind';
import { ThemeSwitcher } from './ThemeSwitcher';

/**
 * The page chrome every playground page shares: the wordmark, the places
 * to go, the theme switcher, and — on a component page — where you
 * are and what is next door — and quick find, on mod+k. Reads the route to know which page it is on,
 * which is why it is a client component; nothing here writes an id.
 */

const PLACES = [
  { href: '/', label: 'Components' },
  { href: '/examples', label: 'Examples' },
  { href: '/theme', label: 'Theme' },
  { href: '/rules', label: 'Rules' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/harness', label: 'Harness' },
] as const;

export function Chrome() {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);

  /*
   * The chrome's height while it is pinned, as `--chrome-block-size` on the
   * root, so what sticks below it (the index's tier list) and what is jumped
   * to (a `#tier-N` heading) clear it. Zero where it scrolls away (a phone).
   */
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const root = document.documentElement;
    const measure = () => {
      const pinned = getComputedStyle(element).position === 'sticky';
      root.style.setProperty('--chrome-block-size', `${pinned ? element.offsetHeight : 0}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const index = COMPONENTS.findIndex((entry) => pathname === `/components/${entry.slug}`);
  const entry = index === -1 ? undefined : COMPONENTS[index];
  const previous = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = index !== -1 && index < COMPONENTS.length - 1 ? COMPONENTS[index + 1] : undefined;

  return (
    <header className="chrome" ref={header}>
      <div className="chrome__row">
        <NextLink href="/" className="chrome__brand">
          pixel-perfect
        </NextLink>
        <nav className="chrome__places" aria-label="Playground">
          {PLACES.map((place) => {
            // A component's docs page and its harness page are both "Components";
            // an example is under "Examples".
            const current =
              place.href === '/'
                ? pathname === '/' || entry !== undefined || pathname.startsWith('/docs/')
                : pathname === place.href || pathname.startsWith(`${place.href}/`);
            return (
              <Link key={place.href} asChild tone="neutral" underline="hover">
                <NextLink href={place.href} aria-current={current ? 'page' : undefined}>
                  {place.label}
                </NextLink>
              </Link>
            );
          })}
        </nav>
        <ThemeSwitcher />
        <QuickFind enabled={pathname !== '/components/command-palette'} />
      </div>

      {entry && (
        <nav className="chrome__row chrome__where" aria-label="Component">
          <Link asChild tone="neutral" underline="hover">
            <NextLink href="/">← All components</NextLink>
          </Link>
          <span className="chrome__here" aria-current="page">
            <span className="chrome__tier">{entry.tier}</span> {entry.name}
          </span>
          <span className="chrome__siblings">
            {previous ? (
              <Link asChild tone="neutral" underline="hover">
                <NextLink href={`/components/${previous.slug}`} rel="prev">
                  ← {previous.name}
                </NextLink>
              </Link>
            ) : (
              <span className="chrome__end">First</span>
            )}
            <span aria-hidden="true">·</span>
            {next ? (
              <Link asChild tone="neutral" underline="hover">
                <NextLink href={`/components/${next.slug}`} rel="next">
                  {next.name} →
                </NextLink>
              </Link>
            ) : (
              <span className="chrome__end">Last</span>
            )}
          </span>
        </nav>
      )}
    </header>
  );
}
