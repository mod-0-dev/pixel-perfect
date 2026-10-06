'use client';

import { ButtonGroup, Field, Slider, Toggle } from 'pixel-perfect';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

/**
 * A box you can resize, with a composition in it (D-104 §3).
 *
 * The library's one claim that a screenshot cannot make is that a component
 * answers to the box it was given and never to the viewport. The Matrix
 * proves it with three frozen widths; this lets a person drag the box from a
 * phone to the full page and watch every `@container` rule inside answer —
 * a sidebar fold away, a grid reflow, a toolbar wrap. The frame is a query
 * container, and the composition fills it; nothing inside knows the window.
 *
 * Three ways to set the width, because a drag is not a way everyone has: the
 * edge (pointer), the presets (one press), and a Slider (keys, and the name
 * a screen reader reads). The drag handle is a convenience over the Slider
 * and is hidden from assistive tech, which has the Slider.
 */

const MIN = 240;
const PRESETS = [
  { label: 'Phone', width: 375 },
  { label: 'Tablet', width: 768 },
  { label: 'Full', width: Number.POSITIVE_INFINITY },
] as const;

export interface StageProps {
  /** What is on the stage, for the controls' names: "Settings screen". */
  label: string;
  /** The width to open at, in CSS pixels. Full width when omitted. */
  defaultWidth?: number;
  children: ReactNode;
}

export function Stage({ label, defaultWidth = Number.POSITIVE_INFINITY, children }: StageProps) {
  const outer = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [requested, setRequested] = useState(defaultWidth);

  // The page decides how wide the stage can get; nothing is known about it
  // until it is laid out, so the first render (server and client alike) is
  // "full" and the measurement follows.
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setAvailable(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = available ?? 1200;
  const width = Math.round(Math.max(MIN, Math.min(requested, max)));
  const full = requested >= max;

  const drag = useRef<{ x: number; width: number; rtl: boolean } | null>(null);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    drag.current = { x: event.clientX, width, rtl };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = (event.clientX - start.x) * (start.rtl ? -1 : 1);
    setRequested(Math.max(MIN, Math.min(start.width + dx, max)));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="stage" ref={outer}>
      <div className="stage__controls">
        <ButtonGroup label={`${label}: preset widths`}>
          {PRESETS.map((preset) => (
            <Toggle
              key={preset.label}
              variant="outline"
              size="sm"
              pressed={preset.width === Number.POSITIVE_INFINITY ? full : !full && width === preset.width}
              onPressedChange={() => setRequested(preset.width)}
            >
              {preset.label}
            </Toggle>
          ))}
        </ButtonGroup>
        <div className="stage__width">
          <Field label={`${label}: width in pixels`} labelHidden>
            <Slider min={MIN} max={max} step={1} value={width} onValueChange={setRequested} size="sm" />
          </Field>
        </div>
        <output className="stage__readout" aria-hidden="true">
          {width}px
        </output>
      </div>

      <div className="stage__frame" style={{ inlineSize: width }} data-full={full || undefined}>
        {children}
        <div
          className="stage__handle"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  );
}
