/**
 * Every component page in the playground. The home page navigation and the
 * visual-regression spec both read from here, so adding a component is one
 * entry rather than three edits.
 */
export interface ComponentEntry {
  /** URL segment and screenshot name. */
  slug: string;
  name: string;
  tier: string;
}

export const COMPONENTS: ComponentEntry[] = [
  { slug: 'visually-hidden', name: 'VisuallyHidden', tier: '1.4' },
];
