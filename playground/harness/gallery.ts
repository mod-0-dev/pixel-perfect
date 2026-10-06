/**
 * `?gallery=open` — the one switch between the page a visitor gets and the
 * page the screenshot suite captures (D-102 §1).
 *
 * The four modal galleries (Dialog, AlertDialog, Drawer, CommandPalette)
 * used to open all three of their dialogs at load. Three modals at once lock
 * the page's scroll and pointer and hide the rest of it from assistive
 * tech, and the only way back the page offered was Escape, three times — a
 * key a phone does not have. So by default each cell has a trigger and its
 * dialog stays closed until asked; the suite passes this parameter and gets
 * the three-at-once gallery it has always captured.
 *
 * Read on the server from the page's `searchParams`, so the first render
 * already knows which page it is and nothing changes on hydration.
 */
export type GalleryParams = Record<string, string | string[] | undefined>;

export function galleryOpen(params: GalleryParams): boolean {
  return params.gallery === 'open';
}
