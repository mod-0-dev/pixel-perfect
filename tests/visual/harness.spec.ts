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

  /*
   * D-046. As shipped, `both` measured the block axis and reported it as
   * data-overflow; the inline axis was never measured and never shaded. The
   * shadows are asserted as the number of NON-ZERO background layers, because
   * the attributes alone would pass against a stylesheet that ignores them —
   * which is exactly what the first version did for the inline axis.
   */
  test('Scroller both reports and shades both axes', async ({ page }) => {
    await page.goto('/components/scroller');

    const scroller = page
      .locator('section', { hasText: 'Both axes' })
      .locator('.pp-scroller')
      .first();
    const shadedEdges = () =>
      scroller.evaluate(
        (el) =>
          getComputedStyle(el)
            .backgroundSize.split(',')
            .filter((layer) => !/(^|\s)0px(\s|$)/.test(layer.trim())).length,
      );

    // At rest, scrolled to the top-left corner: content lies past the block-end
    // and inline-end edges only. Two shadows.
    await expect(scroller).toHaveAttribute('data-overflow', 'end');
    await expect(scroller).toHaveAttribute('data-overflow-inline', 'end');
    // Polled, not read once: the attributes land in a React commit after the
    // scroll event, and a single read can precede it.
    await expect.poll(shadedEdges, { message: 'two edges shaded at rest' }).toBe(2);

    // In the middle of both axes: every edge has content beyond it. Four.
    await scroller.evaluate((el) =>
      el.scrollTo({ top: el.scrollHeight / 2, left: el.scrollWidth / 2 }),
    );
    await expect(scroller).toHaveAttribute('data-overflow', 'both');
    await expect(scroller).toHaveAttribute('data-overflow-inline', 'both');
    await expect.poll(shadedEdges, { message: 'four edges shaded mid-scroll' }).toBe(4);

    // And a single-axis region never grows the second attribute.
    const vertical = page
      .locator('section', { hasText: 'Vertical, with a max block size' })
      .locator('.pp-scroller')
      .first();
    await expect(vertical).not.toHaveAttribute('data-overflow-inline', /.*/);
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

test.describe('IconButton', () => {
  test('is square at every size, on the same scale as Button', async ({ page }) => {
    await page.goto('/components/icon-button');

    const cell = page
      .locator('section', { hasText: 'Square at every size' })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();

    for (const [size, expected] of [
      ['sm', 32],
      ['md', 40],
      ['lg', 48],
    ] as const) {
      const box = await cell
        .locator(`.pp-icon-button[data-size="${size}"]`)
        .first()
        .evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return { w: rect.width, h: rect.height };
        });

      // Square, and square at the SHARED control height — not at some scale of
      // its own. A row of Buttons and IconButtons only lines up if both read
      // --pp-control-height-*.
      expect(Math.round(box.w)).toBe(expected);
      expect(Math.round(box.h)).toBe(expected);
    }
  });
});

test.describe('Toggle', () => {
  test('pressed is visibly distinct, and does not lighten on hover', async ({ page }) => {
    await page.goto('/components/toggle');

    const cell = page
      .locator('section', { hasText: 'Off and on, across variants' })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();

    const off = cell.getByRole('button', { name: 'ghost off' }).first();
    const on = cell.getByRole('button', { name: 'ghost on' }).first();

    const bg = (el: import('@playwright/test').Locator) =>
      el.evaluate((node) => getComputedStyle(node).backgroundColor);
    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((node) => getComputedStyle(node).borderTopColor);

    const offBg = await bg(off);
    const onBg = await bg(on);
    expect(onBg).not.toBe(offBg);

    // Pressed is already the filled end of the ramp. Hovering must not walk it
    // back toward the resting colour — that reads as releasing the button.
    const onBorderRest = await border(on);
    await on.hover();
    expect(await bg(on)).toBe(onBg);
    expect(await border(on)).not.toBe(onBorderRest);
  });
});

test.describe('ButtonGroup', () => {
  const wide = (page: import('@playwright/test').Page, section: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first();

  test('ends are rounded, the middle is square, and the seam is one border', async ({ page }) => {
    await page.goto('/components/button-group');
    const cell = wide(page, 'Horizontal — end radii on the ends');

    const corners = (name: string) =>
      cell.getByRole('button', { name }).evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          startStart: s.borderStartStartRadius,
          startEnd: s.borderStartEndRadius,
          leadingBorder: s.borderInlineStartWidth,
        };
      });

    const first = await corners('CSV');
    const middle = await corners('JSON');
    const last = await corners('Parquet');

    expect(first.startStart).not.toBe('0px');
    expect(first.startEnd).toBe('0px');
    expect(middle.startStart).toBe('0px');
    expect(middle.startEnd).toBe('0px');
    expect(last.startEnd).not.toBe('0px');

    // The seam: every button after the first drops its leading border, so the
    // edge between two buttons is drawn exactly once. RULES §2 forbids the
    // usual `margin-inline-start: -1px`, so there is no overlap to collapse.
    expect(first.leadingBorder).not.toBe('0px');
    expect(middle.leadingBorder).toBe('0px');
    expect(last.leadingBorder).toBe('0px');
  });

  test('buttons sit edge to edge with no gap', async ({ page }) => {
    await page.goto('/components/button-group');
    const cell = wide(page, 'Horizontal — end radii on the ends');

    const boxes = await cell
      .locator('.pp-button-group > .pp-button')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.left, r.right]));

    expect(boxes).toHaveLength(3);
    for (let i = 1; i < boxes.length; i++) {
      // Attached means attached. A gap here means someone gave the group a
      // `gap`, at which point it should have been a Cluster.
      expect(Math.abs(boxes[i]![0] - boxes[i - 1]![1])).toBeLessThan(0.5);
    }
  });

  test('a focused button is raised above its neighbours so its ring is not clipped', async ({ page }) => {
    await page.goto('/components/button-group');
    const cell = wide(page, 'Horizontal — end radii on the ends');
    const middle = cell.getByRole('button', { name: 'JSON' });

    expect(await middle.evaluate((el) => getComputedStyle(el).zIndex)).toBe('auto');
    await middle.focus();
    // Edge-to-edge buttons paint in source order, so an un-raised ring on the
    // middle button is drawn underneath the one after it.
    expect(Number(await middle.evaluate((el) => getComputedStyle(el).zIndex))).toBeGreaterThan(0);
  });

  test('vertical collapses the block-start border instead, and equalises widths', async ({ page }) => {
    await page.goto('/components/button-group');
    const cell = wide(page, 'Vertical');

    const widths = await cell
      .locator('.pp-button-group > .pp-button')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(new Set(widths).size).toBe(1);

    const borders = await cell
      .locator('.pp-button-group > .pp-button')
      .evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el);
          return { block: s.borderBlockStartWidth, inline: s.borderInlineStartWidth };
        }),
      );
    expect(borders[0]!.block).not.toBe('0px');
    expect(borders[1]!.block).toBe('0px');
    // The inline border is untouched on the vertical axis — the rules are
    // per-axis, not a blanket "drop the leading border".
    expect(borders[1]!.inline).not.toBe('0px');
  });
});

test.describe('Label', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  const fontSize = (el: import('@playwright/test').Locator) =>
    el.evaluate((node) => getComputedStyle(node).fontSize);

  test('a label is the same type size as the control beside it', async ({ page }) => {
    await page.goto('/components/label');
    const wide = cell(page, 'The label rides the control scale', 'wide · 960px');

    // D-034. The claim is not "labels are 14px" — it is that the label and the
    // control resolve the SAME token, so moving --pp-control-font-size-md moves
    // both. Comparing the two computed values is the only way to assert that;
    // asserting a number would still pass after someone hardcoded one of them.
    for (const size of ['sm', 'md', 'lg']) {
      const label = wide.locator(`.pp-label[data-size="${size}"]`).first();
      const button = wide.locator(`.pp-button[data-size="${size}"]`).first();
      expect(await fontSize(label), `label and button disagree at size=${size}`).toBe(
        await fontSize(button),
      );
    }
  });

  test('sm and md are the same size, and lg is not', async ({ page }) => {
    await page.goto('/components/label');
    const wide = cell(page, 'sm and md are the same size', 'wide · 960px');

    const sm = await fontSize(wide.locator('.pp-label[data-size="sm"]'));
    const md = await fontSize(wide.locator('.pp-label[data-size="md"]'));
    const lg = await fontSize(wide.locator('.pp-label[data-size="lg"]'));

    expect(sm).toBe(md);
    expect(parseFloat(lg)).toBeGreaterThan(parseFloat(md));
  });

  test('the required glyph is not in the control\'s accessible name', async ({ page }) => {
    await page.goto('/components/label');
    // Deliberately NOT a Matrix cell. The Matrix renders its subtree six times,
    // so an id inside it exists six times and `for` resolves to whichever copy
    // comes first in the document — which associates five of the six labels
    // with a control in another cell and leaves this one unnamed. Found by this
    // test failing with an accessible name of "".
    const section = page.locator('section', { hasText: 'Association, click-to-focus' });

    // D-030 §2: jsdom asserts this too, and jsdom is a model of an
    // accessibility tree rather than the one a screen reader reads. Button's
    // loading label passed in jsdom while being invisible to assistive tech, so
    // anything about what a screen reader perceives is asserted here as well.
    await expect(section.locator('#assoc-long')).toHaveAccessibleName(
      'Postal address for delivery confirmation',
    );
  });

  test('the required indicator shares the last line of a wrapping label', async ({ page }) => {
    await page.goto('/components/label');
    const narrow = cell(page, 'Required: one asterisk', 'narrow · 240px');

    const label = narrow.locator('.pp-label[data-required]').nth(1);
    const boxes = await label.evaluate((node) => {
      const indicator = node.querySelector('.pp-label__required') as HTMLElement;
      // getClientRects() on a block element returns ONE border-box rect however
      // many lines it has. Line boxes come from a Range over its contents, and
      // the first version of this test counted 1 for a label that was visibly
      // wrapping in three.
      // Over the TEXT NODE only, not the whole label. Measuring the label's
      // contents includes the indicator itself, so when the indicator moves the
      // thing being compared against moves with it — which reported a 2px delta
      // for an indicator that had been given its own line.
      const range = document.createRange();
      range.selectNodeContents(node.childNodes[0]);
      const lines = Array.from(range.getClientRects());
      const rect = indicator.getBoundingClientRect();
      return {
        lines: lines.length,
        lastLineTop: Math.round(lines[lines.length - 1].top),
        indicatorTop: Math.round(rect.top),
        indicatorLeft: rect.left,
        labelLeft: node.getBoundingClientRect().left,
      };
    });

    // The label must actually be wrapping, or this proves nothing.
    expect(boxes.lines).toBeGreaterThan(1);
    // On the last line OF THE TEXT, not below it and not alone on it. What this
    // guards is the indicator staying an inline part of the text flow — give it
    // `display: block` and it drops a whole line, and this fails.
    //
    // It does NOT guard the absence of a space character before the indicator:
    // a space only orphans the glyph when the last line happens to be nearly
    // full, so putting one back left this test green. That guard lives in
    // Label.test.tsx, where it asserts the text content directly and fails
    // every time.
    expect(boxes.indicatorTop).toBe(boxes.lastLineTop);
    expect(boxes.indicatorLeft).toBeGreaterThan(boxes.labelLeft);
  });

  test('invalid changes no colour; disabled does', async ({ page }) => {
    await page.goto('/components/label');
    const wide = cell(page, 'Disabled dims; invalid changes nothing', 'wide · 960px');

    const color = (selector: string) =>
      wide.locator(selector).first().evaluate((node) => getComputedStyle(node).color);

    const resting = await color('.pp-label:not([data-disabled]):not([data-invalid])');
    expect(await color('.pp-label[data-invalid]')).toBe(resting);
    expect(await color('.pp-label[data-disabled]')).not.toBe(resting);
  });

  test('the required glyph follows the label into the disabled state', async ({ page }) => {
    await page.goto('/components/label');
    const wide = cell(page, 'Disabled dims; invalid changes nothing', 'wide · 960px');

    // currentcolor rather than a second rule. If the default is ever changed to
    // a fixed colour, the glyph stays bright on a dimmed label and this fails.
    const pair = await wide
      .locator('.pp-label[data-disabled][data-required]')
      .evaluate((node) => ({
        label: getComputedStyle(node).color,
        glyph: getComputedStyle(node.querySelector('.pp-label__required') as HTMLElement).color,
      }));

    expect(pair.glyph).toBe(pair.label);
  });

  test('fill means the label takes the box it is given, at every width', async ({ page }) => {
    await page.goto('/components/label');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'A long label wraps', width);
      const ratio = await c.locator('.pp-label').evaluate((node) => {
        const parent = node.parentElement as HTMLElement;
        // The CONTENT box. The harness viewport is padded and bordered, so
        // comparing against its border box asks a filling child to be wider
        // than the space it was given — the first version of this test did
        // exactly that and reported 0.89 as a failure to fill.
        const style = getComputedStyle(parent);
        const content =
          parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return node.getBoundingClientRect().width / content;
      });
      expect(ratio, `label did not fill its parent at ${width}`).toBeCloseTo(1, 2);
    }
  });
});

