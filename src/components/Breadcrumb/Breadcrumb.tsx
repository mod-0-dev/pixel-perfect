import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Link, type LinkProps } from '../Link/Link';

/**
 * Where the reader is, and the way back up: a trail of links from the root
 * to here, the last one the page itself and not a link.
 *
 * FIVE PARTS, NAMED EXPORTS (spec §1, RULES §5.6). No separator part: a
 * separator between every pair of items is a fact of the list, drawn by
 * the stylesheet from `--pp-breadcrumb-separator`, and never in the
 * accessibility tree.
 *
 * THE LAST CRUMB IS THE PAGE (spec §2): `BreadcrumbPage` is a span with
 * `aria-current="page"`, never a link. The consumer decides which item is
 * last; a Server Component with no context could not count, and should
 * not.
 *
 * Sizing contract: fill — a landmark spans its line and the trail wraps
 * inside it. RSC: server. Spec: docs/specs/Breadcrumb.md
 */

export interface BreadcrumbProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'aria-label'> {
  /** The landmark's name. */
  label?: string;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { label = 'Breadcrumb', className, children, ...props },
  ref,
) {
  return (
    <nav ref={ref} aria-label={label} className={cx('pp-breadcrumb', className)} {...props}>
      <ol className="pp-breadcrumb__list">{children}</ol>
    </nav>
  );
});

export interface BreadcrumbItemProps extends ComponentPropsWithoutRef<'li'> {}

export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(function BreadcrumbItem(
  { className, ...props },
  ref,
) {
  return <li ref={ref} className={cx('pp-breadcrumb__item', className)} {...props} />;
});

export interface BreadcrumbLinkProps extends Omit<LinkProps, 'tone' | 'underline'> {}

/** A `Link`, neutral and underlined on hover; the crumb's colour through Link's own hook (spec §3). */
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(function BreadcrumbLink(
  { className, ...props },
  ref,
) {
  return <Link ref={ref} tone="neutral" underline="hover" className={cx('pp-breadcrumb__link', className)} {...props} />;
});

export interface BreadcrumbPageProps extends ComponentPropsWithoutRef<'span'> {}

export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(function BreadcrumbPage(
  { className, ...props },
  ref,
) {
  return <span ref={ref} aria-current="page" className={cx('pp-breadcrumb__page', className)} {...props} />;
});

export interface BreadcrumbEllipsisProps extends Omit<ComponentPropsWithoutRef<'li'>, 'children'> {
  /** The accessible name of the cut. */
  label?: string;
}

/** Where the consumer cut the trail. Named, so a screen reader hears that levels are hidden, not "…". */
export const BreadcrumbEllipsis = forwardRef<HTMLLIElement, BreadcrumbEllipsisProps>(function BreadcrumbEllipsis(
  { label = 'More levels', className, ...props },
  ref,
) {
  return (
    <li ref={ref} className={cx('pp-breadcrumb__item', 'pp-breadcrumb__ellipsis', className)} {...props}>
      <span role="img" aria-label={label}>
        …
      </span>
    </li>
  );
});
