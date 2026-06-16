import type { NoteEntry } from '$lib/stores/notes';

export function normalizeListPath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

export function notesDirNeedsRefresh(notesDir: string, entries: NoteEntry[]): boolean {
  if (!notesDir) return true;
  const base = normalizeListPath(notesDir).replace(/\/+$/, '');
  return entries.some((entry) => !normalizeListPath(entry.path).startsWith(`${base}/`));
}

export function getFolderNoteEntries(
  entries: NoteEntry[],
  selectedFolder: string | null,
  notesDir: string,
): NoteEntry[] {
  const folder = normalizeListPath(selectedFolder ?? '').replace(/^\/+|\/+$/g, '');
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  if (!folder) {
    return sorted;
  }

  const base = normalizeListPath(notesDir).replace(/\/+$/, '');
  return sorted.filter((entry) => {
    const notePath = normalizeListPath(entry.path);
    if (!base || !notePath.startsWith(`${base}/`)) {
      return false;
    }

    const relative = notePath.slice(base.length + 1);
    const slashIndex = relative.lastIndexOf('/');
    const parent = slashIndex === -1 ? '' : relative.slice(0, slashIndex);
    return parent === folder;
  });
}
