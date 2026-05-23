export type RenameDecision =
  | { kind: 'ignore' }
  | { kind: 'submit'; cleanName: string };

export function normalizeNoteName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (!trimmed.toLowerCase().endsWith('.md')) return trimmed;
  return trimmed.slice(0, -3).trim();
}

export function resolveRenameRequest(input: {
  currentName: string;
  requestedName: string;
  isSubmitting: boolean;
}): RenameDecision {
  if (input.isSubmitting) {
    return { kind: 'ignore' };
  }

  const cleanName = normalizeNoteName(input.requestedName);
  if (!cleanName || cleanName === input.currentName.trim()) {
    return { kind: 'ignore' };
  }

  return { kind: 'submit', cleanName };
}

export function buildRenamedNotePath(oldPath: string, cleanName: string): string {
  return oldPath.replace(/[^/\\]+$/, `${cleanName}.md`);
}
