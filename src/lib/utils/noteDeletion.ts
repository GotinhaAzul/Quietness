export interface NoteIdentity {
  path: string;
}

export function normalizeNotePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

export function isSameNotePath(a: string, b: string): boolean {
  return normalizeNotePath(a) === normalizeNotePath(b);
}

export function visibleNotesAfterOptimisticDelete<T extends NoteIdentity>(
  entries: T[],
  deletingPaths: Set<string>,
): T[] {
  if (deletingPaths.size === 0) return entries;
  const normalizedDeletingPaths = new Set(
    [...deletingPaths].map(path => normalizeNotePath(path)),
  );
  return entries.filter(entry => !normalizedDeletingPaths.has(normalizeNotePath(entry.path)));
}

export function waitForOptimisticDeletePaint(
  schedule: (done: () => void) => void = (done) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => done());
      return;
    }
    setTimeout(done, 0);
  },
): Promise<void> {
  return new Promise(resolve => {
    schedule(resolve);
  });
}
