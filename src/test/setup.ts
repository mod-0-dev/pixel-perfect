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

/**
 * jsdom implements no `scrollIntoView` either, and `Form` (3.16) calls it when
 * a summary link is followed. Same reasoning as above: it is in every browser
 * the library targets, so the stub lives here rather than a guard in the
 * component. A no-op, because jsdom has no layout to scroll; which element is
 * scrolled is asserted with a spy in Form.test.tsx, and that the scroll lands
 * the label in view is asserted in tests/visual/harness.spec.ts.
 *
 * **Consumers testing in jsdom need the same stub.** Documented on the Form
 * docs page.
 */
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
