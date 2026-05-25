import { writable, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { showError } from '$lib/stores/errors';
import { loadFolders } from '$lib/stores/folders';
import { loadNotes } from '$lib/stores/notes';

export interface TrashEntry {
  originalName: string;
  originalPath: string;
  trashedAt: string;
  isFolder: boolean;
  trashName: string;
}

export const trashEntries: Writable<TrashEntry[]> = writable([]);
export const trashLoading: Writable<boolean> = writable(false);

export async function loadTrash(): Promise<void> {
  trashLoading.set(true);
  try {
    const entries = await invoke<TrashEntry[]>('list_trash');
    trashEntries.set(entries);
  } catch (e) {
    showError(`Failed to load trash: ${e}`);
  } finally {
    trashLoading.set(false);
  }
}

export async function restoreTrashEntry(trashName: string): Promise<void> {
  try {
    await invoke('restore_trash_entry', { trashName });
    await Promise.all([loadTrash(), loadFolders(), loadNotes()]);
  } catch (e) {
    showError(`Failed to restore item: ${e}`);
  }
}

export async function permanentlyDeleteTrashEntry(trashName: string): Promise<void> {
  try {
    await invoke('permanently_delete_trash_entry', { trashName });
    await loadTrash();
  } catch (e) {
    showError(`Failed to permanently delete item: ${e}`);
  }
}
