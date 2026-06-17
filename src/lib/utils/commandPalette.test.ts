import test from 'node:test';
import assert from 'node:assert/strict';

const { filterCommandPaletteItems } = await import(
  new URL('./commandPalette.ts', import.meta.url).href
);

function ids(results: Array<{ id: string }>): string[] {
  return results.map(item => item.id);
}

const items = [
  { id: 'new-note', label: 'New note', kind: 'command' as const },
  { id: 'split', label: 'Switch to Split', kind: 'command' as const },
  { id: 'ironia', label: 'Ironia, Sarcasmo e Deboche', kind: 'note' as const },
  { id: 'cafe', label: 'Café ideas', kind: 'note' as const },
  { id: 'daily', label: 'My daily note', kind: 'note' as const },
];

test('finds a note by a case-insensitive title substring', () => {
  assert.deepEqual(
    ids(filterCommandPaletteItems(items, 'IRON')),
    ['ironia'],
  );
});

test('matches titles without requiring typed accents', () => {
  assert.deepEqual(
    ids(filterCommandPaletteItems(items, 'cafe')),
    ['cafe'],
  );
});

test('ranks prefix matches ahead of later word and substring matches', () => {
  const ranked = filterCommandPaletteItems([
    { id: 'prefix', label: 'Note archive', kind: 'note' as const },
    { id: 'word', label: 'Daily note', kind: 'note' as const },
    { id: 'substring', label: 'Footnotes', kind: 'note' as const },
  ], 'note');

  assert.deepEqual(ids(ranked), ['prefix', 'word', 'substring']);
});

test('ranks commands ahead of notes when match quality is equal', () => {
  const ranked = filterCommandPaletteItems([
    { id: 'note', label: 'New notebook', kind: 'note' as const },
    { id: 'command', label: 'New note', kind: 'command' as const },
  ], 'new');

  assert.deepEqual(ids(ranked), ['command', 'note']);
});

test('returns commands before notes when the query is empty', () => {
  const ranked = filterCommandPaletteItems(items, '');

  assert.deepEqual(ids(ranked), [
    'new-note',
    'split',
    'cafe',
    'ironia',
    'daily',
  ]);
});
