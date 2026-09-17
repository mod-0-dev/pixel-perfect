import { expect, test } from '@playwright/test';

/**
 * These assertions verify the HARNESS, not a component. If overflow detection
 * is broken, every sizing-contract result the playground ever reports is
 * meaningless, so it is checked before it is trusted.
 */
test.describe('harness self-check', () => {
  test('a fill component is never flagged as overflowing', async ({ page }) => {
    await page.goto('/harness');

    const cells = page.locator('section', { hasText: 'Well-behaved' }).locator('.matrix__viewport');
    await expect(cells).toHaveCount(6); // 3 widths × 2 themes

    for (const cell of await cells.all()) {
      await expect(cell).not.toHaveAttribute('data-overflowing', /.*/);
    }
  });

  test('a component that sets its own width is caught at narrow widths', async ({ page }) => {
    await page.goto('/harness');

    const broken = page.locator('section', { hasText: 'Deliberately broken' });
    const cells = broken.locator('.matrix__viewport');
    await expect(cells).toHaveCount(6);

    // 720px content in 240px and 480px cells overflows; the 960px cell does not.
    const flagged = broken.locator('.matrix__viewport[data-overflowing]');
    await expect(flagged).toHaveCount(4); // 240 and 480 overflow; 960 does not
    await expect(broken.locator('.matrix__overflow').first()).toBeVisible();
  });

  test('both themes render distinct backgrounds side by side', async ({ page }) => {
    await page.goto('/harness');

    const bg = (theme: string) =>
      page
        .locator(`.matrix__theme[data-pp-theme="${theme}"]`)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Regression guard for D-010: with themes pinned to :root these were equal.
    expect(await bg('light')).not.toBe(await bg('dark'));
  });
});

/**
 * Computed-style assertions that jsdom cannot make. D-011 was found this way
 * and nowhere else: reading the CSS proved nothing, and only a real browser
 * resolving a real `var()` chain caught it.
 */
test.describe('layout primitives', () => {
  test('a nested Stack does not inherit its parent\'s gap', async ({ page }) => {
    await page.goto('/components/stack');

    const section = page.locator('section', { hasText: 'Nested stacks do not inherit' });
    const outer = section.locator('.pp-stack[data-pp-gap="6"]').first();
    // Located structurally, NOT by data-pp-gap="0". Matching on the attribute
    // would make this fail with "locator not found" the moment the attribute
    // is dropped — which is the very change that causes the bug, so the test
    // would be reporting its own selector rather than the defect. Found by
    // deliberately breaking Stack and watching how the test failed.
    const inner = outer.locator('.pp-stack').first();

    // The gap scale is mapped onto an INHERITING custom property (--_pp-gap),
    // shared by every layout primitive so the ramp lives in one place. That is
    // only safe because `gap` defaults to '0' and the attribute is therefore
    // never omitted. Make `gap` optional-with-no-attribute and this reads 32px.
    expect(await outer.evaluate((el) => getComputedStyle(el).rowGap)).toBe('32px');
    expect(await inner.evaluate((el) => getComputedStyle(el).rowGap)).toBe('0px');
  });

  test('the gap prop resolves to its space token, not to a literal', async ({ page }) => {
    await page.goto('/components/stack');

    const stack = page.locator('.pp-stack[data-pp-gap="3"]').first();
    // --pp-space-3 is 0.75rem, and the playground's root font size is 16px.
    expect(await stack.evaluate((el) => getComputedStyle(el).rowGap)).toBe('12px');
  });

  test('--pp-stack-gap overrides the gap prop', async ({ page }) => {
    await page.goto('/components/stack');

    const section = page.locator('section', { hasText: 'Styling API' });
    const stack = section.locator('.pp-stack[data-pp-gap="1"]').first();
    // gap="1" is 4px; the custom property pins it to --pp-space-5 (1.5rem).
    expect(await stack.evaluate((el) => getComputedStyle(el).rowGap)).toBe('24px');
  });

  test('a Stack never declares an inline size of its own', async ({ page }) => {
    await page.goto('/components/stack');

    // RULES §1: the parent decides. Whatever box the harness hands it, the
    // Stack fills exactly — no more (which would overflow) and no less.
    const cell = page.locator('.matrix__viewport').first();
    const stack = cell.locator('> .pp-stack').first();

    // Against the cell's CONTENT box: the harness viewport carries its own
    // padding and border, and the Stack is only offered what is inside them.
    const available = await cell.evaluate((el) => {
      const cs = getComputedStyle(el);
      return el.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
    });
    const stackBox = await stack.boundingBox();
    expect(stackBox!.width).toBeCloseTo(available, 0);
  });

  test('a Cluster wraps in a narrow container and does not in a wide one', async ({ page }) => {
    await page.goto('/components/cluster');

    const section = page.locator('section', { hasText: 'Wrapping is the container behaviour' });

    // Distinct line-box counts, measured rather than asserted from CSS. This is
    // the payoff of RULES §1 stated as a number: the same markup, the same
    // component, two different layouts, and nothing measured the viewport.
    const lineCount = (cellIndex: number) =>
      section
        .locator('.matrix__viewport')
        .nth(cellIndex)
        .locator('.pp-cluster')
        .evaluate((el) => {
          const tops = new Set<number>();
          for (const child of Array.from(el.children)) {
            tops.add(Math.round(child.getBoundingClientRect().top));
          }
          return tops.size;
        });

    // Matrix order is light[narrow, medium, wide], dark[narrow, medium, wide].
    const narrow = await lineCount(0);
    const wide = await lineCount(2);

    expect(narrow).toBeGreaterThan(1);
    expect(wide).toBe(1);
  });

  test('wrap={false} is caught by the harness as an overflow', async ({ page }) => {
    await page.goto('/components/cluster');

    const section = page.locator('section', { hasText: 'is the overflow you asked for' });
    // The 240px cells cannot hold four badges on one line, and nowrap means
    // they do not get a second. That is a bug the component was told to have.
    await expect(section.locator('.matrix__viewport[data-overflowing]').first()).toBeVisible();
  });
});

