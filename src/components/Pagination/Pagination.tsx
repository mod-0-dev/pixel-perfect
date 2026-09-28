'use client';

import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react';

import { cx } from '../../internal/cx';
import { useControllableState } from '../../internal/useControllableState';
import type { Size } from '../../types';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';

/**
 * Which page of many, and a way to the others: previous, next, and a
 * window of page numbers around the current one with the first and the
 * last always reachable.
 *
 * BUTTONS BY DEFAULT, LINKS WHEN `getHref` SAYS WHERE A PAGE LIVES (spec
 * §2): a page with a URL is a page a reader can open in a new tab. The
 * current page is never a link to itself.
 *
 * THE COMPACT FORM IS THE CONTAINER'S DECISION (spec §4): below 28rem the
 * stylesheet hides the numbers and shows "3 of 12". Nothing is measured
 * here; the status is always rendered, visually hidden in the full form.
 *
 * Sizing contract: fill — because the container query needs the parent's
 * width. RSC: client. Spec: docs/specs/Pagination.md
 */

export interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children' | 'aria-label'> {
  /** The number of pages. */
  count: number;
  /** Controlled. */
  page?: number;
  /** Uncontrolled. */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Pages shown each side of the current one. */
  siblingCount?: number;
  /** Pages shown at each end. */
  boundaryCount?: number;
  /** Pages become links to the URL returned; the current page becomes text. */
  getHref?: (page: number) => string;
  /** The Buttons' size. */
  size?: Size;
  /** The landmark's name. */
  label?: string;
  /** Every control. */
  disabled?: boolean;
}

type Item = number | 'start-ellipsis' | 'end-ellipsis';

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

/**
 * The window (spec §1): the boundaries, the siblings, and an ellipsis where
 * the two do not touch — with a constant number of slots as the page moves,
 * so the row keeps its width. MUI's `usePagination` arithmetic.
 */
export function paginationItems(count: number, page: number, siblingCount: number, boundaryCount: number): Item[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : count - 1,
  );

  const items: Item[] = [...startPages];
  if (siblingsStart > boundaryCount + 2) items.push('start-ellipsis');
  else if (boundaryCount + 1 < count - boundaryCount) items.push(boundaryCount + 1);
  items.push(...range(siblingsStart, siblingsEnd));
  if (siblingsEnd < count - boundaryCount - 1) items.push('end-ellipsis');
  else if (count - boundaryCount > boundaryCount) items.push(count - boundaryCount);
  items.push(...endPages);
  return items;
}

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  /* One drawing, pointed along the inline axis; the stylesheet mirrors it
     under `:dir(rtl)` (spec §5). */
  return (
    <svg
      className="pp-pagination__chevron"
      data-direction={direction}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'previous' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </svg>
  );
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    count,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    getHref,
    size = 'md',
    label = 'Pagination',
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const total = Number.isFinite(count) && count >= 1 ? Math.floor(count) : 1;
  const [rawPage, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
    component: 'Pagination',
    prop: 'page',
  });
  const page = Math.min(total, Math.max(1, rawPage));

  const go = (next: number) => (event: MouseEvent) => {
    if (disabled || next === page || next < 1 || next > total) {
      if (getHref) event.preventDefault();
      return;
    }
    setPage(next);
  };

  const items = paginationItems(total, page, Math.max(0, siblingCount), Math.max(0, boundaryCount));

  const control = (direction: 'previous' | 'next') => {
    const target = direction === 'previous' ? page - 1 : page + 1;
    const off = disabled || target < 1 || target > total;
    const name = direction === 'previous' ? 'Previous page' : 'Next page';
    const icon = (
      <Icon decorative size={size}>
        <Chevron direction={direction} />
      </Icon>
    );
    const shared = {
      variant: 'ghost' as const,
      size,
      className: 'pp-icon-button pp-pagination__control',
      'aria-label': name,
      disabled: off,
      onClick: go(target),
    };
    if (getHref && !off) {
      return (
        <Button asChild {...shared}>
          <a href={getHref(target)}>{icon}</a>
        </Button>
      );
    }
    return <Button {...shared}>{icon}</Button>;
  };

  return (
    <nav ref={ref} aria-label={label} className={cx('pp-pagination', className)} data-size={size} {...props}>
      <ul className="pp-pagination__list">
        <li className="pp-pagination__item pp-pagination__item--control">{control('previous')}</li>
        {items.map((item) => {
          if (typeof item !== 'number') {
            return (
              <li key={item} className="pp-pagination__item pp-pagination__ellipsis" aria-hidden="true">
                …
              </li>
            );
          }
          const current = item === page;
          const shared = {
            variant: 'ghost' as const,
            /* The current page is in the accent ramp, so its pressed surface
               (spec §3) and its text are the accent's; the others are neutral. */
            tone: current ? ('accent' as const) : ('neutral' as const),
            size,
            className: 'pp-pagination__page',
            disabled,
            onClick: go(item),
            ...(current ? { 'aria-current': 'page' as const } : {}),
          };
          return (
            <li key={item} className="pp-pagination__item pp-pagination__item--page">
              {getHref ? (
                current ? (
                  <Button asChild {...shared}>
                    <span>{item}</span>
                  </Button>
                ) : (
                  <Button asChild {...shared}>
                    <a href={getHref(item)}>{item}</a>
                  </Button>
                )
              ) : (
                <Button {...shared}>{item}</Button>
              )}
            </li>
          );
        })}
        <li className="pp-pagination__item pp-pagination__status">
          {page} of {total}
        </li>
        <li className="pp-pagination__item pp-pagination__item--control">{control('next')}</li>
      </ul>
    </nav>
  );
});