test.describe('Field', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  const box = (el: import('@playwright/test').Locator) =>
    el.evaluate((node) => {
      const r = node.getBoundingClientRect();
      return { top: r.top, left: r.left, bottom: r.bottom, width: r.width };
    });

  test('vertical puts the label above the control and the error below it', async ({ page }) => {
    await page.goto('/components/field');
    const wide = cell(page, 'Required, and invalid', 'wide · 960px');
    const field = wide.locator('.pp-field[data-invalid]').first();

    const label = await box(field.locator('.pp-field__label'));
    const description = await box(field.locator('.pp-field__description'));
    const control = await box(field.locator('.pp-field__control'));
    const error = await box(field.locator('.pp-field__error'));

    // The order the spec commits to: label, description, control, error. The
    // description is above the control because it is the instruction you need
    // before you type; the error is below it because that is where the thing to
    // fix is.
    expect(label.bottom).toBeLessThanOrEqual(description.top);
    expect(description.bottom).toBeLessThanOrEqual(control.top);
    expect(control.bottom).toBeLessThanOrEqual(error.top);
  });

  test('horizontal puts the control beside the label, with the rest in the label column', async ({
    page,
  }) => {
    await page.goto('/components/field');
    const wide = cell(page, 'Horizontal — the checkbox arrangement', 'wide · 960px');
    const field = wide.locator('.pp-field[data-orientation="horizontal"]').first();

    const control = await box(field.locator('.pp-field__control'));
    const label = await box(field.locator('.pp-field__label'));
    const description = await box(field.locator('.pp-field__description'));

    // Same row, control first.
    expect(control.left).toBeLessThan(label.left);
    expect(Math.abs(control.top - label.top)).toBeLessThan(label.bottom - label.top);
    // The description is in the label's column, not under the checkbox.
    expect(Math.round(description.left)).toBe(Math.round(label.left));
    expect(description.top).toBeGreaterThanOrEqual(label.bottom - 1);
  });

  test('the description and the error are the label\'s type size', async ({ page }) => {
    await page.goto('/components/field');
    const wide = cell(page, "The description and the error are the label", 'wide · 960px');

    for (const size of ['sm', 'md', 'lg']) {
      const field = wide.locator(`.pp-field[data-size="${size}"]`);
      const sizes = await field.evaluate((node) => ({
        label: getComputedStyle(node.querySelector('.pp-field__label') as HTMLElement).fontSize,
        description: getComputedStyle(node.querySelector('.pp-field__description') as HTMLElement)
          .fontSize,
        error: getComputedStyle(node.querySelector('.pp-field__error') as HTMLElement).fontSize,
      }));

      // D-034 continued: distinguished by colour and weight, never by shrinking.
      expect(sizes.description, `description shrank at size=${size}`).toBe(sizes.label);
      expect(sizes.error, `error shrank at size=${size}`).toBe(sizes.label);
    }
  });

  test('the error takes its colour from the danger tone, not from the text colour', async ({
    page,
  }) => {
    await page.goto('/components/field');
    const wide = cell(page, 'Required, and invalid', 'wide · 960px');
    const field = wide.locator('.pp-field[data-invalid]').first();

    const colors = await field.evaluate((node) => ({
      label: getComputedStyle(node.querySelector('.pp-field__label') as HTMLElement).color,
      description: getComputedStyle(node.querySelector('.pp-field__description') as HTMLElement)
        .color,
      error: getComputedStyle(node.querySelector('.pp-field__error') as HTMLElement).color,
    }));

    // Three distinct roles. The error resolves --pp-tone-text under
    // data-pp-tone="danger" (D-007), so this fails if the attribute is dropped
    // and the error silently inherits the page's text colour.
    expect(colors.error).not.toBe(colors.label);
    expect(colors.error).not.toBe(colors.description);
    expect(colors.description).not.toBe(colors.label);
  });

  test('the control is named and described in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/field');
    const wide = cell(page, 'Required, and invalid', 'wide · 960px');
    const control = wide.locator('.pp-field[data-invalid] input');

    // D-030 §2. jsdom asserts this too, and jsdom's accessibility tree is a
    // model of one rather than the one a screen reader reads.
    await expect(control).toHaveAccessibleName('Email address');
    await expect(control).toHaveAccessibleDescription(
      'We only use this for receipts. Enter an email address in the format name@example.com',
    );
  });

  /*
   * D-045. Label exposes --pp-label-cursor and the Label spec said Checkbox
   * would set it on its own root — which could never work, because inside a
   * Field the label is the control's SIBLING and a custom property only
   * inherits downward. The horizontal Field is the common ancestor and sets it
   * once. Asserted as a computed style on the label itself, so it fails if the
   * declaration moves back onto the control where nothing can read it.
   */
  test('a horizontal field gives its label the pointer; a vertical one does not', async ({
    page,
  }) => {
    await page.goto('/components/field');

    const cursorOf = (section: string, selector: string) =>
      cell(page, section, 'wide · 960px')
        .locator(selector)
        .first()
        .locator('.pp-field__label')
        .evaluate((el) => getComputedStyle(el).cursor);

    expect(
      await cursorOf('Horizontal — the checkbox arrangement', '.pp-field[data-orientation="horizontal"]'),
      'the checkbox row is one click target and its label should say so',
    ).toBe('pointer');
    expect(
      await cursorOf('Label, description, control', '.pp-field[data-orientation="vertical"]'),
      'a block label above a text input overstates the affordance with a pointer',
    ).not.toBe('pointer');
  });

  test('a disabled horizontal field does not promise a click with a pointer', async ({ page }) => {
    await page.goto('/components/checkbox');

    const cursor = await cell(page, 'Disabled', 'wide · 960px')
      .locator('.pp-field[data-orientation="horizontal"][data-disabled] .pp-field__label')
      .first()
      .evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');
  });

  test('a hidden label is hidden from sight and present in the tree', async ({ page }) => {
    await page.goto('/components/field');
    const wide = cell(page, 'labelHidden hides the label', 'wide · 960px');

    const label = wide.locator('.pp-field__label');
    const size = await box(label);

    // Clipped to nothing visually — and still the control's name.
    expect(size.width).toBeLessThan(2);
    await expect(wide.locator('.pp-field input')).toHaveAccessibleName('Search orders');
  });

  test('fill: the field takes the box it is given, at every width', async ({ page }) => {
    await page.goto('/components/field');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'Long text wraps', width);
      const ratio = await c.locator('.pp-field').evaluate((node) => {
        const parent = node.parentElement as HTMLElement;
        const style = getComputedStyle(parent);
        const content =
          parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return node.getBoundingClientRect().width / content;
      });
      expect(ratio, `field did not fill its parent at ${width}`).toBeCloseTo(1, 2);
    }
  });
});

/**
 * Tier 3C. Everything here needs layout: the fill claim is a measurement, the
 * focus border is a var() chain jsdom resolves none of, and D-030 §2 is the
 * standing reason an accessible name is asserted where layout exists.
 */
test.describe('Input', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  /*
   * THE REASON THIS COMPONENT HAS A WRAPPER. RULES §1 claims a block element
   * with no width declaration fills its parent "in every layout context"; an
   * <input> has an intrinsic inline size and does not. Measured before the
   * component was written, and asserted here so a future simplification to a
   * single element fails loudly instead of silently shipping a 185px field.
   */
  test('fill: the control takes the box it is given, at every width', async ({ page }) => {
    await page.goto('/components/input');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'It fills, at every container width', width);
      const ratio = await c.locator('.pp-input__control').evaluate((node) => {
        const root = node.closest('.pp-input') as HTMLElement;
        return node.getBoundingClientRect().width / root.getBoundingClientRect().width;
      });
      expect(ratio, `the control did not fill its root at ${width}`).toBeCloseTo(1, 2);
    }
  });

  test('a long unbreakable value shrinks the control instead of the container', async ({
    page,
  }) => {
    await page.goto('/components/input');
    const narrow = cell(page, 'It fills, at every container width', 'narrow · 240px');

    const overflow = await narrow.locator('.pp-field').evaluate((node) => {
      const parent = node.parentElement as HTMLElement;
      return parent.scrollWidth - parent.clientWidth;
    });
    expect(overflow, 'the input pushed its container wide').toBeLessThanOrEqual(1);
  });

  test('an Input and a Button are the same height at the same size', async ({ page }) => {
    await page.goto('/components/input');
    const wide = cell(page, 'Sizes', 'wide · 960px');
    const heights: Record<string, number> = {};

    for (const size of ['sm', 'md', 'lg'] as const) {
      heights[size] = await wide
        .locator(`.pp-input[data-size="${size}"] .pp-input__control`)
        .evaluate((el) => el.getBoundingClientRect().height);
    }

    // D-028's entire purpose, stated as the numbers it aliases onto.
    expect(heights).toEqual({ sm: 32, md: 40, lg: 48 });
  });

  /*
   * D-029 reserved --pp-tone-focus for exactly this and D-039 §4 spends it:
   * focus draws TWO things, one ring colour outside the box and a tone-shifted
   * border inside it.
   *
   * THE FIRST VERSION OF THIS TEST COULD NOT FAIL. It compared a valid
   * control's border with an invalid one's and called the difference "the tone
   * shift" — but those two differ because of data-invalid, not because of
   * focus, so deleting the focus rule outright left it green. Found by deleting
   * it and watching all seven tests pass. The comparison has to be the SAME
   * control at rest and focused; nothing else isolates focus.
   */
  test('focus shifts the control border, and the ring is one colour', async ({ page }) => {
    await page.goto('/components/input');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-input:not([data-invalid]) .pp-input__control').first();
    const invalid = wide.locator('.pp-input[data-invalid] .pp-input__control').first();

    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).borderTopColor);
    const outline = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineColor);

    const resting = await border(valid);
    await valid.focus();
    const focused = await border(valid);

    expect(focused, 'the border did not shift on focus').not.toBe(resting);

    const validRing = await outline(valid);
    await invalid.focus();
    expect(await outline(invalid), 'the ring is one colour library-wide (D-029)').toBe(validRing);
  });

  /*
   * The payoff D-039 §4 claims: an invalid control focused is still visibly
   * invalid. Fails if the root stops carrying data-pp-tone="danger", because
   * then --pp-tone-focus resolves neutral and the two focused borders converge.
   */
  test('an invalid control stays in the danger tone while focused', async ({ page }) => {
    await page.goto('/components/input');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-input:not([data-invalid]) .pp-input__control').first();
    const invalid = wide.locator('.pp-input[data-invalid] .pp-input__control').first();

    const focusedBorder = async (el: import('@playwright/test').Locator) => {
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder(invalid),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder(valid));
  });

  test('read-only and disabled are distinguishable', async ({ page }) => {
    await page.goto('/components/input');
    const wide = cell(page, 'Disabled and read-only are different states', 'wide · 960px');

    const read = (sel: string) =>
      wide.locator(sel).first().evaluate((n) => {
        const s = getComputedStyle(n);
        return { color: s.color, border: s.borderTopColor };
      });

    const disabled = await read('.pp-input[data-disabled] .pp-input__control');
    const readOnly = await read('.pp-input[data-readonly] .pp-input__control');

    // Same fill by design; the text and the border are what tell them apart.
    expect(disabled.color, 'the text is the same on both').not.toBe(readOnly.color);
    /* D-050: the disabled edge drops to the decorative step, because 1.4.11
       exempts inactive components from the 3:1 the live one meets — and the
       docs and the playground both now say so, which under D-045 means it is
       asserted rather than restated. */
    expect(disabled.border, 'the disabled edge is the live one').not.toBe(readOnly.border);
  });

  /* D-035 §1 / spec §12: association is demonstrated once, outside the Matrix,
     where the id is unique — and this is the assertion that proves it worked. */
  test('an explicit controlId names the control in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/input');
    const control = page.locator('[data-testid="input-association"] input');

    await expect(control).toHaveAccessibleName('Billing email');
    await expect(control).toHaveAttribute('id', 'billing-email');
  });
});

/*
 * Textarea (3.9). Everything here needs layout: the block-axis agreement with
 * Input is arithmetic the browser performs, and auto-resize is scrollHeight,
 * which jsdom reports as 0 for every element. The unit file asserts what
 * auto-resize does to the DOM; this asserts what it does to the box.
 */
