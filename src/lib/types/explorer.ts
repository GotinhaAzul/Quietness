export interface ExplorerFolderNode {
  type: 'folder';
  name: string;
  path: string;
  children: ExplorerNode[];
}

export interface ExplorerNoteNode {
  type: 'note';
  name: string;
  path: string;
  folderPath: string | null;
}

export type ExplorerNode = ExplorerFolderNode | ExplorerNoteNode;
