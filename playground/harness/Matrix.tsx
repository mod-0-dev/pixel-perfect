'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MatrixWidth {
  label: string;
  width: number;
}

/**
 * Three container widths, chosen to break things:
 * - 240px: a sidebar. Where text wrapping and truncation fail.
 * - 480px: a modal or a narrow column. The common case.
 * - 960px: full page width. Where `hug` components that should not stretch
 *   reveal themselves by stretching.
 */
export const CONTAINER_WIDTHS: MatrixWidth[] = [
  { label: 'narrow', width: 240 },
  { label: 'medium', width: 480 },
  { label: 'wide', width: 960 },
];

/**
 * Flags a component that outgrew the box its parent gave it. Under the sizing
 * contract that is always a bug in the component, never in the parent, so the
 * harness should say so out loud rather than leave it to be noticed.
 */
function useOverflowFlag() {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  return { ref, overflowing };
}

function Cell({ width, children }: { width: MatrixWidth; children: ReactNode }) {
  const { ref, overflowing } = useOverflowFlag();

  return (
    <div className="matrix__cell">
      <div className="matrix__label">
        {width.label} · {width.width}px
        {overflowing && <span className="matrix__overflow">overflows its parent</span>}
      </div>
      <div
        className="matrix__viewport"
        style={{ width: width.width }}
        data-overflowing={overflowing || undefined}
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
}

export interface MatrixProps {
  children: ReactNode;
  widths?: MatrixWidth[];
  themes?: Array<'light' | 'dark'>;
}

/**
 * Renders the same subtree at every container width in both themes at once.
 *
 * The viewport div is what sizes the component — the whole point of the sizing
 * contract is that the component has no say. Each viewport is also a query
 * container, so a component's own `@container` rules resolve against the box
 * it was actually given rather than the browser window.
 */
export function Matrix({
  children,
  widths = CONTAINER_WIDTHS,
  themes = ['light', 'dark'],
}: MatrixProps) {
  return (
    <div className="matrix">
      {themes.map((theme) => (
        <section key={theme} className="matrix__theme" data-pp-theme={theme}>
          <h3 className="matrix__theme-name">{theme}</h3>
          {widths.map((width) => (
            <Cell key={width.label} width={width}>
              {children}
            </Cell>
          ))}
        </section>
      ))}
    </div>
  );
}
