export function normalizeNotePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

export function isSameNotePath(a: string, b: string): boolean {
  return normalizeNotePath(a) === normalizeNotePath(b);
}
