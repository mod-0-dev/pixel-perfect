'use client';

import { Link } from 'pixel-perfect';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { COMPONENTS } from '../app/components/registry';
import { ThemeSwitcher } from './ThemeSwitcher';

/**
 * The page chrome every playground page shares: the wordmark, the three
 * places to go, the theme switcher, and — on a component page — where you
 * are and what is next door. Reads the route to know which page it is on,
 * which is why it is a client component; nothing here writes an id.
 */

const PLACES = [
  { href: '/', label: 'Components' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/harness', label: 'Harness' },
] as const;

export function Chrome() {
  const pathname = usePathname();
  const index = COMPONENTS.findIndex((entry) => pathname === `/components/${entry.slug}`);
  const entry = index === -1 ? undefined : COMPONENTS[index];
  const previous = index > 0 ? COMPONENTS[index - 1] : undefined;
  const next = index !== -1 && index < COMPONENTS.length - 1 ? COMPONENTS[index + 1] : undefined;

  return (
    <header className="chrome">
      <div className="chrome__row">
        <NextLink href="/" className="chrome__brand">
          pixel-perfect
        </NextLink>
        <nav className="chrome__places" aria-label="Playground">
          {PLACES.map((place) => {
            const current = place.href === '/' ? pathname === '/' || entry !== undefined : pathname === place.href;
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
