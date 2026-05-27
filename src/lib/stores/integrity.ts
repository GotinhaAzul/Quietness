import { invoke } from '@tauri-apps/api/core';
import { loadNotes, currentNote, notes } from '$lib/stores/notes';
import { loadFolders, selectedFolder, folders } from '$lib/stores/folders';
import { loadTrash } from '$lib/stores/trash';
import { showError } from '$lib/stores/errors';
import { get } from 'svelte/store';

export interface IntegrityRepairReport {
  removedTrashMetadata: number;
}

export async function reconcileIntegrity(reason?: 'startup' | 'load-note-failed' | 'save-failed' | 'trash-opened'): Promise<void> {
  try {
    await invoke<IntegrityRepairReport>('repair_integrity');
  } catch { /* non-critical; continue with reloads */ }

  await Promise.all([loadNotes(), loadFolders()]);

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
