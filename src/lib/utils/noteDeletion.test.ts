import test from 'node:test';
import assert from 'node:assert/strict';

const noteDeletion = await import(
  new URL('./noteDeletion.ts', import.meta.url).href
);
const { normalizeNotePath, isSameNotePath } = noteDeletion;

test('normalizeNotePath lowercases and normalizes separators', () => {
  assert.equal(
    normalizeNotePath('C:\\Notes\\Open.md'),
    'c:/notes/open.md',
  );
});

test('isSameNotePath treats Windows slash and case variants as the same note', () => {
  assert.equal(
    isSameNotePath('C:\\Notes\\Open.md', 'c:/notes/open.md'),
    true,
  );
});

test('note deletion utilities expose path identity helpers only', () => {
  assert.deepEqual(
    Object.keys(noteDeletion).sort(),
    ['isSameNotePath', 'normalizeNotePath'],
  );
});
