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

    // Same fill by design; the text and border are what tell them apart.
    expect(disabled.color).not.toBe(readOnly.color);
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
