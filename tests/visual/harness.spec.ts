import { expect, test } from '@playwright/test';

/**
 * These assertions verify the HARNESS, not a component. If overflow detection
 * is broken, every sizing-contract result the playground ever reports is
 * meaningless, so it is checked before it is trusted.
 */
/**
 * Whether a focus ring is actually PAINTED on an element.
 *
 * `outline-width` alone cannot answer that, and believing it does is what put
 * two assertions in this file on the wrong side of a Chromium version. CSS says
 * the computed `outline-width` of an element whose `outline-style` is `none` is
 * zero; Chromium reports the SPECIFIED width instead — `medium`, i.e. `3px` —
 * so `expect(outlineWidth).toBe('0px')` on an unfocused control passes on one
 * build and fails on another with nothing wrong with the component. It passed
 * locally and failed in CI for exactly that reason, on `NumberInput` and
 * `Slider`, and on `main` as well as on the branch.
 *
 * `outline-style` is the property that says whether a line is drawn, so that is
 * what "no ring" is asserted on. The width is still checked where a ring IS
 * expected, because a solid ring of zero width is D-052 §3's impossible
 * combination and the thing that reads as a pass.
 */
async function ringOf(el: import('@playwright/test').Locator) {
  return el.evaluate((n) => {
    const style = getComputedStyle(n);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
}

/**
 * Picks a theme through the playground's own switcher (D-063). The Matrix
 * renders one theme at a time, so an assertion that compares themes switches
 * here rather than reading two columns. Waits for `<html>` to carry the
 * attribute, which is what the library's tokens resolve against.
 */
async function setTheme(page: import('@playwright/test').Page, theme: 'system' | 'light' | 'dark') {
  const label = theme.charAt(0).toUpperCase() + theme.slice(1);
  await page.getByTestId('theme-switcher').getByRole('button', { name: label }).click();
  const html = page.locator('html');
  if (theme === 'system') await expect(html).not.toHaveAttribute('data-pp-theme', /.*/);
  else await expect(html).toHaveAttribute('data-pp-theme', theme);
}

/**
 * The bounding box of a floating-ui panel, once it is PLACED and STILL.
 *
 * Radix parks a panel off-screen (`translate(0, -200%)`) until floating-ui has
 * computed a position, and `toBeVisible` is satisfied by an off-screen box; a
 * read in that window is (0, 0), which is exactly what one CI run reported
 * for the RTL half of both the Popover and the Tooltip side tests while the
 * LTR half passed (D-066 §3). Nothing in these tests places a panel at the
 * origin, so a box is trusted only once its x and y are both positive and it
 * has not moved between two reads a frame apart.
 */
async function placedBox(el: import('@playwright/test').Locator) {
  await expect(el).toBeVisible();
  let last: { x: number; y: number; width: number; height: number } | null = null;
  await expect
    .poll(
      async () => {
        const box = await el.boundingBox();
        const settled = !!box && !!last && box.x > 0 && box.y > 0 && box.x === last.x && box.y === last.y;
        last = box;
        return settled;
      },
      { message: 'the panel never settled at a placed position', intervals: [32, 32, 64, 128, 256, 512] },
    )
    .toBe(true);
  return last!;
}

test.describe('harness self-check', () => {
  test('a fill component is never flagged as overflowing', async ({ page }) => {
    await page.goto('/harness');

    const cells = page.locator('section', { hasText: 'Well-behaved' }).locator('.matrix__viewport');
    await expect(cells).toHaveCount(3); // 3 widths, in the theme the switcher picked (D-063)

    for (const cell of await cells.all()) {
      await expect(cell).not.toHaveAttribute('data-overflowing', /.*/);
    }
  });

  test('a component that sets its own width is caught at narrow widths', async ({ page }) => {
    await page.goto('/harness');

    const broken = page.locator('section', { hasText: 'Deliberately broken' });
    const cells = broken.locator('.matrix__viewport');
    await expect(cells).toHaveCount(3);

    // 720px content in 240px and 480px cells overflows; the 960px cell does not.
    const flagged = broken.locator('.matrix__viewport[data-overflowing]');
    await expect(flagged).toHaveCount(2); // 240 and 480 overflow; 960 does not
    await expect(broken.locator('.matrix__overflow').first()).toBeVisible();
  });

  test('the theme switcher changes the resolved background, and the choice survives a reload', async ({
    page,
  }) => {
    await page.goto('/harness');
    const bg = () => page.locator('.matrix').first().evaluate((el) => getComputedStyle(el).backgroundColor);

    await setTheme(page, 'light');
    const light = await bg();
    await setTheme(page, 'dark');
    const dark = await bg();
    // Regression guard for D-010 and D-011: a token that resolved once at
    // :root and inherited as a colour would read the same in both.
    expect(light).not.toBe(dark);

    // Applied before first paint by the layout's script, from the stored choice.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-pp-theme', 'dark');
    expect(await bg()).toBe(dark);

    await setTheme(page, 'system');
    await page.reload();
    await expect(page.locator('html')).not.toHaveAttribute('data-pp-theme', /.*/);
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

    // Three cells, one per width, all 21/9. Different sizes, one shape,
    // which is the component choosing a shape and never a size (D-063).
    expect(ratios).toHaveLength(3);
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
     `name`: the harness renders its subtree three times, so a shared name would
     make three cells one group. */
  test('three copies of a group in the Matrix are three groups', async ({ page }) => {
    await page.goto('/components/radio');
    const section = page.locator('section', { hasText: 'Spacing is how an undersized target passes' });

    await expect(section.locator('.pp-radio-group')).toHaveCount(3);
    await expect(section.locator('input:checked')).toHaveCount(3);
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
      for (const theme of ['light', 'dark'] as const) {
        /* One theme at a time (D-063): switch, then read the same cell. */
        await setTheme(page, theme);
        const scope = page
          .locator('section', { hasText: 'The thumb is the state indicator' })
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

    expect((await ringOf(control)).style, 'an unfocused control is already ringed').toBe('none');
    await control.focus();
    // Polled: the reset's reduced-motion crush is `all 0.00001s`, so a read in
    // the same frame can catch the pre-transition value (D-052 §3).
    await expect
      .poll(async () => (await ringOf(control)).width, {
        message: 'the control did not take a ring',
      })
      .toBeGreaterThan(0);
    expect((await ringOf(control)).style, 'a zero-width solid ring is not a ring').toBe('solid');
    expect((await ringOf(root)).style, 'a second ring was drawn on the wrapper').toBe('none');

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
    expect((await ringOf(control)).style, 'an unfocused control is already ringed').toBe('none');
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
      .poll(async () => (await ringOf(control)).width, {
        message: 'the control did not take a ring',
      })
      .toBeGreaterThan(0);
    expect((await ringOf(control)).style, 'a zero-width solid ring is not a ring').toBe('solid');
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

/*
 * Alert (5.2). The first component of Tier 5, and the first whose own surface
 * is a tinted step 3 with other people's controls sitting on it.
 *
 * Three of the assertions below exist because of a ruling rather than a
 * feature. Spec §1 rejected a `solid` variant after measuring a plain Button's
 * text at 1.04:1 against --pp-tone-solid, so the legibility of a caller's
 * control against the alert's fill is asserted here rather than trusted — from
 * the colours the browser actually resolved, which is the only place that
 * argument can be checked. The icon sits on the first line by construction
 * rather than by a negative margin (RULES §2), which is a claim about layout
 * and therefore invisible to jsdom. And the root is flex rather than the
 * three-column grid the spec drew, because a grid gaps between TRACKS — an
 * alert with no icon would pay a column gap for the empty track it left
 * behind — so there is an assertion that measures exactly that.
 */
test.describe('Alert', () => {
  const cell = (page: import('@playwright/test').Page, section: string, width: string) =>
    page
      .locator('section', { hasText: section })
      .locator('.matrix__cell')
      .filter({ hasText: width })
      .first();

  test('fills the box its parent gives it, at every width, with no width declared', async ({ page }) => {
    await page.goto('/components/alert');
    const section = page.locator('section', { hasText: 'fill — it takes the column it is given' });
    const widths: number[] = [];

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const measured = await section
        .locator('.matrix__cell')
        .filter({ hasText: width })
        .first()
        .locator('.pp-alert')
        .first()
        .evaluate((el) => {
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

    expect(new Set(widths).size, 'the box did not track its container').toBe(3);
    await expect(section.locator('.matrix__viewport[data-overflowing]')).toHaveCount(0);
  });

  test('the icon is centred on the first line of text, with no negative margin', async ({ page }) => {
    await page.goto('/components/alert');
    const alert = cell(page, 'Anatomy', 'wide · 960px')
      .locator('.pp-alert')
      .filter({ hasText: 'Payment method expires soon' })
      .first();

    const measured = await alert.evaluate((el) => {
      const icon = el.querySelector('.pp-alert__icon') as HTMLElement;
      const title = el.querySelector('.pp-alert__title') as HTMLElement;
      /* The FIRST LINE BOX, not the title element: on a narrow container the
         title wraps and the element's centre stops being the line's centre.
         A Range over the text node reports the line boxes themselves. */
      const range = document.createRange();
      range.selectNodeContents(title);
      const line = range.getClientRects()[0] as DOMRect;
      const box = icon.getBoundingClientRect();
      return {
        iconCentre: box.top + box.height / 2,
        lineCentre: line.top + line.height / 2,
        // RULES §2 bans the usual fix. If this is ever non-zero the alignment
        // came from a nudge rather than from the box being one line box tall.
        marginBlockStart: getComputedStyle(icon).marginBlockStart,
      };
    });

    expect(Math.abs(measured.iconCentre - measured.lineCentre)).toBeLessThan(1);
    expect(measured.marginBlockStart).toBe('0px');
  });

  test('an alert with no icon pays no gap for the slot it does not have', async ({ page }) => {
    await page.goto('/components/alert');
    const anatomy = cell(page, 'Anatomy', 'wide · 960px');

    const inset = (text: string) =>
      anatomy
        .locator('.pp-alert')
        .filter({ hasText: text })
        .first()
        .evaluate((el) => {
          const content = el.querySelector('.pp-alert__content') as HTMLElement;
          const style = getComputedStyle(el);
          return (
            content.getBoundingClientRect().left -
            el.getBoundingClientRect().left -
            parseFloat(style.borderInlineStartWidth) -
            parseFloat(style.paddingInlineStart)
          );
        });

    /* THE REASON THE ROOT IS FLEX AND NOT A GRID. A three-column grid gaps
       between tracks whether or not anything is in them, so this alert would
       start one --pp-alert-gap in from the padding edge with nothing to show
       for it. Flex gaps only between items that exist. */
    expect(await inset('Body only'), 'the absent icon left a gap behind').toBeCloseTo(0, 0);

    // ...and the one WITH an icon is inset by exactly the icon plus the gap,
    // which is what says the measurement above is reading the right thing.
    const withIcon = await inset('Payment method expires soon');
    const iconWidth = await anatomy
      .locator('.pp-alert')
      .filter({ hasText: 'Payment method expires soon' })
      .first()
      .evaluate((el) => {
        const icon = el.querySelector('.pp-alert__icon') as HTMLElement;
        return icon.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap);
      });
    expect(withIcon).toBeCloseTo(iconWidth, 0);
  });

  test("a caller's plain Button is legible against the alert's fill", async ({ page }) => {
    await page.goto('/components/alert');
    const alert = cell(page, 'Arbitrary children', 'wide · 960px').locator('.pp-alert').first();

    const ratio = await alert.evaluate((root) => {
      /* Painted and read back rather than parsed, for the reason the Switch
         helper above gives: getComputedStyle returns the colour in the space
         the token was authored in, and one pixel of image data is always sRGB
         bytes. */
      const srgb = (color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((v) => v / 255);
      };
      const luminance = (c: number[]) => {
        const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
      };
      const button = root.querySelector('.pp-button[data-variant="plain"]') as HTMLElement;
      const la = luminance(srgb(getComputedStyle(button).color));
      const lb = luminance(srgb(getComputedStyle(root).backgroundColor));
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    });

    /* THE ASSERTION THAT WOULD HAVE CAUGHT A `solid` VARIANT (spec §1).
       An Alert is the only component whose children are arbitrary, so the tone
       context inherits into them — and a plain Button's text resolves to
       --pp-tone-text, which is 1.04:1 on --pp-tone-solid and 4.59:1 on the
       --pp-tone-bg this component actually uses. Nothing in `lint:contrast`
       pairs a tone step with a caller's control, so this is the only place the
       ruling is checked. */
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('the focus ring inside an alert is the one library-wide ring', async ({ page }) => {
    await page.goto('/components/alert');
    /*
     * THE DANGER ALERT, NOT THE FIRST ONE ON THE PAGE, AND THAT IS THE WHOLE
     * TEST. The first dismissible alert is `accent`, whose --pp-tone-focus IS
     * --pp-palette-accent-focus — the same value --pp-color-focus-ring resolves
     * to. Pointed there, this assertion compared a colour with itself: giving
     * the ring `var(--pp-tone-focus)` changed nothing and the test stayed
     * green. Found by running the break, which is the only way this kind of
     * thing is ever found (D-009). `danger` is a hue where the two differ.
     */
    const dismiss = page
      .locator('.pp-alert[data-pp-tone="danger"] .pp-alert__dismiss')
      .first();
    await dismiss.scrollIntoViewIfNeeded();
    await dismiss.focus();

    const ring = await dismiss.evaluate((el) => {
      const srgb = (color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
      };
      const alert = el.closest('.pp-alert') as HTMLElement;
      const style = getComputedStyle(el);
      return {
        declared: srgb(getComputedStyle(alert).getPropertyValue('--pp-color-focus-ring').trim()),
        drawn: srgb(style.outlineColor),
        // READ ALONGSIDE THE COLOUR, because `outline-width` is reported for an
        // element whose `outline-style` is `none` too, and "solid, 0px" is the
        // impossible combination D-052 §3 spent a debugging session on.
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });

    /* D-029: one ring colour, library-wide. An alert is the first component
       with a tinted surface of its own, so it is the first place anyone would
       be tempted to give the ring a tone — and `lint:contrast` asserts exactly
       one ring pairing, so a second colour here would be an unverified one.
       The ring's contrast AGAINST this surface is a known token-layer gap
       (2.74–2.77 light, 2.54–2.57 dark); it is recorded in spec §9 and
       ROADMAP's Current state rather than papered over here. */
    expect(ring.drawn).toEqual(ring.declared);
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThan(0);
  });

  test('a string with no break opportunity breaks rather than escaping the box', async ({ page }) => {
    await page.goto('/components/alert');
    const section = page.locator('section', { hasText: 'min-inline-size: 0' });
    const narrow = section.locator('.matrix__cell').filter({ hasText: 'narrow · 240px' }).first();

    const measured = await narrow.locator('.pp-alert').first().evaluate((el) => {
      const parent = el.parentElement as HTMLElement;
      const style = getComputedStyle(parent);
      return {
        root: Math.round(el.getBoundingClientRect().width),
        available: Math.round(
          parent.clientWidth -
            parseFloat(style.paddingInlineStart) -
            parseFloat(style.paddingInlineEnd),
        ),
      };
    });

    /*
     * WHAT EACH HALF ACTUALLY PROVES, because they were written believing the
     * same thing and they do not check the same thing.
     *
     * The box measurement passed on the very first run, while the harness
     * flagged four of six cells: `min-inline-size: 0` sizes the BOX and the
     * glyphs went on painting past its edges regardless. `overflow-wrap:
     * anywhere` is what makes the second expectation true, and breaking it is
     * what turns this test red.
     *
     * `min-inline-size: 0` itself is asserted by NOTHING here, and the break
     * check says so plainly — removing it changes not one of these numbers.
     * With `overflow-wrap: anywhere` the text's min-content size is one
     * character, and every alert on the page sits in a COLUMN flex container,
     * where the automatic minimum size does not apply on the inline axis
     * anyway. It stays because RULES §1 defines `fill` as including it, and it
     * earns its keep in the arrangements this page does not contain — a row
     * flex item, a grid cell, content that cannot break. Claiming otherwise
     * would be the D-051 §4 shape: an assertion that reads like a guarantee
     * and checks nothing.
     */
    expect(measured.root).toBe(measured.available);
    await expect(section.locator('.matrix__viewport[data-overflowing]')).toHaveCount(0);
  });
});

/*
 * 3.16 `Form`. The describe title is deliberately not the bare word "Form":
 * `-g` is a case-insensitive substring (D-049 §6), and "form" is inside
 * "transform", "platform" and "formatted" in this file.
 */
test.describe('Form summary and submission', () => {
  const demo = (page: import('@playwright/test').Page, name: string) =>
    page.locator(`form[data-demo="${name}"]`);

  test('fills the box its parent gives it, at every width, with no width declared', async ({ page }) => {
    await page.goto('/components/form');
    const section = page.locator('section', { hasText: 'fill — the summary, the fields, the gap' }).first();
    const widths: number[] = [];

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const measured = await section
        .locator('.matrix__cell')
        .filter({ hasText: width })
        .first()
        .locator('.pp-form')
        .evaluate((el) => {
          const parent = el.parentElement as HTMLElement;
          const style = getComputedStyle(parent);
          return {
            root: Math.round(el.getBoundingClientRect().width),
            available: Math.round(
              parent.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd),
            ),
            declared: (el as HTMLElement).style.width,
          };
        });
      expect(measured.root, `did not fill at ${width}`).toBe(measured.available);
      expect(measured.declared).toBe('');
      widths.push(measured.root);
    }

    expect(new Set(widths).size, 'the box did not track its container').toBe(3);
    await expect(section.locator('.matrix__viewport[data-overflowing]')).toHaveCount(0);
  });

  test('the summary is first, and the gap between children is --pp-space-5', async ({ page }) => {
    await page.goto('/components/form');
    const form = page
      .locator('section', { hasText: 'fill — the summary, the fields, the gap' })
      .first()
      .locator('.matrix__cell')
      .filter({ hasText: 'wide · 960px' })
      .first()
      .locator('.pp-form');

    const measured = await form.evaluate((el) => {
      const [first, second] = Array.from(el.children) as HTMLElement[];
      const probe = document.createElement('div');
      probe.style.blockSize = 'var(--pp-space-5)';
      el.appendChild(probe);
      const space5 = probe.getBoundingClientRect().height;
      probe.remove();
      return {
        firstIsSummary: first!.classList.contains('pp-form__summary'),
        gap: second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom,
        space5,
      };
    });

    expect(measured.firstIsSummary).toBe(true);
    // Proves the shared scale reached the form: a missing data-pp-gap, or a
    // gap read from the wrong property, reads as 0 here.
    expect(measured.space5).toBeGreaterThan(0);
    expect(measured.gap).toBeCloseTo(measured.space5, 0);
  });

  test('the summary links are in the danger tone, the pairing Alert asserts', async ({ page }) => {
    await page.goto('/components/form');
    const summary = page.locator('.pp-form__summary').first();
    const colours = await summary.evaluate((el) => ({
      link: getComputedStyle(el.querySelector('.pp-form__error-link') as Element).color,
      body: getComputedStyle(el.querySelector('.pp-alert__body') as Element).color,
    }));
    /* Link's own default is accent. Equal to the body text means the link is
       danger's step 11 on danger's step 3 — Alert's body pairing, asserted per
       hue by lint:contrast — and not a cross-hue pairing nothing checks. */
    expect(colours.link).toBe(colours.body);
  });

  test('a keyboard submit that fails moves focus to the summary', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'signup');
    await form.getByRole('textbox', { name: 'Name', exact: true }).focus();
    await page.keyboard.press('Enter');

    const summary = form.locator('.pp-form__summary');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveCount(3);
  });

  test('following a link focuses the control with its label in view', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'signup');
    await form.getByRole('button', { name: 'Create account' }).click();
    await form.getByRole('link', { name: /email address/ }).click();

    /* getByRole, not getByLabel: a required Field's label text includes its
       aria-hidden asterisk, so an exact label match finds nothing. */
    await expect(form.getByRole('textbox', { name: 'Email', exact: true })).toBeFocused();
    const labelTop = await form
      .locator('label', { hasText: 'Email' })
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    // Spec §4: fragment navigation puts the CONTROL at the top and the label
    // above the fold. The field is scrolled instead.
    expect(labelTop).toBeGreaterThanOrEqual(0);
    expect(labelTop).toBeLessThan(page.viewportSize()!.height);
  });

  test('a group target focuses a radio inside it', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'signup');
    await form.getByRole('button', { name: 'Create account' }).click();
    await form.getByRole('link', { name: 'Choose a plan' }).click();
    await expect(form.getByRole('radio', { name: 'Free' })).toBeFocused();
  });

  test('an error set on blur does not move focus', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'signup');
    await form.getByRole('textbox', { name: 'Nickname' }).fill('a');
    await form.getByRole('textbox', { name: 'Email', exact: true }).click();

    await expect(form.locator('.pp-form__summary')).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Email', exact: true })).toBeFocused();
  });

  test('pending blocks a second submit, and focus waits for the slow result', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'signup');
    await form.getByLabel('Slow server').check();
    await form.getByRole('textbox', { name: 'Name', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(form).toHaveAttribute('data-pending');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    await expect(form.locator('.pp-form__summary')).toBeFocused();
    await expect(form.getByTestId('submissions')).toHaveText('Submissions: 1');
  });

  test('pending blocks a second React action', async ({ page }) => {
    await page.goto('/components/form');
    const form = demo(page, 'action');
    await form.getByLabel('Code').fill('0000');
    await page.keyboard.press('Enter');
    await expect(form).toHaveAttribute('data-pending');
    await page.keyboard.press('Enter');

    await expect(form.locator('.pp-form__summary')).toBeFocused();
    await expect(form.getByTestId('action-calls')).toHaveText('Action calls: 1');
  });

  test('the summary link works with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/components/form');
    const form = page.locator('form[data-demo="roundtrip"]');

    await expect(form.locator('.pp-form__summary')).toBeVisible();
    await form.getByRole('link', { name: 'Enter an email address' }).click();
    // No handler ran; the fragment did the work.
    expect(new URL(page.url()).hash).toBe('#roundtrip-email');
    await expect(form.locator('#roundtrip-email')).toBeInViewport();
    await context.close();
  });
});

/*
 * RangeSlider (3.17) — spec docs/specs/RangeSlider.md.
 *
 * The first slider thumb in the library that a test can measure. `Slider`'s
 * thumb is a UA-painted pseudo-element whose box is not observable from script
 * (D-052 §4); this component's visible thumbs are spans of ours, positioned
 * with the platform's own formula over invisible native thumbs. So the
 * assertions below check the things `Slider`'s could only screenshot: where
 * the ring is drawn, that a press on the visible thumb reaches the native one
 * beneath it, and that a bare track press — which the pointer-events layering
 * takes away from the inputs — is routed to the nearer thumb by the root.
 */
test.describe('RangeSlider', () => {
  type Page = import('@playwright/test').Page;
  type Locator = import('@playwright/test').Locator;

  const scope = (page: Page, id: string) => page.locator(`[data-testid="range-slider-${id}"]`);
  const control = (root: Locator, thumb: 'start' | 'end') =>
    root.locator(`.pp-range-slider__control[data-thumb="${thumb}"]`);
  const thumb = (root: Locator, which: 'start' | 'end') =>
    root.locator(`.pp-range-slider__thumb[data-thumb="${which}"]`);

  /*
   * The x of a fraction of the range, by the platform's formula: the thumb
   * travels a track shorter by its own width, so p = 0 is half a thumb in
   * from the start edge. Measured from the thumb's own box, not restated.
   */
  async function geometry(root: Locator) {
    await root.scrollIntoViewIfNeeded();
    const box = (await root.boundingBox())!;
    const t = (await thumb(root, 'start').boundingBox())!;
    return {
      box,
      thumb: t.width,
      xAt: (fraction: number) => box.x + t.width / 2 + fraction * (box.width - t.width),
      y: box.y + box.height / 2,
    };
  }

  /* A pointer lands on a pixel and a value is a step, so a drag is right to
     within a step or two of where it was aimed; exact values are asserted
     where the keyboard, not the pointer, produced them. */
  const expectNear = async (input: Locator, expected: number) => {
    const actual = Number(await input.inputValue());
    expect(Math.abs(actual - expected), `expected ${expected}, read ${actual}`).toBeLessThanOrEqual(2);
  };

  const centre = async (el: Locator) => {
    const b = (await el.boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };

  /* `page.mouse`, because the visible thumb is `pointer-events: none` and
     `locator.click()` refuses an element that does not receive the hit
     (D-052 §2 for the scroll; the press falls through to the native thumb). */
  async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move((from.x + to.x) / 2, to.y);
    await page.mouse.move(to.x, to.y);
    await page.mouse.up();
  }

  test('the ring is on the focused thumb, and on nothing else', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'keyboard').locator('.pp-range-slider');
    await root.scrollIntoViewIfNeeded();

    for (const which of ['start', 'end'] as const) {
      expect((await ringOf(thumb(root, which))).style, `${which} is ringed before focus`).toBe('none');
    }

    await control(root, 'start').focus();
    /* Polled, not read in the same frame (D-052 §3); `outline-style`, not
       `outline-width` (D-054 §1). */
    await expect.poll(async () => (await ringOf(thumb(root, 'start'))).style).toBe('solid');
    expect((await ringOf(thumb(root, 'start'))).width).toBeGreaterThan(0);
    expect((await ringOf(thumb(root, 'end'))).style, 'the start ring reached the end thumb').toBe('none');

    await page.keyboard.press('Tab');
    await expect(control(root, 'end')).toBeFocused();
    await expect.poll(async () => (await ringOf(thumb(root, 'end'))).style).toBe('solid');
    await expect.poll(async () => (await ringOf(thumb(root, 'start'))).style).toBe('none');
  });

  /*
   * THE ASSERTION §1's FORMULA IS FOR — AND THE DRAG ALONE COULD NOT BE IT.
   * If our thumb drifted off the native one, or the native thumb took no
   * pointer events, a press on the visible thumb would land on bare track and
   * the root would route it to the nearer thumb: the same thumb, moved to the
   * same place, and a value assertion reads green. The root's routing is a
   * safety net, and a test that cannot tell the net from the wire is D-035
   * §3's failure. So the HIT TEST is asserted first: at each visible thumb's
   * centre the element under the pointer must be that thumb's own input, and
   * between them it must be the root. Removing `pointer-events: auto` from
   * one engine's thumb fails here; the formula's break (physical `left`) is
   * right in LTR and is caught by the RTL test below instead (D-060 §1).
   */
  test('a press on the visible thumb drags the native thumb beneath it', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'track').locator('.pp-range-slider');
    const g = await geometry(root);
    await expect(control(root, 'start')).toHaveValue('40');
    await expect(control(root, 'end')).toHaveValue('60');

    const under = (x: number, y: number) =>
      page.evaluate(([px, py]) => {
        const el = document.elementFromPoint(px, py) as HTMLElement | null;
        return el ? `${el.className}${el.dataset.thumb ? `[${el.dataset.thumb}]` : ''}` : null;
      }, [x, y] as const);
    const startCentre = await centre(thumb(root, 'start'));
    const endCentre = await centre(thumb(root, 'end'));
    expect(await under(startCentre.x, startCentre.y), 'nothing native under the start thumb').toBe(
      'pp-range-slider__control[start]',
    );
    expect(await under(endCentre.x, endCentre.y), 'nothing native under the end thumb').toBe(
      'pp-range-slider__control[end]',
    );
    expect(await under(g.xAt(0.5), g.y), 'bare track did not fall through to the root').toBe(
      'pp-range-slider',
    );

    await drag(page, await centre(thumb(root, 'start')), { x: g.xAt(0.2), y: g.y });
    await expectNear(control(root, 'start'), 20);
    await expect(control(root, 'end')).toHaveValue('60');
    await expect(control(root, 'start')).toBeFocused();

    await drag(page, await centre(thumb(root, 'end')), { x: g.xAt(0.9), y: g.y });
    await expectNear(control(root, 'end'), 90);
    await expectNear(control(root, 'start'), 20);
  });

  test('a press on bare track moves the nearer thumb and keeps dragging it', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'track').locator('.pp-range-slider');
    const g = await geometry(root);

    // Nearer the start thumb (40) than the end (60).
    await page.mouse.move(g.xAt(0.1), g.y);
    await page.mouse.down();
    await expectNear(control(root, 'start'), 10);
    await expect(control(root, 'start')).toBeFocused();

    // Still down: the drag continues on the thumb the press picked.
    await page.mouse.move(g.xAt(0.2), g.y);
    await page.mouse.move(g.xAt(0.3), g.y);
    await expectNear(control(root, 'start'), 30);
    await expect(control(root, 'end')).toHaveValue('60');
    await page.mouse.up();

    // Nearer the end thumb.
    await page.mouse.click(g.xAt(0.95), g.y);
    await expectNear(control(root, 'end'), 95);
    await expect(control(root, 'end')).toBeFocused();
    await expectNear(control(root, 'start'), 30);
  });

  /*
   * THE BREAK CHECK FOR `translate`. Our thumbs are placed with
   * `inset-inline-start`, which the engine mirrors in RTL; `translate` is
   * physical and would put the end thumb on the right of the start thumb in
   * a layout where the native inputs have already reversed (D-048 §4). And
   * the root's pointer maths reads `direction` at event time, so a press
   * near the LEFT edge is a press near `max`.
   */
  test('in RTL the thumbs reverse with the inputs, and a track press is measured from the inline start', async ({
    page,
  }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'rtl').locator('.pp-range-slider');
    const g = await geometry(root);

    const startBox = (await thumb(root, 'start').boundingBox())!;
    const endBox = (await thumb(root, 'end').boundingBox())!;
    expect(endBox.x, 'the end thumb is not on the left in RTL').toBeLessThan(startBox.x);

    // Left edge is the max end. Value ≈ 90: nearer the end thumb (80).
    await page.mouse.click(g.xAt(0.1), g.y);
    await expectNear(control(root, 'end'), 90);
    await expect(control(root, 'start')).toHaveValue('20');
  });

  test('the thumbs cannot cross — by keyboard, the clamp is the other thumb', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'keyboard').locator('.pp-range-slider');
    await root.scrollIntoViewIfNeeded();

    await control(root, 'start').focus();
    await page.keyboard.press('End');
    // Not 10: the end thumb sits at 7, and React restored the clamped input.
    await expect(control(root, 'start')).toHaveValue('7');
    await expect(control(root, 'end')).toHaveValue('7');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Home');
    await expect(control(root, 'end')).toHaveValue('7');
    await page.keyboard.press('ArrowRight');
    await expect(control(root, 'end')).toHaveValue('8');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(control(root, 'end')).toHaveValue('7');
  });

  test('the thumbs cannot cross — by drag, the start stops at the end', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'track').locator('.pp-range-slider');
    const g = await geometry(root);

    await drag(page, await centre(thumb(root, 'start')), { x: g.xAt(0.95), y: g.y });
    await expect(control(root, 'start')).toHaveValue('60');
    await expect(control(root, 'end')).toHaveValue('60');
  });

  /*
   * THE CASE EVERY HAND-BUILT RANGE SLIDER SHIPS BROKEN (spec §3). Both at
   * max: the two inputs cover each other, and unless the start input is on
   * top nothing can be grabbed that moves. `data-thumb-top` says which is,
   * and the break of dropping it fails here.
   */
  test('a pair stuck at max can be pulled apart', async ({ page }) => {
    await page.goto('/components/range-slider');
    const root = scope(page, 'stuck').locator('.pp-range-slider');
    const g = await geometry(root);
    await expect(root).toHaveAttribute('data-thumb-top', 'start');

    await drag(page, await centre(thumb(root, 'start')), { x: g.xAt(0.6), y: g.y });
    await expectNear(control(root, 'start'), 60);
    await expect(control(root, 'end')).toHaveValue('100');
    await expect(root).toHaveAttribute('data-thumb-top', 'start');
  });

  test('the fill column runs between the thumbs', async ({ page }) => {
    await page.goto('/components/range-slider');
    const section = page.locator('section', { hasText: 'The fill runs between the thumbs' });
    const wide = section.locator('.matrix__cell').filter({ hasText: 'wide · 960px' }).first();

    const columns = async (labelText: string) => {
      const track = wide
        .locator('.pp-field', { hasText: labelText })
        .locator('.pp-range-slider__track')
        .first();
      const raw = await track.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
      const [a, b, c] = raw.split(' ').map(parseFloat) as [number, number, number];
      const total = a + b + c;
      return { before: a / total, fill: b / total };
    };

    const quarter = await columns('A quarter to three quarters');
    expect(quarter.before).toBeCloseTo(0.25, 2);
    expect(quarter.fill).toBeCloseTo(0.5, 2);
    const met = await columns('The thumbs meet at 50');
    expect(met.before).toBeCloseTo(0.5, 2);
    expect(met.fill).toBeCloseTo(0, 2);
    expect((await columns('The whole range')).fill).toBeCloseTo(1, 2);
  });

  /* Same height as an Input at the same size, so a row of controls lines up
     (D-028). Read off both pages rather than restated. */
  test('the control scale agrees with Input', async ({ page }) => {
    await page.goto('/components/input');
    const inputHeight = await page
      .locator('.pp-input[data-size="md"] .pp-input__control')
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    await page.goto('/components/range-slider');
    const sliderHeight = await scope(page, 'keyboard')
      .locator('.pp-range-slider__control')
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));

    expect(sliderHeight, 'a RangeSlider beside an Input is a pixel crooked').toBe(inputHeight);
  });

  test('the group is named by its field and each thumb by its label, in a real accessibility tree', async ({
    page,
  }) => {
    await page.goto('/components/range-slider');
    const region = scope(page, 'valuetext');
    await expect(region.getByRole('group', { name: 'Price' })).toBeVisible();

    const min = region.getByRole('slider', { name: 'Minimum price' });
    const max = region.getByRole('slider', { name: 'Maximum price' });
    await expect(min).toHaveAttribute('aria-valuetext', '£50');
    await expect(max).toHaveAttribute('aria-valuetext', '£250');
    // Not ours: the element supplies aria-valuenow for `slider`.
    await expect(min).not.toHaveAttribute('aria-valuenow', /.*/);
    await expect(min).toHaveAttribute('name', 'price');
    await expect(max).toHaveAttribute('name', 'price');
  });

  test('onValueCommit fires once for a track press that keeps dragging', async ({ page }) => {
    await page.goto('/components/range-slider');
    const region = scope(page, 'controlled');
    const root = region.locator('.pp-range-slider');
    const readout = region.locator('p, .pp-text').last();
    const g = await geometry(root);

    await page.mouse.move(g.xAt(0.3), g.y);
    await page.mouse.down();
    for (const fraction of [0.35, 0.4, 0.45, 0.5]) await page.mouse.move(g.xAt(fraction), g.y);
    await page.mouse.up();

    const text = await readout.textContent();
    const changes = Number(/onValueChange fired (\d+)/.exec(text ?? '')?.[1]);
    const commits = Number(/onValueCommit fired (\d+)/.exec(text ?? '')?.[1]);

    expect(changes, 'the drag produced no continuous updates').toBeGreaterThan(1);
    expect(commits, 'a drag committed more than once').toBe(1);
    expect(text).toContain('value 50–80');
  });

  test('fills the box its parent gives it, at every width, with no width declared', async ({ page }) => {
    await page.goto('/components/range-slider');
    const section = page.locator('section', { hasText: 'It fills, at every container width' });
    const widths: number[] = [];

    for (const width of ['narrow · 240px', 'medium · 480px', 'wide · 960px']) {
      const box = section.locator('.matrix__cell').filter({ hasText: width }).first();
      const root = box.locator('.pp-range-slider').first();

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

/*
 * Popover (4.2), and through it the overlay foundation (4.1) — specs
 * docs/specs/Popover.md and docs/specs/overlay-foundation.md.
 *
 * The panel is PORTALLED to <body>, so nothing below scopes it to a section;
 * each test opens one popover and reads the one `.pp-popover` on the page.
 * What only a browser can answer: that the z-index token reaches Radix's
 * positioned wrapper; that a logical `side` lands on the right physical side
 * in both directions; that a space-scale offset is the pixels the token says;
 * that the theme really crosses the portal, in resolved colour and not only
 * in an attribute; and that the reset's reduced-motion rule reaches a
 * portalled element.
 */
test.describe('Popover', () => {
  type Page = import('@playwright/test').Page;
  /* The Matrix gallery keeps six panels open for the screenshot, marked
     `data-gallery`; every interactive test below opens exactly one more. */
  const panel = (page: Page) => page.locator('.pp-popover:not([data-gallery])');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="popover-${id}"]`);

  test('the z-index token reaches the element that stacks', async ({ page }) => {
    await page.goto('/components/popover');
    await demo(page, 'form').getByRole('button', { name: 'Filters' }).click();
    const el = panel(page);
    await expect(el).toBeVisible();

    const read = await el.evaluate((n) => ({
      panel: getComputedStyle(n).zIndex,
      token: getComputedStyle(n).getPropertyValue('--pp-z-popover').trim(),
      wrapper: getComputedStyle(n.parentElement as HTMLElement).zIndex,
    }));
    expect(read.panel).toBe(read.token);
    expect(read.wrapper, "Radix's wrapper did not take the panel's z-index").toBe(read.token);
  });

  test('the Title names the dialog, in a real accessibility tree', async ({ page }) => {
    await page.goto('/components/popover');
    await demo(page, 'form').getByRole('button', { name: 'Filters' }).click();
    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-state', 'open');
    // The page sets no theme scope of its own — the default theme is
    // `:root:not([data-pp-theme])` — so there is nothing to copy, and the
    // panel carries no attribute rather than an invented one (D-062 §3).
    await expect(dialog).not.toHaveAttribute('data-pp-theme', /.*/);
  });

  /* sideOffset="2" is --pp-space-2, 0.5rem, 8px at the default root size:
     the gap between the trigger's bottom edge and the panel's top edge. */
  test('a space-scale offset is the pixels its token resolves to', async ({ page }) => {
    await page.goto('/components/popover');
    const trigger = demo(page, 'form').getByRole('button', { name: 'Filters' });
    await trigger.click();
    const el = panel(page);
    await expect(el).toHaveAttribute('data-side', 'bottom');
    const [t, p] = await Promise.all([trigger.boundingBox(), placedBox(el)]);
    const expected = await trigger.evaluate(
      (n) => parseFloat(getComputedStyle(n).getPropertyValue('--pp-space-2')) * parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(expected).toBe(8);
    expect(Math.abs(p!.y - (t!.y + t!.height) - expected), 'the gap is not the token').toBeLessThanOrEqual(1);
  });

  test('side="start" is on the left in LTR and on the right in RTL', async ({ page }) => {
    await page.goto('/components/popover');
    for (const [id, expectLeft] of [
      ['sides', true],
      ['sides-rtl', false],
    ] as const) {
      const trigger = demo(page, id).locator('[data-side-trigger="start"]');
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const el = panel(page);
      const [t, p] = await Promise.all([trigger.boundingBox(), placedBox(el)]);
      if (expectLeft) {
        expect(p!.x + p!.width, `${id}: start is not on the left`).toBeLessThanOrEqual(t!.x + 1);
        await expect(el).toHaveAttribute('data-side', 'left');
      } else {
        expect(p!.x, `${id}: start is not on the right`).toBeGreaterThanOrEqual(t!.x + t!.width - 1);
        await expect(el).toHaveAttribute('data-side', 'right');
      }
      await page.keyboard.press('Escape');
      await expect(el).toHaveCount(0);
    }
  });

  test('the theme crosses the portal, in resolved colour', async ({ page }) => {
    await page.goto('/components/popover');

    await demo(page, 'form').getByRole('button', { name: 'Filters' }).click();
    const lightBg = await panel(page).evaluate((n) => getComputedStyle(n).backgroundColor);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);

    const dark = demo(page, 'theme');
    await dark.getByRole('button', { name: 'Open here' }).click();
    const el = panel(page);
    await expect(el).toHaveAttribute('data-pp-theme', 'dark');
    const read = await el.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      // Portalled: the panel is not a descendant of the dark region.
      inside: n.closest('[data-testid="popover-theme"]') !== null,
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
    }));
    expect(read.inside).toBe(false);
    expect(read.bg, 'the dark panel painted the light surface').not.toBe(lightBg);
    // The region's own raised surface, resolved by the same token in the same theme.
    const regionRaised = await dark.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim());
    expect(read.raised).toBe(regionRaised);
  });

  test('focus enters the panel on open and returns to the trigger on Escape', async ({ page }) => {
    await page.goto('/components/popover');
    const trigger = demo(page, 'form').getByRole('button', { name: 'Filters' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    const focused = await page.evaluate(() => document.activeElement?.closest('.pp-popover') !== null);
    expect(focused, 'focus did not move into the panel').toBe(true);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('an outside press closes a non-modal popover and still lands', async ({ page }) => {
    await page.goto('/components/popover');
    const region = demo(page, 'controlled');
    await region.getByRole('button', { name: 'Open' }).click();
    await expect(panel(page)).toBeVisible();
    await page.getByTestId('popover-outside').click();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.locator('section', { hasText: 'Controlled, and an outside press lands' })).toContainText(
      'outside clicked 1×',
    );
  });

  test('a modal popover swallows the outside press and keeps focus inside', async ({ page }) => {
    await page.goto('/components/popover');
    await demo(page, 'modal').getByRole('button', { name: 'Choose a plan' }).click();
    const el = panel(page);
    await expect(el).toBeVisible();

    // Tab from the last button wraps to the first: focus is trapped.
    await page.getByRole('button', { name: 'Yearly' }).focus();
    await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(() => document.activeElement?.closest('.pp-popover') !== null);
    expect(stillInside, 'focus escaped a modal popover').toBe(true);

    /*
     * AN OUTSIDE PRESS CLOSES A MODAL POPOVER AND DOES NOT LAND (D-062 §4).
     * The spec first said the press was blocked outright; Radix's modal
     * popover closes on it, as a dialog's overlay does, and swallows it —
     * pointer events outside the panel are disabled, so the button under the
     * press is never pressed. `page.mouse`, because Playwright's click refuses
     * an element that cannot receive the pointer, which is the point.
     */
    const outside = page.getByTestId('popover-outside');
    await outside.scrollIntoViewIfNeeded();
    const box = (await outside.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(el).toHaveCount(0);
    await expect(page.locator('section', { hasText: 'Controlled, and an outside press lands' })).toContainText(
      'outside clicked 0×',
    );
  });

  /*
   * playwright.config.ts pins reducedMotion: 'reduce'. The first draft of
   * this test expected the RESET's crush and read 0.14s: an `animation`
   * shorthand in pp.components outranks a zero-specificity rule in pp.reset,
   * so the component carries its own reduced-motion rule (D-062 §5). What is
   * asserted is that rule, on a portalled element.
   */
  test('reduced motion removes the panel\'s animation', async ({ page }) => {
    await page.goto('/components/popover');
    await demo(page, 'form').getByRole('button', { name: 'Filters' }).click();
    const name = await panel(page).evaluate((n) => getComputedStyle(n).animationName);
    expect(name, 'the entry animation ran under reduced motion').toBe('none');
  });

  test('the Matrix opens one popover per cell, in the theme the page loaded with, none wider than the measure', async ({
    page,
  }) => {
    await page.goto('/components/popover');
    const panels = page.locator('.pp-popover[data-gallery]');
    await expect(panels).toHaveCount(3);
    // No stored choice: no scope, no attribute (D-062 §3).
    expect(await panels.evaluateAll((els) => els.map((el) => el.getAttribute('data-pp-theme')))).toEqual([
      null,
      null,
      null,
    ]);

    // A stored dark choice is on <html> before the popovers mount, and they copy it.
    await page.addInitScript(() => window.localStorage.setItem('pp-theme', 'dark'));
    await page.goto('/components/popover');
    await expect(panels).toHaveCount(3);
    expect(await panels.evaluateAll((els) => els.map((el) => el.getAttribute('data-pp-theme')))).toEqual([
      'dark',
      'dark',
      'dark',
    ]);
    const widths = await panels.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    const measure = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pp-measure-xs')) * 16,
    );
    for (const w of widths) expect(w).toBeLessThanOrEqual(measure + 1);
  });
});

/*
 * Tooltip (4.3) — spec docs/specs/Tooltip.md.
 *
 * The panel is PORTALLED to <body>, so nothing below scopes it to a section;
 * each test opens one tooltip and reads the one `.pp-tooltip` on the page
 * that the Matrix gallery did not open. Tooltips open AT ONCE on keyboard
 * focus, so most tests focus the trigger rather than wait out the pointer
 * delay; the pointer tests wait. What only a browser can answer: that the
 * z-index token reaches Radix's positioned wrapper; that the panel is the
 * inverse surface, in resolved colour, and the inverse of the REGION it was
 * opened from; that a logical `side` lands on the right physical side in
 * both directions; that a space-scale offset is the pixels the token says;
 * that the pointer can travel from trigger to panel (WCAG 1.4.13); that
 * `instant-open` skips the entry animation and `delayed-open` plays it; that
 * three `defaultOpen` tooltips coexist; and what a disabled trigger does.
 */
test.describe('Tooltip', () => {
  type Page = import('@playwright/test').Page;
  const tip = (page: Page) => page.locator('.pp-tooltip:not([data-gallery])');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="tooltip-${id}"]`);
  const save = (page: Page) => demo(page, 'shortcut').getByRole('button', { name: 'Save' });

  /*
   * Opens a tooltip by keyboard focus — at once, no delay. The trigger is
   * scrolled into view FIRST and a frame is waited out, because a scroll
   * event is dispatched on the next frame and Radix closes a tooltip when
   * an ancestor of its trigger scrolls (spec §6): scroll-then-focus in one
   * breath opens the tooltip and closes it a frame later, which is what the
   * first draft of every test below did.
   */
  const focusToOpen = async (page: Page, trigger: import('@playwright/test').Locator) => {
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await trigger.focus();
  };


  test('the z-index token reaches the element that stacks', async ({ page }) => {
    await page.goto('/components/tooltip');
    await focusToOpen(page, save(page));
    const el = tip(page);
    await expect(el).toBeVisible();
    const read = await el.evaluate((n) => ({
      panel: getComputedStyle(n).zIndex,
      token: getComputedStyle(n).getPropertyValue('--pp-z-tooltip').trim(),
      wrapper: getComputedStyle(n.parentElement as HTMLElement).zIndex,
    }));
    expect(read.panel).toBe(read.token);
    expect(read.wrapper, "Radix's wrapper did not take the panel's z-index").toBe(read.token);
  });

  test('describes its trigger in a real accessibility tree, and paints the inverse surface', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = save(page);
    await focusToOpen(page, trigger);
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveClass(/pp-tooltip/);
    await expect(tooltip).toHaveAttribute('data-state', 'instant-open');
    await expect(trigger).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id'))!);
    await expect(trigger).toHaveAccessibleDescription(/Save/);
    // The page sets no theme scope of its own, so there is nothing to copy
    // and the panel carries no attribute rather than an invented one (D-062 §3).
    await expect(tooltip).not.toHaveAttribute('data-pp-theme', /.*/);

    // The inverse pair, resolved: the fill is what `--pp-color-bg-inverse`
    // computes to and the ink is `--pp-color-text-inverse` — and neither is
    // the page's own surface or ink (spec §3).
    const read = await tooltip.evaluate((n) => {
      const bg = getComputedStyle(n).backgroundColor;
      const color = getComputedStyle(n).color;
      // Each token painted on THIS element, so the comparison is between
      // resolved colours in one serialisation, then the inline paint removed.
      // Through the same property each time: Chromium serialises a computed
      // `color` and a computed `background-color` differently (lab vs oklab).
      const resolve = (token: string, property: 'background-color' | 'color') => {
        n.style.setProperty(property, `var(${token})`);
        const value = getComputedStyle(n).getPropertyValue(property);
        n.style.removeProperty(property);
        return value;
      };
      return {
        bg,
        color,
        bgInverse: resolve('--pp-color-bg-inverse', 'background-color'),
        textInverse: resolve('--pp-color-text-inverse', 'color'),
        pageBg: resolve('--pp-color-bg-page', 'background-color'),
        pageText: resolve('--pp-color-text', 'color'),
      };
    });
    expect(read.bg).toBe(read.bgInverse);
    expect(read.color).toBe(read.textInverse);
    expect(read.bg, 'the tooltip painted the page surface').not.toBe(read.pageBg);
    expect(read.color, "the tooltip painted the page's ink").not.toBe(read.pageText);

    // A Kbd inside keeps its own surface and its own ink on it (D-065 §2):
    // neither is the panel's, which is what lets a key read as a key.
    const kbd = tooltip.locator('.pp-kbd');
    await expect(kbd).toHaveText('⌘S');
    const key = await kbd.evaluate((n) => ({ bg: getComputedStyle(n).backgroundColor, color: getComputedStyle(n).color }));
    expect(key.bg, "the Kbd took the tooltip's surface").not.toBe(read.bg);
    expect(key.color, "the Kbd took the tooltip's ink").not.toBe(read.color);
  });

  /* sideOffset="1" is --pp-space-1, 0.25rem, 4px at the default root size:
     the gap between the tooltip's bottom edge and the trigger's top edge. */
  test('a space-scale offset is the pixels its token resolves to', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = demo(page, 'sides').locator('[data-side-trigger="top"]');
    await focusToOpen(page, trigger);
    const el = tip(page);
    await expect(el).toHaveAttribute('data-side', 'top');
    const [t, p] = await Promise.all([trigger.boundingBox(), placedBox(el)]);
    const expected = await trigger.evaluate(
      (n) => parseFloat(getComputedStyle(n).getPropertyValue('--pp-space-1')) * parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(expected).toBe(4);
    expect(Math.abs(t!.y - (p!.y + p!.height) - expected), 'the gap is not the token').toBeLessThanOrEqual(1);
  });

  test('side="start" is on the left in LTR and on the right in RTL', async ({ page }) => {
    await page.goto('/components/tooltip');
    for (const [id, expectLeft] of [
      ['sides', true],
      ['sides-rtl', false],
    ] as const) {
      const trigger = demo(page, id).locator('[data-side-trigger="start"]');
      await focusToOpen(page, trigger);
      const el = tip(page);
      const [t, p] = await Promise.all([trigger.boundingBox(), placedBox(el)]);
      if (expectLeft) {
        expect(p!.x + p!.width, `${id}: start is not on the left`).toBeLessThanOrEqual(t!.x + 1);
        await expect(el).toHaveAttribute('data-side', 'left');
      } else {
        expect(p!.x, `${id}: start is not on the right`).toBeGreaterThanOrEqual(t!.x + t!.width - 1);
        await expect(el).toHaveAttribute('data-side', 'right');
      }
      await page.keyboard.press('Escape');
      await expect(el).toHaveCount(0);
      // Escape closed it and left focus where it was (spec §Keyboard).
      await expect(trigger).toBeFocused();
    }
  });

  test('the pointer can travel from the trigger onto the tooltip, and leaving both closes it', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = save(page);
    await trigger.scrollIntoViewIfNeeded();
    const box = (await trigger.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Not before the delay has run.
    await page.waitForTimeout(200);
    await expect(tip(page)).toHaveCount(0);
    const el = tip(page);
    await expect(el).toBeVisible({ timeout: 3000 });
    await expect(el).toHaveAttribute('data-state', 'delayed-open');

    // WCAG 1.4.13, hoverable: onto the panel, in a few steps, and it stays.
    const panel = (await el.boundingBox())!;
    await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height / 2, { steps: 8 });
    await page.waitForTimeout(400);
    await expect(el).toBeVisible();

    // Away from both: closed.
    await page.mouse.move(panel.x + panel.width + 200, panel.y + panel.height + 200, { steps: 8 });
    await expect(el).toHaveCount(0);
  });

  test('a click on the trigger closes it: activating the control dismisses its label', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = save(page);
    await trigger.hover();
    const el = tip(page);
    await expect(el).toBeVisible({ timeout: 3000 });
    await trigger.click();
    await expect(el).toHaveCount(0);
  });

  /*
   * playwright.config.ts pins reducedMotion: 'reduce' for every other test,
   * which is the right default and exactly what hides the one thing §4 rests
   * on: that `instant-open` and `delayed-open` are painted differently. This
   * describe lifts the pin for two tests and nothing else.
   */
  test.describe('with motion', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('delayed-open plays the entry animation; a neighbour within the skip window is instant-open and skips it', async ({
      page,
    }) => {
      await page.goto('/components/tooltip');
      const toolbar = demo(page, 'toolbar');
      const copy = toolbar.getByRole('button', { name: 'Copy' });
      const del = toolbar.getByRole('button', { name: 'Delete' });
      await copy.hover();
      const first = tip(page);
      await expect(first).toBeVisible({ timeout: 3000 });
      await expect(first).toHaveAttribute('data-state', 'delayed-open');
      expect(await first.evaluate((n) => getComputedStyle(n).animationName)).toBe('pp-tooltip-in');

      // In steps, as a pointer moves: a single jump's one `pointermove` lands
      // on the neighbour while the pointer is still "in transit" towards the
      // first tooltip's grace area, and Radix ignores it — the next move is
      // what opens. A real hand never produces exactly one event.
      const target = (await del.boundingBox())!;
      await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
      const second = page.getByRole('tooltip', { name: 'Delete' });
      await expect(second).toBeVisible();
      await expect(second).toHaveAttribute('data-state', 'instant-open');
      await expect(copy).toHaveAttribute('data-state', 'closed');
      expect(await second.evaluate((n) => getComputedStyle(n).animationName), 'a skip-delay open animated in').toBe(
        'none',
      );
    });

    test('keyboard focus opens at once with no entry animation', async ({ page }) => {
      await page.goto('/components/tooltip');
      await focusToOpen(page, save(page));
      const el = tip(page);
      await expect(el).toHaveAttribute('data-state', 'instant-open');
      expect(await el.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
    });
  });

  test("reduced motion removes the panel's animation", async ({ page }) => {
    await page.goto('/components/tooltip');
    // A pointer open, because a focus open skips the entry regardless.
    await save(page).hover();
    const el = tip(page);
    await expect(el).toBeVisible({ timeout: 3000 });
    await expect(el).toHaveAttribute('data-state', 'delayed-open');
    expect(await el.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
  });

  test('the theme crosses the portal, and the tooltip is the inverse of the region it opened from', async ({
    page,
  }) => {
    await page.goto('/components/tooltip');
    await focusToOpen(page, save(page));
    const onPage = await tip(page).evaluate((n) => getComputedStyle(n).backgroundColor);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toHaveCount(0);

    const region = demo(page, 'theme');
    await focusToOpen(page, region.getByRole('button', { name: 'Rest here' }));
    const el = tip(page);
    await expect(el).toHaveAttribute('data-pp-theme', 'dark');
    const read = await el.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      inside: n.closest('[data-testid="tooltip-theme"]') !== null,
      inverse: getComputedStyle(n).getPropertyValue('--pp-color-bg-inverse').trim(),
    }));
    expect(read.inside).toBe(false);
    // The inverse of dark is light: not the near-black the page-level tooltip painted.
    expect(read.bg, 'the tooltip in a dark region painted the light page\'s inverse').not.toBe(onPage);
    const regionInverse = await region.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-inverse').trim());
    expect(read.inverse).toBe(regionInverse);
  });

  test('long content hugs its text up to the measure, then wraps', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = demo(page, 'long').getByRole('button');
    await focusToOpen(page, trigger);
    const el = tip(page);
    await placedBox(el);
    const read = await el.evaluate((n) => ({
      width: n.getBoundingClientRect().width,
      lines: n.getBoundingClientRect().height / (parseFloat(getComputedStyle(n).lineHeight) || 1),
      measure: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pp-measure-xs')) * 16,
    }));
    expect(read.width).toBeLessThanOrEqual(read.measure + 1);
    expect(read.width, 'a long tooltip did not reach the ceiling').toBeGreaterThan(read.measure - 2);
    expect(read.lines, 'a long tooltip did not wrap').toBeGreaterThan(2);
  });

  /*
   * A NATIVELY DISABLED TRIGGER, MEASURED (D-064 §7). Whether a disabled
   * <button> fires the pointermove the trigger opens on is the browser's;
   * this pins what Chromium does so the docs page can state it rather than
   * guess. `page.mouse` rather than `hover()`, which is the one path that
   * does not itself refuse a disabled element.
   */
  test('a disabled trigger opens its tooltip in Chromium', async ({ page }) => {
    await page.goto('/components/tooltip');
    const trigger = demo(page, 'disabled').getByRole('button');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeDisabled();
    const box = (await trigger.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await expect(tip(page)).toBeVisible({ timeout: 3000 });
  });

  test.describe('on touch', () => {
    test.use({ hasTouch: true });

    test('a tap activates the control and shows no tooltip', async ({ page }) => {
      await page.goto('/components/tooltip');
      const trigger = demo(page, 'controlled').getByRole('button');
      await trigger.scrollIntoViewIfNeeded();
      const box = (await trigger.boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      await expect(tip(page)).toHaveCount(0);
    });
  });

  test('controlled: the owner opens and closes it, and an owner-opened tooltip is instant-open', async ({ page }) => {
    await page.goto('/components/tooltip');
    const show = page.getByTestId('tooltip-show');
    await show.scrollIntoViewIfNeeded();
    await show.click();
    const el = tip(page);
    await expect(el).toBeVisible();
    await expect(el).toHaveAttribute('data-state', 'instant-open');
    await expect(el).toHaveText('Delete');
    await expect(page.locator('section', { hasText: 'Controlled' })).toContainText('open: true');
    // The press on Hide is itself an outside press, which the owner is told
    // about first (`onOpenChange(false)`); Hide then says the same thing.
    await page.getByTestId('tooltip-hide').click();
    await expect(el).toHaveCount(0);
    await expect(page.locator('section', { hasText: 'Controlled' })).toContainText('open: false');
  });

  test('the Matrix opens one tooltip per cell, three together, in the theme the page loaded with', async ({ page }) => {
    await page.goto('/components/tooltip');
    const panels = page.locator('.pp-tooltip[data-gallery]');
    // Three defaultOpen tooltips coexist: a default open dispatches no
    // "another tooltip opened" event (D-064 §7).
    await expect(panels).toHaveCount(3);
    // No stored choice: no scope, no attribute (D-062 §3).
    expect(await panels.evaluateAll((els) => els.map((el) => el.getAttribute('data-pp-theme')))).toEqual([
      null,
      null,
      null,
    ]);

    await page.addInitScript(() => window.localStorage.setItem('pp-theme', 'dark'));
    await page.goto('/components/tooltip');
    await expect(panels).toHaveCount(3);
    expect(await panels.evaluateAll((els) => els.map((el) => el.getAttribute('data-pp-theme')))).toEqual([
      'dark',
      'dark',
      'dark',
    ]);
  });
});