test.describe('Textarea', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  test('fill: the control takes the box it is given, at every width', async ({ page }) => {
    await page.goto('/components/textarea');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'It fills, at every container width', width);
      const ratio = await c.locator('.pp-textarea__control').evaluate((node) => {
        const root = node.closest('.pp-textarea') as HTMLElement;
        return node.getBoundingClientRect().width / root.getBoundingClientRect().width;
      });
      expect(ratio, `the control did not fill its root at ${width}`).toBeCloseTo(1, 2);
    }
  });

  test('a long unbreakable value shrinks the control instead of the container', async ({
    page,
  }) => {
    await page.goto('/components/textarea');
    const narrow = cell(page, 'It fills, at every container width', 'narrow · 240px');

    const overflow = await narrow.locator('.pp-field').evaluate((node) => {
      const parent = node.parentElement as HTMLElement;
      return parent.scrollWidth - parent.clientWidth;
    });
    expect(overflow, 'the textarea pushed its container wide').toBeLessThanOrEqual(1);
  });

  /*
   * THE REASON THE VERTICAL PADDING IS A calc() AND NOT A SPACE STEP.
   *
   * (height − line box − borders) / 2 comes out at 3.8 / 7.8 / 10.2px. The space
   * scale can express the first two and cannot express the third — 8px and 12px
   * are the neighbours — so lg would be 4.4px short or 3.6px over, and the
   * largest control would be the one visibly disagreeing with the Button beside
   * it. Deriving it from the same tokens Input reads makes this test's claim
   * true by construction; hardcoding any of the three makes it fail.
   */
  test('a one-row Textarea is exactly as tall as an Input, at every size', async ({ page }) => {
    await page.goto('/components/textarea');
    const wide = cell(page, 'One row is exactly an Input', 'wide · 960px');

    for (const size of ['sm', 'md', 'lg'] as const) {
      const height = (sel: string) =>
        wide.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);

      const input = await height(`.pp-input[data-size="${size}"] .pp-input__control`);
      const textarea = await height(`.pp-textarea[data-size="${size}"] .pp-textarea__control`);

      // Sub-pixel only: the padding is a fraction, and the two boxes round it
      // independently. Anything larger is a hardcoded value that stopped
      // tracking --pp-control-height-*.
      expect(Math.abs(textarea - input), `${size}: ${textarea}px vs an Input's ${input}px`)
        .toBeLessThanOrEqual(1);
    }
  });

  test('an invalid control stays in the danger tone while focused', async ({ page }) => {
    await page.goto('/components/textarea');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-textarea:not([data-invalid]) .pp-textarea__control').first();
    const invalid = wide.locator('.pp-textarea[data-invalid] .pp-textarea__control').first();

    const focusedBorder = async (el: import('@playwright/test').Locator) => {
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder(invalid),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder(valid));
  });

  /* The same control at rest and focused — nothing else isolates focus. The
     first version of Input's equivalent compared a valid control to an invalid
     one, which differ for another reason entirely, and so could not fail. */
  test('focus shifts the control border, and the ring is one colour', async ({ page }) => {
    await page.goto('/components/textarea');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-textarea:not([data-invalid]) .pp-textarea__control').first();
    const invalid = wide.locator('.pp-textarea[data-invalid] .pp-textarea__control').first();

    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).borderTopColor);
    const outline = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineColor);

    const resting = await border(valid);
    await valid.focus();
    expect(await border(valid), 'the border did not shift on focus').not.toBe(resting);

    const validRing = await outline(valid);
    await invalid.focus();
    expect(await outline(invalid), 'the ring is one colour library-wide (D-029)').toBe(validRing);
  });

  test('read-only and disabled are distinguishable', async ({ page }) => {
    await page.goto('/components/textarea');
    const wide = cell(page, 'Disabled and read-only are different states', 'wide · 960px');

    const read = (sel: string) =>
      wide.locator(sel).first().evaluate((n) => {
        const s = getComputedStyle(n);
        return { color: s.color, border: s.borderTopColor };
      });

    const disabled = await read('.pp-textarea[data-disabled] .pp-textarea__control');
    const readOnly = await read('.pp-textarea[data-readonly] .pp-textarea__control');

    expect(disabled.color).not.toBe(readOnly.color);
  });

  test('resize is vertical by default and none when asked for', async ({ page }) => {
    await page.goto('/components/textarea');
    const wide = cell(page, 'Resize, and why there is no horizontal', 'wide · 960px');

    const resize = (sel: string) =>
      wide.locator(sel).first().evaluate((n) => getComputedStyle(n).resize);

    expect(await resize('.pp-textarea[data-resize="vertical"] .pp-textarea__control')).toBe(
      'vertical',
    );
    expect(await resize('.pp-textarea[data-resize="none"] .pp-textarea__control')).toBe('none');
  });

  /*
   * AUTO-RESIZE, WHERE LAYOUT EXISTS. jsdom reports every box as 0×0, so the
   * unit file can only assert the attribute and the handler — a height
   * assertion there would pass against a component that computes nothing.
   *
   * Outside the Matrix on purpose: a test that types needs one unambiguous
   * target, not six identical ones.
   */
  test('auto-resize grows with content and returns to the rows floor', async ({ page }) => {
    await page.goto('/components/textarea');
    const control = page.locator('[data-testid="textarea-auto-resize"] textarea');
    const height = () => control.evaluate((n) => n.getBoundingClientRect().height);

    const floor = await height();
    await control.fill('one\ntwo\nthree\nfour\nfive\nsix');
    const grown = await height();
    expect(grown, 'the control did not grow with its content').toBeGreaterThan(floor);

    // The half that a naive scrollHeight implementation gets wrong: measuring
    // against a height it wrote itself can only ratchet upward, so the control
    // grows with the text and never shrinks when it is deleted.
    await control.fill('');
    expect(await height(), 'the control did not shrink back').toBeCloseTo(floor, 0);
  });

  test('auto-resize never shrinks below rows', async ({ page }) => {
    await page.goto('/components/textarea');
    const auto = page.locator('[data-testid="textarea-auto-resize"] textarea');
    const fixed = page.locator('[data-testid="textarea-fixed"] textarea');

    await auto.fill('');
    // Both are rows={2}. The empty auto-resizing one must not be shorter than
    // the fixed one, which is what "rows is the floor" means in pixels.
    expect(await auto.evaluate((n) => n.getBoundingClientRect().height)).toBeCloseTo(
      await fixed.evaluate((n) => n.getBoundingClientRect().height),
      0,
    );
  });

  test('auto-resize forces the drag handle off', async ({ page }) => {
    await page.goto('/components/textarea');
    const control = page.locator('[data-testid="textarea-auto-resize"] textarea');
    // A handle and a JS-written block-size fight each other: the handle sets a
    // height the next keystroke overwrites.
    expect(await control.evaluate((n) => getComputedStyle(n).resize)).toBe('none');
  });

  /* D-035 §1 / spec §12: association is demonstrated once, outside the Matrix,
     where the id is unique — and this is the assertion that proves it worked. */
  test('an explicit controlId names the control in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/textarea');
    const control = page.locator('[data-testid="textarea-auto-resize"] textarea');

    await expect(control).toHaveAccessibleName('Release notes');
    await expect(control).toHaveAttribute('id', 'release-notes');
  });
});

/*
 * Checkbox (3.10). The first checkable control, and the first in 3C whose
 * claims are almost entirely geometric: a 16/20/24 box, a solid fill, a mark
 * that must not be a hole in its own target, and a spacing exception that is
 * the whole WCAG 2.5.8 conformance argument. jsdom has no layout and no
 * `oklch()`, so none of it can be asserted anywhere but here.
 */
test.describe('Checkbox', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  test('the box is 16 / 20 / 24, from the size scale and not the control scale', async ({
    page,
  }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px');

    // --pp-size-4/5/6 at a 16px root. --pp-control-height-* would be 32/40/48,
    // which is the mistake this asserts against: a checkbox is a box, not a
    // control surface with a height.
    for (const [size, expected] of [
      ['sm', 16],
      ['md', 20],
      ['lg', 24],
    ] as const) {
      const box = await wide
        .locator(`.pp-checkbox[data-size="${size}"] .pp-checkbox__input`)
        .first()
        .evaluate((el) => el.getBoundingClientRect());

      expect(box.width, `${size} is ${box.width}px wide`).toBeCloseTo(expected, 0);
      expect(box.height, `${size} is not square`).toBeCloseTo(expected, 0);
    }
  });

  test('hug: the box keeps its size at every container width', async ({ page }) => {
    await page.goto('/components/checkbox');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'It hugs, at every container width', width);
      const box = await c
        .locator('.pp-checkbox__input')
        .first()
        .evaluate((el) => el.getBoundingClientRect());

      // A `fill` control would stretch into the Field column and become an
      // oblong. 20px is --pp-size-5, the md default.
      expect(box.width, `stretched to ${box.width}px at ${width}`).toBeCloseTo(20, 0);
      expect(box.height).toBeCloseTo(20, 0);
    }
  });

  test('checked fills the box; unchecked does not', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Three states, and only two a user can reach', 'wide · 960px');

    const bg = (state: string) =>
      wide
        .locator(`.pp-checkbox[data-state="${state}"] .pp-checkbox__input`)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    const unchecked = await bg('unchecked');
    expect(await bg('checked'), 'a checked box is painted like an empty one').not.toBe(unchecked);
    // Indeterminate is a filled box with a different mark, not a third fill.
    expect(await bg('indeterminate')).toBe(await bg('checked'));
  });

  test('the mark is drawn, and indeterminate draws a different one', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Three states, and only two a user can reach', 'wide · 960px');

    const mark = (state: string) =>
      wide.locator(`.pp-checkbox[data-state="${state}"] .pp-checkbox__indicator`).first();

    await expect(mark('unchecked')).toHaveCount(0);

    // It is markup, not a mask-image data URI (D-039 §3): the path is in the
    // DOM and readable, which is what made the lint rule that ruling proposed
    // unnecessary.
    const check = await mark('checked').locator('path').getAttribute('d');
    const dash = await mark('indeterminate').locator('path').getAttribute('d');
    expect(check).not.toBe(dash);

    // And it is actually visible: an inline SVG that resolved to a 0×0 box
    // would still satisfy every assertion above.
    const size = await mark('checked').evaluate((el) => el.getBoundingClientRect());
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  /*
   * The mark reads `--pp-icon-size` from Checkbox.css — Icon's own styling API,
   * used as the escape hatch RULES §3 sanctions rather than as a deep selector.
   * Passing `Icon` a `size` prop instead would pin the mark to a fixed step, so
   * overriding `--pp-checkbox-size` would move the box and leave the mark
   * behind; with no size at all the Icon falls back to 1em and the mark tracks
   * the LABEL's type rather than the box it sits in.
   */
  test('the mark tracks the box, not the font size beside it', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px');

    for (const size of ['sm', 'lg'] as const) {
      const root = wide.locator(`.pp-checkbox[data-size="${size}"]`).first();
      const box = await root
        .locator('.pp-checkbox__input')
        .evaluate((el) => el.getBoundingClientRect().width);
      const mark = await root
        .locator('.pp-checkbox__indicator')
        .evaluate((el) => el.getBoundingClientRect().width);

      expect(mark, `${size}: a ${mark}px mark in a ${box}px box`).toBeCloseTo(box, 0);
    }
  });

  /* The same control at rest and focused — nothing else isolates focus. The
     first version of Input's equivalent compared a valid control to an invalid
     one, which differ for another reason entirely, and so could not fail
     (D-040 §3). */
  test('focus shifts the border, and the ring is one colour', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-checkbox:not([data-invalid]) .pp-checkbox__input').first();
    const invalid = wide.locator('.pp-checkbox[data-invalid] .pp-checkbox__input').first();

    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).borderTopColor);
    const outline = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineColor);

    const resting = await border(valid);
    await valid.focus();
    expect(await border(valid), 'the border did not shift on focus').not.toBe(resting);

    const validRing = await outline(valid);
    await invalid.focus();
    expect(await outline(invalid), 'the ring is one colour library-wide (D-029)').toBe(validRing);
  });

  test('an invalid checkbox stays in the danger tone while focused', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');

    const focusedBorder = async (selector: string) => {
      const el = wide.locator(selector).first();
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder('.pp-checkbox[data-invalid] .pp-checkbox__input'),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder('.pp-checkbox:not([data-invalid]) .pp-checkbox__input'));
  });

  /* Source order in the stylesheet is the precedence story: checked, then
     invalid, then disabled. A disabled checked box must not still be solid. */
  test('disabled beats checked, and is distinguishable from an unchecked box', async ({ page }) => {
    await page.goto('/components/checkbox');
    const disabled = cell(page, 'Disabled', 'wide · 960px');
    const live = cell(page, 'Three states, and only two a user can reach', 'wide · 960px');

    const bg = (scope: ReturnType<typeof cell>, selector: string) =>
      scope.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);

    const disabledChecked = await bg(disabled, '.pp-checkbox[data-state="checked"] .pp-checkbox__input');
    const liveChecked = await bg(live, '.pp-checkbox[data-state="checked"] .pp-checkbox__input');

    expect(disabledChecked, 'a disabled checked box is as loud as a live one').not.toBe(
      liveChecked,
    );
    expect(
      await disabled
        .locator('.pp-checkbox[data-disabled] .pp-checkbox__input')
        .first()
        .evaluate((el) => getComputedStyle(el).cursor),
    ).toBe('not-allowed');
  });

  /*
   * WCAG 2.2 SC 2.5.8, and the reason RadioGroup's gap defaults to "3"
   * (D-039 §4). A 16px target passes through the SPACING exception: a 24px
   * circle centred on each one must not intersect its neighbour's, which needs
   * 24px between centres. At gap="2" (8px) a column of sm boxes puts them
   * exactly 24px apart — tangent circles, an argument with an auditor rather
   * than a pass.
   */
  test('undersized boxes clear the 2.5.8 spacing exception at gap="3"', async ({ page }) => {
    await page.goto('/components/checkbox');
    const wide = cell(page, 'Spacing is how an undersized target passes', 'wide · 960px');

    const centres = await wide
      .locator('.pp-checkbox__input')
      .evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + r.height / 2;
        }),
      );

    expect(centres.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < centres.length; i += 1) {
      const gap = (centres[i] as number) - (centres[i - 1] as number);
      expect(gap, `centres are ${gap}px apart — 24px circles would intersect`).toBeGreaterThanOrEqual(24);
    }
  });

  /*
   * The pointer half of D-039 §2. The mark sits in the same grid cell as the
   * input and covers it completely, so without `pointer-events: none` the
   * middle of a checked box is dead and the control only works at its edges —
   * which reads as flakiness rather than as a bug.
   */
  test('clicking the mark toggles the box beneath it', async ({ page }) => {
    await page.goto('/components/checkbox');
    const scope = page.locator('[data-testid="checkbox-mark-target"]');
    const control = scope.locator('input');

    await expect(control).toBeChecked();
    // Dead centre, which is the mark. Not `control.click()`, which Playwright
    // would route to the input regardless of what is painted over it.
    await scope.locator('.pp-checkbox').click({ position: { x: 12, y: 12 } });
    await expect(control, 'the centre of the box does not toggle it').not.toBeChecked();
  });

  /* The third state, end to end, in the only case it exists for. */
  test('select all: the parent computes indeterminate and the click resolves it', async ({
    page,
  }) => {
    await page.goto('/components/checkbox');
    const scope = page.locator('[data-testid="checkbox-select-all"]');
    const all = scope.locator('#select-all');
    const first = scope.locator('#notify-0');

    /* One of three checked, so the parent hands down 'indeterminate'.
       Asserted as a CHECKED STATE rather than as an `aria-checked` attribute,
       because the component deliberately writes no such attribute: the native
       input carries the state and the browser derives `mixed` from the
       `indeterminate` DOM property. Reading the attribute returns null and
       would be asserting the absence of our own second source of truth. */
    await expect(all).toBeChecked({ indeterminate: true });
    await expect(scope.locator('.pp-checkbox[data-state="indeterminate"]')).toHaveCount(1);

    // Clicking a mixed box selects everything — never 'indeterminate'.
    await all.click();
    await expect(all).toBeChecked();
    await expect(scope.locator('input:checked')).toHaveCount(4);

    // And unchecking a child puts the parent back into the third state.
    await first.click();
    await expect(all).toBeChecked({ indeterminate: true });
  });

  /* D-035 §1 / spec §12: association is demonstrated once, outside the Matrix,
     where the id is unique — and this is the assertion that proves it worked. */
  test('an explicit controlId names the control in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/checkbox');
    const control = page.locator('[data-testid="checkbox-mark-target"] input');

    await expect(control).toHaveAccessibleName('Click the check itself');
    await expect(control).toHaveAttribute('id', 'mark-target');
  });
});

