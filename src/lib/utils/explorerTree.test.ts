import test from 'node:test';
import assert from 'node:assert/strict';
import type { ExplorerNode, ExplorerFolderNode, ExplorerNoteNode } from '$lib/types/explorer';
import type { FolderEntry } from '$lib/stores/folders';
import type { NoteEntry } from '$lib/stores/notes';

const { buildExplorerTree, notesDirNeedsRefresh, getNoteRelativeFolder } = await import(
  new URL('./explorerTree.ts', import.meta.url).href
);

function isFolder(n: ExplorerNode): n is ExplorerFolderNode {
  return n.type === 'folder';
}

function names(nodes: ExplorerNode[]): string[] {
  return nodes.map(n => n.name);
}

function findFolder(nodes: ExplorerNode[], name: string): ExplorerFolderNode | undefined {
  for (const n of nodes) {
    if (n.type === 'folder' && n.name === name) return n;
    if (n.type === 'folder') {
      const found = findFolder(n.children, name);
      if (found) return found;
    }
  }
  return undefined;
}

function findNote(nodes: ExplorerNode[], name: string): ExplorerNoteNode | undefined {
  for (const n of nodes) {
    if (n.type === 'note' && n.name === name) return n;
    if (n.type === 'folder') {
      const found = findNote(n.children, name);
      if (found) return found;
    }
  }
  return undefined;
}

const folders: FolderEntry[] = [
  { name: 'Projects', path: 'Projects' },
  { name: 'Ideas', path: 'Projects/Ideas' },
  { name: 'Archive', path: 'Archive' },
];

const notes: NoteEntry[] = [
  { name: 'RootNote', path: 'C:/Vault/RootNote.md' },
  { name: 'ProjectNote', path: 'C:/Vault/Projects/ProjectNote.md' },
  { name: 'IdeaNote', path: 'C:/Vault/Projects/Ideas/IdeaNote.md' },
  { name: 'OrphanNote', path: 'D:/Other/OrphanNote.md' },
];

test('builds multi-level tree with folders and notes', () => {
  const tree = buildExplorerTree(folders, notes, 'C:/Vault');
  assert.equal(tree.length, 4);

  const archive = findFolder(tree, 'Archive');
  assert.ok(archive);
  assert.equal(archive.children.length, 0);

  const projects = findFolder(tree, 'Projects');
  assert.ok(projects);
  assert.equal(projects.children.length, 2);

  const ideas = findFolder(projects.children, 'Ideas');
  assert.ok(ideas);
  assert.equal(ideas.children.length, 1);
  assert.equal(ideas.children[0].type, 'note');
  assert.equal(ideas.children[0].name, 'IdeaNote');
});

test('notes at root are placed in top-level list', () => {
  const tree = buildExplorerTree(folders, notes, 'C:/Vault');
  const rootNotes = tree.filter((n: ExplorerNode) => n.type === 'note');
  assert.equal(rootNotes.length, 2);
  assert.ok(rootNotes.some((n: ExplorerNode) => n.name === 'RootNote'));
  assert.ok(rootNotes.some((n: ExplorerNode) => n.name === 'OrphanNote'));
});

test('windows backslash paths are normalized', () => {
  const winNotes: NoteEntry[] = [
    { name: 'WinNote', path: 'C:\\Vault\\Projects\\WinNote.md' },
    { name: 'RootWin', path: 'C:\\Vault\\RootWin.md' },
  ];
  const tree = buildExplorerTree(folders, winNotes, 'C:\\Vault');
  const projects = findFolder(tree, 'Projects');
  assert.ok(projects);
  assert.ok(projects.children.some(c => c.type === 'note' && c.name === 'WinNote'));
  assert.ok(tree.some((n: ExplorerNode) => n.type === 'note' && n.name === 'RootWin'));
});

