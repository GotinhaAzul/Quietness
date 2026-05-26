export interface RecoverableNote {
  name: string;
  path: string;
  content: string;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

export function isPathInsideFolder(path: string, basePath: string, folderPath: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedBase = normalizePath(basePath).replace(/\/$/, '');
  const normalizedFolder = normalizePath(folderPath).replace(/^\/|\/$/g, '');
  const absoluteFolder = normalizedFolder
    ? `${normalizedBase}/${normalizedFolder}`
    : normalizedBase;

  return normalizedPath === absoluteFolder || normalizedPath.startsWith(`${absoluteFolder}/`);
}

export function restoreFailedFolderMutation(
  previousCurrent: RecoverableNote | null,
  currentWasCleared: boolean,
  previousSelected: string | null,
  selectedWasCleared: boolean,
): { currentNote: RecoverableNote | null; selectedFolder: string | null } {
  return {
    currentNote: currentWasCleared ? previousCurrent : null,
    selectedFolder: selectedWasCleared ? previousSelected : null,
  };
}