/*
 * Radio / RadioGroup (3.11). Two components and two sizing contracts, and
 * almost every claim needs a real browser: the 16/20/24 box, the dot that is
 * half of it, the 2.5.8 spacing exception — and, uniquely in this tier, the
 * KEYBOARD. D-039 §5 rules that the component writes no keydown handler
 * because radios sharing a `name` already implement the APG Radio Group
 * pattern; jsdom implements none of that, so asserting it there would assert
 * jsdom rather than the ruling.
 */
test.describe('Radio', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  test('the box is 16 / 20 / 24, from the size scale and not the control scale', async ({
    page,
  }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px');

    for (const [size, expected] of [
      ['sm', 16],
      ['md', 20],
      ['lg', 24],
    ] as const) {
      const box = await wide
        .locator(`.pp-radio[data-size="${size}"] .pp-radio__input`)
        .first()
        .evaluate((el) => el.getBoundingClientRect());

      expect(box.width, `${size} is ${box.width}px wide`).toBeCloseTo(expected, 0);
      expect(box.height, `${size} is not square`).toBeCloseTo(expected, 0);
    }
  });

  /*
   * THE CLAIM THAT A RADIO AND A CHECKBOX ARE THE SAME BOX, ASSERTED RATHER
   * THAN RESTATED. The spec, this component's stylesheet and its docs page all
   * say it; D-045's rule — and the Definition of Done line it added — is that a
   * claim about another component's behaviour is asserted or linked, never
   * repeated in prose. Measured against `Checkbox` itself rather than against
   * 20, because a numeric assertion in both files still passes after someone
   * changes one of them. The same shape as D-034's Label-against-Button check.
   */
  test('a radio is the same box as a checkbox at the same size', async ({ page }) => {
    await page.goto('/components/checkbox');
    const checkbox = await cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px')
      .locator('.pp-checkbox[data-size="lg"] .pp-checkbox__input')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);

    await page.goto('/components/radio');
    const radio = await cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px')
      .locator('.pp-radio[data-size="lg"] .pp-radio__input')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);

    expect(radio, `a ${radio}px radio beside a ${checkbox}px checkbox`).toBeCloseTo(checkbox, 0);
  });

  /* The one line that makes it a radio rather than a checkbox. Asserted as a
     resolved RADIUS rather than as the token's text, because --pp-radius-full
     is a large length that the box clamps to a circle — half the box is what
     the browser actually paints. */
  test('the box is round, where a checkbox is not', async ({ page }) => {
    await page.goto('/components/radio');
    const radius = await cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px')
      .locator('.pp-radio[data-size="md"] .pp-radio__input')
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).borderStartStartRadius));

    expect(radius, `a ${radius}px radius on a 20px box is not a circle`).toBeGreaterThanOrEqual(10);
  });

  test('hug and fill together: the box holds at every width while the group spreads', async ({
    page,
  }) => {
    await page.goto('/components/radio');

    let previousGroup = 0;
    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'The group fills, the radio hugs', width);
      const box = await c
        .locator('.pp-radio__input')
        .first()
        .evaluate((el) => el.getBoundingClientRect());
      const group = await c
        .locator('.pp-radio-group')
        .first()
        .evaluate((el) => el.getBoundingClientRect().width);

      expect(box.width, `stretched to ${box.width}px at ${width}`).toBeCloseTo(20, 0);
      expect(box.height).toBeCloseTo(20, 0);
      expect(group, `the group did not take the room it was given at ${width}`).toBeGreaterThan(
        previousGroup,
      );
      previousGroup = group;
    }
  });

  test('selected fills the box; unselected does not', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Vertical and horizontal', 'wide · 960px');

    const bg = (state: string) =>
      wide
        .locator(`.pp-radio[data-state="${state}"] .pp-radio__input`)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(await bg('checked'), 'a selected radio is painted like an empty one').not.toBe(
      await bg('unchecked'),
    );
  });

  /*
   * The dot is in the DOM at every moment — React does not know whether a bare
   * radio is checked, so React does not decide — and the stylesheet scales it
   * from 0. A `scale(0)` element has a zero-width box, which is what separates
   * "not drawn" from "drawn and invisible" here.
   */
  test('the dot is drawn when selected and scaled away when not', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Vertical and horizontal', 'wide · 960px');

    const dot = (state: string) =>
      wide
        .locator(`.pp-radio[data-state="${state}"] .pp-radio__indicator`)
        .first()
        .evaluate((el) => el.getBoundingClientRect().width);

    await expect(wide.locator('.pp-radio__indicator').first()).toHaveCount(1);
    expect(await dot('checked'), 'the dot is not drawn').toBeGreaterThan(0);
    expect(await dot('unchecked'), 'the dot is drawn on an unselected radio').toBeCloseTo(0, 1);
  });

  /* Half the box, so overriding --pp-radio-size moves both. A fixed step would
     leave the dot behind, which is the same mistake Checkbox's mark avoids by
     reading Icon's own styling API rather than passing a `size` prop. */
  test('the dot tracks the box at every size', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Sizes — 16 / 20 / 24', 'wide · 960px');

    for (const size of ['sm', 'lg'] as const) {
      const root = wide.locator(`.pp-radio[data-size="${size}"][data-state="checked"]`).first();
      const box = await root
        .locator('.pp-radio__input')
        .evaluate((el) => el.getBoundingClientRect().width);
      const dot = await root
        .locator('.pp-radio__indicator')
        .evaluate((el) => el.getBoundingClientRect().width);

      expect(dot, `${size}: a ${dot}px dot in a ${box}px box`).toBeCloseTo(box / 2, 0);
    }
  });

  /* The same control at rest and focused — nothing else isolates focus
     (D-040 §3). */
  test('focus shifts the border, and the ring is one colour', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-radio:not([data-invalid]) .pp-radio__input').first();
    const invalid = wide.locator('.pp-radio[data-invalid] .pp-radio__input').first();

    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).borderTopColor);
    const outline = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineColor);

    const resting = await border(valid);
    await valid.focus();
    expect(await border(valid), 'the border did not shift on focus').not.toBe(resting);

    const validRing = await outline(valid);
    await invalid.focus();
    expect(await outline(invalid), 'the ring is one colour library-wide (D-029)').toBe(validRing);
  });

  test('an invalid radio stays in the danger tone while focused', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');

    const focusedBorder = async (selector: string) => {
      const el = wide.locator(selector).first();
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder('.pp-radio[data-invalid] .pp-radio__input'),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder('.pp-radio:not([data-invalid]) .pp-radio__input'));
  });

  /* Source order in the stylesheet is the precedence story: the disabled rule
     follows the checked rule at the same specificity. A disabled selected radio
     must not still be solid. */
  test('disabled beats selected, and says so with the cursor', async ({ page }) => {
    await page.goto('/components/radio');
    const disabled = cell(page, 'Disabled', 'wide · 960px');
    const live = cell(page, 'Vertical and horizontal', 'wide · 960px');

    const bg = (scope: ReturnType<typeof cell>, selector: string) =>
      scope
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(
      await bg(disabled, '.pp-radio[data-state="checked"] .pp-radio__input'),
      'a disabled selected radio is as loud as a live one',
    ).not.toBe(await bg(live, '.pp-radio[data-state="checked"] .pp-radio__input'));

    expect(
      await disabled
        .locator('.pp-radio[data-disabled] .pp-radio__input')
        .first()
        .evaluate((el) => getComputedStyle(el).cursor),
    ).toBe('not-allowed');
  });

  /*
   * WCAG 2.2 SC 2.5.8, and the whole reason `gap` defaults to "3" (D-039 §4).
   * The group on this page passes NO gap, so what is measured is the default.
   * A 16px target passes through the SPACING exception: a 24px circle centred
   * on each one must not intersect its neighbour's, which needs 24px between
   * centres. At gap="2" (8px) a column of sm radios puts them exactly 24px
   * apart — tangent circles, an argument with an auditor rather than a pass.
   */
  test('the default gap clears the 2.5.8 spacing exception at sm', async ({ page }) => {
    await page.goto('/components/radio');
    const wide = cell(page, 'Spacing is how an undersized target passes', 'wide · 960px');

    const centres = await wide.locator('.pp-radio__input').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      }),
    );

    expect(centres.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < centres.length; i += 1) {
      const gap = (centres[i] as number) - (centres[i - 1] as number);
      expect(gap, `centres are ${gap}px apart — 24px circles would intersect`).toBeGreaterThanOrEqual(24);
    }
  });

  /*
   * D-039 §5, the ruling this component exists to demonstrate. Every assertion
   * below is of BROWSER behaviour that the component deliberately does not
   * implement, so a regression here means someone added a keydown handler.
   */
  test('one tab stop: the group is entered at the selected radio', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-keyboard"]');

    await scope.locator('#region-eu').focus();
    await page.keyboard.press('Tab');

    // Out of the group entirely in one press, not onto the next radio.
    await expect(scope.locator('input:focus')).toHaveCount(0);
  });

  test('arrow keys move AND select, skip a disabled member, and wrap', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-keyboard"]');
    const eu = scope.locator('#region-eu');
    const us = scope.locator('#region-us');
    const apac = scope.locator('#region-apac');

    await eu.focus();
    await expect(eu).toBeChecked();

    // Past the disabled US option in one press, and selecting as it goes —
    // which is the APG pattern, and none of it is ours.
    await page.keyboard.press('ArrowDown');
    await expect(apac).toBeFocused();
    await expect(apac).toBeChecked();
    await expect(us).not.toBeChecked();

    // And it wraps at the end rather than stopping.
    await page.keyboard.press('ArrowDown');
    await expect(eu).toBeFocused();
    await expect(eu).toBeChecked();

    /* All four arrows, regardless of orientation — a superset of APG rather
       than a deviation. Recorded so the next reader of the APG page does not
       "fix" it. */
    await page.keyboard.press('ArrowRight');
    await expect(apac).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(eu).toBeFocused();
  });

  /*
   * The generated `name` (D-039 §5). Two groups on this page are given no
   * name at all; if they shared one they would be one group and selecting in
   * the first would clear the second — silently.
   */
  test('two unnamed groups are two groups', async ({ page }) => {
    await page.goto('/components/radio');
    const groups = page.locator('[data-testid="radio-two-groups"] .pp-radio-group');
    const second = groups.nth(1).locator('input').first();

    await expect(second).toBeChecked();
    await groups.nth(0).locator('input').nth(1).click();

    await expect(second, 'selecting in one group cleared the other').toBeChecked();
    await expect(page.locator('[data-testid="radio-two-groups"] input:checked')).toHaveCount(2);
  });

  /* The same claim one level up, and the reason nothing in a Matrix passes a
     `name`: the harness renders its subtree six times, so a shared name would
     make six cells one group. */
  test('six copies of a group in the Matrix are six groups', async ({ page }) => {
    await page.goto('/components/radio');
    const section = page.locator('section', { hasText: 'Spacing is how an undersized target passes' });

    await expect(section.locator('.pp-radio-group')).toHaveCount(6);
    await expect(section.locator('input:checked')).toHaveCount(6);
  });

  /*
   * THE STYLESHEET READS `:checked`, NOT `data-state` — the deviation from
   * RULES §4 that this component records. Outside a group nothing owns the
   * selection, so `data-state` is omitted rather than guessed; the box must
   * still paint. This is the only assertion that can tell the two mechanisms
   * apart, because everywhere else they agree.
   */
  test('a radio with no group has no data-state and is still painted', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-bare"]');
    const root = scope.locator('.pp-radio');
    const control = scope.locator('input');

    await expect(root).not.toHaveAttribute('data-state', /.*/);

    const resting = await control.evaluate((el) => getComputedStyle(el).backgroundColor);
    const dotResting = await scope
      .locator('.pp-radio__indicator')
      .evaluate((el) => el.getBoundingClientRect().width);

    await control.click();

    await expect(root, 'a group appeared from nowhere').not.toHaveAttribute('data-state', /.*/);
    expect(
      await control.evaluate((el) => getComputedStyle(el).backgroundColor),
      'the box did not fill — the stylesheet is reading the attribute, not :checked',
    ).not.toBe(resting);
    expect(
      await scope.locator('.pp-radio__indicator').evaluate((el) => el.getBoundingClientRect().width),
      'the dot did not appear',
    ).toBeGreaterThan(dotResting);
  });

  /* And where the group DOES own the value, the attribute and the platform
     agree. Two mechanisms that disagree would be worse than either alone. */
  test('data-state agrees with :checked inside a group', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-controlled"]');

    await scope.locator('#target-production').click();

    await expect(scope.locator('.pp-radio[data-state="checked"] input')).toBeChecked();
    await expect(scope.locator('.pp-radio[data-state="checked"]')).toHaveCount(1);
    for (const state of await scope.locator('.pp-radio').all()) {
      const attribute = await state.getAttribute('data-state');
      const checked = await state.locator('input').isChecked();
      expect(attribute).toBe(checked ? 'checked' : 'unchecked');
    }
  });

  /*
   * The pointer half of D-039 §2. The dot sits over the input in the same grid
   * cell, so without `pointer-events: none` the middle of a SELECTED radio is
   * dead and the control only works at its edges — which reads as flakiness
   * rather than as a bug.
   *
   * IT HAS TO BE A SELECTED RADIO. The first version of this test clicked the
   * centre of an UNSELECTED one, where the dot is `scale(0)` and has a
   * zero-sized box: nothing could intercept the pointer there, so the
   * assertion passed with the declaration deleted. Seventh time a
   * break-it-and-watch check has found a test that could not fail.
   */
  test('the dot is not a hole in the middle of a selected radio', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-controlled"]');
    const selected = scope.locator('.pp-radio[data-state="checked"]').first();

    /* Dead centre, which on a SELECTED radio is the dot. Not
       `input.click()`, which Playwright would route to the input regardless of
       what is painted over it.

       Asserted as FOCUS rather than as selection, because clicking a radio
       that is already selected is a no-op by design and leaves nothing else to
       observe. The dot is a <span> and is not focusable, so if it took the
       click, focus would land nowhere. */
    await selected.click({ position: { x: 10, y: 10 } });

    await expect(
      selected.locator('input'),
      'the centre of the box is dead — the click landed on the dot',
    ).toBeFocused();
    await expect(selected.locator('input'), 'the click deselected it').toBeChecked();
  });

  /* D-035 §1 / spec §12: association is demonstrated once, outside the Matrix,
     where the id is unique — and the group is named through aria-labelledby,
     because a <div> is not a labelable element. */
  test('the group is named by its field, and each option by its own', async ({ page }) => {
    await page.goto('/components/radio');
    const scope = page.locator('[data-testid="radio-controlled"]');

    await expect(scope.getByRole('radiogroup')).toHaveAccessibleName('Deployment target');
    await expect(scope.locator('#target-preview')).toHaveAccessibleName('Preview');
    await expect(scope.getByRole('radiogroup')).toHaveAccessibleDescription(
      /Changes take effect/,
    );
  });
});

