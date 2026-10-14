import { TIERS, type ComponentEntry } from '../app/components/registry';

/**
 * The one matcher behind both ways of finding a component: the filter on the
 * index and the quick-find palette in the chrome. Every word typed must
 * appear somewhere in the entry — its name, slug, tier number, tier name or
 * summary — so "dialog" finds Dialog and AlertDialog, "modal" finds what
 * says it is one, and "overlay" the whole tier. Order is the registry's, so
 * a filtered list still reads in tier order.
 */
const TIER_NAMES = new Map(TIERS.map((tier) => [tier.id, tier.name]));

const haystack = (entry: ComponentEntry) =>
  [entry.name, entry.slug, entry.tier, TIER_NAMES.get(entry.tier.split('.')[0] ?? ''), entry.summary]
    .join(' ')
    .toLowerCase();

export function findComponents(entries: ComponentEntry[], query: string): ComponentEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;
  return entries.filter((entry) => {
    const text = haystack(entry);
    return words.every((word) => text.includes(word));
  });
}

export const tierOf = (entry: ComponentEntry) => entry.tier.split('.')[0];
