export function shouldRestoreNoteAfterDeleteFailure(error: unknown): boolean {
  return !String(error).toLowerCase().includes('note not found');
}

