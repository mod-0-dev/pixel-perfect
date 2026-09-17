/**
 * The fixed prop vocabulary from RULES §5. Components import these rather than
 * redeclaring them, so a tone or size can never mean something different in
 * two places.
 */

export type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning';

export type Size = 'sm' | 'md' | 'lg';

export type Variant = 'solid' | 'outline' | 'ghost' | 'plain';
