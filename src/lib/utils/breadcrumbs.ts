export function getBreadcrumbSegments(notePath: string, notesDir: string): string[] {
  const normalized = notePath.replace(/\\/g, '/');
  const base = notesDir.replace(/\\/g, '/').replace(/\/+$/, '');
  if (!normalized.startsWith(base + '/')) return [];
  const relative = normalized.slice(base.length + 1);
  const slashIdx = relative.lastIndexOf('/');
  if (slashIdx <= 0) return [];
  return relative.slice(0, slashIdx).split('/');
}
