import test from 'node:test';
import assert from 'node:assert/strict';

const { isSameNotePath, visibleNotesAfterOptimisticDelete } = await import(
  new URL('./noteDeletion.ts', import.meta.url).href
);

test('isSameNotePath treats Windows slash and case variants as the same note', () => {
  assert.equal(
    isSameNotePath('C:\\Notes\\Open.md', 'c:/notes/open.md'),
    true,
  );
});

test('visibleNotesAfterOptimisticDelete hides deleted paths from stale note listings', () => {
  const entries = [
    { name: 'Keep', path: 'C:/notes/Keep.md' },
    { name: 'Delete me', path: 'C:\\notes\\Delete me.md' },
  ];

  assert.deepEqual(
    visibleNotesAfterOptimisticDelete(entries, new Set(['C:/notes/Delete me.md'])),
    [{ name: 'Keep', path: 'C:/notes/Keep.md' }],
  );
});

test('visibleNotesAfterOptimisticDelete preserves the original list when no paths are pending delete', () => {
  const entries = [
    { name: 'One', path: 'C:/notes/One.md' },
    { name: 'Two', path: 'C:/notes/Two.md' },
  ];

  assert.deepEqual(visibleNotesAfterOptimisticDelete(entries, new Set()), entries);
});