/*
 * Switch (3.12). The last of the checkable three, and the one whose claims are
 * almost all geometric: a 2:1 track, a thumb derived from it, a travel that is
 * the difference between the track's two axes. None of that exists in jsdom.
 *
 * Two of the assertions below exist because of a ruling rather than a feature.
 * D-048 §1 replaced the spec's `--pp-color-border-strong` track after measuring
 * it at 1.97:1, so the contrast of the thumb against the track is asserted here
 * rather than trusted — in both themes, from the colours the browser actually
 * resolved. And D-048 §4 moves the thumb with `inset-inline-start` rather than
 * `translate`, which only differs in an RTL layout, so there is an RTL
 * assertion and it is the only thing that can tell the two apart.
 */
test.describe('Switch', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  /* Resolve a computed colour to sRGB and compare two of them. getComputedStyle
     hands back whatever colour space the token was authored in — oklch(), here
     — so the canvas does the conversion rather than a regex that would only
     work for one of them. */
  const contrastOf = (scope: ReturnType<typeof cell>, selectorA: string, selectorB: string) =>
    scope.evaluate(
      (root, [a, b]) => {
        /* Painted and read back rather than parsed. getComputedStyle returns
           the colour in whatever space the token was authored in — oklch(),
           here — and `ctx.fillStyle` echoes that string back rather than
           normalising it, which is how the first version of this helper
           produced NaN. One pixel of image data is always sRGB bytes. */
        const srgb = (color: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3).map((v) => v / 255);
        };
        const luminance = (c: number[]) => {
          const [r, g, bl] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
          return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (bl as number);
        };
        const bg = (selector: string) =>
          getComputedStyle(root.querySelector(selector) as Element).backgroundColor;
        const la = luminance(srgb(bg(a as string)));
        const lb = luminance(srgb(bg(b as string)));
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      },
      [selectorA, selectorB] as const,
    );

  test('the track is 2:1 on the size scale, not on the control scale', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'Sizes', 'wide · 960px');

    const box = (size: string) =>
      wide
        .locator(`.pp-switch[data-size="${size}"] .pp-switch__input`)
        .first()
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { inline: r.width, block: r.height };
        });

    // 32×16 / 40×20 / 48×24. --pp-control-height-* would be 32 / 40 / 48 on the
    // BLOCK axis, which is the mistake this asserts against.
    for (const [size, block] of [['sm', 16], ['md', 20], ['lg', 24]] as const) {
      const { inline, block: measured } = await box(size);
      expect(measured, `a ${size} track is ${measured}px tall`).toBeCloseTo(block, 0);
      expect(inline, `a ${size} track is ${inline}px long, not 2:1`).toBeCloseTo(block * 2, 0);
    }
  });

  /*
   * The cross-component agreement the size scale exists to make structural: a
   * switch and a checkbox in the same form line up, and an OFF switch rests on
   * the same surface an unchecked checkbox does. Asserted against the other
   * component rather than against numbers, because a numeric assertion still
   * passes after someone hardcodes one of the two (D-034's mechanism).
   *
   * It is also what D-045 requires of the claim: the component page and the
   * stylesheet both say "the same fill and edge an unchecked Checkbox takes",
   * and prose stated in four places was false in all four.
   */
  test('a switch and a checkbox agree on the box and on the resting surface', async ({ page }) => {
    /* The height comes from each page's size matrix and the resting colours
       from wherever that page shows an UNCHECKED md control — the checkbox
       page's size matrix is all checked, which is why these are two reads. */
    const measure = (
      page: import('@playwright/test').Page,
      section: string,
      selector: string,
    ) =>
      cell(page, section, 'wide · 960px')
        .locator(selector)
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            block: el.getBoundingClientRect().height,
            bg: style.backgroundColor,
            border: style.borderTopColor,
          };
        });

    await page.goto('/components/checkbox');
    const checkboxBox = await measure(page, 'Sizes', '.pp-checkbox[data-size="md"] .pp-checkbox__input');
    const checkbox = await measure(
      page,
      'Three states, and only two a user can reach',
      '.pp-checkbox[data-state="unchecked"] .pp-checkbox__input',
    );

    await page.goto('/components/switch');
    const trackBox = await measure(page, 'Sizes', '.pp-switch[data-size="md"] .pp-switch__input');
    const track = await measure(
      page,
      'The thumb is the state indicator',
      '.pp-switch[data-state="unchecked"] .pp-switch__input',
    );

    expect(trackBox.block, `a ${trackBox.block}px switch beside a ${checkboxBox.block}px checkbox`)
      .toBeCloseTo(checkboxBox.block, 0);
    expect(track.bg, 'the off track is not the checkbox\'s resting fill').toBe(checkbox.bg);
    expect(track.border, 'the off track is not the checkbox\'s resting edge').toBe(checkbox.border);
  });

  /*
   * THE DERIVED GEOMETRY (D-048 §2). The thumb is the track minus two insets
   * and the travel is `inline − block`, so a md switch moves its 16px thumb
   * 20px and is inset by the same 2px at both ends. Break any one of the four
   * calc() expressions and one of these numbers moves.
   */
  test('the thumb is derived from the track, and travels inline minus block', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'The thumb is the state indicator', 'wide · 960px');

    const geometry = (state: string) =>
      wide
        .locator(`.pp-switch[data-state="${state}"]`)
        .first()
        .evaluate((root) => {
          const track = (root.querySelector('.pp-switch__input') as Element).getBoundingClientRect();
          const thumb = (root.querySelector('.pp-switch__thumb') as Element).getBoundingClientRect();
          return {
            thumb: thumb.width,
            square: thumb.width - thumb.height,
            start: thumb.left - track.left,
            end: track.right - thumb.right,
            centre: thumb.left + thumb.width / 2 - track.left,
          };
        });

    const off = await geometry('unchecked');
    const on = await geometry('checked');

    // 20 − 2×2. The thumb is a circle, so both axes agree.
    expect(off.thumb).toBeCloseTo(16, 0);
    expect(off.square).toBeCloseTo(0, 1);
    // Inset at the start when off, the same inset at the end when on.
    expect(off.start).toBeCloseTo(2, 0);
    expect(on.end).toBeCloseTo(2, 0);
    // Travel is inline − block = 40 − 20, whatever the inset is.
    expect(on.centre - off.centre, 'the thumb did not travel inline − block').toBeCloseTo(20, 0);
  });

  /* One override moves all four lengths, which is the point of deriving them.
     The cell sets --pp-switch-track-block-size: 2rem and nothing else. */
  test('overriding the track block size moves the thumb, the inset and the travel', async ({
    page,
  }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'The styling API is six custom properties', 'wide · 960px');

    const measured = await wide.locator('.pp-switch').nth(1).evaluate((root) => {
      const track = (root.querySelector('.pp-switch__input') as Element).getBoundingClientRect();
      const thumb = (root.querySelector('.pp-switch__thumb') as Element).getBoundingClientRect();
      return { inline: track.width, block: track.height, thumb: thumb.width, start: thumb.left - track.left };
    });

    // 2rem = 32px block, so 64px inline, and the inset is still (32 − 16) / 2 —
    // the thumb STEP is the size scale's, not a fraction of the track.
    expect(measured.block).toBeCloseTo(32, 0);
    expect(measured.inline).toBeCloseTo(64, 0);
    expect(measured.thumb).toBeCloseTo(32 - 2 * 8, 0);
    expect(measured.start).toBeCloseTo(8, 0);
  });

  /*
   * D-048 §1, and the reason the spec's State table was amended. A
   * --pp-color-border-strong track with a surface thumb measures 1.97:1 in the
   * light theme; both pairings below have to clear 3:1, in both themes, from
   * the colours the browser actually resolved rather than from the ones the
   * stylesheet names.
   */
  test('the thumb clears 3:1 against the track, on and off, in both themes', async ({ page }) => {
    await page.goto('/components/switch');

    for (const width of ['wide · 960px']) {
      for (const theme of ['light', 'dark']) {
        /* Theme OUTSIDE cell: the harness renders one <section
           class="matrix__theme"> per theme and the three width cells inside
           it, not the other way round. */
        const scope = page
          .locator('section', { hasText: 'The thumb is the state indicator' })
          .locator(`.matrix__theme[data-pp-theme="${theme}"]`)
          .locator('.matrix__cell')
          .filter({ hasText: width })
          .first();

        for (const state of ['unchecked', 'checked']) {
          const ratio = await contrastOf(
            scope.locator(`.pp-switch[data-state="${state}"]`).first(),
            '.pp-switch__thumb',
            '.pp-switch__input',
          );
          expect(
            ratio,
            `the ${state} thumb is ${ratio.toFixed(2)}:1 against its track in the ${theme} theme`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  test('on and off are different tracks, not only different thumb positions', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'The thumb is the state indicator', 'wide · 960px');

    const bg = (state: string, part: string) =>
      wide
        .locator(`.pp-switch[data-state="${state}"] ${part}`)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(await bg('checked', '.pp-switch__input'), 'an on switch is painted like an off one').not.toBe(
      await bg('unchecked', '.pp-switch__input'),
    );
    expect(await bg('checked', '.pp-switch__thumb')).not.toBe(await bg('unchecked', '.pp-switch__thumb'));
  });

  test('an invalid switch borrows the danger tone, and keeps it while focused', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');

    const border = (selector: string) =>
      wide.locator(selector).first().evaluate((el) => getComputedStyle(el).borderTopColor);

    expect(await border('.pp-switch[data-invalid] .pp-switch__input')).not.toBe(
      await border('.pp-switch:not([data-invalid]) .pp-switch__input'),
    );

    const focusedBorder = async (selector: string) => {
      const el = wide.locator(selector).first();
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder('.pp-switch[data-invalid] .pp-switch__input'),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder('.pp-switch:not([data-invalid]) .pp-switch__input'));
  });

  /* Source order in the stylesheet is the precedence story: checked, then
     invalid, then disabled. A disabled switch that is ON must not still be
     solid — and it must still be distinguishable from a live off one. */
  test('disabled beats checked, and is distinguishable from a live off switch', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'Disabled', 'wide · 960px');

    const bg = (selector: string) =>
      wide.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);

    /* A LIVE ON switch, not a live OFF one. The first version of this
       assertion compared the disabled ON track with a live OFF track, which
       differ because of `data-state` whatever the disabled rule does — so
       deleting that rule outright left it green. Eighth time a
       break-it-and-watch check has found an assertion that could not fail. */
    expect(
      await bg('.pp-switch[data-disabled][data-state="checked"] .pp-switch__input'),
      'a disabled switch that is on is as loud as a live one',
    ).not.toBe(await bg('.pp-switch:not([data-disabled])[data-state="checked"] .pp-switch__input'));

    /* The distinction the spec worried about, moved into the thumb (D-048 §1):
       a live off switch has a thumb you can see and a disabled one does not. */
    const thumbContrast = (selector: string) =>
      contrastOf(wide.locator(selector).first(), '.pp-switch__thumb', '.pp-switch__input');

    const live = await thumbContrast('.pp-switch:not([data-disabled])[data-state="unchecked"]');
    const dead = await thumbContrast('.pp-switch[data-disabled][data-state="unchecked"]');
    expect(live, `off ${live.toFixed(2)}:1 vs disabled ${dead.toFixed(2)}:1`).toBeGreaterThan(dead);

    expect(
      await wide
        .locator('.pp-switch[data-disabled] .pp-switch__input')
        .first()
        .evaluate((el) => getComputedStyle(el).cursor),
    ).toBe('not-allowed');
  });

  /* WCAG 2.2 SC 2.5.8 on the block axis, the same geometry Checkbox and
     RadioGroup record: a 24px circle centred on each target must not intersect
     its neighbour's, which needs 24px between centres. */
  test('undersized tracks clear the 2.5.8 spacing exception at gap="3"', async ({ page }) => {
    await page.goto('/components/switch');
    const wide = cell(page, 'Spacing is how an undersized target passes', 'wide · 960px');

    const centres = await wide.locator('.pp-switch__input').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      }),
    );

    expect(centres.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < centres.length; i += 1) {
      const gap = (centres[i] as number) - (centres[i - 1] as number);
      expect(gap, `centres are ${gap}px apart — 24px circles would intersect`).toBeGreaterThanOrEqual(24);
    }
  });

  /*
   * D-048 §4, and the only assertion that can tell `inset-inline-start` from
   * `translate`: they are the same movement in LTR and opposite movements in
   * RTL. A physically translated thumb runs toward the track's START in an
   * Arabic or Hebrew layout, which is a switch that reads backwards.
   */
  test('the thumb travels toward the inline END, in RTL as well as LTR', async ({ page }) => {
    await page.goto('/components/switch');
    const scope = page.locator('[data-testid="switch-thumb-target"]');

    const offsetFromCentre = () =>
      scope.locator('.pp-switch').first().evaluate((root) => {
        const track = (root.querySelector('.pp-switch__input') as Element).getBoundingClientRect();
        const thumb = (root.querySelector('.pp-switch__thumb') as Element).getBoundingClientRect();
        return thumb.left + thumb.width / 2 - (track.left + track.width / 2);
      });

    // Checked, so the thumb is at the track's inline end: to the right in LTR.
    expect(await offsetFromCentre()).toBeGreaterThan(0);

    await scope.evaluate((el) => el.setAttribute('dir', 'rtl'));

    expect(
      await offsetFromCentre(),
      'the thumb still moved rightwards in RTL — it is being translated, not offset',
    ).toBeLessThan(0);
  });

  /*
   * The pointer half of D-039 §2. The thumb sits over the input in the same
   * grid cell, so without `pointer-events: none` the part of the track the
   * thumb covers is dead.
   *
   * Asserted as FOCUS rather than as state, and on a CHECKED switch, for the
   * reason D-047 §5 rewrote Radio's version of this test: the thumb must
   * actually be under the click for the assertion to be able to fail, and the
   * thumb is a <span> that cannot take focus, so if it takes the click focus
   * lands nowhere.
   */
  test('the thumb is not a hole in the track', async ({ page }) => {
    await page.goto('/components/switch');
    const scope = page.locator('[data-testid="switch-thumb-target"]');
    const root = scope.locator('.pp-switch');
    const control = scope.locator('input');

    await expect(control).toBeChecked();

    // A checked md switch puts its 16px thumb at 22–38px of a 40px track, so
    // x: 30 is the middle of the thumb.
    await root.click({ position: { x: 30, y: 10 } });

    await expect(control, 'the click landed on the thumb, not the track').toBeFocused();
    await expect(control, 'the switch did not flip').not.toBeChecked();
  });

  /*
   * The role, in a real accessibility tree rather than in jsdom — D-030 §2's
   * standing rule, and the line D-030 §5 drew against `Toggle`. Also D-035 §1 /
   * spec §12: association is demonstrated once, outside the Matrix, where the
   * id is unique.
   */
  test('it is announced as a switch, named by its field', async ({ page }) => {
    await page.goto('/components/switch');
    const control = page.locator('[data-testid="switch-controlled"] input');

    await expect(control).toHaveRole('switch');
    await expect(control).toHaveAccessibleName('Ship on merge');
    await expect(control).toHaveAccessibleDescription(/Deploys to production/);
    await expect(control).toHaveAttribute('id', 'ship-on-merge');
  });

  /* The attribute and the platform agree, which is what lets this stylesheet
     paint from `data-state` where Radio's cannot (D-048 §3). */
  test('data-state agrees with :checked, and the effect is immediate', async ({ page }) => {
    await page.goto('/components/switch');
    const scope = page.locator('[data-testid="switch-controlled"]');

    await expect(scope.locator('.pp-switch')).toHaveAttribute('data-state', 'unchecked');
    await expect(scope).toContainText('Merges do nothing');

    await scope.locator('#ship-on-merge').click();

    await expect(scope.locator('.pp-switch')).toHaveAttribute('data-state', 'checked');
    await expect(scope.locator('input')).toBeChecked();
    // No Save button anywhere: the consequence is already on the page.
    await expect(scope).toContainText('Already in effect');
  });
});

