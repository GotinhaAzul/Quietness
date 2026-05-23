import test from 'node:test';
import assert from 'node:assert/strict';

const { buildRenamedNotePath, resolveRenameRequest } = await import(
  new URL('./noteRename.ts', import.meta.url).href
);

test('resolveRenameRequest returns null for in-flight duplicate submissions', () => {
  const result = resolveRenameRequest({
    currentName: 'Old title',
    requestedName: 'New title',
    isSubmitting: true,
  });

  assert.equal(result, null);
});

test('resolveRenameRequest returns the normalized note name', () => {
  const result = resolveRenameRequest({
    currentName: 'Old title',
    requestedName: '  New title.md  ',
    isSubmitting: false,
  });

  assert.equal(result, 'New title');
});

test('resolveRenameRequest returns null for no-op renames after normalization', () => {
  const result = resolveRenameRequest({
    currentName: 'Same title',
    requestedName: ' Same title.md ',
    isSubmitting: false,
  });

  assert.equal(result, null);
});

test('buildRenamedNotePath replaces the file name while preserving the parent path', () => {
  assert.equal(
    buildRenamedNotePath('C:/notes/folder/Old title.md', 'New title'),
    'C:/notes/folder/New title.md',
  );
});
