import { invoke } from '@tauri-apps/api/core';
import { loadNotes, currentNote, notes } from '$lib/stores/notes';
import { loadFolders, selectedFolder, folders } from '$lib/stores/folders';
import { loadTrash } from '$lib/stores/trash';
import { showError, showWarning } from '$lib/stores/errors';
import { get } from 'svelte/store';

export interface IntegrityRepairReport {
  removedTrashMetadata: number;
}

interface ReconcileIntegrityOptions {
  refreshLibrary?: boolean;
}

export async function reconcileIntegrity(
  reason?: 'startup' | 'load-note-failed' | 'save-failed' | 'trash-opened',
  options: ReconcileIntegrityOptions = {},
): Promise<void> {
  const { refreshLibrary = true } = options;
  let repairReport: IntegrityRepairReport | null = null;
  try {
    repairReport = await invoke<IntegrityRepairReport>('repair_integrity');
  } catch (e) {
    showWarning(`Integrity repair failed: ${e}`);
  }

  if (repairReport && repairReport.removedTrashMetadata > 0) {
    showWarning(`Cleaned up ${repairReport.removedTrashMetadata} stale trash entr${repairReport.removedTrashMetadata === 1 ? 'y' : 'ies'}.`);
  }

  if (refreshLibrary) {
    await Promise.all([loadNotes(), loadFolders()]);
  }

  const current = get(currentNote);
  const noteList = get(notes);
  if (current && !noteList.some(n => n.path === current.path)) {
    currentNote.set(null);
    showError('The current note was removed externally.');
  }

  const sel = get(selectedFolder);
  const folderList = get(folders);
  if (sel !== null && !folderList.some(f => f.path === sel)) {
    selectedFolder.set(null);
  }

  if (reason === 'trash-opened' || reason === 'startup') {
    await loadTrash();
  }
}
