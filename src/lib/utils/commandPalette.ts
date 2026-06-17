export interface CommandPaletteSearchItem {
  id: string;
  label: string;
  kind: 'command' | 'note';
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

function matchScore(label: string, query: string): number | null {
  if (!query) return 0;
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (label.split(/\s+/).some(word => word.startsWith(query))) return 2;
  if (label.includes(query)) return 3;
  return null;
}

export function filterCommandPaletteItems<T extends CommandPaletteSearchItem>(
  items: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchText(query);

  return items
    .map((item, index) => ({
      item,
      index,
      score: matchScore(normalizeSearchText(item.label), normalizedQuery),
    }))
    .filter((entry): entry is typeof entry & { score: number } => entry.score !== null)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.item.kind !== b.item.kind) return a.item.kind === 'command' ? -1 : 1;
      if (!normalizedQuery && a.item.kind === 'command') return a.index - b.index;
      return a.item.label.localeCompare(b.item.label, undefined, { sensitivity: 'base' });
    })
    .map(entry => entry.item);
}