/*
 * Dialog (4.4) — spec docs/specs/Dialog.md.
 *
 * Scrim and panel are PORTALLED to <body>. The Matrix gallery holds three
 * dialogs open, each portalled into a `contain: layout` box in its cell, and
 * their side effects are real: the page's scroll is locked, the rest of it is
 * `aria-hidden` and takes no pointer events. So every interactive test
 * closes the gallery first — Escape, three times, topmost layer each — and
 * then reads the one non-gallery scrim and panel on the page.
 *
 * What only a browser can answer: that the scrim's box is the viewport and
 * the panel is centred in it, in both directions; that the panel shrinks to
 * the viewport less the gutter at 320px; that a tall panel scrolls the scrim
 * and not the page; the scroll lock and its RTL compensation, measured; the
 * layers, with a popover and a second dialog opened from inside; the focus
 * loop and the no-trigger restore; the theme in resolved colour; and the
 * gallery's three viewports.
 */
test.describe('Dialog', () => {
  type Page = import('@playwright/test').Page;
  const gallery = (page: Page) => page.locator('.pp-dialog[data-gallery]');
  const panel = (page: Page) => page.locator('.pp-dialog:not([data-gallery])');
  const scrim = (page: Page) => page.locator('.pp-dialog__scrim:has(> .pp-dialog:not([data-gallery]))');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="dialog-${id}"]`);

  /* One Escape per dialog, each waited out: Escape reaches the topmost
     layer, and a dialog still running its exit is still the topmost layer. */
  const closeGallery = async (page: Page) => {
    await expect(gallery(page)).toHaveCount(3);
    for (let left = 2; left >= 0; left -= 1) {
      await page.keyboard.press('Escape');
      await expect(gallery(page)).toHaveCount(left);
    }
  };

  /* Returns the trigger as a text locator, not a role one: once the dialog
     is open the trigger is aria-hidden with the rest of the page, and a role
     locator no longer resolves to it. */
  const open = async (page: Page, id: string, name: string) => {
    await closeGallery(page);
    const trigger = demo(page, id).getByRole('button', { name });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(panel(page)).toBeVisible();
    return demo(page, id).locator('button', { hasText: name }).first();
  };

  const centred = async (page: Page) => {
    const [viewport, box] = await Promise.all([page.viewportSize(), placedBox(panel(page))]);
    const dx = Math.abs(box.x + box.width / 2 - viewport!.width / 2);
    const dy = Math.abs(box.y + box.height / 2 - viewport!.height / 2);
    return { dx, dy };
  };

  test('the scrim is the viewport, the panel is centred in it, and each is at its token\'s layer', async ({ page }) => {
    await page.goto('/components/dialog');
    await open(page, 'form', 'Rename');
    const viewport = page.viewportSize()!;
    const s = await scrim(page).boundingBox();
    expect(s).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    const { dx, dy } = await centred(page);
    expect(dx, 'the panel is not centred horizontally').toBeLessThanOrEqual(1);
    expect(dy, 'the panel is not centred vertically').toBeLessThanOrEqual(1);

    const read = await panel(page).evaluate((n) => ({
      panel: getComputedStyle(n).zIndex,
      modal: getComputedStyle(n).getPropertyValue('--pp-z-modal').trim(),
      scrim: getComputedStyle(n.parentElement as HTMLElement).zIndex,
      overlay: getComputedStyle(n).getPropertyValue('--pp-z-overlay').trim(),
    }));
    expect(read.scrim).toBe(read.overlay);
    expect(read.panel).toBe(read.modal);
  });

  test('centred in RTL too: the scrim is a grid, not a transform', async ({ page }) => {
    await page.goto('/components/dialog');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await open(page, 'form', 'Rename');
    const { dx, dy } = await centred(page);
    expect(dx, 'the panel is off centre in RTL').toBeLessThanOrEqual(1);
    expect(dy).toBeLessThanOrEqual(1);
  });

  test('at 320px the panel is the viewport less the gutter, and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/components/dialog');
    await open(page, 'form', 'Rename');
    const box = await placedBox(panel(page));
    const gutter = await panel(page).evaluate(
      (n) => parseFloat(getComputedStyle(n.parentElement as HTMLElement).paddingInlineStart),
    );
    expect(gutter).toBe(16);
    expect(Math.abs(box.width - (320 - 2 * gutter)), 'the panel did not shrink to the viewport').toBeLessThanOrEqual(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'the page scrolls sideways').toBe(0);
    // The description holds one unbreakable path longer than the panel's
    // content box: it wraps inside, and nothing runs out of the panel.
    const inside = await panel(page).evaluate((n) => n.scrollWidth <= n.clientWidth);
    expect(inside, 'an unbreakable string ran out of the panel').toBe(true);
  });

  test('a panel taller than the viewport scrolls the scrim, not the page, and leaves the page where it was', async ({
    page,
  }) => {
    await page.goto('/components/dialog');
    await open(page, 'long', 'Terms');
    const before = await page.evaluate(() => window.scrollY);
    expect(before, 'the trigger sits low enough that the page had to scroll').toBeGreaterThan(0);

    const s = scrim(page);
    const metrics = await s.evaluate((n) => ({ scroll: n.scrollHeight, client: n.clientHeight, top: n.scrollTop }));
    expect(metrics.scroll, 'the panel did not overflow the scrim').toBeGreaterThan(metrics.client);
    expect(metrics.top).toBe(0);

    await page.mouse.move(640, 450);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => s.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY), 'the page scrolled under the dialog').toBe(before);

    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY), 'the page moved when the dialog closed').toBe(before);
  });

  /*
   * THE SCROLLBAR COMPENSATION IN RTL, MEASURED (spec §9). Radix's lock pads
   * the body by the scrollbar's width so the page does not shift when the
   * bar disappears — react-remove-scroll-bar writes `padding-right` and
   * `margin-right`, unconditionally. Chromium puts the bar on the LEFT under
   * `dir="rtl"`. Headless Chromium hides scrollbars, so the gap here is
   * expected to be 0 and the side is recorded rather than asserted; the
   * source is what says which side, and the docs page says so.
   */
  test('the scroll lock: body overflow hidden, and the compensation measured under dir="rtl"', async ({ page }, info) => {
    await page.goto('/components/dialog');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await open(page, 'form', 'Rename');
    const read = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        overflow: cs.overflowY,
        paddingRight: cs.paddingRight,
        paddingLeft: cs.paddingLeft,
        marginRight: cs.marginRight,
        scrollbar: window.innerWidth - document.documentElement.clientWidth,
      };
    });
    expect(read.overflow).toBe('hidden');
    console.log(`[dialog] rtl scrollbar compensation: ${JSON.stringify(read)}`);
    info.annotations.push({
      type: 'rtl-scrollbar-compensation',
      description: `scrollbar ${read.scrollbar}px; body padding-right ${read.paddingRight}, padding-left ${read.paddingLeft}, margin-right ${read.marginRight}`,
    });
    if (read.scrollbar > 0) {
      // A classic scrollbar: the compensation is on the right, which in RTL is
      // the wrong side. Recorded, not fixed (spec §9).
      expect(read.marginRight).toBe(`${read.scrollbar}px`);
    }
  });

  test('a press on the scrim closes it, and nothing under the scrim is pressed', async ({ page }) => {
    await page.goto('/components/dialog');
    await open(page, 'form', 'Rename');
    const outside = page.getByTestId('dialog-outside');
    const box = (await outside.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(panel(page)).toHaveCount(0);
    await expect(page.locator('section', { hasText: 'The usual' })).toContainText('outside clicked 0×');
  });

  test('a dialog with unsaved input vetoes Escape and the scrim press', async ({ page }) => {
    await page.goto('/components/dialog');
    await open(page, 'veto', 'New note');
    await page.getByRole('textbox', { name: 'Note' }).fill('draft');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeVisible();
    await page.mouse.click(20, 20);
    await expect(panel(page)).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(panel(page)).toHaveCount(0);
  });

  test('focus moves in, loops, and returns to the trigger', async ({ page }) => {
    await page.goto('/components/dialog');
    await closeGallery(page);
    const trigger = demo(page, 'form').getByRole('button', { name: 'Rename' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Rename', exact: true }).last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Name' }), 'Tab did not wrap to the first control').toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Rename', exact: true }).last(), 'Shift+Tab did not wrap to the last').toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('without a trigger, focus returns to the element that opened it', async ({ page }) => {
    await page.goto('/components/dialog');
    await closeGallery(page);
    const actions = demo(page, 'no-trigger').getByRole('button', { name: 'Row actions' });
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await expect(panel(page)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'File name' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(actions, 'focus dropped to the body (spec §7)').toBeFocused();
  });

  test('the page behind is hidden from assistive tech; a popover opened inside is not, and paints above the scrim; a second dialog paints above and closes first', async ({
    page,
  }) => {
    await page.goto('/components/dialog');
    const trigger = await open(page, 'nested', 'Open the first');
    expect(await trigger.evaluate((n) => n.closest('[aria-hidden="true"]') !== null), 'the page is not hidden').toBe(true);

    await page.getByRole('button', { name: 'Pick a colour' }).click();
    const popover = page.getByRole('dialog', { name: 'Colour' });
    await expect(popover, 'the popover is hidden by the sweep or not rendered').toBeVisible();
    const layers = await popover.evaluate((n) => ({
      popover: parseInt(getComputedStyle(n).zIndex, 10),
      scrim: parseInt(getComputedStyle(document.querySelector('.pp-dialog__scrim:not(:has([data-gallery]))') as HTMLElement).zIndex, 10),
    }));
    expect(layers.popover).toBeGreaterThan(layers.scrim);
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
    await expect(panel(page), 'Escape on the popover closed the dialog too').toHaveCount(1);

    await page.getByRole('button', { name: 'Open another' }).click();
    const scrims = page.locator('.pp-dialog__scrim:not(:has([data-gallery]))');
    await expect(scrims).toHaveCount(2);
    const order = await scrims.evaluateAll((els) => {
      const [a, b] = els as HTMLElement[];
      const later = !!(a!.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { later, same: getComputedStyle(a!).zIndex === getComputedStyle(b!).zIndex };
    });
    expect(order.later, 'the second scrim is not later in the DOM').toBe(true);
    expect(order.same, 'the two scrims are not at the same layer').toBe(true);
    await expect(page.getByRole('dialog', { name: 'The second dialog' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(scrims, 'Escape closed both').toHaveCount(1);
    await expect(page.getByRole('dialog', { name: 'The first dialog' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(scrims).toHaveCount(0);
  });

  test('the theme crosses the portal onto the scrim, in resolved colour', async ({ page }) => {
    await page.goto('/components/dialog');
    await open(page, 'form', 'Rename');
    const onPage = await scrim(page).evaluate((n) => getComputedStyle(n).backgroundColor);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);

    const region = demo(page, 'theme');
    const trigger = region.getByRole('button', { name: 'Open here' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const s = scrim(page);
    await expect(s).toHaveAttribute('data-pp-theme', 'dark');
    const read = await s.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      inside: n.closest('[data-testid="dialog-theme"]') !== null,
      token: getComputedStyle(n).getPropertyValue('--pp-color-bg-scrim').trim(),
      panelBg: getComputedStyle(n.querySelector('.pp-dialog') as HTMLElement).backgroundColor,
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
    }));
    expect(read.inside).toBe(false);
    expect(read.bg, 'the dark scrim painted the light theme\'s scrim').not.toBe(onPage);
    const regionTokens = await region.evaluate((n) => ({
      scrim: getComputedStyle(n).getPropertyValue('--pp-color-bg-scrim').trim(),
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
    }));
    expect(read.token).toBe(regionTokens.scrim);
    expect(read.raised, 'the panel did not inherit the theme from the scrim').toBe(regionTokens.raised);
  });

  test("reduced motion removes the scrim's and the panel's animation", async ({ page }) => {
    await page.goto('/components/dialog');
    await open(page, 'form', 'Rename');
    const names = await panel(page).evaluate((n) => ({
      panel: getComputedStyle(n).animationName,
      scrim: getComputedStyle(n.parentElement as HTMLElement).animationName,
    }));
    expect(names).toEqual({ panel: 'none', scrim: 'none' });
  });

  test('the gallery: three viewports, the narrow and medium panels below the ceiling and the wide one at it', async ({
    page,
  }) => {
    await page.goto('/components/dialog');
    const panels = gallery(page);
    await expect(panels).toHaveCount(3);
    // The page is still a page while three bodies' worth of scroll lock are
    // applied: the full-page capture has a height to capture (spec §11).
    const tall = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    expect(tall).toBe(true);

    const read = await panels.evaluateAll((els) =>
      els.map((el) => {
        const scrim = el.parentElement as HTMLElement;
        const stage = scrim.parentElement as HTMLElement;
        const s = scrim.getBoundingClientRect();
        const t = stage.getBoundingClientRect();
        return {
          scrimIsStage: Math.abs(s.width - t.width) <= 1 && Math.abs(s.height - t.height) <= 1 && Math.abs(s.x - t.x) <= 1,
          width: el.getBoundingClientRect().width,
          centred: Math.abs(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2 - (t.x + t.width / 2)) <= 1,
          ceiling: parseFloat(getComputedStyle(el).getPropertyValue('--pp-measure-sm')) * 16,
        };
      }),
    );
    for (const cell of read) {
      expect(cell.scrimIsStage, 'the scrim is not the size of its stage').toBe(true);
      expect(cell.centred, 'the panel is not centred in its stage').toBe(true);
    }
    expect(read[0]!.width).toBeLessThan(read[0]!.ceiling);
    expect(read[1]!.width).toBeLessThan(read[1]!.ceiling);
    expect(Math.abs(read[2]!.width - read[2]!.ceiling), 'the wide panel is not at its ceiling').toBeLessThanOrEqual(1);
  });
});

/*
 * AlertDialog (4.5) — spec docs/specs/AlertDialog.md. Dialog with two rules
 * changed, drawn by Dialog's stylesheet. Asserted here: only what differs,
 * and the two-class contract that makes the rest apply — resolved, not by
 * class name.
 */
test.describe('AlertDialog', () => {
  type Page = import('@playwright/test').Page;
  const gallery = (page: Page) => page.locator('.pp-alert-dialog[data-gallery]');
  const panel = (page: Page) => page.locator('.pp-alert-dialog:not([data-gallery])');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="alert-dialog-${id}"]`);

  const closeGallery = async (page: Page) => {
    await expect(gallery(page)).toHaveCount(3);
    for (let left = 2; left >= 0; left -= 1) {
      await page.keyboard.press('Escape');
      await expect(gallery(page)).toHaveCount(left);
    }
  };

  test('is drawn by Dialog: the layers, the scrim as viewport, the ceiling at 20rem, no motion under reduced motion', async ({
    page,
  }) => {
    await page.goto('/components/alert-dialog');
    await closeGallery(page);
    await demo(page, 'delete').getByRole('button', { name: 'Delete report' }).click();
    const el = panel(page);
    await expect(el).toBeVisible();
    const viewport = page.viewportSize()!;
    const box = await placedBox(el);
    const read = await el.evaluate((n) => {
      const scrim = n.parentElement as HTMLElement;
      const s = scrim.getBoundingClientRect();
      return {
        scrim: { x: s.x, y: s.y, width: s.width, height: s.height },
        scrimZ: getComputedStyle(scrim).zIndex,
        overlay: getComputedStyle(n).getPropertyValue('--pp-z-overlay').trim(),
        panelZ: getComputedStyle(n).zIndex,
        modal: getComputedStyle(n).getPropertyValue('--pp-z-modal').trim(),
        ceiling: parseFloat(getComputedStyle(n).getPropertyValue('--pp-measure-xs')) * 16,
        animation: getComputedStyle(n).animationName,
        scrimAnimation: getComputedStyle(scrim).animationName,
        role: n.getAttribute('role'),
      };
    });
    expect(read.scrim).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    expect(read.scrimZ).toBe(read.overlay);
    expect(read.panelZ).toBe(read.modal);
    expect(read.role).toBe('alertdialog');
    expect(Math.abs(box.width - read.ceiling), 'the panel is not at the 20rem ceiling').toBeLessThanOrEqual(1);
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(read.animation).toBe('none');
    expect(read.scrimAnimation).toBe('none');
  });

  test('focus lands on Cancel, a scrim press does nothing, and Escape returns focus to the trigger', async ({ page }) => {
    await page.goto('/components/alert-dialog');
    await closeGallery(page);
    const trigger = demo(page, 'delete').getByRole('button', { name: 'Delete report' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keep it' })).toBeFocused();

    const outside = page.getByTestId('alert-dialog-outside');
    const box = (await outside.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await expect(panel(page), 'a scrim press closed an alert dialog').toBeVisible();
    await expect(page.locator('section', { hasText: 'Delete, with a way to decline' })).toContainText('outside clicked 0×');

    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(demo(page, 'delete').locator('button', { hasText: 'Delete report' })).toBeFocused();
  });

  test('Action closes and acts; Cancel closes and does not', async ({ page }) => {
    await page.goto('/components/alert-dialog');
    await closeGallery(page);
    const trigger = demo(page, 'delete').getByRole('button', { name: 'Delete report' });
    await trigger.click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(panel(page)).toHaveCount(0);
    await trigger.click();
    await page.getByRole('button', { name: 'Keep it' }).click();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.locator('section', { hasText: 'Delete, with a way to decline' })).toContainText('deleted 1× · kept 1×');
  });

  test('with no Cancel, the panel itself takes focus', async ({ page }) => {
    await page.goto('/components/alert-dialog');
    await closeGallery(page);
    await demo(page, 'no-cancel').getByRole('button', { name: 'Acknowledge' }).click();
    await expect(panel(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('the gallery holds three, each scrim the size of its cell', async ({ page }) => {
    await page.goto('/components/alert-dialog');
    const panels = gallery(page);
    await expect(panels).toHaveCount(3);
    const ok = await panels.evaluateAll((els) =>
      els.every((el) => {
        const scrim = el.parentElement as HTMLElement;
        const stage = scrim.parentElement as HTMLElement;
        const s = scrim.getBoundingClientRect();
        const t = stage.getBoundingClientRect();
        return Math.abs(s.width - t.width) <= 1 && Math.abs(s.height - t.height) <= 1;
      }),
    );
    expect(ok).toBe(true);
  });
});

/*
 * Drawer (4.6) — spec docs/specs/Drawer.md. Dialog with a different
 * placement. Asserted here: where the panel is, per side and per direction;
 * that its anchored axis is the token and the other axis the viewport; that
 * the PANEL scrolls, not the page; the motion rule; the gallery.
 */
test.describe('Drawer', () => {
  type Page = import('@playwright/test').Page;
  type Box = { x: number; y: number; width: number; height: number };
  const gallery = (page: Page) => page.locator('.pp-drawer[data-gallery]');
  const panel = (page: Page) => page.locator('.pp-drawer:not([data-gallery])');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="drawer-${id}"]`);

  const closeGallery = async (page: Page) => {
    await expect(gallery(page)).toHaveCount(3);
    for (let left = 2; left >= 0; left -= 1) {
      await page.keyboard.press('Escape');
      await expect(gallery(page)).toHaveCount(left);
    }
  };

  const openSide = async (page: Page, side: string) => {
    const trigger = demo(page, 'sides').locator(`[data-side-trigger="${side}"]`);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    await expect(el).toHaveAttribute('data-side', /left|right|top|bottom/);
    return el;
  };

  /* A drawer sits AT an edge, so a box with x = 0 or y = 0 is a placed box
     here; placedBox's positive-coordinate rule does not apply. Two reads a
     frame apart that agree are enough — under reduced motion there is no
     slide to wait out. */
  const stillBox = async (el: import('@playwright/test').Locator): Promise<Box> => {
    let last: Box | null = null;
    await expect
      .poll(async () => {
        const box = await el.boundingBox();
        const settled = !!box && !!last && box.x === last.x && box.y === last.y && box.width === last.width && box.height === last.height;
        last = box;
        return settled;
      })
      .toBe(true);
    return last!;
  };

  test('each side is flush with its edge, the token on the anchored axis and the viewport on the other', async ({ page }) => {
    await page.goto('/components/drawer');
    await closeGallery(page);
    const viewport = page.viewportSize()!;
    const token = 20 * 16;
    const checks: Record<string, [string, (b: Box) => void]> = {
      start: ['left', (b) => { expect(b.x).toBe(0); expect(Math.abs(b.width - token)).toBeLessThanOrEqual(1); expect(b.height).toBe(viewport.height); }],
      end: ['right', (b) => { expect(Math.abs(b.x + b.width - viewport.width)).toBeLessThanOrEqual(1); expect(Math.abs(b.width - token)).toBeLessThanOrEqual(1); expect(b.height).toBe(viewport.height); }],
      top: ['top', (b) => { expect(b.y).toBe(0); expect(b.width).toBe(viewport.width); expect(Math.abs(b.height - viewport.height / 2)).toBeLessThanOrEqual(1); }],
      bottom: ['bottom', (b) => { expect(Math.abs(b.y + b.height - viewport.height)).toBeLessThanOrEqual(1); expect(b.width).toBe(viewport.width); expect(Math.abs(b.height - viewport.height / 2)).toBeLessThanOrEqual(1); }],
    };
    for (const [side, [physical, check]] of Object.entries(checks)) {
      const el = await openSide(page, side);
      await expect(el).toHaveAttribute('data-side', physical);
      check(await stillBox(el));
      await page.keyboard.press('Escape');
      await expect(el).toHaveCount(0);
    }
  });

  test('side="start" is on the right under dir="rtl"', async ({ page }) => {
    await page.goto('/components/drawer');
    await closeGallery(page);
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    const el = await openSide(page, 'start');
    await expect(el).toHaveAttribute('data-side', 'right');
    const box = await stillBox(el);
    const viewport = page.viewportSize()!;
    expect(Math.abs(box.x + box.width - viewport.width), 'start is not on the right in RTL').toBeLessThanOrEqual(1);
  });

  test('at 320px a side drawer is the full width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/components/drawer');
    await closeGallery(page);
    const trigger = demo(page, 'nav').getByRole('button', { name: 'Menu' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const box = await stillBox(panel(page));
    expect(box.width).toBe(320);
    expect(box.x).toBe(0);
  });

  /*
   * THE PAGE MUST NOT MOVE, MEASURED AT THE BOTTOM OF THE PAGE. The trigger
   * sits low, so the page is scrolled to its maximum; any shrink of the
   * document while the drawer is open clamps `scrollY`, which is how this
   * test caught Radix's scroll lock zeroing a padded body's gutter (D-071
   * §6). Dialog's counterpart never scrolled that far and never saw it.
   */
  test('a panel taller than its content scrolls itself, and the page stays where it was', async ({ page }) => {
    await page.goto('/components/drawer');
    await closeGallery(page);
    const trigger = demo(page, 'tall').getByRole('button', { name: 'Activity' });
    await trigger.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    expect(before, 'the trigger sits low enough that the page had to scroll').toBeGreaterThan(0);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);

    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight), 'the page shrank behind the drawer').toBe(height);
    expect(await page.evaluate(() => window.scrollY), 'opening the drawer scrolled the page').toBe(before);

    const metrics = await el.evaluate((n) => ({
      scroll: n.scrollHeight,
      client: n.clientHeight,
      scrimScroll: (n.parentElement as HTMLElement).scrollHeight,
      scrimClient: (n.parentElement as HTMLElement).clientHeight,
    }));
    expect(metrics.scroll, 'the panel did not overflow').toBeGreaterThan(metrics.client);
    expect(metrics.scrimScroll, 'the scrim scrolled instead of the panel').toBe(metrics.scrimClient);

    const box = await stillBox(el);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => el.evaluate((n) => n.scrollTop), 'the wheel did not scroll the panel').toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY), 'the page scrolled under the drawer').toBe(before);

    await page.keyboard.press('Escape');
    await expect(el).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY), 'the page moved when the drawer closed').toBe(before);
  });

  test('focus lands on the first link, Escape returns it to the trigger, and the motion is none under reduced motion', async ({
    page,
  }) => {
    await page.goto('/components/drawer');
    await closeGallery(page);
    const trigger = demo(page, 'nav').getByRole('button', { name: 'Menu' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const el = panel(page);
    await expect(el).toBeVisible();
    // Radix's focus scope skips links on mount autofocus (D-071 §4): the
    // first focus is the first BUTTON, which here is Close.
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    expect(await el.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
    await page.keyboard.press('Escape');
    await expect(el).toHaveCount(0);
    await expect(demo(page, 'nav').locator('button').first()).toBeFocused();
  });

  test('the theme crosses the portal onto the scrim', async ({ page }) => {
    await page.goto('/components/drawer');
    await closeGallery(page);
    const region = demo(page, 'theme');
    const trigger = region.getByRole('button', { name: 'Open here' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    await expect(el.locator('xpath=..')).toHaveAttribute('data-pp-theme', 'dark');
    const read = await el.evaluate((n) => ({
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
      inside: n.closest('[data-testid="drawer-theme"]') !== null,
    }));
    expect(read.inside).toBe(false);
    expect(read.raised).toBe(await region.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim()));
  });

  test('the gallery holds three end drawers, contained: full width at 240, 20rem at the right edge at 480 and 960', async ({
    page,
  }) => {
    await page.goto('/components/drawer');
    const panels = gallery(page);
    await expect(panels).toHaveCount(3);
    const read = await panels.evaluateAll((els) =>
      els.map((el) => {
        const scrim = el.parentElement as HTMLElement;
        const s = scrim.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        const stage = (scrim.parentElement as HTMLElement).getBoundingClientRect();
        return {
          stage: s.width,
          width: b.width,
          scrimX: s.x,
          stageX: stage.x,
          panelX: b.x,
          panelRight: b.x + b.width,
          scrimRight: s.x + s.width,
          flushRight: Math.abs(b.x + b.width - (s.x + s.width)) <= 1,
          fullHeight: Math.abs(b.height - s.height) <= 1,
        };
      }),
    );
    expect(read.every((r) => r.flushRight && r.fullHeight), JSON.stringify(read)).toBe(true);
    expect(read[0]!.width).toBe(read[0]!.stage);
    expect(Math.abs(read[1]!.width - 320)).toBeLessThanOrEqual(1);
    expect(Math.abs(read[2]!.width - 320)).toBeLessThanOrEqual(1);
  });
});

test.describe('DropdownMenu', () => {
  type Page = import('@playwright/test').Page;
  /* The Matrix gallery keeps three non-modal menus open for the screenshot,
     marked `data-gallery`; a submenu is a second `.pp-dropdown-menu`. */
  const panel = (page: Page) => page.locator('.pp-dropdown-menu:not([data-gallery]):not(.pp-dropdown-menu__sub)');
  const sub = (page: Page) => page.locator('.pp-dropdown-menu__sub');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="dropdown-menu-${id}"]`);
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );

  /* Opened from the keyboard, and not returned until the entry focus has
     landed on the first item: a key pressed before that is lost. The trigger
     comes back as a CSS locator — a modal menu hides the rest of the page
     from assistive tech, so a role query cannot see it while the menu is
     open (D-068 §4). */
  const openActions = async (page: Page, id = 'actions') => {
    const trigger = demo(page, id).locator('button').first();
    await expect(trigger).toHaveAccessibleName('More');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const el = panel(page);
    await expect(el).toBeVisible();
    await expect(el.getByRole('menuitem').first()).toBeFocused();
    return { trigger, el };
  };

  test('the z-index token reaches the element that stacks, and the list is named by its trigger', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { el } = await openActions(page);
    await expect(page.getByRole('menu', { name: 'More' })).toBeVisible();
    const read = await el.evaluate((n) => ({
      panel: getComputedStyle(n).zIndex,
      token: getComputedStyle(n).getPropertyValue('--pp-z-popover').trim(),
      wrapper: getComputedStyle(n.parentElement as HTMLElement).zIndex,
      animation: getComputedStyle(n).animationName,
    }));
    expect(read.panel).toBe(read.token);
    expect(read.wrapper, "Radix's wrapper did not take the panel's z-index").toBe(read.token);
    expect(read.animation, 'not still under reduced motion').toBe('none');
  });

  test('align="start" puts the list on the trigger\'s start edge, one space step below it', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { trigger, el } = await openActions(page);
    await expect(el).toHaveAttribute('data-side', 'bottom');
    await expect(el).toHaveAttribute('data-align', 'start');
    const [t, p] = await Promise.all([trigger.boundingBox(), placedBox(el)]);
    const step = await px(page, '--pp-space-1');
    expect(step).toBe(4);
    expect(Math.abs(p!.x - t!.x), 'the start edges differ').toBeLessThanOrEqual(1);
    expect(Math.abs(p!.y - (t!.y + t!.height) - step), 'the gap is not the token').toBeLessThanOrEqual(1);
  });

  test('a row is the small control height; a plain menu has no gutter and a checkable one insets every row alike', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { el } = await openActions(page);
    const height = await px(page, '--pp-control-height-sm');
    const inline = await px(page, '--pp-control-padding-inline-sm');
    expect(height).toBe(32);
    const rows = el.locator('.pp-dropdown-menu__item');
    const plain = await rows.evaluateAll((els) =>
      els.map((n) => ({ h: n.getBoundingClientRect().height, start: parseFloat(getComputedStyle(n).paddingInlineStart) })),
    );
    expect(plain.length).toBeGreaterThan(3);
    expect(plain.every((r) => Math.abs(r.h - height) <= 1), JSON.stringify(plain)).toBe(true);
    expect(plain.every((r) => r.start === inline), 'a plain menu carries a gutter').toBe(true);
    await page.keyboard.press('Escape');
    await expect(el).toHaveCount(0);

    const view = demo(page, 'view').getByRole('button', { name: 'View' });
    await view.scrollIntoViewIfNeeded();
    await view.click();
    await expect(el).toBeVisible();
    const mixed = await el.locator('.pp-dropdown-menu__item, .pp-dropdown-menu__label').evaluateAll((els) =>
      els.map((n) => ({ role: n.getAttribute('role'), start: parseFloat(getComputedStyle(n).paddingInlineStart) })),
    );
    const starts = new Set(mixed.map((r) => r.start));
    expect(starts.size, `rows and labels do not share one inset: ${JSON.stringify(mixed)}`).toBe(1);
    const mark = await px(page, '--pp-size-4');
    const gap = await px(page, '--pp-control-gap-sm');
    expect([...starts][0]).toBe(inline + mark + gap);
    // The plain item at the end of a checkable menu is inset like the rest.
    expect(mixed.find((r) => r.role === 'menuitem')?.start).toBe(inline + mark + gap);
    // The mark sits in the gutter, on the row's centre line.
    const checked = el.locator('[role="menuitemradio"][aria-checked="true"]');
    const [row, ind] = await Promise.all([checked.boundingBox(), checked.locator('.pp-dropdown-menu__indicator').boundingBox()]);
    expect(Math.abs(ind!.x - (row!.x + inline))).toBeLessThanOrEqual(1);
    expect(Math.abs(ind!.y + ind!.height / 2 - (row!.y + row!.height / 2))).toBeLessThanOrEqual(1);
  });

  test('the highlighted row is the hover token, resolved; typeahead moves it', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { el } = await openActions(page);
    const rename = el.getByRole('menuitem', { name: 'Rename' });
    await expect(rename).toBeFocused();
    await expect(rename).toHaveAttribute('data-highlighted', '');
    const read = await rename.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      token: getComputedStyle(n).getPropertyValue('--pp-tone-bg-hover').trim(),
    }));
    const expected = await rename.evaluate((n, token) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = token;
      n.appendChild(probe);
      const bg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return bg;
    }, read.token);
    expect(read.bg).toBe(expected);
    await page.keyboard.type('d');
    await expect(el.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
    await expect(rename).not.toHaveAttribute('data-highlighted', '');
  });

  test('the submenu opens on ArrowRight in LTR, to the right, its first item on the trigger\'s row; ArrowLeft in RTL, to the left', async ({
    page,
  }) => {
    await page.goto('/components/dropdown-menu');
    for (const [id, rtl] of [
      ['actions', false],
      ['actions-rtl', true],
    ] as const) {
      const { el } = await openActions(page, id);
      // Radix's roving focus moves focus on a timeout after the key, so each
      // arrow is waited out before the next (D-072 §7).
      await page.keyboard.press('ArrowDown');
      await expect(el.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      const trigger = el.getByRole('menuitem', { name: 'Move to' });
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // The wrong key does nothing.
      await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft');
      await expect(sub(page)).toHaveCount(0);
      await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
      const s = sub(page);
      await expect(s).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const first = s.getByRole('menuitem', { name: 'Archive' });
      await expect(first).toBeFocused();
      await expect(s).toHaveAttribute('data-side', rtl ? 'left' : 'right');
      const [t, sp, f] = await Promise.all([trigger.boundingBox(), placedBox(s), first.boundingBox()]);
      if (rtl) {
        expect(sp!.x + sp!.width, `${id}: the submenu is not on the left`).toBeLessThanOrEqual(t!.x + 1);
      } else {
        expect(sp!.x, `${id}: the submenu is not on the right`).toBeGreaterThanOrEqual(t!.x + t!.width - 1);
      }
      expect(Math.abs(f!.y - t!.y), `${id}: the first sub-item is not on its trigger's row`).toBeLessThanOrEqual(1);
      // The chevron points into the submenu.
      const flipped = await trigger.locator('.pp-dropdown-menu__chevron').evaluate((n) => getComputedStyle(n).scale);
      expect(flipped).toBe(rtl ? '-1 1' : 'none');
      await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft');
      await expect(s).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(el).toHaveCount(0);
    }
  });

  test('Enter activates an item, closes the menu and returns focus to the trigger', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { trigger, el } = await openActions(page);
    await page.keyboard.press('ArrowDown');
    await expect(el.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(el).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(demo(page, 'actions').locator('xpath=..')).toContainText('last: duplicate');
  });

  test('a press outside a modal menu closes it and does not land', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const trigger = demo(page, 'outside').getByRole('button', { name: 'Open' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    const target = page.getByTestId('dropdown-menu-outside-target');
    const box = (await target.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(el).toHaveCount(0);
    await expect(target.locator('xpath=../..')).toContainText('outside clicked 0×');
  });

  test('a long label wraps inside the ceiling and a long list scrolls inside itself', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const trigger = demo(page, 'long').getByRole('button', { name: 'Workspaces' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    const box = await placedBox(el);
    const ceiling = await px(page, '--pp-measure-xs');
    expect(box!.width).toBeLessThanOrEqual(ceiling + 1);
    const metrics = await el.evaluate((n) => ({ scroll: n.scrollHeight, client: n.clientHeight }));
    expect(metrics.scroll, 'the list did not overflow').toBeGreaterThan(metrics.client);
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => el.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY), 'the page scrolled under the menu').toBe(before);
  });

  test('the theme crosses the portal, in resolved colour', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const { el } = await openActions(page);
    const lightBg = await el.evaluate((n) => getComputedStyle(n).backgroundColor);
    await page.keyboard.press('Escape');
    await expect(el).toHaveCount(0);
    const region = demo(page, 'theme');
    const trigger = region.getByRole('button', { name: 'Open here' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(el).toHaveAttribute('data-pp-theme', 'dark');
    const read = await el.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      inside: n.closest('[data-testid="dropdown-menu-theme"]') !== null,
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
    }));
    expect(read.inside).toBe(false);
    expect(read.bg).not.toBe(lightBg);
    expect(read.raised).toBe(await region.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim()));
  });

  test('the gallery holds three, each beside its trigger, with the gutter its checkable item earns', async ({ page }) => {
    await page.goto('/components/dropdown-menu');
    const panels = page.locator('.pp-dropdown-menu[data-gallery]');
    await expect(panels).toHaveCount(3);
    const read = await panels.evaluateAll((els) =>
      els.map((el) => ({
        state: el.getAttribute('data-state'),
        items: el.querySelectorAll('.pp-dropdown-menu__item').length,
        inset: parseFloat(getComputedStyle(el.querySelector('.pp-dropdown-menu__item') as HTMLElement).paddingInlineStart),
        marks: el.querySelectorAll('.pp-dropdown-menu__indicator').length,
      })),
    );
    expect(read.every((r) => r.state === 'open' && r.items === 4 && r.marks === 1 && r.inset > 8), JSON.stringify(read)).toBe(true);
  });
});

