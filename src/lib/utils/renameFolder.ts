export function normalizeFolderName(name: string): string {
  return name.trim();
}

export function resolveFolderRenameRequest(input: {
  currentName: string;
  requestedName: string;
  isSubmitting: boolean;
}): string | null {
  if (input.isSubmitting) return null;

  const cleanName = normalizeFolderName(input.requestedName);
  if (!cleanName || cleanName === input.currentName.trim()) return null;

  if (/[\\/:*?"<>|]/.test(cleanName) || cleanName.includes('..') || cleanName.startsWith('_')) return null;

  return cleanName;
}

export function buildRenamedFolderPath(oldPath: string, cleanName: string): string {
  const normalized = oldPath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  parts[parts.length - 1] = cleanName;
  return parts.join('/');
}
