/**
 * Joins class names, dropping falsy entries. Returns `undefined` rather than an
 * empty string so a component never emits `class=""`.
 */
export function cx(...parts: Array<string | false | null | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join(' ');
  return joined.length > 0 ? joined : undefined;
}