test.describe('ContextMenu', () => {
  type Page = import('@playwright/test').Page;
  const panel = (page: Page) => page.locator('.pp-context-menu:not([data-gallery]):not(.pp-dropdown-menu__sub)');
  const sub = (page: Page) => page.locator('.pp-context-menu.pp-dropdown-menu__sub');
  const demo = (page: Page, id: string) => page.locator(`[data-testid="context-menu-${id}"]`);
  const region = (page: Page, id: string) => demo(page, id).locator('.pp-context-menu__trigger');

  /* A secondary press at a point inside the region; the list is returned
     once its first item is placed. */
  const pressAt = async (page: Page, id: string, dx = 24, dy = 24) => {
    const el = region(page, id);
    await el.scrollIntoViewIfNeeded();
    const box = (await el.boundingBox())!;
    // A negative dx counts from the region's right edge.
    const point = { x: dx >= 0 ? box.x + dx : box.x + box.width + dx, y: box.y + dy };
    await page.mouse.click(point.x, point.y, { button: 'right' });
    const list = panel(page);
    await expect(list).toBeVisible();
    return { list, point, box };
  };

  test('a secondary press opens DropdownMenu\'s list at the pointer: the two-class contract, the row, the token', async ({ page }) => {
    await page.goto('/components/context-menu');
    const { list, point } = await pressAt(page, 'region');
    await expect(region(page, 'region')).toHaveAttribute('data-state', 'open');
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
    const box = await placedBox(list);
    // Radix anchors a zero-size rect at the point and places the list to
    // its right (its own two-pixel offset), aligned to its top (spec §4).
    expect(Math.abs(box!.x - (point.x + 2)), 'the list did not open at the pointer').toBeLessThanOrEqual(1);
    expect(Math.abs(box!.y - point.y)).toBeLessThanOrEqual(1);
    const read = await list.evaluate((n) => ({
      z: getComputedStyle(n).zIndex,
      token: getComputedStyle(n).getPropertyValue('--pp-z-popover').trim(),
      wrapper: getComputedStyle(n.parentElement as HTMLElement).zIndex,
      row: (n.querySelector('.pp-dropdown-menu__item') as HTMLElement).getBoundingClientRect().height,
      animation: getComputedStyle(n).animationName,
    }));
    expect(read.z).toBe(read.token);
    expect(read.wrapper).toBe(read.token);
    expect(Math.abs(read.row - 32)).toBeLessThanOrEqual(1);
    expect(read.animation).toBe('none');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(region(page, 'region')).toHaveAttribute('data-state', 'closed');
  });

  test('Shift+F10 on the focused region opens the list; Enter on an item acts, closes, and focus returns', async ({ page }) => {
    await page.goto('/components/context-menu');
    const el = region(page, 'region');
    await el.scrollIntoViewIfNeeded();
    await el.focus();
    await page.keyboard.press('Shift+F10');
    const list = panel(page);
    await expect(list).toBeVisible();
    // Opened from the keyboard, so the entry focus lands on the first item.
    await expect(list.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await expect(el).toBeFocused();
    await expect(demo(page, 'region').locator('xpath=..')).toContainText('last: rename');
  });

  test('under dir="rtl" the submenu opens on ArrowLeft, to the left, the chevron flipped', async ({ page }) => {
    await page.goto('/components/context-menu');
    // Pressed near the region's right edge, so a submenu has room on the left.
    const { list } = await pressAt(page, 'region-rtl', -40);
    await expect(list).toHaveAttribute('dir', 'rtl');
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    const trigger = list.getByRole('menuitem', { name: 'Move to' });
    await expect(trigger).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(sub(page)).toHaveCount(0);
    await page.keyboard.press('ArrowLeft');
    const s = sub(page);
    await expect(s).toBeVisible();
    await expect(s.getByRole('menuitem', { name: 'Archive' })).toBeFocused();
    const [t, sp] = await Promise.all([trigger.boundingBox(), placedBox(s)]);
    expect(sp!.x + sp!.width, 'the submenu is not on the left').toBeLessThanOrEqual(t!.x + 1);
    expect(await trigger.locator('.pp-dropdown-menu__chevron').evaluate((n) => getComputedStyle(n).scale)).toBe('-1 1');
  });

  test('a disabled region opens nothing, and a controlled one closes from outside', async ({ page }) => {
    await page.goto('/components/context-menu');
    const disabled = region(page, 'disabled');
    await disabled.scrollIntoViewIfNeeded();
    await expect(disabled).toHaveAttribute('data-disabled', '');
    const box = (await disabled.boundingBox())!;
    await page.mouse.click(box.x + 24, box.y + 24, { button: 'right' });
    await page.waitForTimeout(250);
    await expect(panel(page)).toHaveCount(0);

    const { list } = await pressAt(page, 'controlled');
    await expect(demo(page, 'controlled').locator('xpath=..')).toContainText('open: true');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(demo(page, 'controlled').locator('xpath=..')).toContainText('open: false');
  });

  test('the theme crosses the portal, in resolved colour', async ({ page }) => {
    await page.goto('/components/context-menu');
    const { list } = await pressAt(page, 'region');
    const lightBg = await list.evaluate((n) => getComputedStyle(n).backgroundColor);
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    const dark = await pressAt(page, 'theme');
    await expect(dark.list).toHaveAttribute('data-pp-theme', 'dark');
    const read = await dark.list.evaluate((n) => ({
      bg: getComputedStyle(n).backgroundColor,
      inside: n.closest('[data-testid="context-menu-theme"]') !== null,
    }));
    expect(read.inside).toBe(false);
    expect(read.bg).not.toBe(lightBg);
  });

  /*
   * A list opened at a point is anchored to VIEWPORT coordinates, and the
   * three regions run past a 900px viewport, so the lower lists are shifted
   * up to fit. The full-page screenshot resizes the viewport to the page
   * and floating-ui re-places them (D-062 §2's finding for Popover); this
   * test does the same, so it measures what the screenshot shows.
   */
  test('the gallery holds three, each opened at a point inside its region', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/components/context-menu');
    const panels = page.locator('.pp-context-menu[data-gallery]');
    await expect(panels).toHaveCount(3);
    const read = await panels.evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        const regions = Array.from(document.querySelectorAll('.matrix .pp-context-menu__trigger')).map((r) => r.getBoundingClientRect());
        const inside = regions.some((r) => b.x >= r.x && b.y >= r.y && b.y <= r.y + r.height);
        return { state: el.getAttribute('data-state'), inside, items: el.querySelectorAll('.pp-dropdown-menu__item').length };
      }),
    );
    expect(read.every((r) => r.state === 'open' && r.inside && r.items === 4), JSON.stringify(read)).toBe(true);
  });
});