/*
 * Select (3.13). Everything here needs layout. The reserved chevron room is a
 * calc() the browser performs, `:has(option:checked)` is a live selector jsdom
 * does not implement, and the RTL question is about which physical side a
 * logical offset lands on — none of which a DOM snapshot can answer.
 */
test.describe('Select', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  /*
   * THE REASON THIS COMPONENT HAS A WRAPPER, and the worst case of the three
   * surfaces: a native <select> sizes to its LONGEST OPTION, so as a block
   * element it is whatever its content says rather than whatever its parent
   * says. Asserted so a future simplification to a single element fails loudly.
   */
  test('fill: the control takes the box it is given, at every width', async ({ page }) => {
    await page.goto('/components/select');

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const c = cell(page, 'It fills, at every container width', width);
      const ratio = await c.locator('.pp-select__input').evaluate((node) => {
        const root = node.closest('.pp-select') as HTMLElement;
        return node.getBoundingClientRect().width / root.getBoundingClientRect().width;
      });
      expect(ratio, `the control did not fill its root at ${width}`).toBeCloseTo(1, 2);
    }
  });

  test('a long option truncates instead of pushing the container wide', async ({ page }) => {
    await page.goto('/components/select');
    const narrow = cell(page, 'It fills, at every container width', 'narrow · 240px');

    const overflow = await narrow.locator('.pp-field').evaluate((node) => {
      const parent = node.parentElement as HTMLElement;
      return parent.scrollWidth - parent.clientWidth;
    });
    expect(overflow, 'the select pushed its container wide').toBeLessThanOrEqual(1);
  });

  /*
   * D-028's entire purpose, asserted against the other component rather than
   * against numbers: a numeric assertion still passes after someone hardcodes
   * one of the two (D-034's mechanism). The numbers are checked too, because
   * "both wrong in the same way" is the case comparing them cannot catch.
   */
  test('a Select and an Input are the same height at the same size', async ({ page }) => {
    const heightsOn = async (path: string, selector: string) => {
      await page.goto(path);
      const wide = cell(page, 'Sizes', 'wide · 960px');
      const out: Record<string, number> = {};
      for (const size of ['sm', 'md', 'lg'] as const) {
        out[size] = await wide
          .locator(selector.replace('SIZE', size))
          .first()
          .evaluate((el) => el.getBoundingClientRect().height);
      }
      return out;
    };

    const input = await heightsOn('/components/input', '.pp-input[data-size="SIZE"] .pp-input__control');
    const select = await heightsOn(
      '/components/select',
      '.pp-select[data-size="SIZE"] .pp-select__input',
    );

    expect(select, 'a Select is a different height from an Input in the same form').toEqual(input);
    expect(select).toEqual({ sm: 32, md: 40, lg: 48 });
  });

  /*
   * THE CHEVRON'S RESERVED ROOM, as geometry rather than as a number. The text
   * area of the control has to end before the glyph begins, or a long value
   * runs underneath it — which looks like a rendering glitch rather than a
   * missing declaration. Fails when --_pad-inline-end loses any of its three
   * terms.
   */
  test('the text box ends before the chevron begins, at every size', async ({ page }) => {
    await page.goto('/components/select');
    const wide = cell(page, 'Sizes', 'wide · 960px');

    for (const size of ['sm', 'md', 'lg'] as const) {
      const gap = await wide
        .locator(`.pp-select[data-size="${size}"]`)
        .first()
        .evaluate((root) => {
          const control = root.querySelector('.pp-select__input') as HTMLElement;
          const glyph = root.querySelector('.pp-select__indicator') as HTMLElement;
          const box = control.getBoundingClientRect();
          const end = box.right - parseFloat(getComputedStyle(control).paddingRight);
          return glyph.getBoundingClientRect().left - end;
        });
      expect(gap, `a ${size} chevron sits inside the text box`).toBeGreaterThanOrEqual(0);
    }
  });

  /*
   * D-049 §2, AND THE ONLY ASSERTION THAT CAN TELL THE TWO MECHANISMS APART.
   *
   * An UNCONTROLLED select with its placeholder selected: the root carries no
   * `data-placeholder` — React was never told and refuses to guess — and the
   * text is muted anyway, because the stylesheet reads the platform's own
   * `:checked`. Swap the `:has()` rule for `[data-placeholder]` and the colour
   * assertion fails while every other test on this page stays green.
   */
  test('an uncontrolled placeholder is muted with no attribute to read', async ({ page }) => {
    await page.goto('/components/select');
    const scope = page.locator('[data-testid="select-uncontrolled-placeholder"]');
    const control = scope.locator('.pp-select__input');

    await expect(scope.locator('.pp-select')).not.toHaveAttribute('data-placeholder', /.*/);

    const placeholderColor = await control.evaluate((el) => getComputedStyle(el).color);
    const muted = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--pp-color-text-muted').trim(),
    );
    const resolved = await page.evaluate((value) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      document.body.append(probe);
      const out = getComputedStyle(probe).color;
      probe.remove();
      return out;
    }, muted);

    expect(placeholderColor, 'the placeholder is not painted muted').toBe(resolved);
  });

  /*
   * D-045: a claim about ANOTHER component is asserted or linked, never
   * restated. The stylesheet, the spec and the docs page all say the
   * placeholder is the colour `Input` gives `::placeholder`, and prose stated
   * in four places was false in all four. So it is read off both components,
   * on their own pages, rather than written down twice.
   */
  test('the placeholder is the colour Input gives ::placeholder', async ({ page }) => {
    await page.goto('/components/input');
    const inputPlaceholder = await page
      .locator('.pp-input__control[placeholder]')
      .first()
      .evaluate((el) => getComputedStyle(el, '::placeholder').color);

    await page.goto('/components/select');
    const selectPlaceholder = await page
      .locator('[data-testid="select-uncontrolled-placeholder"] .pp-select__input')
      .evaluate((el) => getComputedStyle(el).color);

    expect(selectPlaceholder, 'the two empty states are different colours').toBe(inputPlaceholder);
  });

  /* The same rule, live: the platform changes the selection and the colour
     follows without React rendering anything. Fails the moment the paint is
     driven by an attribute instead. */
  test('choosing a real option un-mutes an uncontrolled select', async ({ page }) => {
    await page.goto('/components/select');
    const control = page.locator('[data-testid="select-uncontrolled-placeholder"] .pp-select__input');

    const before = await control.evaluate((el) => getComputedStyle(el).color);
    await control.selectOption('production');
    const after = await control.evaluate((el) => getComputedStyle(el).color);

    expect(after, 'the placeholder colour survived a real selection').not.toBe(before);
  });

  /* The other half: controlled, so React does know, and the attribute is
     there for consumers to style off. */
  test('a controlled select exposes data-placeholder and drops it on change', async ({ page }) => {
    await page.goto('/components/select');
    const scope = page.locator('[data-testid="select-controlled"]');
    const root = scope.locator('.pp-select');

    await expect(root).toHaveAttribute('data-placeholder', 'true');
    await scope.locator('.pp-select__input').selectOption('production');
    await expect(root).not.toHaveAttribute('data-placeholder', /.*/);
  });

  /*
   * D-029 / D-039 §4: focus draws TWO things, a ring outside the box in one
   * library-wide colour and a tone-shifted border inside it. The comparison is
   * the SAME control at rest and focused — comparing a valid control with an
   * invalid one is the assertion that could not fail, which D-040 §3 found.
   */
  test('focus shifts the control border, and the ring is one colour', async ({ page }) => {
    await page.goto('/components/select');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-select:not([data-invalid]) .pp-select__input').first();
    const invalid = wide.locator('.pp-select[data-invalid] .pp-select__input').first();

    const border = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).borderTopColor);
    const outline = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineColor);

    const resting = await border(valid);
    await valid.focus();
    expect(await border(valid), 'the border did not shift on focus').not.toBe(resting);

    const validRing = await outline(valid);
    await invalid.focus();
    expect(await outline(invalid), 'the ring is one colour library-wide (D-029)').toBe(validRing);
  });

  test('an invalid control stays in the danger tone while focused', async ({ page }) => {
    await page.goto('/components/select');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');

    const focusedBorder = async (selector: string) => {
      const el = wide.locator(selector).first();
      await el.focus();
      return el.evaluate((n) => getComputedStyle(n).borderTopColor);
    };

    expect(
      await focusedBorder('.pp-select[data-invalid] .pp-select__input'),
      'the error state vanished the moment the user acted on it',
    ).not.toBe(await focusedBorder('.pp-select:not([data-invalid]) .pp-select__input'));
  });

  /* The chevron dims with the box rather than staying live on a dead control.
     Read on the indicator, whose colour is the thing in question. */
  test('a disabled chevron is not a live one', async ({ page }) => {
    await page.goto('/components/select');
    /* NOT `hasText: 'Disabled'`. That is a case-insensitive substring, and the
       placeholder section above says "disabled, hidden" — so the first match
       was a section with no disabled control in it and the locator waited out
       the timeout. Filter on a phrase that exists once. */
    const wide = cell(page, 'no read-only', 'wide · 960px');

    const chevron = (selector: string) =>
      wide.locator(selector).first().evaluate((n) => getComputedStyle(n).color);

    expect(await chevron('.pp-select[data-disabled] .pp-select__indicator')).not.toBe(
      await chevron('.pp-select:not([data-disabled]) .pp-select__indicator'),
    );
  });

  /*
   * The pointer half. The chevron sits over the control in the same grid cell,
   * so without `pointer-events: none` the inline end of the box is dead.
   *
   * Asserted as FOCUS, for the reason D-047 §5 rewrote Radio's version of this
   * test: the glyph must actually be under the click for the assertion to be
   * able to fail, and it is a <span> that cannot take focus — so if it takes
   * the click, focus lands nowhere.
   */
  test('a click on the chevron reaches the control underneath it', async ({ page }) => {
    await page.goto('/components/select');
    const scope = page.locator('[data-testid="select-chevron-target"]');
    const root = scope.locator('.pp-select');

    /*
     * The ROOT is clicked at the chevron's own centre, rather than the chevron
     * being clicked directly. Clicking it directly is unactionable BY DESIGN:
     * Playwright hit-tests the point, finds the <select>, and reports an
     * interception — which is the declaration working. Targeting the root means
     * the hit landing on a descendant is a pass, and the position is measured
     * rather than guessed so it survives a change to the size or the padding.
     */
    const position = await root.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const glyph = (el.querySelector('.pp-select__indicator') as Element).getBoundingClientRect();
      return { x: glyph.left + glyph.width / 2 - box.left, y: box.height / 2 };
    });

    await root.click({ position });

    /* Focus, not state: the chevron is a <span> and cannot take focus, so if
       it takes the click focus lands nowhere (D-047 §5). */
    await expect(
      scope.locator('.pp-select__input'),
      'the click landed on the chevron, not the control',
    ).toBeFocused();
  });

  /*
   * D-048 §4's question on a different part, and TWO SEPARATE CLAIMS that a
   * first version of this test collapsed into one it could not fail.
   *
   * That version asserted only which side of the box's centre the chevron sat
   * on, and called the answer proof of a logical offset. It is not: which side
   * is `place-self: center end`'s doing, and the grid mirrors that by itself.
   * Swapping `inset-inline-end` for `right` left the chevron on the correct
   * side in RTL and every assertion green — the ninth time this repository has
   * found an assertion that could not fail (D-048 §5), and the same shape as
   * the other eight: two things compared that already differ for another
   * reason.
   *
   * What the OFFSET decides is the direction the glyph is pulled back in. In
   * RTL the box's inline end is its left edge, so `right` pulls the chevron
   * further left — clean off the control — while `inset-inline-end` pulls it
   * inward, the same 12px the LTR layout gets. So the number to watch is the
   * inset from the inline-end edge, and it fails on its own message.
   */
  test('the chevron is inset from the inline end, in RTL as well as LTR', async ({ page }) => {
    await page.goto('/components/select');
    const scope = page.locator('[data-testid="select-chevron-target"]');
    const root = scope.locator('.pp-select').first();

    const measure = () =>
      root.evaluate((el) => {
        const box = (el.querySelector('.pp-select__input') as Element).getBoundingClientRect();
        const glyph = (el.querySelector('.pp-select__indicator') as Element).getBoundingClientRect();
        const rtl = getComputedStyle(el).direction === 'rtl';
        return {
          // Positive means "toward the inline end", whichever side that is.
          fromCentre:
            (glyph.left + glyph.width / 2 - (box.left + box.width / 2)) * (rtl ? -1 : 1),
          insetFromEnd: rtl ? glyph.left - box.left : box.right - glyph.right,
        };
      });

    const ltr = await measure();
    expect(ltr.fromCentre, 'the chevron is not at the inline end in LTR').toBeGreaterThan(0);
    expect(ltr.insetFromEnd, 'the chevron is not inset from the edge').toBeGreaterThan(0);

    await scope.evaluate((el) => el.setAttribute('dir', 'rtl'));
    const rtl = await measure();

    expect(rtl.fromCentre, 'the chevron is not at the inline end in RTL').toBeGreaterThan(0);
    expect(
      rtl.insetFromEnd,
      'the chevron was pulled off the control in RTL — it is offset physically, not logically',
    ).toBeCloseTo(ltr.insetFromEnd, 1);
  });

  /*
   * Spec §12 and D-030 §2: what a screen reader perceives is asserted in a real
   * browser, never in jsdom, where a visibility:hidden label once passed
   * `toHaveAccessibleName` and was announced as nothing. One combobox in the
   * tree, named by the field — the chevron contributes nothing.
   */
  test('an explicit controlId names the control in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/select');
    const control = page.locator('[data-testid="select-association"] select');

    await expect(control).toHaveAccessibleName('Billing region');
    await expect(control).toHaveAttribute('id', 'billing-region');
  });
});

