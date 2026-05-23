import test from 'node:test';
import assert from 'node:assert/strict';

const { buildRenamedNotePath, resolveRenameRequest } = await import(
  new URL('./noteRename.ts', import.meta.url).href
);

test('resolveRenameRequest ignores in-flight duplicate submissions', () => {
  const result = resolveRenameRequest({
    currentName: 'Old title',
    requestedName: 'New title',
    isSubmitting: true,
  });

  assert.deepEqual(result, { kind: 'ignore' });
});

test('resolveRenameRequest trims and strips optional md extension', () => {
  const result = resolveRenameRequest({
    currentName: 'Old title',
    requestedName: '  New title.md  ',
    isSubmitting: false,
  });

  assert.deepEqual(result, { kind: 'submit', cleanName: 'New title' });
});

test('resolveRenameRequest ignores no-op renames after normalization', () => {
  const result = resolveRenameRequest({
    currentName: 'Same title',
    requestedName: ' Same title.md ',
    isSubmitting: false,
  });

  assert.deepEqual(result, { kind: 'ignore' });
});

test('buildRenamedNotePath replaces the file name while preserving the parent path', () => {
  assert.equal(
    buildRenamedNotePath('C:/notes/folder/Old title.md', 'New title'),
    'C:/notes/folder/New title.md',
  );
});
