/**
 * Whether a key pressed on this element belongs to a caret.
 *
 * A toolbar leaves the arrows to a text field (Toolbar §4) and a bare
 * shortcut never fires inside one (KeyHints §1): the same question, asked
 * once (D-100 §7). An <input> whose type does not edit text — a button, a
 * checkbox, a file picker — is not editing; everything else that takes
 * typing is, including `range`, `number` and the date kinds, whose arrows
 * step a value.
 *
 * Internal. Not exported from the package.
 */
const NON_EDITING_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'color']);

export function isEditing(el: Element | null | undefined): boolean {
  if (!el) return false;
  const element = el as HTMLElement;
  if (element.isContentEditable) return true;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT') return !NON_EDITING_INPUT_TYPES.has((element as HTMLInputElement).type);
  return false;
}
