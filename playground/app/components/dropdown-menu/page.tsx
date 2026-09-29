/*
 * A Server Component. `DropdownMenu` is `'use client'` and every demo lives
 * in Demos.tsx — including the Matrix gallery, whose menus need two event
 * handlers to sit open together (D-062 §2).
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the menu's ids come from `useId()`,
 * and the browser suite finds its sections by `data-testid`.
 */
import { Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Gallery, Long, Outside, RowActions, ThemeCrossing, ViewMenu } from './Demos';

export default function DropdownMenuPage() {
  return (
    <>
      <h1>4.7 DropdownMenu</h1>
      <p>
        A list of commands anchored to the button that opened it. Behaviour is Radix&rsquo;s menu
        &mdash; roving focus, typeahead, submenus &mdash; and every row, mark, label, separator and
        pixel is ours. The direction is read from the trigger at open time and handed to Radix, so
        the arrow keys and the submenu&rsquo;s side read correctly in a right-to-left page.
      </p>

      <section>
        <h2>Open, at every width</h2>
        <p>
          Each cell&rsquo;s menu is portalled to the body and paints in the theme it was opened in.
          A checkable item gives the list its gutter, so every label aligns; a menu of plain
          commands has none.
        </p>
        <Matrix>
          <Gallery />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>The actions on a row</h2>
        <Text>
          Plain commands with shortcut hints, a submenu that opens on the arrow key pointing into it
          (<code>ArrowRight</code> here, <code>ArrowLeft</code> in the right-to-left row), a
          disabled item, and a destructive one. Type the first letter of an item to jump to it.
        </Text>
        <Stack gap="4">
          <RowActions />
          <RowActions dir="rtl" />
        </Stack>
      </section>

      <section>
        <h2>Checkable, and one of many</h2>
        <Text>
          A radio group and checkbox items under labels. These stay open on selection because their
          <code>onSelect</code> prevents the default; the plain item at the end closes the menu, and
          its label sits on the same line as the others.
        </Text>
        <ViewMenu />
      </section>

      <section>
        <h2>Modal: an outside press closes, and does not land</h2>
        <Text>
          The default. Open the menu and press Outside: the menu closes and the count does not move,
          as with every native menu.
        </Text>
        <Outside />
      </section>

      <section>
        <h2>The ceiling, and a list that scrolls</h2>
        <Text>
          A label longer than <code>--pp-measure-xs</code> wraps inside the ceiling; thirty items
          scroll inside the list, never the page.
        </Text>
        <Long />
      </section>

      <section>
        <h2>The theme crosses the portal</h2>
        <Text>
          A dark region on this light page. The menu opened from inside it is portalled to the body
          &mdash; outside the region &mdash; and paints dark.
        </Text>
        <ThemeCrossing />
      </section>
    </>
  );
}
