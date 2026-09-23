/**
 * Every component page in the playground. The home page navigation and the
 * visual-regression spec both read from here, so adding a component is one
 * entry rather than three edits.
 *
 * In roadmap order, because the home page prints `tier` beside `name` and a
 * list that reads 1.3, 1.5, 1.8, 1.10, 1.6 is a list nobody can scan.
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
  { slug: 'visually-hidden', name: 'VisuallyHidden', tier: '1.4' },
  { slug: 'separator', name: 'Separator', tier: '1.5' },
  { slug: 'spinner', name: 'Spinner', tier: '1.6' },
  { slug: 'skeleton', name: 'Skeleton', tier: '1.7' },
  { slug: 'badge', name: 'Badge', tier: '1.8' },
  { slug: 'avatar', name: 'Avatar', tier: '1.9' },
  { slug: 'kbd', name: 'Kbd', tier: '1.10' },
  { slug: 'code', name: 'Code', tier: '1.11' },
  { slug: 'stack', name: 'Stack', tier: '2.1' },
  { slug: 'cluster', name: 'Cluster', tier: '2.2' },
  { slug: 'grid', name: 'Grid', tier: '2.3' },
  { slug: 'container', name: 'Container', tier: '2.4' },
  { slug: 'center', name: 'Center', tier: '2.5' },
  { slug: 'split', name: 'Split', tier: '2.6' },
  { slug: 'aspect-ratio', name: 'AspectRatio', tier: '2.7' },
  { slug: 'scroller', name: 'Scroller', tier: '2.8' },
  { slug: 'button', name: 'Button', tier: '3.1' },
  { slug: 'icon-button', name: 'IconButton', tier: '3.2' },
  { slug: 'link', name: 'Link', tier: '3.3' },
  { slug: 'button-group', name: 'ButtonGroup', tier: '3.4' },
  { slug: 'toggle', name: 'Toggle', tier: '3.5' },
  { slug: 'label', name: 'Label', tier: '3.6' },
  { slug: 'field', name: 'Field', tier: '3.7' },
  { slug: 'input', name: 'Input', tier: '3.8' },
  { slug: 'textarea', name: 'Textarea', tier: '3.9' },
  { slug: 'checkbox', name: 'Checkbox', tier: '3.10' },
  { slug: 'radio', name: 'Radio', tier: '3.11' },
  { slug: 'switch', name: 'Switch', tier: '3.12' },
  { slug: 'select', name: 'Select', tier: '3.13' },
  { slug: 'number-input', name: 'NumberInput', tier: '3.14' },
  { slug: 'slider', name: 'Slider', tier: '3.15' },
  { slug: 'form', name: 'Form', tier: '3.16' },
  { slug: 'alert', name: 'Alert', tier: '5.2' },
];
