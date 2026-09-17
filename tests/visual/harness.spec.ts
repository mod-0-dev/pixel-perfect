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

  test('an auto-fit Grid reflows across container widths with no query', async ({ page }) => {
    await page.goto('/components/grid');

    const section = page.locator('section', { hasText: 'auto-fit is the container-native mode' });
    const columnCount = (cellIndex: number) =>
      section
        .locator('.matrix__viewport')
        .nth(cellIndex)
        .locator('.pp-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    // 12rem minimum in 240px / 480px / 960px content boxes, minus the cell's
    // own padding. Nothing here consulted the viewport.
    expect(await columnCount(0)).toBe(1);
    expect(await columnCount(1)).toBe(2);
    expect(await columnCount(2)).toBeGreaterThan(2);
  });

  test('a nested Grid does not inherit its parent tracks', async ({ page }) => {
    await page.goto('/components/grid');

    const section = page.locator('section', { hasText: 'Nested grids do not inherit' });
    const outer = section.locator('.pp-grid[data-mode="fixed"]').first();
    // Structurally, not by data-mode — see the note on the nested-Stack test.
    const inner = outer.locator('.pp-grid').first();

    const cols = (el: typeof outer) =>
      el.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);

    expect(await cols(outer)).toBe(3);
    expect(await cols(inner)).toBe(1);
  });

  test('--pp-grid-template-columns set on an ANCESTOR beats the prop', async ({ page }) => {
    await page.goto('/components/grid');

    // D-024. Had Grid written the public property into its own inline style,
    // this would read three columns and the documented escape hatch would be
    // decorative. The private-property indirection is what makes it real.
    const section = page.locator('section', { hasText: 'Styling API' });
    const grid = section.locator('.pp-grid').first();

    const tracks = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(tracks.split(' ')).toHaveLength(2);
  });

  test('Container constrains its measure and centres what is left', async ({ page }) => {
    await page.goto('/components/container');

    const section = page.locator('section', { hasText: 'Styling API' });
    // The 960px cell is wider than the 20rem pin, so the constraint applies.
    const cell = section.locator('.matrix__viewport').nth(2);
    const container = cell.locator('.pp-container');

    const { width, marginStart, marginEnd } = await container.evaluate((el) => {
      const parent = el.parentElement!.getBoundingClientRect();
      const own = el.getBoundingClientRect();
      return {
        width: own.width,
        marginStart: own.left - parent.left,
        marginEnd: parent.right - own.right,
      };
    });

    expect(width).toBeCloseTo(320, 0); // 20rem at a 16px root
    // Centred: margin-inline: auto, which is Container's other exemption (D-018).
    expect(marginStart).toBeCloseTo(marginEnd, 0);
    expect(marginStart).toBeGreaterThan(0);
  });

  test('Container establishes a query container for everything below it', async ({ page }) => {
    await page.goto('/components/container');

    // Not incidental: without one near the top of the tree, a component's
    // @container rules resolve against whatever ancestor happens to have one,
    // which in a page with none is the viewport — quietly reintroducing the
    // thing RULES §1 removed. Split (2.6) is the first to depend on it.
    const container = page.locator('.pp-container').first();
    expect(await container.evaluate((el) => getComputedStyle(el).containerType)).toBe(
      'inline-size',
    );
  });

  test('Split collapses on its OWN inline size, not the viewport', async ({ page }) => {
    await page.goto('/components/split');

    const section = page.locator('section', { hasText: 'the default, 45rem' });
    // Same page, same window, same markup. Three cells, two layouts. If this
    // ever reads the same in all three, something reintroduced a media query.
    const stacked = (cellIndex: number) =>
      section
        .locator('.matrix__viewport')
        .nth(cellIndex)
        .locator('.pp-split')
        .evaluate((el) => {
          const [a, b] = Array.from(el.children).map((c) => c.getBoundingClientRect());
          return Math.round(a.top) !== Math.round(b.top);
        });

    expect(await stacked(0)).toBe(true); // 240px content box — collapsed
    expect(await stacked(1)).toBe(true); // 480px minus the cell's padding — still under 45rem
    expect(await stacked(2)).toBe(false); // 960px — side by side
  });

  test('Split never reorders its slots, in either layout', async ({ page }) => {
    await page.goto('/components/split');

    // D-022 §3. `order` would desynchronise reading order from visual order;
    // this asserts the collapse rule only ever touches flex-basis.
    const section = page.locator('section', { hasText: 'There is no side prop' });
    for (const cellIndex of [0, 2]) {
      const orders = await section
        .locator('.matrix__viewport')
        .nth(cellIndex)
        .locator('.pp-split')
        .evaluate((el) => Array.from(el.children).map((c) => getComputedStyle(c).order));
      expect(orders).toEqual(['0', '0']);
    }
  });

  test('Split.Main shrinks rather than pushing the sidebar away', async ({ page }) => {
    await page.goto('/components/split');

    const section = page.locator('section', { hasText: 'so a wide child does not push' });
    const cell = section.locator('.matrix__viewport').first();

    // min-inline-size: 0 on the main pane. Without it the pane's floor is its
    // min-content size and one long token relocates the whole layout.
    const sidebarWidth = await cell
      .locator('.pp-split__sidebar')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(sidebarWidth).toBeCloseTo(96, 0); // 6rem
    await expect(cell).not.toHaveAttribute('data-overflowing', /.*/);
  });

  test('Center gives itself no block size, and takes one from the custom property', async ({
    page,
  }) => {
    await page.goto('/components/center');

    const section = page.locator('section', { hasText: 'There is no height prop' });
    const center = section.locator('.pp-center').first();

    // --pp-space-8 is 4rem. D-016 §4 applied a second time: the parent or the
    // custom property supplies the height, never a prop.
    expect(await center.evaluate((el) => getComputedStyle(el).minBlockSize)).toBe('64px');
  });

  test('AspectRatio holds its shape at every container width', async ({ page }) => {
    await page.goto('/components/aspect-ratio');

    const section = page.locator('section', { hasText: 'The shape holds at every width' });
    const ratios = await section
      .locator('.pp-aspect-ratio')
      .evaluateAll((els) => els.map((el) => el.clientWidth / el.clientHeight));

    // Six cells: 3 widths x 2 themes, all 21/9. Different sizes, one shape,
    // which is the component choosing a shape and never a size.
    expect(ratios).toHaveLength(6);
    for (const r of ratios) expect(r).toBeCloseTo(21 / 9, 1);
  });

  test('AspectRatio stretches its child on both axes without declaring inline-size', async ({
    page,
  }) => {
    await page.goto('/components/aspect-ratio');

    const box = page.locator('.pp-aspect-ratio').first();
    const fit = await box.evaluate((el) => {
      const child = el.firstElementChild!.getBoundingClientRect();
      const own = el.getBoundingClientRect();
      return { dw: Math.abs(child.width - own.width), dh: Math.abs(child.height - own.height) };
    });
    // Grid stretch on the inline axis, block-size: 100% on the block axis.
    expect(fit.dw).toBeLessThan(1);
    expect(fit.dh).toBeLessThan(1);
  });

  test('Scroller reports the overflowing edge, and reports none when content fits', async ({
    page,
  }) => {
    await page.goto('/components/scroller');

    const overflowing = page
      .locator('section', { hasText: 'Vertical, with a max block size' })
      .locator('.pp-scroller')
      .first();
    const fits = page
      .locator('section', { hasText: 'Content that fits gets no shadow' })
      .locator('.pp-scroller')
      .first();

    // At rest, scrolled to the top: content lies past the END edge only.
    await expect(overflowing).toHaveAttribute('data-overflow', 'end');
    await expect(fits).toHaveAttribute('data-overflow', 'none');

    // Scrolled to the bottom: past the START edge only. A shadow left showing
    // on a fully scrolled region is the bug the rounding in overflowState
    // exists to prevent.
    await overflowing.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await expect(overflowing).toHaveAttribute('data-overflow', 'start');

    // And in the middle, both.
    await overflowing.evaluate((el) => el.scrollTo({ top: el.scrollHeight / 2 }));
    await expect(overflowing).toHaveAttribute('data-overflow', 'both');
  });

  test('Scroller is a focusable region with an accessible name', async ({ page }) => {
    await page.goto('/components/scroller');

    // .first(): the harness renders the same subtree in six cells.
    const scroller = page.getByRole('region', { name: 'Assets' }).first();
    await scroller.focus();
    await expect(scroller).toBeFocused();

    // RULES §6: focus is always visible. An outline of 0 here would mean the
    // focus ring was removed without a replacement.
    const outlineWidth = await scroller.evaluate((el) =>
      parseFloat(getComputedStyle(el).outlineWidth),
    );
    expect(outlineWidth).toBeGreaterThan(0);
  });
});


