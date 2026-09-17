import { defineConfig } from 'vitest/config';

/**
 * Scope: behaviour, API shape, and accessibility semantics.
 *
 * NOT scope: anything that depends on real CSS. jsdom does not implement
 * cascade layers, container queries, or `oklch()`, so a computed-style
 * assertion here proves nothing. Those belong in tests/visual, which runs in a
 * real browser. Splitting it the other way round is how a suite ends up green
 * while the component is visibly broken.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
