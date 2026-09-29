import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Cluster, type ClusterProps } from '../Cluster/Cluster';
import { Heading, type HeadingLevel, type HeadingProps } from '../Heading/Heading';
import { Text, type TextProps } from '../Text/Text';

/**
 * The top of a page: where you are (a Breadcrumb, as a child), what the page
 * is (its <h1>), one line about it, and the actions that act on the whole
 * page at the end of the title's row — under the title when the row is too
 * narrow for both.
 *
 * ONE FLEX ROW THAT WRAPS (spec §2): the breadcrumb and the description take
 * a row each, the title grows and sends the actions down when its row cannot
 * hold `--pp-measure-xs` of title beside them, and a part that is absent is
 * a row that is absent, so no empty row ever costs a gap. The description
 * reads after the title and paints after the actions (spec §3): DOM title,
 * description, actions; painted title, actions, description.
 *
 * Sizing contract: fill. RSC: server. Spec: docs/specs/PageHeader.md
 */
export interface PageHeaderProps extends ComponentPropsWithoutRef<'header'> {}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader({ className, ...props }, ref) {
  return <header ref={ref} className={cx('pp-page-header', className)} {...props} />;
});

/** `Heading`, `level` 1 by default: the page's title is the page's <h1> (spec §4). */
export interface PageHeaderTitleProps extends Omit<HeadingProps, 'level'> {
  level?: HeadingLevel;
}

export const PageHeaderTitle = forwardRef<HTMLHeadingElement, PageHeaderTitleProps>(function PageHeaderTitle(
  { level = 1, className, ...props },
  ref,
) {
  return <Heading ref={ref} level={level} className={cx('pp-page-header__title', className)} {...props} />;
});

/** `Text`, `tone="muted"` by default. Its own row, painted after the actions (spec §3). */
export interface PageHeaderDescriptionProps extends TextProps {}

export const PageHeaderDescription = forwardRef<HTMLParagraphElement, PageHeaderDescriptionProps>(function PageHeaderDescription(
  { tone = 'muted', className, ...props },
  ref,
) {
  return <Text ref={ref} tone={tone} className={cx('pp-page-header__description', className)} {...props} />;
});

/** `Cluster`, `gap="2"` by default. Beside the title, or below it. */
export interface PageHeaderActionsProps extends ClusterProps {}

export const PageHeaderActions = forwardRef<HTMLDivElement, PageHeaderActionsProps>(function PageHeaderActions(
  { gap = '2', className, ...props },
  ref,
) {
  return <Cluster ref={ref} gap={gap} className={cx('pp-page-header__actions', className)} {...props} />;
});
