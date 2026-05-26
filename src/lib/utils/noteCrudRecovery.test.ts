import test from 'node:test';
import assert from 'node:assert/strict';

const recovery = await import(
  new URL('./noteCrudRecovery.ts', import.meta.url).href
);
const { shouldRestoreNoteAfterDeleteFailure } = recovery;

test('shouldRestoreNoteAfterDeleteFailure keeps missing external deletes cleared', () => {
  assert.equal(shouldRestoreNoteAfterDeleteFailure('Note not found'), false);
  assert.equal(shouldRestoreNoteAfterDeleteFailure('Failed to delete note: Note not found'), false);
});

test('shouldRestoreNoteAfterDeleteFailure restores for permission and locked-path failures', () => {
  assert.equal(shouldRestoreNoteAfterDeleteFailure('Access is denied'), true);
  assert.equal(shouldRestoreNoteAfterDeleteFailure('The process cannot access the file'), true);
});

