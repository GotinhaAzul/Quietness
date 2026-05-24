import test from 'node:test';
import assert from 'node:assert/strict';

const { buildRenamedFolderPath, resolveFolderRenameRequest, normalizeFolderName } = await import(
  new URL('./renameFolder.ts', import.meta.url).href
);

test('normalizeFolderName trims whitespace', () => {
  assert.equal(normalizeFolderName('  My Folder  '), 'My Folder');
});

test('normalizeFolderName returns empty string for whitespace-only', () => {
  assert.equal(normalizeFolderName('   '), '');
});

test('resolveFolderRenameRequest returns null for in-flight submission', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Folder',
    requestedName: 'New Folder',
    isSubmitting: true,
  });
  assert.equal(result, null);
});

test('resolveFolderRenameRequest returns normalized folder name', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Folder',
    requestedName: '  New Folder  ',
    isSubmitting: false,
  });
  assert.equal(result, 'New Folder');
});

test('resolveFolderRenameRequest returns null for no-op rename', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Same Folder',
    requestedName: ' Same Folder ',
    isSubmitting: false,
  });
  assert.equal(result, null);
});

test('resolveFolderRenameRequest returns null for invalid folder name with backslash', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Folder',
    requestedName: 'Bad\\Name',
    isSubmitting: false,
  });
  assert.equal(result, null);
});

test('resolveFolderRenameRequest returns null for path traversal', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Folder',
    requestedName: '../escape',
    isSubmitting: false,
  });
  assert.equal(result, null);
});

test('resolveFolderRenameRequest returns null for underscore-prefixed name', () => {
  const result = resolveFolderRenameRequest({
    currentName: 'Folder',
    requestedName: '_hidden',
    isSubmitting: false,
  });
  assert.equal(result, null);
});

test('buildRenamedFolderPath replaces last path segment', () => {
  assert.equal(
    buildRenamedFolderPath('parent/subfolder', 'new-name'),
    'parent/new-name',
  );
});

test('buildRenamedFolderPath handles windows backslashes', () => {
  assert.equal(
    buildRenamedFolderPath('parent\\subfolder', 'new-name'),
    'parent/new-name',
  );
});

test('buildRenamedFolderPath preserves parent path', () => {
  assert.equal(
    buildRenamedFolderPath('a/b/c/d', 'renamed'),
    'a/b/c/renamed',
  );
});
