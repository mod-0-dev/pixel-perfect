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
  { slug: 'text', name: 'Text', tier: '1.1' },
  { slug: 'heading', name: 'Heading', tier: '1.2' },
  { slug: 'icon', name: 'Icon', tier: '1.3' },
  { slug: 'separator', name: 'Separator', tier: '1.5' },
  { slug: 'badge', name: 'Badge', tier: '1.8' },
  { slug: 'kbd', name: 'Kbd', tier: '1.10' },
  { slug: 'code', name: 'Code', tier: '1.11' },
  { slug: 'spinner', name: 'Spinner', tier: '1.6' },
  { slug: 'skeleton', name: 'Skeleton', tier: '1.7' },
  { slug: 'avatar', name: 'Avatar', tier: '1.9' },
  { slug: 'visually-hidden', name: 'VisuallyHidden', tier: '1.4' },
  { slug: 'stack', name: 'Stack', tier: '2.1' },
  { slug: 'cluster', name: 'Cluster', tier: '2.2' },
  { slug: 'grid', name: 'Grid', tier: '2.3' },
  { slug: 'container', name: 'Container', tier: '2.4' },
  { slug: 'center', name: 'Center', tier: '2.5' },
  { slug: 'split', name: 'Split', tier: '2.6' },
  { slug: 'aspect-ratio', name: 'AspectRatio', tier: '2.7' },
  { slug: 'scroller', name: 'Scroller', tier: '2.8' },
  { slug: 'button', name: 'Button', tier: '3.1' },
  { slug: 'link', name: 'Link', tier: '3.3' },
  { slug: 'icon-button', name: 'IconButton', tier: '3.2' },
  { slug: 'toggle', name: 'Toggle', tier: '3.5' },
  { slug: 'button-group', name: 'ButtonGroup', tier: '3.4' },
  { slug: 'label', name: 'Label', tier: '3.6' },
];
