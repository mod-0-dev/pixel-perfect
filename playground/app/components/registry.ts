/**
 * Every component page in the playground. The home page, the page chrome and
 * the visual-regression spec all read from here, so adding a component is one
 * entry rather than three edits.
 *
 * In roadmap order, because the home page groups by tier and prints `tier`
 * beside `name`, and a list that reads 1.3, 1.5, 1.8, 1.10, 1.6 is a list
 * nobody can scan.
 */
export interface ComponentEntry {
  /** URL segment and screenshot name. */
  slug: string;
  name: string;
  tier: string;
  /** One line, for the index card. What it is, not how it is built. */
  summary: string;
}

export interface TierEntry {
  /** The number before the dot. */
  id: string;
  name: string;
  blurb: string;
}

export const TIERS: TierEntry[] = [
  { id: '1', name: 'Atoms', blurb: 'Type, icons, and the small things that sit inline with text.' },
  { id: '2', name: 'Layout primitives', blurb: 'The only components allowed to space and size others.' },
  { id: '3', name: 'Form & action core', blurb: 'Buttons, links, fields and every native input, on one control scale.' },
  { id: '4', name: 'Overlays & disclosure', blurb: 'Behaviour from Radix Primitives; every node and pixel ours.' },
  { id: '5', name: 'Composition & data', blurb: 'Blocks made of the tiers below.' },
];

export const COMPONENTS: ComponentEntry[] = [
  { slug: 'text', name: 'Text', tier: '1.1', summary: 'Body copy on the type scale, with tone, weight and truncation.' },
  { slug: 'heading', name: 'Heading', tier: '1.2', summary: 'A semantic level and a visual size, decoupled on purpose.' },
  { slug: 'icon', name: 'Icon', tier: '1.3', summary: 'Your SVG at a scale step, decorative or named.' },
  { slug: 'visually-hidden', name: 'VisuallyHidden', tier: '1.4', summary: 'In the accessibility tree, out of sight.' },
  { slug: 'separator', name: 'Separator', tier: '1.5', summary: 'A divider with no contrast obligation, either axis.' },
  { slug: 'spinner', name: 'Spinner', tier: '1.6', summary: 'Indeterminate progress, named for a screen reader.' },
  { slug: 'skeleton', name: 'Skeleton', tier: '1.7', summary: 'The shape of content that has not arrived.' },
  { slug: 'badge', name: 'Badge', tier: '1.8', summary: 'A small label with a tone; ghost by default.' },
  { slug: 'avatar', name: 'Avatar', tier: '1.9', summary: 'An image with initials to fall back on.' },
  { slug: 'kbd', name: 'Kbd', tier: '1.10', summary: 'A key, drawn as one.' },
  { slug: 'code', name: 'Code', tier: '1.11', summary: 'Inline code in the mono face.' },
  { slug: 'stack', name: 'Stack', tier: '2.1', summary: 'A column with a gap from the space scale.' },
  { slug: 'cluster', name: 'Cluster', tier: '2.2', summary: 'A row that wraps, with justification and alignment.' },
  { slug: 'grid', name: 'Grid', tier: '2.3', summary: 'Tracks that reflow by container width, never by viewport.' },
  { slug: 'container', name: 'Container', tier: '2.4', summary: 'The one component allowed a max-width: a measure and a gutter.' },
  { slug: 'center', name: 'Center', tier: '2.5', summary: 'Centres its child on one axis or both.' },
  { slug: 'split', name: 'Split', tier: '2.6', summary: 'A sidebar and a main column that collapse on their own width.' },
  { slug: 'aspect-ratio', name: 'AspectRatio', tier: '2.7', summary: 'A box that keeps its shape at any width.' },
  { slug: 'scroller', name: 'Scroller', tier: '2.8', summary: 'A scroll region that shows which edge has more.' },
  { slug: 'button', name: 'Button', tier: '3.1', summary: 'Four variants, five tones, three sizes; loading keeps its name.' },
  { slug: 'icon-button', name: 'IconButton', tier: '3.2', summary: 'A square button whose label is required by the type.' },
  { slug: 'link', name: 'Link', tier: '3.3', summary: 'An anchor with a tone and an underline policy; wraps next/link.' },
  { slug: 'button-group', name: 'ButtonGroup', tier: '3.4', summary: 'Buttons edge to edge, one seam between them.' },
  { slug: 'toggle', name: 'Toggle', tier: '3.5', summary: 'A pressed button, with aria-pressed and a distinct pressed look.' },
  { slug: 'label', name: 'Label', tier: '3.6', summary: 'A label on the control scale, with the required mark.' },
  { slug: 'field', name: 'Field', tier: '3.7', summary: 'Label, description, error and every ARIA relationship, wired once.' },
  { slug: 'input', name: 'Input', tier: '3.8', summary: 'The text control, on the shared control surface.' },
  { slug: 'textarea', name: 'Textarea', tier: '3.9', summary: 'Rows as a floor, and a grow-with-content option.' },
  { slug: 'checkbox', name: 'Checkbox', tier: '3.10', summary: 'Tri-state, and only the caller can set the third.' },
  { slug: 'radio', name: 'Radio', tier: '3.11', summary: 'A group that owns the value; radios that read :checked.' },
  { slug: 'switch', name: 'Switch', tier: '3.12', summary: 'A 2:1 track whose thumb is the state indicator.' },
  { slug: 'select', name: 'Select', tier: '3.13', summary: 'The native select first, with our chevron.' },
  { slug: 'number-input', name: 'NumberInput', tier: '3.14', summary: 'A spinbutton on a text input; clamps and snaps on commit.' },
  { slug: 'slider', name: 'Slider', tier: '3.15', summary: 'A native range input; our track, the platform’s thumb.' },
  { slug: 'form', name: 'Form', tier: '3.16', summary: 'An error summary that moves focus, and one submission at a time.' },
  { slug: 'range-slider', name: 'RangeSlider', tier: '3.17', summary: 'Two thumbs that cannot cross, with the ring on the one that has focus.' },
  { slug: 'popover', name: 'Popover', tier: '4.2', summary: 'A named panel anchored to its trigger; the theme crosses the portal.' },
  { slug: 'alert', name: 'Alert', tier: '5.2', summary: 'A tone-coloured block for something that happened or is true.' },
];
