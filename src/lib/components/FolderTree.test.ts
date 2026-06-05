import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const componentPath = join(dirname(fileURLToPath(import.meta.url)), 'FolderTree.svelte');
const component = readFileSync(componentPath, 'utf8');

test('folder row hover group excludes expanded children', () => {
  const childrenBlock = '{#if expandedPaths.has(node.path) && node.children.length > 0}';
  const childrenIndex = component.indexOf(childrenBlock);

  assert.notEqual(childrenIndex, -1);

  const beforeChildren = component.slice(0, childrenIndex);
  assert.match(beforeChildren, /<div class="group relative flex items-center">[\s\S]*<\/div>\s*$/);
});

test('folder name reserves room for row action buttons', () => {
  assert.match(component, /<span class="truncate pr-14">\{node\.name\}<\/span>/);
});
