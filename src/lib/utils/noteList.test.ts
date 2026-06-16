import test from 'node:test';
import assert from 'node:assert/strict';

const noteList = await import(
  new URL('./noteList.ts', import.meta.url).href
);
const { getFolderNoteEntries, notesDirNeedsRefresh } = noteList;

const entries = [
  { name: 'Root', path: 'C:\\Vault\\Root.md' },
  { name: 'Nested', path: 'C:\\Vault\\Projects\\Nested.md' },
  { name: 'Deep', path: 'C:\\Vault\\Projects\\Ideas\\Deep.md' },
];

function names(list: Array<{ name: string }>): string[] {
  return list.map((entry) => entry.name);
}

test('all notes includes root and nested notes', () => {
  assert.deepEqual(
    names(getFolderNoteEntries(entries, null, 'C:\\Vault')),
    ['Deep', 'Nested', 'Root'],
  );
});

test('folder notes are matched relative to the active notes directory', () => {
  assert.deepEqual(
    names(getFolderNoteEntries(entries, 'Projects', 'C:\\Vault')),
    ['Nested'],
  );
});

test('stale notes directory is detected after switching home folder', () => {
  assert.equal(notesDirNeedsRefresh('C:\\OldVault', entries), true);
  assert.equal(notesDirNeedsRefresh('C:\\Vault', entries), false);
});
