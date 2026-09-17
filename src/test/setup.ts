import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

/**
 * jsdom implements no ResizeObserver, and `Scroller` (2.8) needs one to know
 * whether its content overflows.
 *
 * Stubbed here rather than guarded in the component. ResizeObserver is in every
 * browser the library targets, alongside `@container`, `:dir()` and OKLCH;
 * defending production code against a gap in the test environment is the tail
 * wagging the dog, and the playground's own harness has used it unguarded since
 * Tier 0.
 *
 * It never fires. jsdom has no layout, so there is nothing for it to observe —
 * which is exactly why overflow detection is asserted in a real browser
 * (tests/visual/harness.spec.ts) and only the arithmetic is unit-tested here.
 *
 * **Consumers testing in jsdom need the same stub**, or a polyfill. Documented
 * on the Scroller docs page.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