test.describe('Tabs', () => {
  type Page = import('@playwright/test').Page;
  const demo = (page: Page, id: string) => page.locator(`[data-testid="tabs-${id}"]`);
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );
  const resolve = (page: Page, token: string) =>
    page.evaluate((t) => {
      const probe = document.createElement('div');
      probe.style.color = `var(${t})`;
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    }, token);

  test('a tab is the medium control; the selected one is the text colour with a two-pixel accent bar on the hairline', async ({ page }) => {
    await page.goto('/components/tabs');
    const region = demo(page, 'settings');
    await region.scrollIntoViewIfNeeded();
    const active = region.getByRole('tab', { name: 'General' });
    const inactive = region.getByRole('tab', { name: 'Members' });
    const list = region.getByRole('tablist');
    const height = await px(page, '--pp-control-height-md');
    expect(height).toBe(40);
    const read = await active.evaluate((n) => {
      const after = getComputedStyle(n, '::after');
      const list = n.parentElement as HTMLElement;
      return {
        height: n.getBoundingClientRect().height,
        color: getComputedStyle(n).color,
        barWidth: after.borderBottomWidth,
        barColor: after.borderBottomColor,
        barOffset: after.bottom,
        lineWidth: getComputedStyle(list).borderBottomWidth,
        lineColor: getComputedStyle(list).borderBottomColor,
        tabBottom: n.getBoundingClientRect().bottom,
        listBottom: list.getBoundingClientRect().bottom,
        transition: getComputedStyle(n).transitionDuration,
      };
    });
    expect(Math.abs(read.height - height)).toBeLessThanOrEqual(1);
    expect(read.color).toBe(await resolve(page, '--pp-color-text'));
    expect(await inactive.evaluate((n) => getComputedStyle(n).color)).toBe(await resolve(page, '--pp-color-text-muted'));
    // The bar: two pixels, the accent's solid step, its outer edge one
    // hairline past the tab's edge — which is the list's outer edge.
    expect(read.barWidth).toBe('2px');
    expect(read.barOffset).toBe('-1px');
    expect(read.lineWidth).toBe('1px');
    expect(Math.abs(read.tabBottom + 1 - read.listBottom), 'the bar does not sit on the line').toBeLessThanOrEqual(0.5);
    const accent = await active.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-tone-solid').trim());
    const accentResolved = await active.evaluate((n, token) => {
      const probe = document.createElement('i');
      probe.style.color = token;
      n.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    }, accent);
    expect(read.barColor).toBe(accentResolved);
    expect(read.barColor).not.toBe(read.lineColor);
    expect(read.transition, 'not still under reduced motion').toBe('0s');
    await expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    // Four short tabs: the list is still the strip's full width, so the
    // hairline runs the whole way.
    const span = await list.evaluate((n) => ({ list: n.getBoundingClientRect().width, strip: (n.parentElement as HTMLElement).clientWidth }));
    expect(Math.abs(span.list - span.strip), 'the hairline stops at the last tab').toBeLessThanOrEqual(1);
  });

  test('the arrows select; Tab leaves the strip for the panel; manual mode selects on Enter', async ({ page }) => {
    await page.goto('/components/tabs');
    const region = demo(page, 'settings');
    await region.scrollIntoViewIfNeeded();
    await region.getByRole('tab', { name: 'General' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(region.getByRole('tab', { name: 'Members' })).toBeFocused();
    await expect(region.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
    await expect(region.locator('xpath=..')).toContainText('selected: members');
    // Billing is disabled: skipped.
    await page.keyboard.press('ArrowRight');
    await expect(region.getByRole('tab', { name: 'Advanced' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(region.getByRole('tabpanel')).toBeFocused();

    const manual = demo(page, 'manual');
    await manual.scrollIntoViewIfNeeded();
    await manual.getByRole('tab', { name: 'General' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(manual.getByRole('tab', { name: 'Members' })).toBeFocused();
    await expect(manual.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'false');
    await page.keyboard.press('Enter');
    await expect(manual.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
  });

  test('at 240px the strip scrolls, the page does not, and the hairline runs under every tab', async ({ page }) => {
    await page.goto('/components/tabs');
    const narrow = page.locator('.matrix__cell').first().locator('.pp-tabs');
    await narrow.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    const read = await narrow.evaluate((n) => {
      const strip = n.querySelector('.pp-tabs__strip') as HTMLElement;
      const list = n.querySelector('.pp-tabs__list') as HTMLElement;
      const tabs = Array.from(n.querySelectorAll('.pp-tabs__tab')) as HTMLElement[];
      return {
        rootWidth: n.getBoundingClientRect().width,
        stripClient: strip.clientWidth,
        stripScroll: strip.scrollWidth,
        listWidth: list.getBoundingClientRect().width,
        lastTabRight: tabs[tabs.length - 1]!.getBoundingClientRect().right,
        listRight: list.getBoundingClientRect().right,
        overflowX: getComputedStyle(strip).overflowX,
        wrap: getComputedStyle(list).flexWrap,
      };
    });
    expect(read.overflowX).toBe('auto');
    expect(read.wrap).toBe('nowrap');
    expect(read.stripScroll, 'the strip did not overflow').toBeGreaterThan(read.stripClient);
    expect(Math.abs(read.stripClient - read.rootWidth)).toBeLessThanOrEqual(1);
    // The list grew with its tabs: its hairline ends where the last tab does.
    expect(Math.abs(read.listRight - read.lastTabRight), 'the hairline stops short of the last tab').toBeLessThanOrEqual(1);
    const strip = narrow.locator('.pp-tabs__strip');
    const box = (await strip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(200, 0);
    await expect.poll(() => strip.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('vertical: the strip is a column beside its panel, the bar on the inline-end edge', async ({ page }) => {
    await page.goto('/components/tabs');
    const region = demo(page, 'vertical');
    await region.scrollIntoViewIfNeeded();
    const [list, panel] = await Promise.all([region.getByRole('tablist').boundingBox(), region.getByRole('tabpanel').boundingBox()]);
    expect(list!.x + list!.width, 'the panel is not beside the strip').toBeLessThanOrEqual(panel!.x + 1);
    expect(Math.abs(list!.y - panel!.y)).toBeLessThanOrEqual(1);
    const read = await region.getByRole('tab', { name: 'Profile' }).evaluate((n) => {
      const after = getComputedStyle(n, '::after');
      const list = n.parentElement as HTMLElement;
      return {
        barWidth: after.borderRightWidth,
        barBottom: after.borderBottomWidth,
        offset: after.right,
        lineWidth: getComputedStyle(list).borderRightWidth,
        lineBottom: getComputedStyle(list).borderBottomWidth,
        tabRight: n.getBoundingClientRect().right,
        listRight: list.getBoundingClientRect().right,
      };
    });
    expect(read.barWidth).toBe('2px');
    expect(read.barBottom).toBe('0px');
    expect(read.offset).toBe('-1px');
    expect(read.lineWidth).toBe('1px');
    expect(read.lineBottom).toBe('0px');
    expect(Math.abs(read.tabRight + 1 - read.listRight)).toBeLessThanOrEqual(0.5);
    await region.getByRole('tab', { name: 'Profile' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(region.getByRole('tab', { name: 'Security' })).toBeFocused();
  });

  test('a kept panel keeps what was typed; a fresh one does not', async ({ page }) => {
    await page.goto('/components/tabs');
    const region = demo(page, 'kept');
    await region.scrollIntoViewIfNeeded();
    await region.getByPlaceholder('still here').fill('Ada');
    await region.getByRole('tab', { name: 'Fresh' }).click();
    await region.getByPlaceholder('gone on return').fill('Lin');
    await region.getByRole('tab', { name: 'Other' }).click();
    // Both inactive panels are hidden; the kept one still holds its input,
    // the fresh one is empty (D-074 §3).
    const hidden = region.locator('.pp-tabs__panel[hidden]');
    await expect(hidden).toHaveCount(2);
    await expect(hidden.filter({ has: page.getByPlaceholder('still here') })).toHaveCount(1);
    await expect(region.getByPlaceholder('still here')).toBeHidden();
    expect(await hidden.evaluateAll((els) => els.filter((n) => n.childElementCount === 0).length)).toBe(1);
    await region.getByRole('tab', { name: 'Kept' }).click();
    await expect(region.getByPlaceholder('still here')).toHaveValue('Ada');
    await region.getByRole('tab', { name: 'Fresh' }).click();
    await expect(region.getByPlaceholder('gone on return')).toHaveValue('');
  });

  test('a right-to-left strip reads right to left with no dir of its own, and ArrowLeft is next', async ({ page }) => {
    await page.goto('/components/tabs');
    const region = demo(page, 'rtl');
    await region.scrollIntoViewIfNeeded();
    await expect(region.locator('.pp-tabs')).not.toHaveAttribute('dir', /.*/);
    const tabs = region.getByRole('tab');
    const [first, second] = await Promise.all([tabs.nth(0).boundingBox(), tabs.nth(1).boundingBox()]);
    expect(second!.x + second!.width, 'the second tab is not to the left of the first').toBeLessThanOrEqual(first!.x + 1);
    await tabs.nth(0).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Accordion', () => {
  type Page = import('@playwright/test').Page;
  const demo = (page: Page, id: string) => page.locator(`[data-testid="accordion-${id}"]`);
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );

  test('headings on hairlines: the trigger is the large control height, the chevron turns on the open item, still under reduced motion', async ({
    page,
  }) => {
    await page.goto('/components/accordion');
    const region = demo(page, 'single');
    await region.scrollIntoViewIfNeeded();
    const first = region.getByRole('button').first();
    const height = await px(page, '--pp-control-height-lg');
    const fontSize = await px(page, '--pp-font-size-3');
    expect(height).toBe(48);
    const read = await first.evaluate((n) => {
      const heading = n.parentElement as HTMLElement;
      const item = heading.parentElement as HTMLElement;
      const root = item.parentElement as HTMLElement;
      const chevron = n.querySelector('.pp-accordion__chevron') as SVGElement;
      return {
        height: n.getBoundingClientRect().height,
        width: n.getBoundingClientRect().width,
        itemWidth: item.getBoundingClientRect().width,
        heading: heading.tagName,
        headingMargin: getComputedStyle(heading).marginBlockStart,
        fontSize: getComputedStyle(n).fontSize,
        rootLine: getComputedStyle(root).borderTopWidth,
        itemLine: getComputedStyle(item).borderBottomWidth,
        rotate: getComputedStyle(chevron).rotate,
        transition: getComputedStyle(chevron).transitionDuration,
      };
    });
    expect(Math.abs(read.height - height)).toBeLessThanOrEqual(1);
    expect(Math.abs(read.width - read.itemWidth), 'the trigger does not fill the item').toBeLessThanOrEqual(1);
    expect(read.heading).toBe('H3');
    expect(read.headingMargin).toBe('0px');
    expect(parseFloat(read.fontSize)).toBe(fontSize);
    expect(read.rootLine).toBe('1px');
    expect(read.itemLine).toBe('1px');
    expect(read.rotate).toBe('none');
    expect(read.transition, 'not still under reduced motion').toBe('0s');

    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const open = await first.evaluate((n) => {
      const content = document.getElementById(n.getAttribute('aria-controls')!) as HTMLElement;
      return {
        rotate: getComputedStyle(n.querySelector('.pp-accordion__chevron') as SVGElement).rotate,
        animation: getComputedStyle(content).animationName,
        overflow: getComputedStyle(content).overflow,
        contentPadding: getComputedStyle(content).paddingBlockEnd,
        bodyPadding: getComputedStyle(content.firstElementChild as HTMLElement).paddingBlockEnd,
        visible: content.getBoundingClientRect().height > 0,
      };
    });
    expect(open.rotate).toBe('180deg');
    expect(open.animation, 'not still under reduced motion').toBe('none');
    expect(open.overflow).toBe('hidden');
    expect(open.contentPadding).toBe('0px');
    expect(parseFloat(open.bodyPadding)).toBe(await px(page, '--pp-space-4'));
    expect(open.visible).toBe(true);
  });

  test('single: opening one closes the other and the open one closes; strict keeps one open', async ({ page }) => {
    await page.goto('/components/accordion');
    const region = demo(page, 'single');
    await region.scrollIntoViewIfNeeded();
    const buttons = region.getByRole('button');
    await buttons.nth(0).click();
    await expect(region.locator('xpath=..')).toContainText('open: shipping');
    await buttons.nth(1).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(region.getByRole('region')).toHaveCount(1);
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(region.locator('xpath=..')).toContainText('open: none');

    const strict = demo(page, 'strict');
    await strict.scrollIntoViewIfNeeded();
    const strictButtons = strict.getByRole('button');
    await strictButtons.nth(0).click();
    await expect(strictButtons.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(strictButtons.nth(0)).toHaveAttribute('aria-disabled', 'true');
    // Playwright will not click an aria-disabled control on its own; the
    // point is that a press does nothing, so the press is forced.
    await strictButtons.nth(0).click({ force: true });
    await expect(strictButtons.nth(0)).toHaveAttribute('aria-expanded', 'true');
  });

  test('the arrows move between headings; Tab from an open heading reaches its content', async ({ page }) => {
    await page.goto('/components/accordion');
    const region = demo(page, 'multiple');
    await region.scrollIntoViewIfNeeded();
    const buttons = region.getByRole('button');
    await expect(region.getByRole('heading', { level: 4 })).toHaveCount(4);
    await buttons.nth(0).focus();
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    // The disabled last section is skipped: End lands on the last enabled.
    await expect(buttons.nth(2)).toBeFocused();
    await expect(buttons.nth(3)).toBeDisabled();
    await page.keyboard.press('Home');
    await expect(buttons.nth(0)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'true');
    // Multiple: opening the second leaves the first open.
    await buttons.nth(1).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(region.getByRole('region')).toHaveCount(2);
  });

  test('a kept panel keeps what was typed, hidden while closed; a fresh one empties', async ({ page }) => {
    await page.goto('/components/accordion');
    const region = demo(page, 'kept');
    await region.scrollIntoViewIfNeeded();
    await region.getByPlaceholder('still here').fill('Ada');
    await region.getByRole('button', { name: /Fresh/ }).click();
    await expect(region.getByPlaceholder('still here')).toBeHidden();
    await expect(region.locator('.pp-accordion__content[hidden]')).toHaveCount(1);
    await region.getByPlaceholder('gone on return').fill('Lin');
    await region.getByRole('button', { name: /Kept/ }).click();
    await expect(region.getByPlaceholder('still here')).toHaveValue('Ada');
    await region.getByRole('button', { name: /Fresh/ }).click();
    await expect(region.getByPlaceholder('gone on return')).toHaveValue('');
  });
});

test.describe('Combobox', () => {
  type Page = import('@playwright/test').Page;
  const demo = (page: Page, id: string) => page.locator(`[data-testid="combobox-${id}"]`);
  const list = (page: Page) => page.locator('.pp-combobox__list:not([data-gallery])');

  test("the control is Input's box, the list is never narrower than it, and the highlighted option scrolls into view", async ({ page }) => {
    // A short viewport, so seventeen options cannot fit below the field.
    await page.setViewportSize({ width: 1280, height: 480 });
    await page.goto('/components/combobox');
    for (const id of ['narrow', 'wide'] as const) {
      const region = demo(page, id);
      await region.scrollIntoViewIfNeeded();
      const input = region.getByRole('combobox');
      await input.click();
      await page.keyboard.press('ArrowDown');
      const el = list(page);
      await expect(el).toBeVisible();
      const [box, panel] = await Promise.all([region.locator('.pp-combobox__box').boundingBox(), placedBox(el)]);
      expect(panel!.width, `${id}: the list is narrower than its control`).toBeGreaterThanOrEqual(box!.width - 1);
      if (id === 'wide') expect(Math.abs(panel!.width - box!.width), 'a wide control: the list is its width').toBeLessThanOrEqual(1);
      expect(Math.abs(panel!.x - box!.x)).toBeLessThanOrEqual(1);
      const height = await region.locator('.pp-combobox__box').evaluate((n) => n.getBoundingClientRect().height);
      expect(Math.abs(height - 40), 'the box is not the medium control').toBeLessThanOrEqual(1);
      await page.keyboard.press('Escape');
      await expect(el).toHaveCount(0);
    }
    // Seventeen options scroll; End is the caret's, so arrow down past the fold.
    const region = demo(page, 'wide');
    await region.getByRole('combobox').click();
    for (let i = 0; i < 17; i += 1) await page.keyboard.press('ArrowDown');
    const el = list(page);
    const last = el.getByRole('option').last();
    await expect(last).toHaveAttribute('data-highlighted', '');
    const visible = await last.evaluate((n) => {
      const r = n.getBoundingClientRect();
      const p = (n.closest('.pp-combobox__list') as HTMLElement).getBoundingClientRect();
      return r.top >= p.top - 1 && r.bottom <= p.bottom + 1;
    });
    expect(visible, 'the highlighted option is out of view').toBe(true);
    expect(await el.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  });

  test('a press in the list does not blur the input; a click takes; the box rings for the input and a token rings itself', async ({ page }) => {
    await page.goto('/components/combobox');
    const region = demo(page, 'single');
    await region.scrollIntoViewIfNeeded();
    const input = region.getByRole('combobox');
    await input.click();
    await page.keyboard.type('b');
    const el = list(page);
    await expect(el).toBeVisible();
    // Keyboard focus in the input: the box carries the ring, the input none.
    const ring = await region.locator('.pp-combobox__box').evaluate((n) => getComputedStyle(n).outlineStyle);
    expect(ring).toBe('solid');
    await el.getByRole('option', { name: 'Brussels' }).hover();
    await expect(el.getByRole('option', { name: 'Brussels' })).toHaveAttribute('data-highlighted', '');
    await page.mouse.down();
    await expect(input).toBeFocused();
    await page.mouse.up();
    await expect(el).toHaveCount(0);
    await expect(input).toHaveValue('Brussels');
    await expect(region.locator('xpath=..')).toContainText('value: bru');
    await expect(input).toBeFocused();

    const many = demo(page, 'multiple');
    await many.scrollIntoViewIfNeeded();
    await many.getByRole('combobox').focus();
    await page.keyboard.press('Shift+Tab');
    const remove = many.getByRole('button', { name: 'Remove Tokyo' });
    await expect(remove).toBeFocused();
    expect(await remove.evaluate((n) => getComputedStyle(n).outlineStyle)).toBe('solid');
    expect(await many.locator('.pp-combobox__box').evaluate((n) => getComputedStyle(n).outlineStyle)).toBe('none');
    await page.keyboard.press('Enter');
    await expect(many.locator('.pp-combobox__token')).toHaveCount(1);
    await expect(many.getByRole('combobox')).toBeFocused();
  });

  test('a selected option is marked in the gutter and its label aligns with the others; the chevron turns; still under reduced motion', async ({
    page,
  }) => {
    await page.goto('/components/combobox');
    const region = demo(page, 'multiple');
    await region.scrollIntoViewIfNeeded();
    const chevron = region.locator('.pp-combobox__chevron');
    expect(await chevron.evaluate((n) => getComputedStyle(n).rotate)).toBe('none');
    await region.getByRole('combobox').click();
    await page.keyboard.press('ArrowDown');
    const el = list(page);
    await expect(el).toBeVisible();
    expect(await chevron.evaluate((n) => getComputedStyle(n).rotate)).toBe('180deg');
    expect(await chevron.evaluate((n) => getComputedStyle(n).transitionDuration)).toBe('0s');
    expect(await el.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
    const read = await el.locator('[role="option"]').evaluateAll((els) =>
      els.map((n) => ({
        selected: n.getAttribute('aria-selected'),
        start: parseFloat(getComputedStyle(n).paddingInlineStart),
        marked: n.querySelector('.pp-combobox__indicator') !== null,
      })),
    );
    expect(new Set(read.map((r) => r.start)).size, 'options do not share one inset').toBe(1);
    expect(read[0]!.start).toBeGreaterThan(8);
    expect(read.filter((r) => r.selected === 'true').every((r) => r.marked)).toBe(true);
    expect(read.filter((r) => r.selected === 'false').every((r) => !r.marked)).toBe(true);
    expect(read.filter((r) => r.selected === 'true')).toHaveLength(2);
  });

  test('async: the spinner while loading, then the options; the theme crosses the portal', async ({ page }) => {
    await page.goto('/components/combobox');
    const region = demo(page, 'async');
    await region.scrollIntoViewIfNeeded();
    await region.getByRole('combobox').click();
    await page.keyboard.type('to');
    await expect(region.locator('.pp-combobox__toggle .pp-spinner')).toBeVisible();
    await expect(list(page).getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    await expect(list(page).getByRole('option', { name: 'Tokyo' })).toBeVisible();
    await expect(region.locator('.pp-combobox__toggle .pp-spinner')).toHaveCount(0);
    await page.keyboard.press('Escape');

    const dark = demo(page, 'theme');
    await dark.scrollIntoViewIfNeeded();
    await dark.getByRole('combobox').click();
    await page.keyboard.press('ArrowDown');
    const el = list(page);
    await expect(el).toHaveAttribute('data-pp-theme', 'dark');
    const read = await el.evaluate((n) => ({
      inside: n.closest('[data-testid="combobox-theme"]') !== null,
      raised: getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim(),
    }));
    expect(read.inside).toBe(false);
    expect(read.raised).toBe(await dark.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim()));
  });

  test('the gallery holds three open lists, each the width of its control', async ({ page }) => {
    await page.goto('/components/combobox');
    const panels = page.locator('.pp-combobox__list[data-gallery]');
    await expect(panels).toHaveCount(3);
    const read = await panels.evaluateAll((els) =>
      els.map((el) => {
        const p = el.getBoundingClientRect();
        const boxes = Array.from(document.querySelectorAll('.matrix .pp-combobox__box')).map((b) => b.getBoundingClientRect());
        const box = boxes.find((b) => Math.abs(b.x - p.x) <= 1);
        return { options: el.querySelectorAll('[role="option"]').length, selected: el.querySelectorAll('[aria-selected="true"]').length, fits: !!box && p.width >= box.width - 1 };
      }),
    );
    expect(read.every((r) => r.options === 2 && r.selected === 1 && r.fits), JSON.stringify(read)).toBe(true);
  });
});

test.describe('Toast', () => {
  type Page = import('@playwright/test').Page;
  const demo = (page: Page, id: string) => page.locator(`[data-testid="toast-${id}"]`);
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );

  test('the region is at the bottom-end corner one gutter in, the token wide; a toast fills it, the newest nearest the edge; still under reduced motion', async ({
    page,
  }) => {
    await page.goto('/components/toast');
    const region = demo(page, 'corner');
    await region.scrollIntoViewIfNeeded();
    await region.getByRole('button', { name: 'Success' }).click();
    await region.getByRole('button', { name: 'Polite' }).click();
    const viewport = region.locator('.pp-toast__viewport');
    const items = viewport.locator('.pp-toast');
    await expect(items).toHaveCount(2);
    const gutter = await px(page, '--pp-space-4');
    const width = await px(page, '--pp-measure-xs');
    const read = await viewport.evaluate((n) => {
      const r = n.getBoundingClientRect();
      const toasts = Array.from(n.querySelectorAll('.pp-toast')).map((t) => t.getBoundingClientRect());
      return {
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        vw: window.innerWidth,
        vh: window.innerHeight,
        pointer: getComputedStyle(n).pointerEvents,
        toastPointer: getComputedStyle(n.querySelector('.pp-toast') as HTMLElement).pointerEvents,
        toastWidth: toasts[0]!.width,
        innerWidth: n.clientWidth - parseFloat(getComputedStyle(n).paddingLeft) - parseFloat(getComputedStyle(n).paddingRight),
        firstBottom: toasts[0]!.bottom,
        secondBottom: toasts[1]!.bottom,
        animation: getComputedStyle(n.querySelector('.pp-toast') as HTMLElement).animationName,
        zIndex: getComputedStyle(n).zIndex,
        token: getComputedStyle(n).getPropertyValue('--pp-z-toast').trim(),
      };
    });
    expect(Math.abs(read.right - read.vw)).toBeLessThanOrEqual(1);
    expect(Math.abs(read.bottom - read.vh)).toBeLessThanOrEqual(1);
    expect(Math.abs(read.width - width)).toBeLessThanOrEqual(1);
    expect(Math.abs(read.toastWidth - read.innerWidth), 'a toast does not fill the region').toBeLessThanOrEqual(1);
    expect(Math.abs(read.width - read.toastWidth - 2 * gutter), 'the gutter is not the token').toBeLessThanOrEqual(1);
    expect(read.pointer).toBe('none');
    expect(read.toastPointer).toBe('auto');
    // Newest nearest the edge: the second toast fired sits lower than the first.
    expect(read.secondBottom).toBeGreaterThan(read.firstBottom);
    expect(read.animation, 'not still under reduced motion').toBe('none');
    expect(read.zIndex).toBe(read.token);
  });

  test('F8 focuses the region and Escape dismisses; the limit shows three and the rest follow', async ({ page }) => {
    await page.goto('/components/toast');
    const region = demo(page, 'corner');
    await region.scrollIntoViewIfNeeded();
    await region.getByRole('button', { name: 'Five at once' }).click();
    const items = region.locator('.pp-toast[data-state="open"]');
    await expect(items).toHaveCount(3);
    await expect(items.first().locator('.pp-alert__title')).toHaveText('Notification 1');
    // The queue: dismissing one of the three lets the fourth in.
    await items.first().getByRole('button', { name: 'Dismiss' }).click();
    await expect(region.locator('.pp-toast[data-state="open"] .pp-alert__title').filter({ hasText: 'Notification 4' })).toHaveCount(1);
    await expect(items).toHaveCount(3);
    await expect(region.getByRole('region', { name: 'Notifications (F8)' })).toHaveCount(1);

    // F8 focuses A list (this page has a provider per stage, and every one
    // listens; an app has one), Tab reaches its first toast's button, and
    // Escape dismisses that toast.
    await page.keyboard.press('F8');
    await expect(page.locator('.pp-toast__viewport:focus')).toHaveCount(1);
    const index = await page.locator('.pp-toast__viewport').evaluateAll((els) => els.findIndex((el) => el === document.activeElement));
    const list = page.locator('.pp-toast__viewport').nth(index);
    const before = await list.locator('.pp-toast[data-state="open"]').count();
    expect(before).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
    const title = await page.evaluate(() => document.activeElement?.closest('.pp-toast')?.querySelector('.pp-alert__title')?.textContent ?? null);
    expect(title).not.toBeNull();
    await page.keyboard.press('Escape');
    // That toast is gone; a queued one may have taken its place.
    await expect(list.locator('.pp-toast[data-state="open"] .pp-alert__title').filter({ hasText: title! })).toHaveCount(0);
    expect(await list.locator('.pp-toast[data-state="open"]').count()).toBeLessThanOrEqual(before);
  });

  test('four corners, logically, and bottom-end is the bottom left under dir="rtl"', async ({ page }) => {
    await page.goto('/components/toast');
    const stages = demo(page, 'placements');
    await stages.scrollIntoViewIfNeeded();
    const read = await stages.locator('.toast-stage').evaluateAll((els) =>
      els.map((stage) => {
        const s = stage.getBoundingClientRect();
        const v = (stage.querySelector('.pp-toast__viewport') as HTMLElement).getBoundingClientRect();
        return {
          placement: stage.getAttribute('data-placement'),
          left: Math.abs(v.left - s.left) <= 1,
          right: Math.abs(v.right - s.right) <= 1,
          top: Math.abs(v.top - s.top) <= 1,
          bottom: Math.abs(v.bottom - s.bottom) <= 1,
          toasts: stage.querySelectorAll('.pp-toast').length,
          // The swipe, the one physical thing, toward the inline end.
          swipe: stage.querySelector('.pp-toast')?.getAttribute('data-swipe-direction'),
        };
      }),
    );
    expect(read).toEqual([
      { placement: 'top-start', left: true, right: false, top: true, bottom: false, toasts: 1, swipe: 'left' },
      { placement: 'top-end', left: false, right: true, top: true, bottom: false, toasts: 1, swipe: 'right' },
      { placement: 'bottom-start', left: true, right: false, top: false, bottom: true, toasts: 1, swipe: 'left' },
      { placement: 'bottom-end', left: false, right: true, top: false, bottom: true, toasts: 1, swipe: 'right' },
    ]);
    const rtl = demo(page, 'rtl');
    await rtl.scrollIntoViewIfNeeded();
    const mirrored = await rtl.evaluate((stage) => {
      const s = stage.getBoundingClientRect();
      const v = (stage.querySelector('.pp-toast__viewport') as HTMLElement).getBoundingClientRect();
      return {
        left: Math.abs(v.left - s.left) <= 1,
        bottom: Math.abs(v.bottom - s.bottom) <= 1,
        // The swipe, the one physical thing, resolved from the direction.
        swipe: stage.querySelector('.pp-toast')?.getAttribute('data-swipe-direction'),
      };
    });
    expect(mirrored).toEqual({ left: true, bottom: true, swipe: 'left' });
  });

  test('the gallery holds a toast per cell, fixed inside its stage, the region the cell or the token wide', async ({ page }) => {
    await page.goto('/components/toast');
    const read = await page.locator('.matrix .toast-stage').evaluateAll((els) =>
      els.map((stage) => {
        const s = stage.getBoundingClientRect();
        const v = (stage.querySelector('.pp-toast__viewport') as HTMLElement).getBoundingClientRect();
        return { inside: v.left >= s.left - 1 && v.right <= s.right + 1 && v.bottom <= s.bottom + 1, width: v.width, stage: stage.clientWidth, toasts: stage.querySelectorAll('.pp-toast').length };
      }),
    );
    expect(read).toHaveLength(3);
    expect(read.every((r) => r.inside && r.toasts === 1), JSON.stringify(read)).toBe(true);
    expect(Math.abs(read[0]!.width - read[0]!.stage)).toBeLessThanOrEqual(1);
    expect(Math.abs(read[2]!.width - 320)).toBeLessThanOrEqual(1);
  });
});

test.describe('CommandPalette', () => {
  type Page = import('@playwright/test').Page;
  const demo = (page: Page, id: string) => page.locator(`[data-testid="command-palette-${id}"]`);
  const panel = (page: Page) => page.locator('.pp-command-palette:not([data-gallery])');
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );

  const closeGallery = async (page: Page) => {
    await expect(page.locator('.pp-command-palette[data-gallery]')).toHaveCount(3);
    for (let left = 2; left >= 0; left -= 1) {
      await page.keyboard.press('Escape');
      await expect(page.locator('.pp-command-palette[data-gallery]')).toHaveCount(left);
    }
  };

  test('the panel sits the offset below the top, a token wide, over Dialog\'s scrim; the field is focused with its hairline lit; a row is the medium control', async ({
    page,
  }) => {
    await page.goto('/components/command-palette');
    await closeGallery(page);
    const trigger = demo(page, 'launcher').getByRole('button', { name: /Search commands/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const el = panel(page);
    await expect(el).toBeVisible();
    const offset = await px(page, '--pp-space-9');
    const width = await px(page, '--pp-measure-sm');
    const height = await px(page, '--pp-control-height-md');
    const read = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      const scrim = n.parentElement as HTMLElement;
      const field = n.querySelector('.pp-command-palette__field') as HTMLElement;
      const input = n.querySelector('.pp-command-palette__input') as HTMLElement;
      const row = n.querySelector('.pp-command-palette__item') as HTMLElement;
      return {
        top: r.top,
        width: r.width,
        centred: Math.abs(r.left + r.width / 2 - window.innerWidth / 2) <= 1,
        scrimZ: getComputedStyle(scrim).zIndex,
        scrimToken: getComputedStyle(scrim).getPropertyValue('--pp-z-overlay').trim(),
        padding: getComputedStyle(n).paddingTop,
        focused: document.activeElement === input,
        line: getComputedStyle(field).borderBottomColor,
        lineToken: getComputedStyle(field).getPropertyValue('--pp-tone-focus').trim(),
        inputOutline: getComputedStyle(input).outlineColor,
        row: row.getBoundingClientRect().height,
        animation: getComputedStyle(n).animationName,
      };
    });
    expect(Math.abs(read.top - offset)).toBeLessThanOrEqual(1);
    expect(Math.abs(read.width - width)).toBeLessThanOrEqual(1);
    expect(read.centred).toBe(true);
    expect(read.scrimZ).toBe(read.scrimToken);
    expect(read.padding).toBe('0px');
    expect(read.focused).toBe(true);
    const focusColour = await el.evaluate((n, token) => {
      const probe = document.createElement('i');
      probe.style.color = token;
      n.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    }, read.lineToken);
    expect(read.line, 'the field does not light its hairline on focus').toBe(focusColour);
    expect(read.inputOutline).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(Math.abs(read.row - height)).toBeLessThanOrEqual(1);
    expect(read.animation, 'not still under reduced motion').toBe('none');
  });

  test('type, arrow, Enter: the first match is highlighted, the command runs, the palette closes and focus returns; mod+k toggles', async ({ page }) => {
    await page.goto('/components/command-palette');
    await closeGallery(page);
    const region = demo(page, 'launcher');
    const trigger = region.getByRole('button', { name: /Search commands/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    await expect(el.getByRole('option').first()).toHaveAttribute('data-highlighted', '');
    await page.keyboard.type('new');
    await expect(el.getByRole('option')).toHaveCount(2);
    await expect(el.getByRole('option', { name: 'New issue' })).toHaveAttribute('data-highlighted', '');
    await page.keyboard.press('ArrowDown');
    await expect(el.getByRole('option', { name: 'New project' })).toHaveAttribute('data-highlighted', '');
    const fill = await el.getByRole('option', { name: 'New project' }).evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(fill).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Enter');
    await expect(el).toHaveCount(0);
    await expect(region.locator('xpath=..')).toContainText('last ran: new-project');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Control+k');
    await expect(el).toBeVisible();
    await expect(el.getByRole('combobox')).toBeFocused();
    await expect(el.getByRole('combobox')).toHaveValue('');
    await page.keyboard.press('Control+k');
    await expect(el).toHaveCount(0);
  });

  test('a long list scrolls and keeps the highlight in view; the theme crosses the portal', async ({ page }) => {
    await page.goto('/components/command-palette');
    await closeGallery(page);
    const trigger = demo(page, 'long').getByRole('button', { name: 'Thirty commands' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const el = panel(page);
    await expect(el).toBeVisible();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press('ArrowDown');
    const active = el.locator('[data-highlighted]');
    await expect(active).toHaveText('Command 21');
    const read = await active.evaluate((n) => {
      const list = n.closest('.pp-command-palette__list') as HTMLElement;
      const r = n.getBoundingClientRect();
      const p = list.getBoundingClientRect();
      return { inView: r.top >= p.top - 1 && r.bottom <= p.bottom + 1, scrolled: list.scrollTop > 0, overflow: getComputedStyle(list).overflowY };
    });
    expect(read).toEqual({ inView: true, scrolled: true, overflow: 'auto' });
    await page.keyboard.press('Escape');
    await expect(el).toHaveCount(0);

    const dark = demo(page, 'theme');
    await dark.scrollIntoViewIfNeeded();
    await dark.getByRole('button', { name: 'Open here' }).click();
    await expect(el).toBeVisible();
    await expect(el.locator('xpath=..')).toHaveAttribute('data-pp-theme', 'dark');
    const raised = await el.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim());
    expect(raised).toBe(await dark.evaluate((n) => getComputedStyle(n).getPropertyValue('--pp-color-bg-raised').trim()));
  });

  test('the gallery holds three, contained, each with the matches for "go" and the first highlighted', async ({ page }) => {
    await page.goto('/components/command-palette');
    const panels = page.locator('.pp-command-palette[data-gallery]');
    await expect(panels).toHaveCount(3);
    const read = await panels.evaluateAll((els) =>
      els.map((el) => {
        const scrim = el.parentElement as HTMLElement;
        const stage = scrim.parentElement as HTMLElement;
        const s = stage.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return {
          inside: r.left >= s.left - 1 && r.right <= s.right + 1,
          options: el.querySelectorAll('[role="option"]').length,
          highlighted: el.querySelectorAll('[data-highlighted]').length,
          width: r.width,
          stage: stage.clientWidth,
        };
      }),
    );
    expect(read.every((r) => r.inside && r.options === 3 && r.highlighted === 1), JSON.stringify(read)).toBe(true);
    expect(Math.abs(read[0]!.width - (read[0]!.stage - 2 * 16))).toBeLessThanOrEqual(1);
    expect(Math.abs(read[2]!.width - 640)).toBeLessThanOrEqual(1);
  });
});

test.describe('Card', () => {
  type Page = import('@playwright/test').Page;
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );
  const resolve = (page: Page, token: string) =>
    page.evaluate((t) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = `var(${t})`;
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return c;
    }, token);

  test('the raised surface, a hairline edge, no shadow; one hairline per adjacent pair; the foot sunken; the padding tokens', async ({ page }) => {
    await page.goto('/components/card');
    const raised = await resolve(page, '--pp-color-bg-raised');
    const sunken = await resolve(page, '--pp-color-bg-sunken');
    const inline = await px(page, '--pp-space-5');
    const block = await px(page, '--pp-space-4');
    const read = await page.locator('[data-testid="card-sections"] .pp-card').evaluateAll((els) =>
      els.map((card) => {
        const sections = Array.from(card.children) as HTMLElement[];
        return {
          bg: getComputedStyle(card).backgroundColor,
          edge: getComputedStyle(card).borderTopWidth,
          shadow: getComputedStyle(card).boxShadow,
          lines: sections.map((s) => getComputedStyle(s).borderTopWidth),
          padding: sections.map((s) => [getComputedStyle(s).paddingInlineStart, getComputedStyle(s).paddingBlockStart]),
          footer: sections.find((s) => s.classList.contains('pp-card__footer'))
            ? getComputedStyle(sections.find((s) => s.classList.contains('pp-card__footer'))!).backgroundColor
            : null,
        };
      }),
    );
    expect(read).toHaveLength(3);
    expect(read.every((r) => r.bg === raised && r.edge === '1px' && r.shadow === 'none')).toBe(true);
    expect(read[0]!.lines).toEqual(['0px']);
    expect(read[1]!.lines).toEqual(['0px', '1px']);
    expect(read[2]!.lines).toEqual(['0px', '1px', '1px']);
    expect(read[2]!.footer).toBe(sunken);
    expect(read[2]!.padding.every(([i, b]) => parseFloat(i!) === inline && parseFloat(b!) === block)).toBe(true);
  });

  test('an interactive card lifts on hover, rings on focus, and its text is not underlined; a URL stays inside at 240px', async ({ page }) => {
    await page.goto('/components/card');
    const link = page.locator('[data-testid="card-links"] .pp-card').first();
    await link.scrollIntoViewIfNeeded();
    const rest = await link.evaluate((n) => ({
      tag: n.tagName,
      shadow: getComputedStyle(n).boxShadow,
      decoration: getComputedStyle(n).textDecorationLine,
      heading: getComputedStyle(n.querySelector('.pp-heading, h3') as HTMLElement).textDecorationLine,
    }));
    expect(rest.tag).toBe('A');
    expect(rest.shadow).toBe('none');
    expect(rest.decoration).toBe('none');
    expect(rest.heading).toBe('none');
    await link.hover();
    await expect.poll(() => link.evaluate((n) => getComputedStyle(n).boxShadow)).not.toBe('none');
    const border = await link.evaluate((n) => getComputedStyle(n).borderTopColor);
    expect(border).toBe(await resolve(page, '--pp-color-border'));
    await link.focus();
    expect(await link.evaluate((n) => getComputedStyle(n).outlineStyle)).toBe('solid');

    const narrow = page.locator('.matrix__cell').first().locator('.pp-card');
    const fits = await narrow.evaluate((n) => n.scrollWidth <= n.clientWidth && n.getBoundingClientRect().width <= (n.parentElement as HTMLElement).getBoundingClientRect().width + 1);
    expect(fits, 'the URL pushed the card past its cell').toBe(true);
  });
});

test.describe('Progress', () => {
  type Page = import('@playwright/test').Page;
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );
  /* A token resolved INSIDE a tone scope, because the fill and the track are
     `--pp-tone-*` and read differently under `accent` and `neutral`. */
  const resolveIn = (page: Page, token: string, tone: string) =>
    page.evaluate(
      ([t, tn]) => {
        const scope = document.createElement('div');
        scope.setAttribute('data-pp-tone', tn!);
        const probe = document.createElement('div');
        probe.style.backgroundColor = `var(${t})`;
        scope.appendChild(probe);
        document.body.appendChild(scope);
        const c = getComputedStyle(probe).backgroundColor;
        scope.remove();
        return c;
      },
      [token, tone],
    );
  const geometry = (el: HTMLElement) => {
    const fill = el.firstElementChild as HTMLElement;
    const t = el.getBoundingClientRect();
    const f = fill.getBoundingClientRect();
    return {
      height: t.height,
      ratio: f.width / t.width,
      startGap: f.left - t.left,
      endGap: t.right - f.right,
      fillColor: getComputedStyle(fill).backgroundColor,
      trackColor: getComputedStyle(el).backgroundColor,
      transition: getComputedStyle(fill).transitionProperty,
      animation: getComputedStyle(fill).animationName,
    };
  };

  test('the fill is the value of the track and starts at its start; the thickness per size is the token; the colours are the tone\'s', async ({
    page,
  }) => {
    await page.goto('/components/progress');
    const read = await page.locator('[data-testid="progress-sizes"] .pp-progress').evaluateAll((els) =>
      els.map((el) => {
        const fill = el.firstElementChild as HTMLElement;
        const t = el.getBoundingClientRect();
        const f = fill.getBoundingClientRect();
        return {
          height: t.height,
          ratio: f.width / t.width,
          startGap: f.left - t.left,
          fillColor: getComputedStyle(fill).backgroundColor,
          trackColor: getComputedStyle(el).backgroundColor,
        };
      }),
    );
    expect(read).toHaveLength(3);
    expect(read.map((r) => r.height)).toEqual([await px(page, '--pp-space-1'), await px(page, '--pp-space-2'), await px(page, '--pp-space-3')]);
    for (const r of read) {
      expect(Math.abs(r.ratio - 0.6)).toBeLessThanOrEqual(0.005);
      expect(Math.abs(r.startGap)).toBeLessThanOrEqual(0.5);
      expect(r.fillColor).toBe(await resolveIn(page, '--pp-tone-solid', 'accent'));
      expect(r.trackColor).toBe(await resolveIn(page, '--pp-tone-border-subtle', 'accent'));
    }
    /* A neutral bar reads the neutral ramp: the tone is the root's scope. */
    const neutral = page.locator('[data-testid="progress-tones"] .pp-progress').nth(1);
    expect(await neutral.evaluate((n) => getComputedStyle(n.firstElementChild as HTMLElement).backgroundColor)).toBe(
      await resolveIn(page, '--pp-tone-solid', 'neutral'),
    );
  });

  test('in RTL the fill grows from the right edge with no rule for it; the bar fills its cell at three widths', async ({ page }) => {
    await page.goto('/components/progress');
    const rtl = await page.locator('[data-testid="progress-rtl"] .pp-progress').first().evaluate(geometry);
    expect(Math.abs(rtl.ratio - 0.4)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(rtl.endGap)).toBeLessThanOrEqual(0.5);
    expect(rtl.startGap).toBeGreaterThan(1);

    const cells = await page.locator('.matrix__cell .pp-progress').evaluateAll((els) =>
      els.map((el) => {
        const parent = el.parentElement as HTMLElement;
        return { bar: el.getBoundingClientRect().width, parent: parent.getBoundingClientRect().width };
      }),
    );
    expect(cells).toHaveLength(3);
    for (const c of cells) expect(Math.abs(c.bar - c.parent)).toBeLessThanOrEqual(1);
    expect(cells[0]!.bar).toBeLessThan(cells[2]!.bar);
  });

  /* playwright.config.ts pins reducedMotion: 'reduce' for every test, so
     this is the reduced-motion half by default: the segment is the whole
     bar and pulses, and the slide is off (spec §4). */
  test('under reduced motion the indeterminate segment is the whole bar, pulsing, and the slide is off', async ({ page }) => {
    await page.goto('/components/progress');
    const still = await page.locator('[data-testid="progress-indeterminate"] .pp-progress').evaluate(geometry);
    expect(still.animation).toBe('pp-progress-pulse');
    expect(Math.abs(still.ratio - 1)).toBeLessThanOrEqual(0.005);
    const slide = await page.locator('[data-testid="progress-sizes"] .pp-progress').first().evaluate(geometry);
    expect(slide.transition).toBe('none');
  });

  test.describe('with motion', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('the indeterminate segment is two fifths of the bar and moves; the slide is a flex-basis transition at the normal duration', async ({
      page,
    }) => {
      await page.goto('/components/progress');
      const bar = page.locator('[data-testid="progress-indeterminate"] .pp-progress');
      const first = await bar.evaluate(geometry);
      expect(first.animation).toBe('pp-progress-sweep');
      expect(Math.abs(first.ratio - 0.4)).toBeLessThanOrEqual(0.005);
      const at = () => bar.evaluate((el) => (el.firstElementChild as HTMLElement).getBoundingClientRect().left);
      const before = await at();
      await expect.poll(at, { message: 'the segment did not move' }).not.toBe(before);

      const slide = await page.locator('[data-testid="progress-sizes"] .pp-progress').first().evaluate((el) => {
        const style = getComputedStyle(el.firstElementChild as HTMLElement);
        return { property: style.transitionProperty, duration: style.transitionDuration };
      });
      expect(slide).toEqual({ property: 'flex-basis', duration: '0.22s' });
    });
  });
});

test.describe('Table', () => {
  type Page = import('@playwright/test').Page;
  const px = (page: Page, token: string) =>
    page.evaluate(
      (t) =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)) *
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      token,
    );
  const resolveIn = (page: Page, token: string, tone?: string) =>
    page.evaluate(
      ([t, tn]) => {
        const scope = document.createElement('div');
        if (tn) scope.setAttribute('data-pp-tone', tn);
        const probe = document.createElement('div');
        probe.style.backgroundColor = `var(${t})`;
        scope.appendChild(probe);
        document.body.appendChild(scope);
        const c = getComputedStyle(probe).backgroundColor;
        scope.remove();
        return c;
      },
      [token, tone ?? ''] as const,
    );

  test('at 240px the region scrolls inside its own box; at 960px the table is stretched to the region by the grid', async ({ page }) => {
    await page.goto('/components/table');
    const cells = await page.locator('.matrix__cell .pp-table').evaluateAll((els) =>
      els.map((el) => {
        const table = el.querySelector('table') as HTMLElement;
        const parent = el.parentElement as HTMLElement;
        const ps = getComputedStyle(parent);
        return {
          region: el.getBoundingClientRect().width,
          /* The cell's CONTENT box: the matrix pads its cells. */
          parent: parent.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight),
          scrolls: el.scrollWidth > el.clientWidth + 1,
          table: table.getBoundingClientRect().width,
          client: el.clientWidth,
        };
      }),
    );
    expect(cells).toHaveLength(3);
    for (const c of cells) expect(Math.abs(c.region - c.parent)).toBeLessThanOrEqual(1);
    expect(cells[0]!.scrolls, 'the narrow cell should scroll').toBe(true);
    /* And it scrolls rather than wraps: an id or a date stays on one line
       in the narrow cell; a `wrap` cell may break. */
    const lines = await page.locator('.matrix__cell').first().locator('tbody td').first().evaluate((n) => {
      const range = document.createRange();
      range.selectNodeContents(n);
      return { rects: range.getClientRects().length, ws: getComputedStyle(n).whiteSpace };
    });
    expect(lines).toEqual({ rects: 1, ws: 'nowrap' });
    const prose = await page.locator('[data-testid="table-labelled"] td[data-wrap]').first().evaluate((n) => {
      const range = document.createRange();
      range.selectNodeContents(n);
      return { rects: range.getClientRects().length, ws: getComputedStyle(n).whiteSpace };
    });
    expect(prose.ws).toBe('normal');
    expect(prose.rects).toBeGreaterThan(1);
    expect(cells[2]!.scrolls, 'the wide cell should not scroll').toBe(false);
    /* The grid's stretch: a table narrower than its region by content is
       made the region's width (less the frame). */
    expect(Math.abs(cells[2]!.table - cells[2]!.client)).toBeLessThanOrEqual(1);
    expect(cells[2]!.table).toBeGreaterThan(cells[1]!.table);
  });

  test('hairlines on every row but the last; the header and the foot sunken, the head\'s text small, medium and muted; the padding per size; tabular figures', async ({
    page,
  }) => {
    await page.goto('/components/table');
    const sunken = await resolveIn(page, '--pp-color-bg-sunken');
    const muted = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--pp-color-text-muted)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    const read = await page.locator('[data-testid="table-sizes"] .pp-table').evaluateAll((els) =>
      els.map((el) => {
        const rows = Array.from(el.querySelectorAll('tr'));
        const firstCell = (r: Element) => r.querySelector('th, td') as HTMLElement;
        const head = el.querySelector('th') as HTMLElement;
        const headStyle = getComputedStyle(head);
        return {
          lines: rows.map((r) => getComputedStyle(firstCell(r)).borderBottomWidth),
          headerBg: getComputedStyle(el.querySelector('thead')!).backgroundColor,
          footerBg: getComputedStyle(el.querySelector('tfoot')!).backgroundColor,
          headColor: headStyle.color,
          headSize: headStyle.fontSize,
          headWeight: headStyle.fontWeight,
          headAlign: headStyle.textAlign,
          padding: [getComputedStyle(head).paddingTop, getComputedStyle(head).paddingLeft],
          numeric: getComputedStyle(el.querySelector('td')!).fontVariantNumeric,
        };
      }),
    );
    expect(read).toHaveLength(3);
    const px1 = await px(page, '--pp-space-1');
    const px2 = await px(page, '--pp-space-2');
    const px3 = await px(page, '--pp-space-3');
    const px4 = await px(page, '--pp-space-4');
    expect(read.map((r) => r.padding.map(parseFloat))).toEqual([
      [px1, px3],
      [px2, px4],
      [px3, px4],
    ]);
    for (const r of read) {
      /* header row, four body rows, footer row: a line under each but the last. */
      expect(r.lines).toEqual(['1px', '1px', '1px', '1px', '1px', '0px']);
      expect(r.headerBg).toBe(sunken);
      expect(r.footerBg).toBe(sunken);
      expect(r.headColor).toBe(muted);
      expect(parseFloat(r.headSize)).toBe(await px(page, '--pp-font-size-2'));
      expect(r.headWeight).toBe('500');
      /* Not the UA's centre: a heading starts where its column does. */
      expect(r.headAlign).toBe('start');
      expect(r.numeric).toBe('tabular-nums');
    }
  });

  test('striped even rows; a selected row in the accent ramp; align=end; the ring on the focused region', async ({ page }) => {
    await page.goto('/components/table');
    const sunken = await resolveIn(page, '--pp-color-bg-sunken');
    const striped = await page.locator('[data-testid="table-striped"] tbody tr').evaluateAll((rows) =>
      rows.map((r) => getComputedStyle(r).backgroundColor),
    );
    expect(striped).toHaveLength(4);
    expect(striped[1]).toBe(sunken);
    expect(striped[3]).toBe(sunken);
    expect(striped[0]).not.toBe(sunken);
    expect(striped[2]).not.toBe(sunken);

    const selected = page.locator('[data-testid="table-selected"] tr[data-state="selected"]');
    expect(await selected.evaluate((r) => getComputedStyle(r).backgroundColor)).toBe(await resolveIn(page, '--pp-tone-bg', 'accent'));
    const unselected = await page.locator('[data-testid="table-selected"] tbody tr').first().evaluate((r) => getComputedStyle(r).backgroundColor);
    expect(unselected).not.toBe(await resolveIn(page, '--pp-tone-bg', 'accent'));

    const amount = page.locator('[data-testid="table-selected"] td[data-align="end"]').first();
    expect(await amount.evaluate((n) => getComputedStyle(n).textAlign)).toBe('end');
    /* And in RTL, `end` is the left: the number's box ends at the cell's left padding edge. */
    const rtl = await page.locator('[data-testid="table-rtl"] td[data-align="end"]').first().evaluate((n) => {
      const range = document.createRange();
      range.selectNodeContents(n);
      const text = range.getBoundingClientRect();
      const cell = n.getBoundingClientRect();
      return { textLeft: text.left - cell.left, pad: parseFloat(getComputedStyle(n).paddingLeft) };
    });
    expect(Math.abs(rtl.textLeft - rtl.pad)).toBeLessThanOrEqual(1);

    /* The ring is POLLED, not read in the frame focus landed in: the reset
       crushes every transition to 0.01ms under reduced motion (which this
       suite pins) and leaves `transition-property: all`, so the outline
       focus switches on is a transition from 0px, and a read in the same
       frame sees its start value (D-081 §5). */
    const region = page.locator('[data-testid="table-labelled"] .pp-table');
    await region.focus();
    await expect.poll(() => region.evaluate((n) => parseFloat(getComputedStyle(n).outlineWidth))).toBeGreaterThan(0);
    expect(await region.evaluate((n) => getComputedStyle(n).outlineStyle)).toBe('solid');
  });
});
