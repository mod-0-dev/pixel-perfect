import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Cluster, type ClusterProps } from '../Cluster/Cluster';
import { Heading, type HeadingProps } from '../Heading/Heading';
import { Icon } from '../Icon/Icon';
import { Text, type TextProps } from '../Text/Text';

/**
 * Nothing here yet, and what to do about it: a glyph, a title, a line and
 * the action that would fill the space.
 *
 * FIVE PARTS ON THE TIER 1–2 PRIMITIVES (spec §1): every part is the
 * primitive with the empty state's class added, so its props are the
 * primitive's — the title's `level` is required because Heading's is.
 *
 * CENTRED AND HELD TO A MEASURE BY A GRID (spec §2): the root's one column
 * is `minmax(0, measure-xs)`, centred; no child declares a width.
 *
 * `outline` IS CARD'S SURFACE WITH A DASHED EDGE (spec §3): the root carries
 * `pp-card` before its own class, the two-class contract (D-070 §1).
 *
 * Sizing contract: fill. RSC: server. Spec: docs/specs/EmptyState.md
 */

export type EmptyStateVariant = 'plain' | 'outline';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  /** `outline` is a dashed frame on Card's surface — the form for a region that will hold things. */
  variant?: EmptyStateVariant;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { variant = 'plain', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(variant === 'outline' && 'pp-card', 'pp-empty-state', className)}
      data-variant={variant}
      {...props}
    />
  );
});

export interface EmptyStateIconProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'role' | 'aria-label' | 'aria-hidden'> {
  /** The SVG. Decorative: the title says what the glyph shows. */
  children: ReactNode;
}

export const EmptyStateIcon = forwardRef<HTMLSpanElement, EmptyStateIconProps>(function EmptyStateIcon(
  { className, children, ...props },
  ref,
) {
  return (
    <Icon ref={ref} decorative size="lg" className={cx('pp-empty-state__icon', className)} {...props}>
      {children}
    </Icon>
  );
});

export interface EmptyStateTitleProps extends HeadingProps {}

export const EmptyStateTitle = forwardRef<HTMLHeadingElement, EmptyStateTitleProps>(function EmptyStateTitle(
  { size = 'md', className, ...props },
  ref,
) {
  return <Heading ref={ref} size={size} className={cx('pp-empty-state__title', className)} {...props} />;
});

export interface EmptyStateDescriptionProps extends Omit<TextProps, 'align'> {}

export const EmptyStateDescription = forwardRef<HTMLParagraphElement, EmptyStateDescriptionProps>(
  function EmptyStateDescription({ tone = 'muted', className, ...props }, ref) {
    return <Text ref={ref} tone={tone} align="center" className={cx('pp-empty-state__description', className)} {...props} />;
  },
);

export interface EmptyStateActionsProps extends Omit<ClusterProps, 'justify'> {}

export const EmptyStateActions = forwardRef<HTMLDivElement, EmptyStateActionsProps>(function EmptyStateActions(
  { gap = '2', className, ...props },
  ref,
) {
  return <Cluster ref={ref} justify="center" gap={gap} className={cx('pp-empty-state__actions', className)} {...props} />;
});
