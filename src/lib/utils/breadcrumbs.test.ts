import test from 'node:test';
import assert from 'node:assert/strict';

const { getBreadcrumbSegments } = await import(
  new URL('./breadcrumbs.ts', import.meta.url).href
);

test('root note returns empty array', () => {
  assert.deepEqual(getBreadcrumbSegments('C:/Vault/RootNote.md', 'C:/Vault'), []);
});

test('nested note returns folder segments', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/Projects/Note.md', 'C:/Vault'),
    ['Projects'],
  );
});

test('deeply nested note returns all segments', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/Projects/Ideas/Note.md', 'C:/Vault'),
    ['Projects', 'Ideas'],
  );
});

test('note outside notesDir returns empty array', () => {
  assert.deepEqual(getBreadcrumbSegments('D:/Other/Note.md', 'C:/Vault'), []);
});

test('windows backslash paths are normalized', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:\\Vault\\Projects\\Note.md', 'C:\\Vault'),
    ['Projects'],
  );
});

test('deeply nested windows backslash path', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:\\Vault\\Projects\\Ideas\\Note.md', 'C:\\Vault'),
    ['Projects', 'Ideas'],
  );
});

test('notesDir with trailing slash is handled', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/Projects/Note.md', 'C:/Vault/'),
    ['Projects'],
  );
});

test('note with .md in folder name is not confused', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/.md/Note.md', 'C:/Vault'),
    ['.md'],
  );
});

test('similar folder prefixes do not produce incorrect paths', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/ProjectNote/File.md', 'C:/Vault'),
    ['ProjectNote'],
  );
});

test('note at root with name matching a folder prefix', () => {
  assert.deepEqual(
    getBreadcrumbSegments('C:/Vault/Projects.md', 'C:/Vault'),
    [],
  );
});