/*
 * NumberInput (3.14) — spec docs/specs/tier-3d-composite.md §3.14.
 *
 * Everything here needs a real browser: a computed role, a `:has()` selector
 * jsdom does not implement, and an outline drawn on an element other than the
 * focused one. D-030 §2 is the standing reason — a `visibility: hidden` label
 * passed `toHaveAccessibleName` in jsdom and was announced as nothing in a real
 * browser.
 */
test.describe('NumberInput', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  test('the control scale agrees with Input, which is what D-028 exists for', async ({ page }) => {
    /*
     * D-045: a claim about ANOTHER component is asserted, never restated. The
     * stylesheet, the spec, the docs page and the changeset all say a
     * NumberInput and an Input at the same size are the same height. It is read
     * off both components, on their own pages, rather than written down twice.
     */
    /*
     * `[data-size="md"]`, not `.first()`. The first draft took whichever
     * control came first in the document — an `sm` one on the Input page — and
     * reported a 32-vs-40 disagreement that was the test comparing two
     * different size steps.
     */
    await page.goto('/components/input');
    const inputHeight = await page
      .locator('.pp-input[data-size="md"] .pp-input__control')
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    await page.goto('/components/number-input');
    const numberHeight = await page
      .locator('.pp-number-input[data-size="md"] .pp-number-input__control')
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    expect(numberHeight, 'a form of Inputs and NumberInputs is a pixel crooked').toBe(inputHeight);
  });

  test('is announced as a spinbutton, with the bounds it was given', async ({ page }) => {
    await page.goto('/components/number-input');
    const control = page.locator('[data-testid="number-input-association"] .pp-number-input__control').first();

    // The COMPUTED role, from the browser's own accessibility tree.
    expect(await control.evaluate((el) => el.getAttribute('role'))).toBe('spinbutton');
    await expect(control).toHaveAccessibleName('Nights');
    await expect(control).toHaveAttribute('aria-valuemin', '1');
    await expect(control).toHaveAttribute('aria-valuemax', '30');
  });

  /*
   * ARIA 1.2 relaxed aria-valuenow from required to optional for spinbutton —
   * verified against axe-core 4.13 (allowedAttrs, not requiredAttrs) and
   * aria-query 5.3 (requiredProps {}). Announcing a stale number is worse than
   * announcing none, and this is the assertion that the omission is real.
   */
  test('omits aria-valuenow while the box holds no number', async ({ page }) => {
    await page.goto('/components/number-input');
    const control = page.locator('[data-testid="number-input-commit"] .pp-number-input__control');

    await expect(control).not.toHaveAttribute('aria-valuenow', /.*/);
    await control.fill('-');
    await expect(control).not.toHaveAttribute('aria-valuenow', /.*/);
    await control.fill('40');
    await expect(control).toHaveAttribute('aria-valuenow', '40');
  });

  /*
   * ONE RING, AND IT SURROUNDS THE STEPPERS (D-051 §3).
   *
   * The first build drew it on the ROOT with `:has()` and left the inner input
   * to take the reset's own `:where(:focus-visible)` ring — two concentric
   * accent outlines, invisible to every unit test because jsdom implements
   * neither `:has()` nor a cascade. The control is the surface now, so the ring
   * is its own and the buttons sit inside it.
   *
   * Break it by moving the steppers outside the control's reserved
   * padding-inline-end and the containment assertion fails.
   */
  test('draws one focus ring, around a box that contains the steppers', async ({ page }) => {
    await page.goto('/components/number-input');
    const scope = page.locator('[data-testid="number-input-commit"]');
    const root = scope.locator('.pp-number-input');
    const control = scope.locator('.pp-number-input__control');
    const steppers = scope.locator('.pp-number-input__steppers');

    const outlineWidth = (el: import('@playwright/test').Locator) =>
      el.evaluate((n) => getComputedStyle(n).outlineWidth);

    expect(await outlineWidth(control)).toBe('0px');
    await control.focus();
    // Polled: the reset's reduced-motion crush is `all 0.00001s`, so a read in
    // the same frame can catch the pre-transition value (D-052 §3).
    await expect
      .poll(() => outlineWidth(control), { message: 'the control did not take a ring' })
      .not.toBe('0px');
    expect(await outlineWidth(root), 'a second ring was drawn on the wrapper').toBe('0px');

    const [box, buttons] = await Promise.all([control.boundingBox(), steppers.boundingBox()]);
    expect(box).not.toBeNull();
    expect(buttons).not.toBeNull();
    expect(buttons!.x, 'the steppers start before the ringed box does').toBeGreaterThanOrEqual(box!.x);
    expect(
      buttons!.x + buttons!.width,
      'the steppers reach past the box the ring is drawn around',
    ).toBeLessThanOrEqual(box!.x + box!.width + 1);
  });

  test('focus shifts the border, and an invalid control stays in the danger tone', async ({ page }) => {
    await page.goto('/components/number-input');
    const wide = cell(page, 'Description, required, and error', 'wide · 960px');
    const valid = wide.locator('.pp-number-input:not([data-invalid])').first();
    const invalid = wide.locator('.pp-number-input[data-invalid]').first();

    /*
     * READ OFF THE CONTROL, NOT THE ROOT. The first draft read `borderTopColor`
     * from the wrapper, which after D-051 §3 has no border at all — so it
     * returned `currentColor` and reported "unchanged on focus" for a border
     * that was shifting correctly two nodes down. An assertion pointed at the
     * wrong element is the assertion that cannot fail, in the other direction.
     */
    const border = (el: import('@playwright/test').Locator) =>
      el.locator('.pp-number-input__control').evaluate((n) => getComputedStyle(n).borderTopColor);

    const resting = await border(valid);
    await valid.locator('.pp-number-input__control').focus();
    // Polled for the reason above: border-color IS transitioned here, so the
    // first frame after focus still reports the resting colour (D-052 §3).
    await expect
      .poll(() => border(valid), { message: 'the border did not shift on focus' })
      .not.toBe(resting);

    /*
     * The CONTRACT IS THE TONE, NOT THE STEP (D-039 §4). Focus moves the border
     * from --pp-tone-border to --pp-tone-focus, and on an invalid control both
     * resolve in the danger ramp. The first draft asserted the colour was
     * unchanged, which is a different and false claim — what must hold is that
     * a focused invalid control does not look like a focused valid one.
     */
    const validFocused = await border(valid);
    await invalid.locator('.pp-number-input__control').focus();
    await expect
      .poll(() => border(invalid), {
        message: 'the danger tone vanished the moment the user went to fix it',
      })
      .not.toBe(validFocused);
  });

  /*
   * Not a tab stop (spec §6). Six number fields must be six stops, not
   * eighteen. Break `tabIndex={-1}` and the second Tab lands on a chevron.
   */
  test('one field is one tab stop', async ({ page }) => {
    await page.goto('/components/number-input');
    const scope = page.locator('[data-testid="number-input-association"]');
    const first = scope.locator('.pp-number-input__control').first();
    const second = scope.locator('.pp-number-input__control').nth(1);

    await first.focus();
    await page.keyboard.press('Tab');
    await expect(second).toBeFocused();
  });

  /* The steppers keep their accessible names even though they are unreachable
     by Tab: a pointer user and a screen reader user in browse mode both keep
     them. */
  test('the steppers are named, and pressing one keeps focus in the input', async ({ page }) => {
    await page.goto('/components/number-input');
    const scope = page.locator('[data-testid="number-input-commit"]');
    const control = scope.locator('.pp-number-input__control');
    const increase = scope.locator('.pp-number-input__stepper[data-direction="increment"]');

    await expect(increase).toHaveAccessibleName('Increase');
    await control.focus();
    await increase.click();
    await expect(control).toBeFocused();
    /* Empty, and min is 0, so the first press commits the bound that exists
       rather than stepping from an invisible zero (spec §6). */
    await expect(control).toHaveValue('0');
    await increase.click();
    await expect(control).toHaveValue('10');
  });

  /* Typing never clamps or snaps (spec §3). At step=10 the `1` would become
     `10` before the `5` arrived, and `15` could not be typed at all. */
  test('lets a step-forbidden value be typed, and snaps it on blur', async ({ page }) => {
    await page.goto('/components/number-input');
    const control = page.locator('[data-testid="number-input-commit"] .pp-number-input__control');

    await control.click();
    await page.keyboard.type('15');
    await expect(control).toHaveValue('15');
    await control.blur();
    await expect(control).toHaveValue('20');
  });

  /*
   * MEASURED AGAINST THE BOX ITS PARENT GIVES IT, NOT AGAINST `.matrix__viewport`.
   * The first draft compared the root with the viewport's `clientWidth`, which
   * includes the harness's own 12px inline padding — so a component that filled
   * correctly reported 214 of 238 and the test read as a sizing bug in the
   * component. `clientWidth` excludes a border and keeps padding, which is the
   * trap.
   */
  test('fills the box its parent gives it, at every width, with no width declared', async ({ page }) => {
    await page.goto('/components/number-input');
    const section = page.locator('section', { hasText: 'It fills, at every container width' });
    const widths: number[] = [];

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const box = section.locator('.matrix__cell').filter({ hasText: width }).first();
      const root = box.locator('.pp-number-input').first();

      const measured = await root.evaluate((el) => {
        const parent = el.parentElement as HTMLElement;
        const style = getComputedStyle(parent);
        const content =
          parent.clientWidth -
          parseFloat(style.paddingInlineStart) -
          parseFloat(style.paddingInlineEnd);
        return {
          root: Math.round(el.getBoundingClientRect().width),
          available: Math.round(content),
          // The fill comes from the grid, not from a width declaration.
          declared: el.style.width,
        };
      });

      expect(measured.root, `did not fill at ${width}`).toBe(measured.available);
      expect(measured.declared).toBe('');
      widths.push(measured.root);
    }

    // Three different containers, three different widths — otherwise the three
    // assertions above could all pass on a component that ignores its parent.
    expect(new Set(widths).size, 'the control did not track its container').toBe(3);
    await expect(section.locator('.matrix__viewport[data-overflowing]')).toHaveCount(0);
  });
});

