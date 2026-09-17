'use client';

import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import type { Size, Tone } from '../../types';

/**
 * A person's picture, with a fallback when there is no image or it fails.
 *
 * Sizing contract: hug. A fixed square per `size`.
 * RSC: client — the only one in Tier 1. Whether an image loaded is runtime
 * state no CSS can observe. The server renders the fallback, and so does the
 * first client render, so there is no hydration mismatch; the swap happens on
 * the load event, after hydration.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.9
 */

export type AvatarLoadingStatus = 'loading' | 'loaded' | 'error';

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'role' | 'aria-label'> {
  /** The accessible name, and the source of the generated initials. Required. */
  name: string;
  /** Omit for a fallback-only avatar. */
  src?: string;
  /** Overrides the initials generated from `name`. */
  fallback?: ReactNode;
  size?: Size;
  /** Fallback background. */
  tone?: Tone;
  onLoadingStatusChange?: (status: AvatarLoadingStatus) => void;
}

/** First grapheme, not first UTF-16 code unit, so nothing outside the BMP is sliced. */
function firstGrapheme(text: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)[Symbol.iterator]().next();
    return first.done ? '' : first.value.segment;
  }
  return [...text][0] ?? '';
}

/** "Mara Ellison" → "ME"; "Cher" → "C". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  if (!first) return '';
  return (firstGrapheme(first) + (last ? firstGrapheme(last) : '')).toLocaleUpperCase();
}

/**
 * Observes the load on a detached Image rather than the rendered <img>. A
 * cached image can fire `load` during HTML parsing, before React has attached
 * any handler to the server-rendered element, which would leave the avatar
 * showing its fallback forever.
 */
function useImageLoadingStatus(src: string | undefined): AvatarLoadingStatus {
  const [status, setStatus] = useState<AvatarLoadingStatus>(src ? 'loading' : 'error');

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    let active = true;
    setStatus('loading');
    const image = new Image();
    image.onload = () => {
      if (active) setStatus('loaded');
    };
    image.onerror = () => {
      if (active) setStatus('error');
    };
    image.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  return status;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, fallback, size = 'md', tone = 'neutral', onLoadingStatusChange, className, ...props },
  ref,
) {
  const status = useImageLoadingStatus(src);

  useEffect(() => {
    onLoadingStatusChange?.(status);
  }, [status, onLoadingStatusChange]);

  return (
    <span
      ref={ref}
      className={cx('pp-avatar', className)}
      role="img"
      aria-label={name}
      data-size={size}
      data-pp-tone={tone}
      data-state={status}
      {...props}
    >
      {status === 'loaded' && src ? (
        <img className="pp-avatar__image" src={src} alt="" />
      ) : (
        <span className="pp-avatar__fallback" aria-hidden="true">
          {fallback ?? initialsOf(name)}
        </span>
      )}
    </span>
  );
});
