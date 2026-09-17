/**
 * The fixed prop vocabulary from RULES §5. Components import these rather than
 * redeclaring them, so a tone or size can never mean something different in
 * two places.
 */

export type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning';

export type Size = 'sm' | 'md' | 'lg';

export type Variant = 'solid' | 'outline' | 'ghost' | 'plain';

/**
 * A step of the space scale, as taken by the `gap` prop on a layout primitive
 * (D-020). The value is spelled identically to the token it resolves to, so
 * `gap="4"` is `--pp-space-4` and the mapping needs no documentation.
 *
 * A string rather than a number on purpose: `gap={4}` reads like a length, and
 * the first question anyone asks is whether it means 4px or step 4.
 */
export type Space = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/** Cross-axis alignment, fixed across every layout primitive (D-022 §1). */
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/**
 * Main-axis distribution, fixed across every layout primitive (D-022 §1).
 * `between` / `around` / `evenly` drop CSS's `space-` prefix — `between` is the
 * only value in the set that would carry it, and the enum reads better uniform.
 */
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
