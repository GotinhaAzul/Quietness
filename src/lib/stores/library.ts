import { invoke } from '@tauri-apps/api/core';
import { folders, type FolderEntry } from '$lib/stores/folders';
import { notes, type NoteEntry } from '$lib/stores/notes';
import { showError } from '$lib/stores/errors';

export interface LibrarySnapshot {
  notes: NoteEntry[];
  folders: FolderEntry[];
}

export async function loadLibrarySnapshot(): Promise<LibrarySnapshot | null> {
  try {
    const snapshot = await invoke<LibrarySnapshot>('list_library_snapshot');
    notes.set(snapshot.notes);
    folders.set(snapshot.folders);
    return snapshot;
  } catch (e) {
    showError(`Failed to load library snapshot: ${e}`);
    return null;
  }
}