test('case-insensitive folder matching', () => {
  const mixedNotes: NoteEntry[] = [
    { name: 'CaseNote', path: 'C:/Vault/projects/CaseNote.md' },
  ];
  const tree = buildExplorerTree(folders, mixedNotes, 'C:/Vault');
  const projects = findFolder(tree, 'Projects');
  assert.ok(projects);
  assert.ok(projects.children.some(c => c.type === 'note' && c.name === 'CaseNote'));
});

test('deterministic ordering: folders first, then notes, alphabetical', () => {
  const treeNames = names(
    buildExplorerTree(
      [
        { name: 'Zeta', path: 'Zeta' },
        { name: 'Alpha', path: 'Alpha' },
      ],
      [
        { name: 'BNote', path: 'C:/Vault/BNote.md' },
        { name: 'ANote', path: 'C:/Vault/ANote.md' },
      ],
      'C:/Vault',
    ),
  );
  assert.deepEqual(treeNames, ['Alpha', 'Zeta', 'ANote', 'BNote']);
});

test('similar prefixes like Vault and Vault2 are not confused', () => {
  const tree = buildExplorerTree(
    [{ name: 'Sub', path: 'Sub' }],
    [
      { name: 'Vault2Note', path: 'C:/Vault2/Vault2Note.md' },
      { name: 'VaultNote', path: 'C:/Vault/Sub/VaultNote.md' },
    ],
    'C:/Vault',
  );
  const sub = findFolder(tree, 'Sub');
  assert.ok(sub);
  assert.ok(sub.children.some(c => c.type === 'note' && c.name === 'VaultNote'));
  assert.ok(tree.some((n: ExplorerNode) => n.type === 'note' && n.name === 'Vault2Note'));
});

test('notesDirNeedsRefresh detects stale directory', () => {
  const entries: NoteEntry[] = [
    { name: 'Old', path: 'C:/OldVault/note.md' },
    { name: 'Current', path: 'C:/Vault/note.md' },
  ];
  assert.equal(notesDirNeedsRefresh('C:/OldVault', entries), true);
  assert.equal(notesDirNeedsRefresh('C:/OtherVault', entries), true);
  assert.equal(notesDirNeedsRefresh('', entries), true);
});

test('notesDirNeedsRefresh returns false when all notes are under notesDir', () => {
  const entries: NoteEntry[] = [
    { name: 'A', path: 'C:/Vault/A.md' },
    { name: 'B', path: 'C:/Vault/Sub/B.md' },
  ];
  assert.equal(notesDirNeedsRefresh('C:\\Vault', entries), false);
});

test('missing parent folder moves note to root', () => {
  const tree = buildExplorerTree(
    [{ name: 'Existing', path: 'Existing' }],
    [{ name: 'Orphaned', path: 'C:/Vault/Missing/Orphaned.md' }],
    'C:/Vault',
  );
  assert.ok(tree.some((n: ExplorerNode) => n.type === 'note' && n.name === 'Orphaned'));
});

test('getNoteRelativeFolder returns correct parent folder', () => {
  assert.equal(getNoteRelativeFolder('C:/Vault/Projects/Note.md', 'C:/Vault'), 'Projects');
  assert.equal(getNoteRelativeFolder('C:/Vault/Note.md', 'C:/Vault'), null);
  assert.equal(getNoteRelativeFolder('D:/Other/Note.md', 'C:/Vault'), null);
});

test('nested children are sorted: folders before notes', () => {
  const tree = buildExplorerTree(
    [
      { name: 'Parent', path: 'Parent' },
      { name: 'BChild', path: 'Parent/BChild' },
      { name: 'AChild', path: 'Parent/AChild' },
    ],
    [
      { name: 'ZNote', path: 'C:/Vault/Parent/ZNote.md' },
      { name: 'ANote', path: 'C:/Vault/Parent/ANote.md' },
    ],
    'C:/Vault',
  );
  const parent = findFolder(tree, 'Parent')!;
  const childNames = names(parent.children);
  assert.deepEqual(childNames, ['AChild', 'BChild', 'ANote', 'ZNote']);
});