/**
 * Computed-style assertions for Tier 3A. The whole point of `--pp-control-*`
 * is that a chain of var() references resolves to one number in five
 * components; jsdom resolves none of that chain, so it is checked here or it
 * is not checked at all.
 */
test.describe('action core', () => {
  /** The 960px column of a Matrix section, located by its own label. */
  const wideCell = (page: import('@playwright/test').Page, section: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();

  test('the control scale resolves to 32 / 40 / 48', async ({ page }) => {
    await page.goto('/components/button');
    const cell = wideCell(page, 'Size — the shared control scale');

    for (const [size, expected] of [
      ['sm', 32],
      ['md', 40],
      ['lg', 48],
    ] as const) {
      const height = await cell
        .locator(`.pp-button[data-size="${size}"]`)
        .first()
        .evaluate((el) => el.getBoundingClientRect().height);
      // Not "roughly": --pp-control-height-* is an alias onto --pp-size-8/10/12
      // and a border does not change the box, because the reset is border-box.
      expect(Math.round(height)).toBe(expected);
    }
  });

  test('a Button hugs, and only its parent can stretch it', async ({ page }) => {
    await page.goto('/components/button');
    const cell = wideCell(page, 'hug means hug');

    const ratio = (name: string) =>
      cell
        .getByRole('button', { name })
        .evaluate((el) => el.getBoundingClientRect().width / el.parentElement!.clientWidth);

    // RULES §1: no width declaration, so an inline-flex button is its label
    // wide even when handed 960px.
    expect(await ratio('Default — hugs its label')).toBeLessThan(0.5);

    // ...and the escape hatch is the parent making a layout decision, which is
    // exactly where the rule says the decision belongs. If this ever reads < 1,
    // `hug` has become "cannot be stretched", which is a different contract.
    expect(await ratio('The parent stretched this one')).toBeCloseTo(1, 1);
  });

  test('a loading Button keeps its box and hides the label without losing its name', async ({ page }) => {
    await page.goto('/components/button');
    const button = wideCell(page, 'Loading — aria-disabled, not disabled')
      .getByRole('button', { name: 'solid' })
      .first();
    const content = button.locator('.pp-button__content');

    // THE REGRESSION GUARD. `visibility: hidden` and `display: none` both look
    // identical here and both remove the label from the accessibility tree, so
    // a button announced as "solid" becomes a button announced as nothing at
    // the moment it starts working. Only opacity hides it visually and keeps
    // the name. This is how the bug was found; jsdom's name computation does
    // not consult layout and reported the name either way.
    await expect(button).toHaveAccessibleName('solid');
    expect(await content.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    // ...and it still occupies its space, so the box does not shrink under the
    // cursor when the button starts working.
    const labelWidth = await content.evaluate((el) => el.getBoundingClientRect().width);
    const boxWidth = await button.evaluate((el) => el.getBoundingClientRect().width);
    expect(labelWidth).toBeGreaterThan(0);
    expect(boxWidth).toBeGreaterThanOrEqual(labelWidth);

    // The spinner sits in an overlay, so it contributes nothing to the box.
    await expect(button.locator('.pp-button__spinner .pp-spinner')).toHaveCount(1);
  });

  test('the focus ring is one colour for every tone', async ({ page }) => {
    await page.goto('/components/button');
    const cell = wideCell(page, 'Variant × tone');

    const ringOf = async (tone: string) => {
      const button = cell.locator(`.pp-button[data-variant="solid"][data-pp-tone="${tone}"]`).first();
      await button.focus();
      return button.evaluate((el) => {
        const style = getComputedStyle(el);
        return { color: style.outlineColor, width: parseFloat(style.outlineWidth) };
      });
    };

    const accent = await ringOf('accent');
    const danger = await ringOf('danger');
    const warning = await ringOf('warning');

    // Spec §2: --pp-color-focus-ring, not --pp-tone-focus. `lint:contrast`
    // asserts one ring pairing and only one; if these ever differ, four of the
    // five ring colours in the library are unverified.
    expect(danger.color).toBe(accent.color);
    expect(warning.color).toBe(accent.color);

    // RULES §6: focus is always visible.
    expect(accent.width).toBeGreaterThan(0);
  });
});

test.describe('Link', () => {
  test('wraps across lines, because it declares no display of its own', async ({ page }) => {
    await page.goto('/components/link');

    const narrow = page
      .locator('section', { hasText: 'In running text, it wraps' })
      .locator('.matrix__cell')
      .filter({ hasText: 'narrow · 240px' })
      .first();
    const link = narrow.getByRole('link').first();

    // An inline box that breaks across two lines produces two client rects.
    // An `inline-flex` link — which is what several libraries ship — produces
    // one, and overflows or truncates instead. This is the whole reason
    // Link.css declares no `display`.
    const rects = await link.evaluate((el) => el.getClientRects().length);
    expect(rects).toBeGreaterThan(1);
  });

  test('underline follows the prop, and `hover` only underlines on hover', async ({ page }) => {
    await page.goto('/components/link');

    const cell = page
      .locator('section', { hasText: 'underline' })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();
    const decoration = (el: import('@playwright/test').Locator) =>
      el.evaluate((node) => getComputedStyle(node).textDecorationLine);

    const always = cell.locator('.pp-link[data-underline="always"]').first();
    const onHover = cell.locator('.pp-link[data-underline="hover"]').first();
    const never = cell.locator('.pp-link[data-underline="none"]').first();

    expect(await decoration(always)).toBe('underline');
    expect(await decoration(never)).toBe('none');

    expect(await decoration(onHover)).toBe('none');
    await onHover.hover();
    expect(await decoration(onHover)).toBe('underline');
  });

  test('every tone resolves to a different colour, neutral included', async ({ page }) => {
    await page.goto('/components/link');

    const cell = page
      .locator('section', { hasText: 'tone' })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();

    const colourOf = (tone: string) =>
      cell.locator(`.pp-link[data-pp-tone="${tone}"]`).first().evaluate((el) => getComputedStyle(el).color);

    const [neutral, accent, danger] = await Promise.all([
      colourOf('neutral'),
      colourOf('accent'),
      colourOf('danger'),
    ]);

    // If these are equal, the tone context is not reaching the component and
    // every link in the library is the same colour — the D-011 failure mode.
    expect(accent).not.toBe(neutral);
    expect(danger).not.toBe(accent);
  });
});
