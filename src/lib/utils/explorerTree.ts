import type { ExplorerFolderNode, ExplorerNode, ExplorerNoteNode } from '$lib/types/explorer';
import type { FolderEntry } from '$lib/stores/folders';
import type { NoteEntry } from '$lib/stores/notes';

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function sortChildren(node: ExplorerFolderNode): void {
  const folders = node.children.filter(c => c.type === 'folder') as ExplorerFolderNode[];
  const notes = node.children.filter(c => c.type === 'note') as ExplorerNoteNode[];

  for (const f of folders) sortChildren(f);

  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  notes.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  node.children = [...folders, ...notes];
}

export function buildExplorerTree(
  folders: FolderEntry[],
  notes: NoteEntry[],
  notesDir: string,
): ExplorerNode[] {
  const base = normalizePath(notesDir).replace(/\/+$/, '');
  const folderMap = new Map<string, ExplorerFolderNode>();
  const rootNodes: ExplorerNode[] = [];

  for (const f of folders) {
    const path = normalizePath(f.path).replace(/^\/+|\/+$/g, '');
    const node: ExplorerFolderNode = {
      type: 'folder',
      name: f.name,
      path,
      children: [],
    };
    folderMap.set(path.toLowerCase(), node);
  }

  const rootFolders: ExplorerFolderNode[] = [];
  for (const node of folderMap.values()) {
    const slashIdx = node.path.lastIndexOf('/');
    if (slashIdx > 0) {
      const parent = folderMap.get(node.path.slice(0, slashIdx).toLowerCase());
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    rootFolders.push(node);
  }

  for (const n of notes) {
    const notePath = normalizePath(n.path);
    if (!notePath.startsWith(base + '/')) {
      rootNodes.push({
        type: 'note',
        name: n.name,
        path: n.path,
        folderPath: null,
      });
      continue;
    }

    const relative = notePath.slice(base.length + 1);
    const slashIdx = relative.lastIndexOf('/');
    let parentFolderPath: string | null = null;

    if (slashIdx > 0) {
      parentFolderPath = relative.slice(0, slashIdx);
      const parent = folderMap.get(parentFolderPath.toLowerCase());
      if (parent) {
        parent.children.push({
          type: 'note',
          name: n.name,
          path: n.path,
          folderPath: parentFolderPath,
        });
        continue;
      }
    }

    rootNodes.push({
      type: 'note',
      name: n.name,
      path: n.path,
      folderPath: parentFolderPath,
    });
  }

  for (const node of folderMap.values()) {
    sortChildren(node);
  }

  rootFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  rootNodes.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return [...rootFolders, ...rootNodes];
}

export function notesDirNeedsRefresh(notesDir: string, entries: NoteEntry[]): boolean {
  if (!notesDir) return true;
  const base = normalizePath(notesDir).replace(/\/+$/, '');
  return entries.some((entry) => {
    const p = normalizePath(entry.path);
    return !p.startsWith(base + '/');
  });
}

export function getNoteRelativeFolder(notePath: string, notesDir: string): string | null {
  const normalized = normalizePath(notePath);
  const base = normalizePath(notesDir).replace(/\/+$/, '');
  if (!normalized.startsWith(base + '/')) return null;
  const relative = normalized.slice(base.length + 1);
  const slashIdx = relative.lastIndexOf('/');
  if (slashIdx <= 0) return null;
  return relative.slice(0, slashIdx);
}
