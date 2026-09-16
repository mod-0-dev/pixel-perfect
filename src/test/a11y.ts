import axe, { type AxeResults, type RunOptions } from 'axe-core';

/**
 * Runs axe against a container and returns its violations.
 *
 * Deliberately thin: no custom matcher, no wrapper library to keep in step with
 * Vitest releases. The failure message names each rule and the nodes that broke
 * it, which is what you actually need at 2am.
 */
export async function findA11yViolations(
  container: Element,
  options: RunOptions = {},
): Promise<AxeResults['violations']> {
  const results = await axe.run(container, {
    // Colour contrast is verified against real tokens in a real browser by
    // `npm run lint:contrast` and tests/visual. jsdom cannot compute it, and a
    // rule that always passes is worse than no rule.
    rules: { 'color-contrast': { enabled: false } },
    ...options,
  });
  return results.violations;
}

export function formatViolations(violations: AxeResults['violations']): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `      ${n.html}`).join('\n');
      return `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}

/** Fails the test if axe finds anything. */
export async function expectNoA11yViolations(container: Element, options?: RunOptions) {
  const violations = await findA11yViolations(container, options);
  if (violations.length > 0) {
    throw new Error(
      `Expected no accessibility violations, found ${violations.length}:\n\n${formatViolations(violations)}`,
    );
  }
}
