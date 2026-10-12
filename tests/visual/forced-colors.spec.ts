import { expect, test } from './fixtures';

/**
 * FORCED COLOURS (D-110 §2). Behaviour only — no screenshot, so no baseline.
 *
 * Windows' contrast themes replace every author colour with the user's
 * palette, and keep only system colours. Before D-110 no stylesheet had a
 * `forced-colors` rule, and every state below that was painted as a fill
 * vanished: a pressed Toggle looked released, a Progress bar was blank, the
 * chosen radio, segment, tab, page and day looked like their neighbours.
 *
 * Each case names a state and the thing it must differ from, on the
 * component's own harness page, and compares what is actually painted.
 */
type Probe = { selector: string; pseudo?: '::after'; prop: 'backgroundColor' | 'borderBottomColor' };
type Case = { page: string; what: string; state: Probe; rest: Probe };

const bg = (selector: string): Probe => ({ selector, prop: 'backgroundColor' });

const CASES: Case[] = [
  { page: 'toggle', what: 'a pressed Toggle', state: bg('.pp-toggle[data-state="on"]:not([data-disabled])'), rest: bg('.pp-toggle[data-state="off"]:not([data-disabled])') },
  {
    page: 'segmented-control',
    what: 'the chosen segment',
    state: bg('.pp-segmented-control__item:not([data-disabled]):has(:checked)'),
    rest: bg('.pp-segmented-control__item:not([data-disabled]):not(:has(:checked))'),
  },
  {
    page: 'tabs',
    what: 'the active tab’s bar',
    state: { selector: '.pp-tabs__tab[data-state="active"]', pseudo: '::after', prop: 'borderBottomColor' },
    rest: { selector: '.pp-tabs__tab[data-state="inactive"]:not(:disabled)', pseudo: '::after', prop: 'borderBottomColor' },
  },
  { page: 'switch', what: 'an on Switch’s track', state: bg('.pp-switch[data-state="checked"]:not([data-disabled]) .pp-switch__input'), rest: bg('.pp-switch[data-state="unchecked"]:not([data-disabled]) .pp-switch__input') },
  { page: 'switch', what: 'an off Switch’s thumb', state: bg('.pp-switch[data-state="unchecked"]:not([data-disabled]) .pp-switch__thumb'), rest: bg('.pp-switch[data-state="unchecked"]:not([data-disabled]) .pp-switch__input') },
  { page: 'radio', what: 'the chosen radio', state: bg('.pp-radio:not([data-disabled]):has(:checked) .pp-radio__indicator'), rest: bg('.pp-radio:not([data-disabled]):has(:checked) .pp-radio__input') },
  { page: 'progress', what: 'a Progress fill', state: bg('.pp-progress[data-state="determinate"] .pp-progress__fill'), rest: bg('.pp-progress[data-state="determinate"]') },
  { page: 'slider', what: 'a Slider fill', state: bg('.pp-slider__fill'), rest: bg('.pp-slider__track') },
  { page: 'pagination', what: 'the current page', state: bg('.pp-pagination__page[aria-current="page"]'), rest: bg('.pp-pagination__page:not([aria-current])') },
  { page: 'calendar', what: 'the selected day', state: bg('.pp-calendar__day[data-state="selected"]'), rest: bg('.pp-calendar__day:not([data-state="selected"], [data-outside])') },
  { page: 'tree', what: 'the selected row', state: bg('.pp-tree__row[data-selected]'), rest: bg('.pp-tree__row:not([data-selected])') },
  { page: 'nav-sidebar', what: 'the current link', state: bg('.pp-nav-sidebar__link[aria-current="page"]'), rest: bg('.pp-nav-sidebar__link:not([aria-current])') },
];

test.describe('in forced colours', () => {
  test.use({ forcedColors: 'active' });

  for (const c of CASES) {
    test(`${c.what} differs from its neighbours`, async ({ page }) => {
      await page.goto(`/components/${c.page}`);
      // What is painted, not what is declared: a transparent fill shows the
      // first ancestor that has one, so that is the colour compared.
      const read = (p: Probe) =>
        page
          .locator(p.selector)
          .first()
          .evaluate((el, q) => {
            const clear = (c: string) => c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);
            if (q.prop !== 'backgroundColor') return getComputedStyle(el, q.pseudo ?? null)[q.prop];
            for (let node: Element | null = el; node; node = node.parentElement) {
              const c = getComputedStyle(node).backgroundColor;
              if (!clear(c)) return c;
            }
            return 'canvas';
          }, p);
      const [state, rest] = await Promise.all([read(c.state), read(c.rest)]);
      expect(state, `${c.what} is painted like its neighbours`).not.toBe(rest);
    });
  }
});
