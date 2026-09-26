import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import type { Tone } from '../../types';

/**
 * A bordered, tone-coloured block that says something happened, or something is
 * true, about the region of the page it sits in.
 *
 * Sizing contract: fill. Flex row, no width declaration, min-inline-size: 0.
 * RSC: server — no hooks, no state, no browser API.
 *
 * THE NAME IS THE TRAP: `role="alert"` IS OPT-IN.
 * An assertive live region interrupts whatever the screen reader is saying,
 * which is right for a session timeout and wrong for the six other things
 * people build with an alert box. And a live region announces *changes* to a
 * region that already existed, so an `Alert` server-rendered into the initial
 * HTML has no change to announce at all. `live` defaults to `off`.
 *
 * IT HOLDS NO STATE, and that is what keeps it a Server Component. `onDismiss`
 * reports the intent; the caller unmounts the alert. An `open` prop would make
 * this client-only, would drag in RULES §5.5's controlled/uncontrolled pair,
 * and would put the alert's visibility somewhere the app cannot see — which is
 * wrong for the case that actually matters, where a dismissed banner has to
 * stay dismissed across a reload.
 *
 * Spec: docs/specs/Alert.md
 */

export type AlertLive = 'off' | 'polite' | 'assertive';

/**
 * `off` is the absence of a role, not `aria-live="off"`. The two are not the
 * same: an element that carries `aria-live="off"` is still a live region that
 * happens to be muted, and some assistive tech treats it as one.
 *
 * `role` rather than a bare `aria-live` attribute because `role="status"` and
 * `role="alert"` also imply `aria-atomic="true"` — the region is read whole
 * rather than as the one word that changed — and they are the better-supported
 * spelling.
 */
const LIVE_ROLE: Record<AlertLive, 'status' | 'alert' | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

/**
 * Whether a slot has content worth a box.
 *
 * `undefined`, `null` and `false` are all "no slot" — `null` because it is the
 * established explicit-none spelling in this library (NumberInput, 3.14), and
 * `false` because `{cond && <x/>}` is how everyone writes a conditional child.
 * `0` and `''` are content: they render, so they get their box.
 */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * The dismiss glyph, as markup rather than a `mask-image` data URI (D-039 §3).
 *
 * Spec §5 rules that this component ships no icons; this is not one of them.
 * `IconButton` cannot be constructed without children, so a close button with
 * no glyph is not a thing that exists — the same case as `Select`'s chevron,
 * where the component draws the graphic without which its own control is
 * unidentifiable. The five tone icons §5 declines are a different question:
 * they decorate the caller's content, and an alert without one loses nothing.
 */
function DismissGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export interface AlertProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /**
   * The alert's own hue: fill, edge, title, body text and the dismiss button.
   *
   * It does NOT reach a `Button`, `Link`, `Badge` or `Code` you put inside.
   * Each of those defaults its own `tone` and writes its own `data-pp-tone`,
   * and the nearest context wins — so pass the tone to them yourself (D-059).
   */
  tone?: Tone;
  /**
   * The heading line.
   *
   * `title` is OMITTED FROM THE DIV'S OWN PROPS and redeclared, because HTML's
   * `title` is the tooltip attribute and is a `string`. Two props cannot share
   * a name, and the one worth having here is this one: a tooltip on a block of
   * prose is not a pattern, and the caller who wants one can set it through a
   * ref or on a child.
   *
   * A `ReactNode` and not a `string`, which is the escape for heading
   * semantics: the component renders a `<div>`, because the right level is
   * `h2` in a page banner and `h3` inside a card and it knows neither, and
   * `title={<Heading level={3}>…</Heading>}` puts a real one inside it.
   */
  title?: ReactNode;
  /**
   * The SVG, not an `<Icon>` — it is wrapped in `<Icon decorative>` here, so
   * sizing and `aria-hidden` are guaranteed rather than requested.
   *
   * There is no default. `Icon` (1.3) ships no icons of its own and neither
   * does this: four opinionated glyphs are a design system's identity, and a
   * consumer with their own set would ship both (spec §5).
   */
  icon?: ReactNode;
  /** Its presence renders the dismiss button. The component does not hide itself. */
  onDismiss?: () => void;
  /** The dismiss button's accessible name. Ignored when `onDismiss` is absent. */
  dismissLabel?: string;
  /**
   * `polite` → `role="status"`, `assertive` → `role="alert"`. Default `off`.
   *
   * The role lands on THIS element, so it only announces reliably when this
   * element is already mounted and its content changes. `{saved && <Alert
   * live="polite">…}` mounts the region and its text together, and may be
   * read twice or not at all. For a message that arrives by mounting, keep a
   * `role="status"` element mounted yourself and render the alert inside it
   * with `live` off (D-059).
   */
  live?: AlertLive;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    tone = 'neutral',
    title,
    icon,
    onDismiss,
    dismissLabel = 'Dismiss',
    live = 'off',
    className,
    children,
    ...props
  },
  ref,
) {
  const hasIcon = filled(icon);
  const hasTitle = filled(title);
  const hasBody = filled(children);

  return (
    <div
      ref={ref}
      className={cx('pp-alert', className)}
      // The tone context (D-007), on the root rather than on a part so that
      // every part of the alert reads one hue. It reaches the caller's bare
      // text and anything that paints from `currentColor`, and it stops at any
      // component that writes its own `data-pp-tone` — `Button`, `Link`,
      // `Badge` and `Code` all do, from a default, so they keep their own hue
      // unless the caller passes one (D-059). The dismiss button gets `tone`
      // below explicitly for the same reason.
      data-pp-tone={tone}
      // Written BEFORE the spread, so a caller's explicit `role` still wins.
      role={LIVE_ROLE[live]}
      {...props}
    >
      {hasIcon && (
        /*
         * The wrapper is what puts the glyph on the first line WITHOUT the
         * `margin-block-start: -2px` every recipe uses and RULES §2 bans. It is
         * exactly one line box tall and centres its child; `Icon` itself is a
         * 1em square and must stay square, because `.pp-icon > svg` is 100% of
         * both axes and a taller box would stretch the drawing.
         */
        <span className="pp-alert__icon">
          <Icon decorative>{icon}</Icon>
        </span>
      )}
      {(hasTitle || hasBody) && (
        <div className="pp-alert__content">
          {hasTitle && <div className="pp-alert__title">{title}</div>}
          {hasBody && <div className="pp-alert__body">{children}</div>}
        </div>
      )}
      {onDismiss && (
        /*
         * `plain` and not IconButton's `ghost` default: `ghost`'s fill is
         * --pp-tone-bg, which is the alert's own surface, over a subtle border
         * — so a ghost button here draws a visible outlined box and no fill at
         * all. `plain` is transparent until hovered.
         *
         * `size="sm"` is a 32px square, clearing WCAG 2.5.8's 24px minimum
         * without a spacing exception, and `tone` is passed on so the hover
         * fill is the alert's own hue one step darker.
         */
        <IconButton
          className="pp-alert__dismiss"
          label={dismissLabel}
          tone={tone}
          variant="plain"
          size="sm"
          onClick={onDismiss}
        >
          <DismissGlyph />
        </IconButton>
      )}
    </div>
  );
});
