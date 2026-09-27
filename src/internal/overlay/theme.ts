'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * The theme an overlay should paint in, read from the scope its anchor sits in
 * (overlay-foundation.md §3).
 *
 * Every colour in this library resolves by inheritance from the nearest
 * `[data-pp-theme]` (D-007, D-011). A portal renders outside that subtree, so
 * a popover opened from a dark sidebar in a light app would paint light. The
 * overlay writes the value this returns on its own root, and the tokens
 * resolve as they would have in place.
 *
 * Read ONCE, when the overlay mounts — overlays are transient, and a theme
 * toggled while one is open is picked up by the next open. A layout effect,
 * so the attribute is on the element before the browser paints it. Never
 * runs on the server: an overlay's content is portalled and portals mount
 * after hydration.
 *
 * Tone is deliberately NOT read. A popover opened from a `danger` button is
 * not a danger-toned popover (D-059 §1 from the other side).
 *
 * Internal. Not exported from the package.
 */
export function useInheritedTheme(anchorRef: RefObject<Element | null>): string | undefined {
  const [theme, setTheme] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    const scope = anchorRef.current?.closest('[data-pp-theme]');
    setTheme(scope?.getAttribute('data-pp-theme') ?? undefined);
    // The anchor is stable for the life of the overlay; the read is per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return theme;
}
