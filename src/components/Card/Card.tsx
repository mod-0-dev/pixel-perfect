import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';

/**
 * A bounded surface for one thing, with a header, a body and a footer, any
 * of which may be absent, and a hairline between the ones that are present.
 *
 * NAMED PARTS FOR A SERVER COMPOUND TOO (spec §1, D-079 §1): a card could
 * dot — no client module is crossed — and then the library would have two
 * spellings for one idea. One spelling.
 *
 * Sizing contract: fill. RSC: server — no state, no effect, no handler.
 * Spec: docs/specs/Card.md
 */

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /** Renders the child — a link, a button — as the card (RULES §5.7). An interactive card holds no other interactive content. */
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ asChild = false, className, ...props }, ref) {
  const Component = asChild ? Slot : 'div';
  return <Component ref={ref as never} className={cx('pp-card', className)} {...props} />;
});

export interface CardHeaderProps extends ComponentPropsWithoutRef<'div'> {}

/** A `<div>`, not a heading: what it holds is the consumer's, at the page's level (Alert §6). */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cx('pp-card__header', className)} {...props} />;
});

export interface CardBodyProps extends ComponentPropsWithoutRef<'div'> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(function CardBody({ className, ...props }, ref) {
  return <div ref={ref} className={cx('pp-card__body', className)} {...props} />;
});

export interface CardFooterProps extends ComponentPropsWithoutRef<'div'> {}

/** The card's foot, on the sunken surface (spec §4). */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cx('pp-card__footer', className)} {...props} />;
});