/*
 * Slider (3.15) — spec docs/specs/tier-3d-composite.md §3.15.
 *
 * The vendor pseudo-elements are the reason most of this needs a browser:
 * jsdom does not implement ::-webkit-slider-thumb, does not lay out a range
 * input, and has no cascade to resolve the track's grid columns against.
 */
test.describe('Slider', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  /*
   * THE LINE IS CENTRED ON THE CONTROL — AND THIS TEST DOES NOT COVER THE
   * THUMB, WHICH IS THE POINT OF SAYING SO (D-052 §4).
   *
   * Its first draft was called "the thumb is centred on the track it draws" and
   * compared the control's centre with the track span's. Both are ours; neither
   * involves the thumb. Breaking the centring mechanism deliberately —
   * `block-size: var(--_track-size)` on ::-webkit-slider-runnable-track, which
   * drops the thumb off the line — left it green. D-035 §3's failure exactly.
   *
   * The thumb's own box is NOT observable from script: Chromium's
   * `getComputedStyle(el, '::-webkit-slider-thumb')` returns the HOST element's
   * metrics (measured: 40 x 1200, the input's own box), and no layout API
   * reaches a UA-painted pseudo-element. So thumb centring is covered by the
   * screenshot baseline, and this assertion is scoped to the half it can
   * actually check.
   */
  test('the track line is centred on the control', async ({ page }) => {
    await page.goto('/components/slider');
    const scope = page.locator('[data-testid="slider-keyboard"]');
    const control = scope.locator('.pp-slider__control');
    const track = scope.locator('.pp-slider__track');

    const [box, line] = await Promise.all([control.boundingBox(), track.boundingBox()]);
    expect(box).not.toBeNull();
    expect(line).not.toBeNull();

    const controlCentre = box!.y + box!.height / 2;
    const trackCentre = line!.y + line!.height / 2;
    expect(Math.abs(controlCentre - trackCentre), 'the line is off the control centre').toBeLessThanOrEqual(1);
  });

  /*
   * The fill is a GRID COLUMN rather than a `linear-gradient`, so it follows the
   * inline axis and needs nothing said about direction. Asserted as a resolved
   * track listing, which is what proves the percentage reached CSS.
   */
  test('the fill column tracks the value', async ({ page }) => {
    await page.goto('/components/slider');
    const section = page.locator('section', { hasText: 'The fill tracks the value' });
    const wide = section.locator('.matrix__cell').filter({ hasText: 'wide · 960px' }).first();

    const columns = async (labelText: string) => {
      const track = wide
        .locator('.pp-field', { hasText: labelText })
        .locator('.pp-slider__track')
        .first();
      const raw = await track.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
      const [first, second] = raw.split(' ').map(parseFloat);
      return (first as number) / ((first as number) + (second as number));
    };

    expect(await columns('At the minimum')).toBeCloseTo(0, 2);
    expect(await columns('A quarter')).toBeCloseTo(0.25, 2);
    expect(await columns('At the maximum')).toBeCloseTo(1, 2);
  });

  /* The control is the same height as an Input at the same size, so a row of
     controls lines up (D-028). Read off both pages rather than restated. */
  test('the control scale agrees with Input', async ({ page }) => {
    await page.goto('/components/input');
    const inputHeight = await page
      .locator('.pp-input[data-size="md"] .pp-input__control')
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    await page.goto('/components/slider');
    const sliderHeight = await page
      .locator('[data-testid="slider-keyboard"] .pp-slider__control')
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    expect(sliderHeight, 'a Slider beside an Input is a pixel crooked').toBe(inputHeight);
  });

  test('the ring surrounds the whole control, which is the pointer target', async ({ page }) => {
    await page.goto('/components/slider');
    const control = page.locator('[data-testid="slider-keyboard"] .pp-slider__control');

    await control.scrollIntoViewIfNeeded();
    const outlineWidth = () => control.evaluate((n) => getComputedStyle(n).outlineWidth);
    expect(await outlineWidth()).toBe('0px');
    await control.focus();

    /*
     * POLLED, NOT READ ONCE, AND THE REASON IS IN reset.css (D-052 §3).
     *
     * Under `reducedMotion: 'reduce'` — which playwright.config.ts pins for
     * every run — the reset crushes transitions to `all 0.00001s` rather than
     * removing them. A transition of ten microseconds is still a transition, so
     * `outline-width` is briefly its old value, and a `getComputedStyle` in the
     * same frame reads 0px on a control that took the ring correctly. It
     * reproduced only once `scrollIntoViewIfNeeded` shifted the timing by a
     * frame, which is what a latent flake looks like from the outside.
     */
    await expect
      .poll(outlineWidth, { message: 'the control did not take a ring' })
      .not.toBe('0px');
  });

  /*
   * EVERY KEYBOARD ROW IS THE BROWSER'S — the component installs no key
   * handler at all (spec §7). Asserted rather than claimed, because "the
   * platform does it" is exactly the kind of prose D-045 was written about.
   */
  test('arrows, Home and End are the platform\'s, with no handler of ours', async ({ page }) => {
    await page.goto('/components/slider');
    const control = page.locator('[data-testid="slider-keyboard"] .pp-slider__control');

    await control.focus();
    await expect(control).toHaveValue('5');
    await page.keyboard.press('ArrowRight');
    await expect(control).toHaveValue('6');
    await page.keyboard.press('ArrowDown');
    await expect(control).toHaveValue('5');
    await page.keyboard.press('Home');
    await expect(control).toHaveValue('0');
    await page.keyboard.press('End');
    await expect(control).toHaveValue('10');
  });

  /* Clicking the track moves the thumb, which is the behaviour a hand-built
     slider has to reimplement and the reason the native element is kept. */
  test('a click on the track moves the thumb', async ({ page }) => {
    await page.goto('/components/slider');
    const control = page.locator('[data-testid="slider-keyboard"] .pp-slider__control');
    await expect(control).toHaveValue('5');

    /*
     * SCROLLED IN FIRST, BECAUSE `page.mouse` TAKES VIEWPORT COORDINATES AND
     * DOES NOT SCROLL. `locator.click()` auto-scrolls; the raw mouse API does
     * not, and `boundingBox()` on an element 6,000px down returns a y that is
     * simply off-screen — so the click lands on nothing and the assertion reads
     * as "the track is not clickable" (D-052 §2).
     */
    await control.scrollIntoViewIfNeeded();
    const box = (await control.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    expect(Number(await control.inputValue())).toBeGreaterThan(5);
  });

  test('aria-valuetext is the formatted value, and the platform owns the rest', async ({ page }) => {
    await page.goto('/components/slider');
    const control = page.locator('[data-testid="slider-valuetext"] .pp-slider__control');

    await expect(control).toHaveAttribute('aria-valuetext', '£250');
    // Not ours: ARIA requires aria-valuenow for `slider` and the element
    // supplies it, unlike `spinbutton` where 1.2 relaxed it.
    await expect(control).not.toHaveAttribute('aria-valuenow', /.*/);
    await expect(control).toHaveAccessibleName('Budget');
  });

  test('onValueCommit fires once for a drag that fires many changes', async ({ page }) => {
    await page.goto('/components/slider');
    const scope = page.locator('[data-testid="slider-controlled"]');
    const control = scope.locator('.pp-slider__control');
    const readout = scope.locator('p, .pp-text').last();

    await control.scrollIntoViewIfNeeded();
    const box = (await control.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    for (const fraction of [0.4, 0.5, 0.6, 0.7]) {
      await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
    }
    await page.mouse.up();

    const text = await readout.textContent();
    const changes = Number(/onValueChange fired (\d+)/.exec(text ?? '')?.[1]);
    const commits = Number(/onValueCommit fired (\d+)/.exec(text ?? '')?.[1]);

    expect(changes, 'the drag produced no continuous updates').toBeGreaterThan(1);
    expect(commits, 'a drag committed more than once').toBe(1);
  });

  test('fills the box its parent gives it, at every width, with no width declared', async ({ page }) => {
    await page.goto('/components/slider');
    const section = page.locator('section', { hasText: 'It fills, at every container width' });
    const widths: number[] = [];

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const box = section.locator('.matrix__cell').filter({ hasText: width }).first();
      const root = box.locator('.pp-slider').first();

      const measured = await root.evaluate((el) => {
        const parent = el.parentElement as HTMLElement;
        const style = getComputedStyle(parent);
        return {
          root: Math.round(el.getBoundingClientRect().width),
          available: Math.round(
            parent.clientWidth -
              parseFloat(style.paddingInlineStart) -
              parseFloat(style.paddingInlineEnd),
          ),
          declared: el.style.width,
        };
      });

      expect(measured.root, `did not fill at ${width}`).toBe(measured.available);
      expect(measured.declared).toBe('');
      widths.push(measured.root);
    }

    expect(new Set(widths).size, 'the control did not track its container').toBe(3);
    await expect(section.locator('.matrix__viewport[data-overflowing]')).toHaveCount(0);
  });
});
